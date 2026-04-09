import random


async def compare_prices(product_name: str, budget: float):
    baseline = max(299.0, budget * 0.9)
    jitter = random.uniform(0.95, 1.05)
    baseline = baseline * jitter
    amazon_price = round(baseline, 2)
    flipkart_price = round(baseline * random.uniform(0.96, 1.04), 2)
    best = "amazon" if amazon_price <= flipkart_price else "flipkart"
    spread = abs(amazon_price - flipkart_price)
    market_avg = round((amazon_price + flipkart_price) / 2 + spread * 0.65, 2)
    savings_vs_avg = round(max(0.0, market_avg - min(amazon_price, flipkart_price)), 2)
    return {
        "amazon": amazon_price,
        "flipkart": flipkart_price,
        "best": best,
        "market_avg": market_avg,
        "savings_vs_avg": savings_vs_avg,
        "product_name": product_name,
    }
