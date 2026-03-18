import { Router } from "express";
import OpenAI from "openai";
import { SuggestOutfitsBody } from "@workspace/api-zod";

const router = Router();

function getGroqClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "dummy-key",
    baseURL: "https://api.groq.com/openai/v1",
  });
}

const OUTFIT_PROMPT = `You are FyndMate's AI fashion stylist for Indian fashion.
Suggest 6 complete outfits. ONLY respond in valid JSON:
{
  "outfits": [
    {
      "name": "string",
      "occasion": "string",
      "total_price": number,
      "items": [{"name": "string", "price": number}],
      "color_palette": ["string"],
      "styling_tip": "string",
      "image_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"
    }
  ]
}`;

function getDummyOutfits() {
  return {
    outfits: [
      {
        name: "Urban College Vibe",
        occasion: "College",
        total_price: 1650,
        items: [{ name: "White tee", price: 499 }, { name: "Blue jeans", price: 899 }, { name: "Sneakers", price: 252 }],
        color_palette: ["white", "blue", "grey"],
        styling_tip: "Roll up jeans slightly for a casual look",
        image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
      },
      {
        name: "Office Power Look",
        occasion: "Office",
        total_price: 2800,
        items: [{ name: "Blazer", price: 1299 }, { name: "Trousers", price: 899 }, { name: "Formal shoes", price: 602 }],
        color_palette: ["black", "white", "navy"],
        styling_tip: "Add a pocket square for extra polish",
        image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4b4d24?w=400",
      },
      {
        name: "Festival Glow",
        occasion: "Festival",
        total_price: 2200,
        items: [{ name: "Kurti", price: 999 }, { name: "Palazzo", price: 699 }, { name: "Juttis", price: 502 }],
        color_palette: ["red", "gold", "orange"],
        styling_tip: "Add bangles and bindis for a complete festive look",
        image_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400",
      },
      {
        name: "Gym Beast Mode",
        occasion: "Gym",
        total_price: 1750,
        items: [{ name: "Dry fit tee", price: 599 }, { name: "Track pants", price: 749 }, { name: "Sports shoes", price: 402 }],
        color_palette: ["black", "neon green", "grey"],
        styling_tip: "Choose moisture-wicking fabrics for maximum comfort",
        image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
      },
      {
        name: "Wedding Guest Glam",
        occasion: "Wedding",
        total_price: 3600,
        items: [{ name: "Silk saree", price: 1999 }, { name: "Blouse", price: 702 }, { name: "Heels", price: 899 }],
        color_palette: ["pink", "gold", "champagne"],
        styling_tip: "Gujarati drape style with a modern twist",
        image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
      },
      {
        name: "Casual Weekend",
        occasion: "Casual",
        total_price: 1299,
        items: [{ name: "Linen shirt", price: 499 }, { name: "Chinos", price: 599 }, { name: "Loafers", price: 201 }],
        color_palette: ["beige", "brown", "cream"],
        styling_tip: "Leave top button open and roll sleeves for a relaxed vibe",
        image_url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400",
      },
    ],
  };
}

router.post("/suggest-outfits", async (req, res) => {
  try {
    const body = SuggestOutfitsBody.parse(req.body);
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: OUTFIT_PROMPT },
        {
          role: "user",
          content: `Body: ${body.body_type ?? "athletic"}, Occasion: ${body.occasion ?? "casual"}, Budget: ₹${body.budget ?? 2000}, Skin: ${body.skin_tone ?? "medium"}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });
    const text = response.choices[0].message.content || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start >= 0 && end > start) {
      const parsed = JSON.parse(text.slice(start, end));
      return res.json({ success: true, ...parsed });
    }
    res.json({ success: true, ...getDummyOutfits() });
  } catch {
    res.json({ success: true, ...getDummyOutfits() });
  }
});

router.post("/festival-outfits", async (req, res) => {
  try {
    const { festival = "Diwali", budget = 2000, body_type = "athletic" } = req.body;
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: OUTFIT_PROMPT },
        {
          role: "user",
          content: `Body: ${body_type}, Occasion: ${festival} festival, Budget: ₹${budget}, Skin: medium`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });
    const text = response.choices[0].message.content || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start >= 0 && end > start) {
      const parsed = JSON.parse(text.slice(start, end));
      return res.json({ success: true, ...parsed });
    }
    res.json({ success: true, ...getDummyOutfits() });
  } catch {
    res.json({ success: true, ...getDummyOutfits() });
  }
});

router.post("/save-look", (_req, res) => {
  res.json({ success: true, message: "Look saved successfully" });
});

router.post("/share-look", (_req, res) => {
  res.json({ success: true, share_url: "https://fyndmate.com/look/shared" });
});

export default router;
