import axios from "axios";
import type { ClothingItem, Product } from "../types";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000
});

export const finderSearch = async (query: string, budget?: number) => {
  const response = await api.post<{
    products: Product[];
    explanation: string;
    budget_lock: number | null;
    real_products_found?: number;
  }>(
    "/finder/search",
    { query, budget }
  );
  return response.data;
};

export const designerSearch = async (
  query: string,
  bodyType?: string,
  skinTone?: string,
  budget?: number
) => {
  const response = await api.post<{
    items: ClothingItem[];
    budget_lock: number | null;
    occasion_tag?: string;
    seasonal_tag?: string;
    real_items_found?: number;
    recommendations?: Array<{
      title: string;
      total_price: number;
      within_budget: boolean;
      note: string;
      items: ClothingItem[];
    }>;
  }>(
    "/designer/search-outfits",
    { query, body_type: bodyType, skin_tone: skinTone, budget }
  );
  return response.data;
};
