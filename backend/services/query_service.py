import re


def parse_budget_from_query(query: str) -> float | None:
    normalized = query.lower()

    under_match = re.search(r"(?:under|below|less than)\s*(\d[\d,]*)", normalized)
    if under_match:
        return float(under_match.group(1).replace(",", ""))

    upto_match = re.search(r"(?:upto|up to|max|maximum)\s*(\d[\d,]*)", normalized)
    if upto_match:
        return float(upto_match.group(1).replace(",", ""))

    k_match = re.search(r"(\d+(?:\.\d+)?)\s*k", normalized)
    if k_match:
        return float(k_match.group(1)) * 1000

    return None
