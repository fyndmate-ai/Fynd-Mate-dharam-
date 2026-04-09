from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import finder, designer, products
import os

app = FastAPI(title="FyndMate API", version="1.0.0")

allow_origins = os.environ.get("ALLOW_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(finder.router, prefix="/api/finder", tags=["AI Finder"])
app.include_router(designer.router, prefix="/api/designer", tags=["AI Designer"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])


@app.get("/health")
async def health():
    return {
        "status": "FyndMate API running",
        "version": "1.0.0",
        "ai": "OpenAI GPT-4o",
        "origins": allow_origins,
    }
