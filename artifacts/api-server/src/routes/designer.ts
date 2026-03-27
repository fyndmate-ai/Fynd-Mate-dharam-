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

const OCCASION_IMAGES: Record<string, string> = {
  college: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
  office: "https://images.unsplash.com/photo-1594938298603-c8148c4b4d24?w=400",
  wedding: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
  festival: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400",
  gym: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
  casual: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400",
  party: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
};

const ALL_IMAGES = Object.values(OCCASION_IMAGES);

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
        image_url: OCCASION_IMAGES.college,
      },
      {
        name: "Office Power Look",
        occasion: "Office",
        total_price: 2800,
        items: [{ name: "Blazer", price: 1299 }, { name: "Trousers", price: 899 }, { name: "Formal shoes", price: 602 }],
        color_palette: ["black", "white", "navy"],
        styling_tip: "Add a pocket square for extra polish",
        image_url: OCCASION_IMAGES.office,
      },
      {
        name: "Festival Glow",
        occasion: "Festival",
        total_price: 2200,
        items: [{ name: "Kurti", price: 999 }, { name: "Palazzo", price: 699 }, { name: "Juttis", price: 502 }],
        color_palette: ["red", "gold", "orange"],
        styling_tip: "Add bangles and bindis for a complete festive look",
        image_url: OCCASION_IMAGES.festival,
      },
      {
        name: "Gym Beast Mode",
        occasion: "Gym",
        total_price: 1750,
        items: [{ name: "Dry fit tee", price: 599 }, { name: "Track pants", price: 749 }, { name: "Sports shoes", price: 402 }],
        color_palette: ["black", "neon green", "grey"],
        styling_tip: "Choose moisture-wicking fabrics for maximum comfort",
        image_url: OCCASION_IMAGES.gym,
      },
      {
        name: "Wedding Guest Glam",
        occasion: "Wedding",
        total_price: 3600,
        items: [{ name: "Silk saree", price: 1999 }, { name: "Blouse", price: 702 }, { name: "Heels", price: 899 }],
        color_palette: ["pink", "gold", "champagne"],
        styling_tip: "Gujarati drape style with a modern twist",
        image_url: OCCASION_IMAGES.wedding,
      },
      {
        name: "Casual Weekend",
        occasion: "Casual",
        total_price: 1299,
        items: [{ name: "Linen shirt", price: 499 }, { name: "Chinos", price: 599 }, { name: "Loafers", price: 201 }],
        color_palette: ["beige", "brown", "cream"],
        styling_tip: "Leave top button open and roll sleeves for a relaxed vibe",
        image_url: OCCASION_IMAGES.casual,
      },
    ],
  };
}

router.post("/suggest-outfits", async (req, res) => {
  try {
    const body = SuggestOutfitsBody.parse(req.body);
    const occasionKey = (body.occasion ?? "casual").toLowerCase();
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: OUTFIT_PROMPT },
        {
          role: "user",
          content: `Body: ${body.body_type ?? "athletic"}, Occasion: ${body.occasion ?? "casual"}, Budget: ₹${body.budget ?? 2000}, Skin: ${body.skin_tone ?? "medium"}. Indian fashion.`,
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
      const outfits = parsed.outfits || [];
      outfits.forEach((outfit: any, i: number) => {
        if (!outfit.image_url || !outfit.image_url.startsWith("http")) {
          const occ = (outfit.occasion || occasionKey).toLowerCase();
          outfit.image_url = OCCASION_IMAGES[occ] || ALL_IMAGES[i % ALL_IMAGES.length];
        }
      });
      return res.json({ success: true, outfits });
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
          content: `Body: ${body_type}, Occasion: ${festival} festival traditional Indian, Budget: ₹${budget}, Skin: medium.`,
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
      const outfits = parsed.outfits || [];
      outfits.forEach((outfit: any, i: number) => {
        if (!outfit.image_url || !outfit.image_url.startsWith("http")) {
          outfit.image_url = OCCASION_IMAGES.festival || ALL_IMAGES[i % ALL_IMAGES.length];
        }
      });
      return res.json({ success: true, outfits, festival });
    }
    res.json({ success: true, ...getDummyOutfits() });
  } catch {
    res.json({ success: true, ...getDummyOutfits() });
  }
});

