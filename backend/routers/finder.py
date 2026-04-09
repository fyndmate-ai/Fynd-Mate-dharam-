from fastapi import APIRouter
from models.schemas import SearchRequest
from services.openai_service import search_products
from services.query_service import parse_budget_from_query
from services.source_service import fetch_real_products

router = APIRouter()


@router.post("/search")
async def finder_search(req: SearchRequest):
    budget = req.budget if req.budget is not None else parse_budget_from_query(req.query)
    real_products = await fetch_real_products(req.query, budget)
    result = await search_products(req.query, budget, real_products=real_products)
    return {
        "products": result.get("products", []),
        "explanation": result.get("explanation", "No explanation available."),
        "budget_lock": budget,
        "real_products_found": len(real_products),
    }
