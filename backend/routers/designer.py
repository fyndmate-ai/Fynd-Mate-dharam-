from fastapi import APIRouter
from models.schemas import OutfitRequest, TryOnRequest, FestivalRequest
from services.groq_service import get_outfits
import base64
import httpx
import os
import asyncio
import tempfile

router = APIRouter()

# Curated body-type matched outfit images for instant demo
OUTFIT_IMAGES = {
    "college": [
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
    ],
    "office": [
        "https://images.unsplash.com/photo-1594938298603-c8148c4b4d24?w=400",
        "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400",
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
    ],
    "wedding": [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
        "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400",
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    ],
    "festival": [
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400",
        "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400",
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
    ],
    "gym": [
        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
        "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400",
    ],
    "casual": [
        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400",
    ],
    "party": [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
    ],
}


@router.post("/suggest-outfits")
async def suggest_outfits(req: OutfitRequest):
    try:
        result = await get_outfits(req.body_type, req.occasion, req.budget, req.skin_tone)

        # Add real images to outfits
        occasion_key = req.occasion.lower()
        images = OUTFIT_IMAGES.get(occasion_key, OUTFIT_IMAGES["casual"])

        outfits = result.get("outfits", [])
        for i, outfit in enumerate(outfits):
            if not outfit.get("image_url") or "unsplash" not in outfit.get("image_url", ""):
                outfit["image_url"] = images[i % len(images)]

        return {"success": True, "outfits": outfits}

    except Exception as e:
        print(f"Outfit suggestion error: {e}")
        return {"success": False, "error": str(e), "outfits": []}


@router.post("/try-on")
async def try_on(req: TryOnRequest):
    try:
        hf_token = os.environ.get("HUGGINGFACE_API_KEY")

        if not hf_token:
            return {
                "success": False,
                "message": "Virtual try-on requires HuggingFace API key",
                "fallback_image": req.clothing_image_url
            }

        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            _run_tryon_sync,
            req.person_image_base64,
            req.clothing_image_url,
            hf_token
        )
        return result

    except Exception as e:
        print(f"Try-on error: {e}")
        return {
            "success": False,
            "message": "Try-on service is busy. Please try again in 30 seconds.",
            "fallback_image": req.clothing_image_url
        }


def _run_tryon_sync(person_image_base64: str, clothing_image_url: str, hf_token: str):
    try:
        from gradio_client import Client, handle_file

        client = Client(
            "yisol/IDM-VTON",
            hf_token=hf_token
        )

        # Save person image
        person_bytes = base64.b64decode(person_image_base64)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            f.write(person_bytes)
            person_path = f.name

        # Download clothing image
        clothing_data = httpx.get(clothing_image_url, timeout=15.0).content
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            f.write(clothing_data)
            clothing_path = f.name

        # Call IDM-VTON
        result = client.predict(
            dict({"background": handle_file(person_path), "layers": [], "composite": None}),
            dict({"background": handle_file(clothing_path), "layers": [], "composite": None}),
            "FyndMate virtual try-on",
            True,
            True,
            20,
            20,
            api_name="/tryon"
        )

        # Convert result to base64
        result_path = result[0]
        with open(result_path, "rb") as img:
            result_b64 = base64.b64encode(img.read()).decode()

        # Cleanup
        os.unlink(person_path)
        os.unlink(clothing_path)

        return {
            "success": True,
            "result_image": result_b64,
            "message": "Try-on complete!"
        }

    except Exception as e:
        print(f"Sync try-on error: {e}")
        return {
            "success": False,
            "message": f"Try-on failed: {str(e)[:100]}. Please retry.",
            "fallback_image": clothing_image_url
        }


@router.post("/festival-outfits")
async def festival_outfits(req: FestivalRequest):
    try:
        result = await get_outfits(
            req.body_type,
            f"{req.festival} festival traditional Indian",
            req.budget,
            "medium"
        )
        outfits = result.get("outfits", [])
        images = OUTFIT_IMAGES.get("festival", OUTFIT_IMAGES["casual"])
        for i, outfit in enumerate(outfits):
            outfit["image_url"] = images[i % len(images)]
        return {"success": True, "outfits": outfits, "festival": req.festival}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/warmup")
async def warmup_tryon():
    """Call this when user opens AI Designer page to pre-warm HuggingFace space"""
    hf_token = os.environ.get("HUGGINGFACE_API_KEY")
    if not hf_token:
        return {"status": "no_key"}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.get(
                "https://yisol-idm-vton.hf.space/",
                headers={"Authorization": f"Bearer {hf_token}"}
            )
        return {"status": "warmed_up"}
    except:
        return {"status": "warming"}