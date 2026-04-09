from pydantic import BaseModel
from typing import Optional


class SearchRequest(BaseModel):
    query: str
    budget: Optional[float] = None


class DesignerRequest(BaseModel):
    query: str
    budget: Optional[float] = None
    body_type: Optional[str] = "athletic"
    skin_tone: Optional[str] = "medium"


class PriceRequest(BaseModel):
    product_name: str
    budget: float = 2000
