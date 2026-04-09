def assess_review_risk(
    product_name: str,
    rating: float | None = None,
    reviews_count: int | None = None,
) -> dict:
    warning = False
    reasons: list[str] = []

    if reviews_count is not None and reviews_count < 20:
        warning = True
        reasons.append("Very low review sample size.")
    if rating is not None and rating >= 4.9 and (reviews_count or 0) < 120:
        warning = True
        reasons.append("Unusually high rating for review volume.")
    if rating is not None and rating < 3.6:
        reasons.append("Lower ratings indicate mixed customer sentiment.")

    return {
        "product_name": product_name,
        "fake_review_warning": warning,
        "reason": " ".join(reasons) if reasons else "Review pattern appears mostly organic.",
    }


def estimate_return_risk(product_name: str, query: str) -> dict:
    text = f"{product_name} {query}".lower()

    high_risk_terms = ("fashion", "shirt", "jeans", "shoes", "lehenga", "dress")
    medium_risk_terms = ("earbuds", "headphones", "watch", "keyboard")

    if any(term in text for term in high_risk_terms):
        return {"return_risk": "high", "reason": "Size and fit variance can increase returns."}
    if any(term in text for term in medium_risk_terms):
        return {"return_risk": "medium", "reason": "Personal comfort preference may affect satisfaction."}
    return {"return_risk": "low", "reason": "Lower fit mismatch probability for this product class."}


def estimate_use_case_score(product_name: str, query: str, rating: float | None = None) -> int:
    query_tokens = {token for token in query.lower().split() if len(token) > 2}
    name_tokens = {token for token in product_name.lower().split() if len(token) > 2}
    overlap = len(query_tokens.intersection(name_tokens))

    score = 70 + overlap * 6
    if rating is not None:
        score += int((rating - 4.0) * 10)
    return max(55, min(score, 98))
