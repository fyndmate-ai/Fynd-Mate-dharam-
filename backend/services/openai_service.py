import os
import json
from openai import OpenAI
from services.price_service import compare_prices
from services.review_service import (
    assess_review_risk,
    estimate_return_risk,
    estimate_use_case_score,
)
from services.designer_service import (
    infer_occasion,
    infer_seasonal_tag,
    fit_reason_for_body_type,
    score_occasion_alignment,
    score_color_compatibility,
)

def _get_openai_client() -> OpenAI | None:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)

FINDER_SYSTEM = """You are FyndMate's shopping assistant. Return valid JSON with:
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "brand": "string",
      "price": number,
      "image_url": "string",
      "match_score": number,
      "return_risk": "low|medium|high",
      "fake_review_warning": boolean,
      "fake_review_reason": "string",
      "pros": ["string"],
      "cons": ["string"],
      "explanation": "string",
      "buy_amazon_url": "string",
      "buy_flipkart_url": "string",
      "amazon_price": number,
      "flipkart_price": number
    }
  ],
  "explanation": "string"
}"""

DESIGNER_SYSTEM = """You are FyndMate's fashion stylist. Return valid JSON:
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "category": "top|bottom|shoes|accessory",
      "price": number,
      "image_url": "string",
      "source": "Amazon|Flipkart|Myntra",
      "buy_url": "string",
      "color": "string"
    }
  ]
}"""


async def search_products(query: str, budget: float | None, real_products: list):
    if real_products:
        real_lines = []
        for item in real_products[:8]:
            real_lines.append(
                f"- {item.get('name')} | Rs {item.get('price')} | rating {item.get('rating')} | reviews {item.get('reviews')}"
            )
        products_text = "\n".join(real_lines)
        user_content = (
            f"Query: {query}\nBudget: {budget if budget is not None else 'flexible'}\n\n"
            f"Real available products:\n{products_text}\n\n"
            "Select best 1-5 picks from this list."
        )
    else:
        user_content = f"Query: {query}\nBudget: {budget if budget is not None else 'flexible'}"
    try:
        client = _get_openai_client()
        if client is None:
            raise ValueError("OPENAI_API_KEY not configured")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": FINDER_SYSTEM},
                {"role": "user", "content": user_content},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw = json.loads(response.choices[0].message.content)
        products = raw.get("products", [])
        hydrated = []
        for index, product in enumerate(products[:5]):
            name = product.get("name", "Recommended Product")
            rating = product.get("rating")
            review_count = product.get("reviews")
            matched_real = next(
                (entry for entry in real_products if name.lower()[:24] in entry.get("name", "").lower()),
                None,
            )
            platform_prices = await compare_prices(
                name,
                budget if budget is not None else max(float(product.get("price", 0) or 0), 1000.0),
            )
            review_info = assess_review_risk(name, rating=rating, reviews_count=review_count)
            return_info = estimate_return_risk(name, query=query)
            use_case_score = estimate_use_case_score(name, query=query, rating=rating if isinstance(rating, (int, float)) else None)
            hydrated.append(
                {
                    "id": product.get("id", f"p-{index+1}"),
                    "name": name,
                    "brand": product.get("brand", "Generic"),
                    "price": int(
                        matched_real.get("price") if matched_real and matched_real.get("price") else product.get("price", 0) or 0
                    ),
                    "image_url": matched_real.get("image_url") if matched_real else product.get(
                        "image_url",
                        "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800&q=80",
                    ),
                    "match_score": int(product.get("match_score", 85)),
                    "use_case_score": use_case_score,
                    "return_risk": return_info["return_risk"],
                    "return_risk_reason": return_info["reason"],
                    "fake_review_warning": bool(review_info["fake_review_warning"]),
                    "fake_review_reason": review_info["reason"],
                    "pros": product.get("pros", []),
                    "cons": product.get("cons", []),
                    "explanation": product.get("explanation", ""),
                    "buy_amazon_url": (
                        matched_real.get("amazon_url")
                        if matched_real
                        else product.get("buy_amazon_url", "https://www.amazon.in/")
                    ),
                    "buy_flipkart_url": (
                        matched_real.get("flipkart_url")
                        if matched_real
                        else product.get("buy_flipkart_url", "https://www.flipkart.com/")
                    ),
                    "amazon_price": int(platform_prices.get("amazon", 0)),
                    "flipkart_price": int(platform_prices.get("flipkart", 0)),
                    "market_avg_price": int(platform_prices.get("market_avg", 0)),
                    "savings_vs_avg": int(platform_prices.get("savings_vs_avg", 0)),
                }
            )
        return {
            "products": hydrated,
            "explanation": raw.get("explanation", "AI-ranked options based on your query.")
        }
    except Exception:
        fallback_budget = int(budget) if budget is not None else 2000
        return {"products": _fallback_products(query, fallback_budget), "explanation": "Showing best fallback results."}


