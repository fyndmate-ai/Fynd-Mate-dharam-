import type { Product } from "../types";

const productImage = "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800&q=80";

export const finderMockProducts: Product[] = [
  {
    id: "p1",
    name: "Lenovo IdeaPad Slim 3 Intel Core i3",
    brand: "Lenovo",
    price: 38990,
    image_url: productImage,
    match_score: 95,
    return_risk: "low",
    fake_review_warning: false,
    fake_review_reason: "Review pattern appears natural and verified-heavy.",
    pros: ["Strong value", "Good battery life", "Lightweight for college use"],
    cons: ["Average speakers", "No backlit keyboard"],
    explanation: "Best balance of budget, performance, and reliability.",
    buy_amazon_url: "https://www.amazon.in/",
    buy_flipkart_url: "https://www.flipkart.com/",
    amazon_price: 38990,
    flipkart_price: 39499
  },
  {
    id: "p2",
    name: "ASUS VivoBook 15 Ryzen 5",
    brand: "ASUS",
    price: 42990,
    image_url: productImage,
    match_score: 91,
    return_risk: "medium",
    fake_review_warning: false,
    fake_review_reason: "Mostly genuine with mild incentive-review pattern.",
    pros: ["Faster multitasking", "Bright display", "Good keyboard"],
    cons: ["Slightly heavier", "Fan noise under load"],
    explanation: "Great alternative when performance is the priority.",
    buy_amazon_url: "https://www.amazon.in/",
    buy_flipkart_url: "https://www.flipkart.com/",
    amazon_price: 42990,
    flipkart_price: 41990
  },
  {
    id: "p3",
    name: "HP 15s Intel Core i3 12th Gen",
    brand: "HP",
    price: 40990,
    image_url: productImage,
    match_score: 89,
    return_risk: "low",
    fake_review_warning: false,
    fake_review_reason: "Large review pool with low anomaly signals.",
    pros: ["Trusted brand", "Balanced specs", "Service network"],
    cons: ["Average build quality", "Basic webcam"],
    explanation: "Reliable all-round choice for regular student workflows.",
    buy_amazon_url: "https://www.amazon.in/",
    buy_flipkart_url: "https://www.flipkart.com/",
    amazon_price: 40990,
    flipkart_price: 41290
  },
  {
    id: "p4",
    name: "Acer Aspire Lite AMD Ryzen 5",
    brand: "Acer",
    price: 39990,
    image_url: productImage,
    match_score: 87,
    return_risk: "medium",
    fake_review_warning: true,
    fake_review_reason: "Detected repetitive short reviews in recent period.",
    pros: ["Strong processor", "Competitive pricing", "Good display"],
    cons: ["Thermals under stress", "After-sales varies by city"],
    explanation: "Good performance pick with caution on support variability.",
    buy_amazon_url: "https://www.amazon.in/",
    buy_flipkart_url: "https://www.flipkart.com/",
    amazon_price: 39990,
    flipkart_price: 40590
  }
];
