import type { ClothingItem } from "../types";

const imgs = {
  top: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=80",
  bottom: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=700&q=80",
  shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=80",
  accessory: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&q=80"
};

const sourceCycle: ClothingItem["source"][] = ["Amazon", "Flipkart", "Myntra"];

const categories: ClothingItem["category"][] = [
  "top",
  "bottom",
  "shoes",
  "accessory",
  "top",
  "bottom",
  "top",
  "shoes",
  "accessory"
];

export const designerMockItems: ClothingItem[] = categories.map((category, index) => ({
  id: `d-${index + 1}`,
  name:
    category === "top"
      ? "Casual Oxford Shirt"
      : category === "bottom"
        ? "Slim Fit Chino Trousers"
        : category === "shoes"
          ? "White Street Sneakers"
          : "Minimal Wrist Watch",
  category,
  price:
    category === "top"
      ? 1399
      : category === "bottom"
        ? 1699
        : category === "shoes"
          ? 2299
          : 999,
  image_url: imgs[category],
  source: sourceCycle[index % sourceCycle.length],
  buy_url:
    category === "top"
      ? "https://www.myntra.com/"
      : category === "bottom"
        ? "https://www.flipkart.com/"
        : "https://www.amazon.in/",
  color: category === "top" ? "Blue" : category === "bottom" ? "Khaki" : "Neutral"
}));
