from fastapi import APIRouter
from models.schemas import SearchRequest, GiftRequest
from services.groq_service import search_product, get_gifts
from services.price_service import compare_prices, fetch_real_products
import os

router = APIRouter()


@router.post("/search")
async def search(req: SearchRequest):
    try:
        # Step 1: Fetch REAL products from Amazon via RapidAPI
        real_products = await fetch_real_products(req.query, req.budget)

        # Step 2: Send real products to Groq AI for ranking and explanation
        result = await search_product(req.query, req.budget, req.use_case, real_products)

        # Step 3: Get price comparison
        product_name = result.get("product_name", req.query)
        prices = await compare_prices(product_name, req.budget)

        # Step 4: Add prices and affiliate links to result
        result["prices"] = prices
        result["affiliate_links"] = {
            "amazon": prices.get("amazon", {}).get("affiliate_url", f"https://amazon.in/s?k={product_name}&tag=fyndmate-21"),
            "flipkart": prices.get("flipkart", {}).get("affiliate_url", f"https://flipkart.com/search?q={product_name}"),
            "myntra": prices.get("myntra", {}).get("url", f"https://myntra.com/search?q={product_name}")
        }

        return {
            "success": True,
            "main_product": result,
            "prices": prices,
            "real_products_found": len(real_products)
        }

    except Exception as e:
        print(f"Search endpoint error: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Search temporarily unavailable. Please try again."
        }


@router.post("/gift-finder")
async def gift_finder(req: GiftRequest):
    try:
        result = await get_gifts(req.recipient, req.interests, req.budget)
        return {"success": True, **result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/health")
async def finder_health():
    groq_key = os.environ.get("GROQ_API_KEY")
    rapid_key = os.environ.get("RAPIDAPI_KEY")
    return {
        "finder_status": "online",
        "groq_connected": bool(groq_key),
        "rapidapi_connected": bool(rapid_key),
        "mode": "real_products" if rapid_key else "dummy_data"
    }