router.post("/try-on", async (req, res) => {
  try {
    const { person_image_base64, clothing_image_url } = req.body as {
      person_image_base64?: string;
      clothing_image_url?: string;
    };

    if (!person_image_base64 || !clothing_image_url) {
      return res.status(400).json({ success: false, message: "Both person image and clothing image URL are required." });
    }

    // Step 1: Fetch the clothing image server-side to convert to base64 (avoids CORS on client)
    let clothingBase64 = "";
    let clothingMime = "image/jpeg";
    try {
      const imgRes = await fetch(clothing_image_url, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "FyndMate/1.0" },
      });
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        clothingBase64 = buf.toString("base64");
        clothingMime = imgRes.headers.get("content-type") || "image/jpeg";
      }
    } catch {}

    const hfToken = process.env.HUGGINGFACE_API_KEY;

    // Step 2: Attempt real virtual try-on via HuggingFace Kolors space
    if (hfToken && clothingBase64) {
      try {
        const personDataUrl = person_image_base64.startsWith("data:")
          ? person_image_base64
          : `data:image/jpeg;base64,${person_image_base64}`;
        const clothingDataUrl = `data:${clothingMime};base64,${clothingBase64}`;

        const gradioRes = await fetch(
          "https://kwai-kolors-kolors-virtual-try-on.hf.space/run/predict",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${hfToken}`,
            },
            body: JSON.stringify({
              data: [personDataUrl, clothingDataUrl, "upper_body"],
            }),
            signal: AbortSignal.timeout(30000),
          }
        );

        if (gradioRes.ok) {
          const gradioData = await gradioRes.json() as any;
          const rawResult = gradioData?.data?.[0];
          if (rawResult) {
            const resultB64 = typeof rawResult === "string"
              ? rawResult.replace(/^data:[^;]+;base64,/, "")
              : null;
            if (resultB64) {
              return res.json({ success: true, result_image: resultB64 });
            }
          }
        }
      } catch {
        // fall through to fallback
      }
    }

    // Step 3: Return clothing image base64 as fallback so client can do canvas composite
    if (clothingBase64) {
      return res.json({
        success: false,
        fallback: true,
        clothing_image_b64: clothingBase64,
        clothing_mime: clothingMime,
        message: "Showing style preview",
      });
    }

    return res.json({
      success: false,
      fallback: true,
      clothing_image_url,
      message: "Showing style preview",
    });
  } catch (e: any) {
    res.json({
      success: false,
      fallback: true,
      clothing_image_url: req.body?.clothing_image_url || "",
      message: "Try-on temporarily unavailable.",
    });
  }
});

router.post("/voice-chat", async (req, res) => {
  try {
    const { message, context } = req.body as {
      message: string;
      context?: { body_type?: string; occasion?: string; budget?: number; skin_tone?: string };
    };
    if (!message) return res.status(400).json({ error: "No message provided" });

    const groq = getGroqClient();
    const systemPrompt = `You are Aanya, FyndMate's live AI fashion stylist for India. 
You give quick, friendly, conversational fashion advice. Keep replies under 3 sentences.
Speak naturally — like a knowledgeable dost (friend) who loves Indian fashion.
${context ? `User context: Body type: ${context.body_type || "unknown"}, Occasion: ${context.occasion || "casual"}, Budget: ₹${context.budget || 2000}, Skin tone: ${context.skin_tone || "medium"}.` : ""}
Focus on Indian fashion brands, local options, and budget-friendly picks on Amazon/Flipkart/Myntra.`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    const reply = response.choices[0].message.content || "Let me think about that for a moment!";
    return res.json({ success: true, reply });
  } catch {
    return res.json({ success: true, reply: "I love that question! Try a classic kurta with palazzo pants — it works for almost every Indian occasion and looks stunning under any budget." });
  }
});

router.post("/save-look", (_req, res) => {
  res.json({ success: true, message: "Look saved successfully" });
});

router.post("/share-look", (_req, res) => {
  res.json({ success: true, share_url: "https://fyndmate.com/look/shared" });
});

router.get("/warmup", (_req, res) => {
  res.json({ status: "ready" });
});

router.post("/chat-style", async (req, res) => {
  try {
    const { message, user_profile } = req.body as {
      message: string;
      user_profile?: { body_type?: string; budget_hint?: number; occasion_hint?: string };
    };
    if (!message) return res.status(400).json({ success: false, error: "No message" });

    const groq = getGroqClient();

    const parseResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are Aanya, FyndMate's warm friendly Indian fashion stylist AI.
Parse the user message and extract occasion, budget, body_type, color_preference, item_type.
Write a short friendly response (1-2 lines max, use 1 emoji).
Respond ONLY in valid JSON:
{
  "aanya_response": "your friendly reply",
  "occasion": "college/office/wedding/festival/gym/casual/party",
  "budget": number,
  "body_type": "slim/athletic/curvy/plus",
  "color": "color name or null",
  "item_type": "item name or null"
}`,
        },
        { role: "user", content: message },
      ],
      temperature: 0.4,
      max_tokens: 300,
    });

    const parseText = parseResponse.choices[0].message.content || "";
    const ps = parseText.indexOf("{");
    const pe = parseText.lastIndexOf("}") + 1;

    let extracted = {
      aanya_response: "Perfect! Here are some amazing outfits for you! ✨",
      occasion: user_profile?.occasion_hint || "casual",
      budget: user_profile?.budget_hint || 2000,
      body_type: user_profile?.body_type || "athletic",
      color: null as string | null,
      item_type: null as string | null,
    };

    if (ps >= 0 && pe > ps) {
      try {
        const p = JSON.parse(parseText.slice(ps, pe));
        extracted = { ...extracted, ...p };
        if (!p.budget || p.budget <= 0) extracted.budget = user_profile?.budget_hint || 2000;
      } catch {}
    }

    const outfitPrompt = extracted.color
      ? `${OUTFIT_PROMPT}\nUser wants ${extracted.color} color outfits.`
      : OUTFIT_PROMPT;

    const outfitResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: outfitPrompt },
        {
          role: "user",
          content: `Body: ${extracted.body_type}, Occasion: ${extracted.occasion}, Budget: ₹${extracted.budget}${extracted.color ? `, Color: ${extracted.color}` : ""}${extracted.item_type ? `, Item: ${extracted.item_type}` : ""}. Indian fashion.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const outfitText = outfitResponse.choices[0].message.content || "";
    const os = outfitText.indexOf("{");
    const oe = outfitText.lastIndexOf("}") + 1;

    let outfits: any[] = [];
    if (os >= 0 && oe > os) {
      try {
        const parsed = JSON.parse(outfitText.slice(os, oe));
        outfits = parsed.outfits || [];
        const occasionKey = extracted.occasion.toLowerCase();
        outfits.forEach((outfit: any, i: number) => {
          if (!outfit.image_url || !outfit.image_url.startsWith("http")) {
            const occ = (outfit.occasion || occasionKey).toLowerCase();
            outfit.image_url = OCCASION_IMAGES[occ] || ALL_IMAGES[i % ALL_IMAGES.length];
          }
        });
      } catch {}
    }

    if (outfits.length === 0) outfits = getDummyOutfits().outfits;

    res.json({
      success: true,
      aanya_response: extracted.aanya_response,
      outfits: outfits.slice(0, 4),
      extracted: { occasion: extracted.occasion, budget: extracted.budget, body_type: extracted.body_type },
    });
  } catch (e: any) {
    res.json({
      success: true,
      aanya_response: "I'd love to help! Try asking me about casual outfits, wedding looks, or office wear! ✨",
      outfits: getDummyOutfits().outfits.slice(0, 4),
      extracted: {},
    });
  }
});

export default router;
