from fastapi import APIRouter
from models.schemas import PriceRequest
from services.price_service import compare_prices

router = APIRouter()


@router.post("/compare")
async def compare(req: PriceRequest):
    return await compare_prices(req.product_name, req.budget)
