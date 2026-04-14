export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image_url: string;
  match_score: number;
  use_case_score?: number;
  return_risk: "low" | "medium" | "high";
  return_risk_reason?: string;
  fake_review_warning: boolean;
  fake_review_reason: string;
  pros: string[];
  cons: string[];
  explanation: string;
  buy_amazon_url: string;
  buy_flipkart_url: string;
  amazon_price: number;
  flipkart_price: number;
  market_avg_price?: number;
  savings_vs_avg?: number;
}

export interface ClothingItem {
  id: string;
  name: string;
  category: "top" | "bottom" | "shoes" | "accessory";
  price: number;
  image_url: string;
  source: "Amazon" | "Flipkart" | "Myntra";
  buy_url: string;
  color?: string;
  occasion_score?: number;
  compatibility_score?: number;
  fit_reason?: string;
  occasion_tag?: string;
  seasonal_tag?: string;
}

export interface BodyProfile {
  gender?: "male" | "female";
  skinTone: string;
  skinToneHex: string;
  height: number;
  bodyType: "slim" | "average" | "athletic" | "curvy" | "plus";
  photoDataUrl?: string;
}

export interface SelectedOutfitItem extends ClothingItem {
  appliedAt: number;
}

export interface SavedLook {
  id: string;
  createdAt: number;
  query: string;
  totalPrice: number;
  items: SelectedOutfitItem[];
}
