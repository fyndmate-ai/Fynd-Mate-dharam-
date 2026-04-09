import random


def infer_occasion(query: str) -> str:
    text = query.lower()
    mapping = {
        "wedding": "Wedding",
        "college": "College",
        "office": "Office",
        "gym": "Gym",
        "party": "Party",
        "festival": "Festival",
        "diwali": "Festival",
        "eid": "Festival",
        "holi": "Festival",
        "summer": "Summer",
    }
    for key, value in mapping.items():
        if key in text:
            return value
    return "Casual"


def infer_seasonal_tag(query: str) -> str:
    text = query.lower()
    if any(key in text for key in ("summer", "heat", "hot")):
        return "Summer"
    if any(key in text for key in ("winter", "cold", "jacket")):
        return "Winter"
    if any(key in text for key in ("rain", "monsoon")):
        return "Monsoon"
    return "All Season"


def skin_tone_palette(skin_tone: str) -> set[str]:
    tone = skin_tone.lower()
    palette_map = {
        "fair": {"navy", "olive", "black", "rust", "maroon", "white"},
        "wheatish": {"teal", "mustard", "navy", "cream", "olive", "burgundy"},
        "medium": {"emerald", "maroon", "white", "charcoal", "cobalt", "beige"},
        "tan": {"white", "cream", "forest", "mustard", "black", "brown"},
        "dark": {"cream", "yellow", "cobalt", "lavender", "white", "orange"},
    }
    return palette_map.get(tone, {"navy", "white", "black", "olive", "beige"})


def fit_reason_for_body_type(body_type: str, category: str) -> str:
    body = body_type.lower()
    if category == "top":
        if body == "slim":
            return "Layered and structured tops add balanced shape."
        if body == "athletic":
            return "Relaxed shoulder cut complements athletic build."
        if body == "curvy":
            return "Soft drape and waist definition improve comfort."
        return "Roomy silhouette supports confidence and movement."
    if category == "bottom":
        if body == "slim":
            return "Tapered fit keeps proportions clean."
        if body == "athletic":
            return "Stretch waist and thigh room improves mobility."
        if body == "curvy":
            return "High-rise fit gives smoother profile."
        return "Straight fit offers comfort without cling."
    if category == "shoes":
        return "Comfort-first footwear for longer wear."
    return "Accessory adds contrast without overpowering the outfit."


def score_occasion_alignment(item_name: str, occasion: str, query: str) -> int:
    base = 72
    tokens = set((item_name + " " + query).lower().split())
    if occasion.lower() in tokens:
        base += 12
    if occasion in {"Office", "College"} and any(key in tokens for key in ("shirt", "chino", "sneakers")):
        base += 8
    if occasion in {"Wedding", "Festival"} and any(key in tokens for key in ("ethnic", "lehenga", "kurta", "embroidered")):
        base += 10
    if occasion == "Gym" and any(key in tokens for key in ("dryfit", "track", "running", "sports")):
        base += 10
    return max(60, min(base + random.randint(-4, 5), 97))


def score_color_compatibility(color: str, skin_tone: str) -> int:
    allowed = skin_tone_palette(skin_tone)
    if color.lower() in allowed:
        return random.randint(88, 97)
    return random.randint(68, 84)