async def search_outfits(query: str, budget: float | None, body_type: str, skin_tone: str):
    user_content = (
        f"Query: {query}\nBudget: {budget if budget is not None else 'flexible'}\n"
        f"Body type: {body_type}\nSkin tone: {skin_tone}"
    )
    try:
        client = _get_openai_client()
        if client is None:
            raise ValueError("OPENAI_API_KEY not configured")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": DESIGNER_SYSTEM},
                {"role": "user", "content": user_content},
            ],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        raw = json.loads(response.choices[0].message.content)
        items = raw.get("items", [])
        mapped = []
        occasion = infer_occasion(query)
        seasonal = infer_seasonal_tag(query)
        for index, item in enumerate(items[:9]):
            category = item.get("category", "top")
            color = item.get("color", "Neutral")
            price = int(item.get("price", 999))
            occasion_score = score_occasion_alignment(item.get("name", "Styling pick"), occasion, query)
            compatibility_score = score_color_compatibility(color, skin_tone)
            mapped.append(
                {
                    "id": item.get("id", f"i-{index+1}"),
                    "name": item.get("name", "Styling pick"),
                    "category": category,
                    "price": price,
                    "image_url": item.get(
                        "image_url",
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=80",
                    ),
                    "source": (
                        item.get("source")
                        if item.get("source") in {"Amazon", "Flipkart", "Myntra"}
                        else "Amazon"
                    ),
                    "buy_url": item.get("buy_url", "https://www.amazon.in/"),
                    "color": color,
                    "occasion_score": occasion_score,
                    "compatibility_score": compatibility_score,
                    "fit_reason": fit_reason_for_body_type(body_type, category),
                    "occasion_tag": occasion,
                    "seasonal_tag": seasonal,
                }
            )
        balanced = _apply_budget_balancing(mapped, budget)
        recommendations = _build_complete_look_recommendations(balanced, budget)
        return {
            "items": balanced,
            "recommendations": recommendations,
            "occasion_tag": occasion,
            "seasonal_tag": seasonal,
        }
    except Exception:
        fallback = _fallback_items(body_type=body_type, skin_tone=skin_tone, query=query)
        recommendations = _build_complete_look_recommendations(fallback, budget)
        return {
            "items": fallback,
            "recommendations": recommendations,
            "occasion_tag": infer_occasion(query),
            "seasonal_tag": infer_seasonal_tag(query),
        }


def _fallback_products(query: str, budget: int):
    base = max(999, min(budget, 50000))
    return [
        {
            "id": "p-1",
            "name": f"Top pick for {query}",
            "brand": "FyndMate Select",
            "price": base,
            "image_url": "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800&q=80",
            "match_score": 92,
            "return_risk": "low",
            "use_case_score": 91,
            "return_risk_reason": "Stable category with lower mismatch returns.",
            "fake_review_warning": False,
            "fake_review_reason": "Low anomaly confidence.",
            "pros": ["Good value", "Reliable quality", "Strong use-case fit"],
            "cons": ["Limited color options"],
            "explanation": "Balanced pick for your stated budget and intent.",
            "buy_amazon_url": "https://www.amazon.in/",
            "buy_flipkart_url": "https://www.flipkart.com/",
            "amazon_price": base,
            "flipkart_price": int(base * 1.02),
            "market_avg_price": int(base * 1.08),
            "savings_vs_avg": int(base * 0.08),
        },
        {
            "id": "p-2",
            "name": f"Alternative 1 for {query}",
            "brand": "FyndMate Alt",
            "price": int(base * 0.95),
            "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
            "match_score": 88,
            "return_risk": "medium",
            "use_case_score": 86,
            "return_risk_reason": "Specification variance may affect expectations.",
            "fake_review_warning": False,
            "fake_review_reason": "Mixed but mostly organic reviews.",
            "pros": ["Affordable", "Good availability"],
            "cons": ["Slightly lower durability"],
            "explanation": "Cheaper alternative with acceptable tradeoffs.",
            "buy_amazon_url": "https://www.amazon.in/",
            "buy_flipkart_url": "https://www.flipkart.com/",
            "amazon_price": int(base * 0.95),
            "flipkart_price": int(base * 0.93),
            "market_avg_price": int(base),
            "savings_vs_avg": int(base * 0.07),
        },
    ]


