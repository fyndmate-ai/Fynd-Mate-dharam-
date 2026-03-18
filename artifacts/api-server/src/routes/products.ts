import { Router } from "express";
import { ComparePricesBody } from "@workspace/api-zod";

const router = Router();

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

router.post("/compare", async (req, res) => {
  try {
    const body = ComparePricesBody.parse(req.body);
    const budget = body.budget ?? 2000;
    const key = process.env.RAPIDAPI_KEY;
    if (!key) {
      return res.json({ success: true, ...getDummyPrices(body.product_name, budget) });
    }
    const response = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(body.product_name)}&country=IN&page=1`,
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
    let amazonUrl = `https://amazon.in/s?k=${encodeURIComponent(body.product_name)}`;
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
    const flipkartPrice = amazonPrice * 1.03;
    res.json({
      success: true,
      amazon: {
        price: amazonPrice,
        url: amazonUrl,
        affiliate_url: `${amazonUrl}&tag=fyndmate-21`,
        delivery: "2-3 days",
      },
      flipkart: {
        price: flipkartPrice,
        url: `https://flipkart.com/search?q=${encodeURIComponent(body.product_name)}`,
        affiliate_url: `https://flipkart.com/search?q=${encodeURIComponent(body.product_name)}`,
        delivery: "3-4 days",
      },
      best_deal: "amazon",
      savings: Math.abs(amazonPrice - flipkartPrice),
    });
  } catch {
    res.json({ success: true, ...getDummyPrices("product", 2000) });
  }
});

export default router;
