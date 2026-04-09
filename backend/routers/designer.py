from fastapi import APIRouter
from models.schemas import DesignerRequest
from services.openai_service import search_outfits, enrich_clothing_items
from services.query_service import parse_budget_from_query
from services.source_service import fetch_real_clothing

router = APIRouter()


@router.post("/search-outfits")
async def designer_search(req: DesignerRequest):
    budget = req.budget if req.budget is not None else parse_budget_from_query(req.query)
    body_type = req.body_type or "athletic"
    skin_tone = req.skin_tone or "medium"
    real_clothing = await fetch_real_clothing(req.query, budget)
    if real_clothing:
        result = enrich_clothing_items(
            items=real_clothing,
            query=req.query,
            budget=budget,
            body_type=body_type,
            skin_tone=skin_tone,
        )
    else:
        result = await search_outfits(
            query=req.query,
            budget=budget,
            body_type=body_type,
            skin_tone=skin_tone,
        )
    return {
        "items": result.get("items", []),
        "budget_lock": budget,
        "occasion_tag": result.get("occasion_tag"),
        "seasonal_tag": result.get("seasonal_tag"),
        "recommendations": result.get("recommendations", []),
        "real_items_found": len(real_clothing),
    }