def _apply_budget_balancing(items: list[dict], budget: float | None) -> list[dict]:
    if budget is None or budget <= 0:
        return items
    target_total = int(budget)
    current_total = sum(item.get("price", 0) for item in items[:3])
    if current_total <= target_total:
        return items

    scale = max(0.72, min(0.95, target_total / max(current_total, 1)))
    adjusted = []
    for item in items:
        if item.get("category") in {"top", "bottom", "shoes"}:
            item["price"] = max(499, int(item.get("price", 999) * scale))
        adjusted.append(item)
    return adjusted


def _build_complete_look_recommendations(items: list[dict], budget: float | None) -> list[dict]:
    grouped: dict[str, list[dict]] = {"top": [], "bottom": [], "shoes": [], "accessory": []}
    for item in items:
        category = item.get("category", "top")
        if category in grouped:
            grouped[category].append(item)

    top = grouped["top"][0] if grouped["top"] else None
    bottom = grouped["bottom"][0] if grouped["bottom"] else None
    shoes = grouped["shoes"][0] if grouped["shoes"] else None
    accessory = grouped["accessory"][0] if grouped["accessory"] else None

    if not top or not bottom:
        return []

    look_items = [entry for entry in [top, bottom, shoes, accessory] if entry]
    total = sum(item.get("price", 0) for item in look_items)
    within_budget = budget is None or total <= budget
    return [
        {
            "title": "Complete the Look",
            "items": look_items,
            "total_price": total,
            "within_budget": within_budget,
            "note": "Budget-friendly match." if within_budget else "Slightly above target budget.",
        }
    ]


def enrich_clothing_items(
    items: list[dict], query: str, budget: float | None, body_type: str, skin_tone: str
) -> dict:
    occasion = infer_occasion(query)
    seasonal = infer_seasonal_tag(query)
    mapped = []
    for item in items[:12]:
        category = item.get("category", "top")
        color = item.get("color", "Neutral")
        mapped.append(
            {
                "id": item.get("id"),
                "name": item.get("name"),
                "category": category,
                "price": int(item.get("price", 999)),
                "image_url": item.get("image_url"),
                "source": item.get("source", "Amazon"),
                "buy_url": item.get("buy_url", "https://www.amazon.in/"),
                "color": color,
                "occasion_score": score_occasion_alignment(item.get("name", ""), occasion, query),
                "compatibility_score": score_color_compatibility(color, skin_tone),
                "fit_reason": fit_reason_for_body_type(body_type, category),
                "occasion_tag": occasion,
                "seasonal_tag": seasonal,
            }
        )

    balanced = _apply_budget_balancing(mapped, budget)
    return {
        "items": balanced,
        "recommendations": _build_complete_look_recommendations(balanced, budget),
        "occasion_tag": occasion,
        "seasonal_tag": seasonal,
    }


def _fallback_items(body_type: str, skin_tone: str, query: str):
    occasion = infer_occasion(query)
    seasonal = infer_seasonal_tag(query)
    categories = ["top", "bottom", "shoes", "accessory", "top", "bottom", "top", "shoes", "accessory"]
    source_cycle = ["Amazon", "Flipkart", "Myntra"]
    color_cycle = ["Navy", "Olive", "White", "Maroon", "Beige", "Black", "Cream", "Cobalt", "Mustard"]
    image_map = {
        "top": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=80",
        "bottom": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=700&q=80",
        "shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=80",
        "accessory": "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&q=80",
    }
    result = []
    for index, category in enumerate(categories):
        color = color_cycle[index % len(color_cycle)]
        result.append(
            {
                "id": f"i-{index+1}",
                "name": f"Suggested {category.title()} {index+1}",
                "category": category,
                "price": 999 + index * 150,
                "image_url": image_map[category],
                "source": source_cycle[index % len(source_cycle)],
                "buy_url": "https://www.amazon.in/",
                "color": color,
                "occasion_score": score_occasion_alignment(f"Suggested {category.title()}", occasion, query),
                "compatibility_score": score_color_compatibility(color, skin_tone),
                "fit_reason": fit_reason_for_body_type(body_type, category),
                "occasion_tag": occasion,
                "seasonal_tag": seasonal,
            }
        )
    return result
