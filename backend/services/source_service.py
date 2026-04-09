import os
import urllib.parse
import httpx


def _safe_number(value, default: float = 0) -> float:
    try:
        if value is None:
            return default
        if isinstance(value, str):
            cleaned = (
                value.replace(",", "")
                .replace("₹", "")
                .replace("rs", "")
                .replace("Rs", "")
                .strip()
            )
            return float(cleaned)
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_product_item(item: dict, fallback_query: str) -> dict:
    name = item.get("product_title") or item.get("title") or item.get("name") or fallback_query
    price = _safe_number(item.get("product_price") or item.get("price"), 0)
    rating = _safe_number(item.get("product_star_rating") or item.get("rating"), 0)
    reviews = int(_safe_number(item.get("product_num_ratings") or item.get("reviews"), 0))
    image = (
        item.get("product_photo")
        or item.get("thumbnail")
        or item.get("image")
        or "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800&q=80"
    )
    asin_or_id = str(item.get("asin") or item.get("id") or urllib.parse.quote_plus(name))
    return {
        "name": name,
        "brand": item.get("brand") or item.get("brand_name") or "Generic",
        "price": int(price) if price > 0 else 0,
        "rating": rating if rating > 0 else None,
        "reviews": reviews if reviews > 0 else None,
        "image_url": image,
        "amazon_url": item.get("product_url")
        or f"https://www.amazon.in/s?k={urllib.parse.quote_plus(name)}",
        "flipkart_url": f"https://www.flipkart.com/search?q={urllib.parse.quote_plus(name)}",
        "source_id": asin_or_id,
    }


def _to_clothing_item(item: dict, fallback_query: str, index: int) -> dict:
    name = item.get("product_title") or item.get("title") or item.get("name") or fallback_query
    lowered = name.lower()
    if any(key in lowered for key in ("shirt", "tshirt", "kurta", "top", "blouse", "hoodie", "jacket")):
        category = "top"
    elif any(key in lowered for key in ("jeans", "trouser", "pants", "skirt", "bottom", "shorts")):
        category = "bottom"
    elif any(key in lowered for key in ("shoe", "sneaker", "slipper", "sandals", "loafer")):
        category = "shoes"
    else:
        category = "accessory"

    source_cycle = ["Amazon", "Flipkart", "Myntra"]
    color_cycle = ["Navy", "Olive", "White", "Maroon", "Beige", "Black", "Cream", "Cobalt", "Mustard"]
    image = (
        item.get("product_photo")
        or item.get("thumbnail")
        or item.get("image")
        or "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=80"
    )
    price = _safe_number(item.get("product_price") or item.get("price"), 0)
    return {
        "id": str(item.get("asin") or item.get("id") or f"cloth-{index+1}"),
        "name": name,
        "category": category,
        "price": int(price) if price > 0 else 999 + index * 120,
        "image_url": image,
        "source": source_cycle[index % len(source_cycle)],
        "buy_url": item.get("product_url") or f"https://www.amazon.in/s?k={urllib.parse.quote_plus(name)}",
        "color": color_cycle[index % len(color_cycle)],
    }


async def fetch_real_products(query: str, budget: float | None) -> list[dict]:
    rapidapi_key = os.environ.get("RAPIDAPI_KEY")
    rapidapi_host = os.environ.get("RAPIDAPI_HOST", "real-time-amazon-data.p.rapidapi.com")

    if rapidapi_key:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.get(
                    f"https://{rapidapi_host}/search",
                    params={
                        "query": query,
                        "country": "IN",
                        "language": "en_IN",
                        "page": "1",
                    },
                    headers={
                        "X-RapidAPI-Key": rapidapi_key,
                        "X-RapidAPI-Host": rapidapi_host,
                    },
                )
                response.raise_for_status()
                payload = response.json()
                raw_items = (
                    payload.get("data", {}).get("products")
                    or payload.get("data", {}).get("results")
                    or payload.get("products")
                    or payload.get("results")
                    or []
                )
                items = [_to_product_item(entry, query) for entry in raw_items]
                if budget is not None and budget > 0:
                    items = [entry for entry in items if entry.get("price", 0) <= int(budget * 1.2)]
                return items[:8]
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as error:
            print(f"RapidAPI product fetch failed: {error}")

    # Backup real HTTP source for development without API keys.
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://dummyjson.com/products/search",
                params={"q": query},
            )
            response.raise_for_status()
            payload = response.json()
            products = payload.get("products", [])
            normalized = [
                _to_product_item(
                    {
                        "title": item.get("title"),
                        "brand": item.get("brand"),
                        "price": item.get("price"),
                        "rating": item.get("rating"),
                        "reviews": item.get("stock"),
                        "thumbnail": item.get("thumbnail"),
                        "id": item.get("id"),
                    },
                    query,
                )
                for item in products
            ]
            if budget is not None and budget > 0:
                normalized = [entry for entry in normalized if entry.get("price", 0) <= int(budget * 1.2)]
            return normalized[:8]
    except (httpx.HTTPError, ValueError, TypeError, KeyError) as error:
        print(f"Fallback product fetch failed: {error}")
        return []


async def fetch_real_clothing(query: str, budget: float | None) -> list[dict]:
    rapidapi_key = os.environ.get("RAPIDAPI_KEY")
    rapidapi_host = os.environ.get("RAPIDAPI_HOST", "real-time-amazon-data.p.rapidapi.com")

    if rapidapi_key:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.get(
                    f"https://{rapidapi_host}/search",
                    params={"query": query, "country": "IN", "language": "en_IN", "page": "1"},
                    headers={"X-RapidAPI-Key": rapidapi_key, "X-RapidAPI-Host": rapidapi_host},
                )
                response.raise_for_status()
                payload = response.json()
                raw_items = (
                    payload.get("data", {}).get("products")
                    or payload.get("data", {}).get("results")
                    or payload.get("products")
                    or payload.get("results")
                    or []
                )
                items = [_to_clothing_item(entry, query, index) for index, entry in enumerate(raw_items)]
                if budget is not None and budget > 0:
                    items = [entry for entry in items if entry.get("price", 0) <= int(budget * 0.7)]
                return items[:12]
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as error:
            print(f"RapidAPI clothing fetch failed: {error}")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("https://dummyjson.com/products/search", params={"q": query})
            response.raise_for_status()
            payload = response.json()
            products = payload.get("products", [])
            mapped = [
                _to_clothing_item(
                    {
                        "title": item.get("title"),
                        "price": item.get("price"),
                        "thumbnail": item.get("thumbnail"),
                        "id": item.get("id"),
                    },
                    query,
                    index,
                )
                for index, item in enumerate(products)
            ]
            if budget is not None and budget > 0:
                mapped = [entry for entry in mapped if entry.get("price", 0) <= int(budget * 0.7)]
            return mapped[:12]
    except (httpx.HTTPError, ValueError, TypeError, KeyError) as error:
        print(f"Fallback clothing fetch failed: {error}")
        return []
