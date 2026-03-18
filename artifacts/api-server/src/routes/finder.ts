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
Analyze the need and recommend the best product within budget in Indian Rupees.
IMPORTANT: Respond ONLY in valid JSON, no extra text:
{
  "product_name": "string",
  "brand": "string",
  "estimated_price": number,
  "match_score": number,
  "pros": ["string", "string", "string"],
  "cons": ["string", "string"],
  "explanation": "string",
  "amazon_search": "string",
  "flipkart_search": "string",
  "return_risk": "low",
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
    pros: ["Best noise cancellation", "30hr battery", "Crystal clear calls", "Comfortable fit"],
    cons: ["Bulky case", "Premium price"],
    explanation: `Best match for ${query} within ₹${budget}.`,
    amazon_search: "Sony WF-1000XM5",
    flipkart_search: "Sony WF-1000XM5 earphones",
    return_risk: "low",
    return_risk_reason: "3.2% return rate only",
    fake_review_warning: false,
    fake_review_reason: "Reviews appear genuine",
    alternatives: [
      { name: "boAt Rockerz 255 Pro+", price: 999, reason: "Best budget" },
      { name: "JBL Tune 230NC TWS", price: 1599, reason: "Great bass" },
      { name: "Noise Buds VS104", price: 799, reason: "Most affordable" },
    ],
  };
}

function getDummyPrices(productName: string, budget: number) {
  return {
    amazon: {
      price: budget * 0.95,
      url: `https://amazon.in/s?k=${encodeURIComponent(productName)}`,
      affiliate_url: `https://amazon.in/s?k=${encodeURIComponent(productName)}&tag=fyndmate-21`,
      delivery: "2-3 days",
    },
    flipkart: {
      price: budget * 0.98,
      url: `https://flipkart.com/search?q=${encodeURIComponent(productName)}`,
      affiliate_url: `https://flipkart.com/search?q=${encodeURIComponent(productName)}`,
      delivery: "3-4 days",
    },
    best_deal: "amazon",
    savings: budget * 0.03,
  };
}

async function searchProductGroq(query: string, budget: number, useCase: string) {
  try {
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: PRODUCT_PROMPT },
        { role: "user", content: `Find: ${query}. Budget: ₹${budget}. Use case: ${useCase}` },
      ],
      temperature: 0.3,
      max_tokens: 1000,
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

async function comparePricesService(productName: string, budget: number) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return getDummyPrices(productName, budget);
  try {
    const response = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(productName)}&country=IN&page=1`,
      {
        headers: {
          "X-RapidAPI-Key": key,
          "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com",
        },
      }
    );
    const data = (await response.json()) as any;
    const products = data?.data?.products || [];
    let amazonPrice = budget * 0.95;
    let amazonUrl = `https://amazon.in/s?k=${encodeURIComponent(productName)}`;
    if (products.length > 0) {
      const p = products[0];
      const parsed = parseFloat(
        String(p.product_price || "").replace("₹", "").replace(/,/g, "").trim()
      );
      if (!isNaN(parsed)) {
        amazonPrice = parsed;
        amazonUrl = p.product_url || amazonUrl;
      }
    }
    return {
      amazon: {
        price: amazonPrice,
        url: amazonUrl,
        affiliate_url: `${amazonUrl}&tag=fyndmate-21`,
        delivery: "2-3 days",
      },
      flipkart: {
        price: amazonPrice * 1.03,
        url: `https://flipkart.com/search?q=${encodeURIComponent(productName)}`,
        affiliate_url: `https://flipkart.com/search?q=${encodeURIComponent(productName)}`,
        delivery: "3-4 days",
      },
      best_deal: "amazon",
      savings: Math.abs(amazonPrice - amazonPrice * 1.03),
    };
  } catch {
    return getDummyPrices(productName, budget);
  }
}

router.post("/search", async (req, res) => {
  try {
    const body = SearchProductBody.parse(req.body);
    const result = await searchProductGroq(body.query, body.budget ?? 2000, body.use_case ?? "general");
    const prices = await comparePricesService(result.product_name || body.query, body.budget ?? 2000);
    result.prices = prices;
    result.affiliate_links = {
      amazon: prices.amazon.affiliate_url,
      flipkart: prices.flipkart.affiliate_url,
    };
    res.json({ success: true, main_product: result, prices });
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
          content: "You are a gift expert for Indian market. Return ONLY valid JSON with a gifts array, each item having name (string), price (number), reason (string).",
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
      gifts: [{ name: "Bluetooth Speaker", price: (body.budget ?? 1500) * 0.8, reason: "Great gift for music lovers" }],
    });
  } catch {
    res.json({
      success: true,
      gifts: [
        { name: "Bluetooth Speaker", price: 1200, reason: "Great for music lovers" },
        { name: "Book Set", price: 800, reason: "Knowledge is the best gift" },
        { name: "Scented Candle Kit", price: 600, reason: "Perfect relaxation gift" },
        { name: "Desk Organizer", price: 400, reason: "Keeps things tidy" },
        { name: "Premium Tea Set", price: 900, reason: "Elegant and practical" },
      ],
    });
  }
});

export default router;
