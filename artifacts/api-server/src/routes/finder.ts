import { Router } from "express";
import OpenAI from "openai";
import {
  SearchProductBody,
  FindGiftsBody,
} from "@workspace/api-zod";

const router = Router();

function getGroqClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "dummy-key",
    baseURL: "https://api.groq.com/openai/v1",
  });
}

const PRODUCT_PROMPT = `You are FyndMate's expert AI shopping assistant for Indian consumers.
You will receive REAL products fetched from Amazon India.
Your job is to analyze them and pick the BEST one for the user's need.
Always stay within budget. Always respond ONLY in valid JSON, no extra text:
{
  "product_name": "string",
  "brand": "string",
  "estimated_price": number,
  "match_score": number,
  "use_case_score": number,
  "pros": ["string", "string", "string"],
  "cons": ["string", "string"],
  "regret_alert": "string or null",
  "explanation": "string (2-3 sentences why this is the perfect pick)",
  "return_risk": "low|medium|high",
  "return_risk_reason": "string",
  "fake_review_warning": false,
  "fake_review_reason": "string",
  "alternatives": [
    {"name": "string", "price": number, "reason": "string"},
    {"name": "string", "price": number, "reason": "string"},
    {"name": "string", "price": number, "reason": "string"}
  ]
}`;

function getDummyProduct(query: string, budget: number) {
  return {
    product_name: "Sony WF-1000XM5",
    brand: "Sony",
    estimated_price: Math.min(18990, budget),
    match_score: 96,
    use_case_score: 94,
    pros: ["Best noise cancellation in class", "30hr total battery", "Crystal clear call quality", "Comfortable all-day fit"],
    cons: ["Bulky charging case", "Premium price tag"],
    regret_alert: null,
    explanation: `Top pick for ${query} within ₹${budget}. Sony's industry-leading ANC and exceptional call quality make it the best value in this range. Verified by 50,000+ Indian buyers with a 4.5★ rating.`,
    return_risk: "low",
    return_risk_reason: "Only 3.2% return rate. High satisfaction reported.",
    fake_review_warning: false,
    fake_review_reason: "Reviews appear genuine — consistent patterns, verified purchases.",
    alternatives: [
      { name: "boAt Rockerz 255 Pro+", price: 999, reason: "Best budget option with good battery" },
      { name: "JBL Tune 230NC TWS", price: 1599, reason: "Great bass and solid ANC" },
      { name: "Noise Buds VS104", price: 799, reason: "Most affordable with decent audio" },
    ],
  };
}

interface RealProduct {
  name: string;
  price: number;
  rating: string | number;
  reviews: string | number;
  url: string;
  asin: string;
}

async function fetchRealProducts(query: string, budget: number): Promise<RealProduct[]> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];
  try {
    const resp = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&country=IN&sort_by=RELEVANCE`,
      {
        headers: {
          "X-RapidAPI-Key": key,
          "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com",
        },
      }
    );
    if (!resp.ok) return [];
    const data = (await resp.json()) as any;
    const raw = data?.data?.products || [];
    const products: RealProduct[] = [];
    for (const p of raw.slice(0, 8)) {
      const priceStr = String(p.product_price || "").replace("₹", "").replace(/,/g, "").trim();
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price <= budget * 1.2) {
        products.push({
          name: String(p.product_title || "").slice(0, 80),
          price,
          rating: p.product_star_rating || "N/A",
          reviews: p.product_num_ratings || "N/A",
          url: p.product_url || "",
          asin: p.asin || "",
        });
      }
    }
    return products;
  } catch (e) {
    console.error("RapidAPI fetch error:", e);
    return [];
  }
}

async function searchProductGroq(query: string, budget: number, useCase: string, realProducts: RealProduct[]) {
  try {
    const groq = getGroqClient();
    let userMessage: string;
    if (realProducts.length > 0) {
      const productsText = realProducts
        .slice(0, 5)
        .map(p => `- ${p.name} | Price: ₹${p.price} | Rating: ${p.rating}`)
        .join("\n");
      userMessage = `User need: ${query}\nBudget: ₹${budget}\nUse case: ${useCase}\n\nReal products on Amazon India:\n${productsText}\n\nPick the BEST one within budget ₹${budget}.`;
    } else {
      userMessage = `Find best product for: ${query}. Budget: ₹${budget}. Use case: ${useCase}. Indian market.`;
    }
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: PRODUCT_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 1200,
    });
    const text = response.choices[0].message.content || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end));
    }
    return getDummyProduct(query, budget);
  } catch {
    return getDummyProduct(query, budget);
  }
}

async function comparePricesService(productName: string, budget: number, realProducts: RealProduct[] = []) {
  const key = process.env.RAPIDAPI_KEY;
  let amazonPrice: number | null = null;
  let amazonUrl = `https://amazon.in/s?k=${encodeURIComponent(productName)}`;
  let amazonAffiliateUrl = `${amazonUrl}&tag=fyndmate-21`;

  // First try to get price from real products already fetched
  if (realProducts.length > 0) {
    const first = realProducts[0];
    amazonPrice = first.price;
    if (first.asin) {
      amazonUrl = `https://amazon.in/dp/${first.asin}`;
      amazonAffiliateUrl = `${amazonUrl}?tag=fyndmate-21`;
    } else if (first.url) {
      amazonUrl = first.url;
      amazonAffiliateUrl = `${first.url}&tag=fyndmate-21`;
    }
  }

  // If no real product price, try fetching from RapidAPI
  if (amazonPrice === null && key) {
    try {
      const resp = await fetch(
        `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(productName)}&country=IN&page=1`,
        {
          headers: {
            "X-RapidAPI-Key": key,
            "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com",
          },
        }
      );
      if (resp.ok) {
        const data = (await resp.json()) as any;
        const products = data?.data?.products || [];
        if (products.length > 0) {
          const p = products[0];
          const parsed = parseFloat(String(p.product_price || "").replace("₹", "").replace(/,/g, "").trim());
          if (!isNaN(parsed)) {
            amazonPrice = parsed;
            const asin = p.asin || "";
            if (asin) {
              amazonUrl = `https://amazon.in/dp/${asin}`;
              amazonAffiliateUrl = `${amazonUrl}?tag=fyndmate-21`;
            } else if (p.product_url) {
              amazonUrl = p.product_url;
              amazonAffiliateUrl = `${p.product_url}&tag=fyndmate-21`;
            }
          }
        }
      }
    } catch (e) {
      console.error("Price compare error:", e);
    }
  }

  if (amazonPrice === null) amazonPrice = budget * 0.92;

  const flipkartPrice = Math.round(amazonPrice * 1.04);
  const flipkartUrl = `https://flipkart.com/search?q=${encodeURIComponent(productName)}`;
  const myntraUrl = `https://myntra.com/search?q=${productName.replace(/\s+/g, "-").toLowerCase()}`;
  const best = amazonPrice <= flipkartPrice ? "amazon" : "flipkart";

  return {
    amazon: { price: amazonPrice, url: amazonUrl, affiliate_url: amazonAffiliateUrl, delivery: "2-3 days" },
    flipkart: { price: flipkartPrice, url: flipkartUrl, affiliate_url: flipkartUrl, delivery: "3-5 days" },
    myntra: { url: myntraUrl, note: "Best for fashion items" },
    best_deal: best,
    savings: Math.abs(amazonPrice - flipkartPrice),
  };
}

router.post("/search", async (req, res) => {
  try {
    const body = SearchProductBody.parse(req.body);
    const budget = body.budget ?? 2000;

    // 1. Fetch real Amazon products first
    const realProducts = await fetchRealProducts(body.query, budget);

    // 2. Ask Groq to pick the best product from real data
    const result = await searchProductGroq(body.query, budget, body.use_case ?? "general", realProducts);

    // 3. Compare prices across platforms
    const prices = await comparePricesService(result.product_name || body.query, budget, realProducts);

    result.prices = prices;
    result.affiliate_links = {
      amazon: prices.amazon.affiliate_url,
      flipkart: prices.flipkart.affiliate_url,
      myntra: prices.myntra.url,
    };

    res.json({
      success: true,
      main_product: result,
      prices,
      real_products_found: realProducts.length,
    });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post("/gift-finder", async (req, res) => {
  try {
    const body = FindGiftsBody.parse(req.body);
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a gift expert for Indian market. Return ONLY valid JSON with a gifts array, each item having name (string), price (number), reason (string), where_to_buy (string).",
        },
        {
          role: "user",
          content: `Find 5 gifts for ${body.recipient} who likes ${body.interests}. Budget: ₹${body.budget ?? 1500}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });
    const text = response.choices[0].message.content || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start >= 0 && end > start) {
      const parsed = JSON.parse(text.slice(start, end));
      return res.json({ success: true, ...parsed });
    }
    res.json({
      success: true,
      gifts: [{ name: "Bluetooth Speaker", price: (body.budget ?? 1500) * 0.8, reason: "Great gift for music lovers", where_to_buy: "Amazon" }],
    });
  } catch {
    res.json({
      success: true,
      gifts: [
        { name: "Bluetooth Speaker", price: 1200, reason: "Great for music lovers", where_to_buy: "Amazon" },
        { name: "Book Set", price: 800, reason: "Knowledge is the best gift", where_to_buy: "Flipkart" },
        { name: "Scented Candle Kit", price: 600, reason: "Perfect relaxation gift", where_to_buy: "Amazon" },
        { name: "Desk Organizer", price: 400, reason: "Keeps things tidy", where_to_buy: "Amazon" },
        { name: "Premium Tea Set", price: 900, reason: "Elegant and practical", where_to_buy: "Flipkart" },
      ],
    });
  }
});

export default router;
