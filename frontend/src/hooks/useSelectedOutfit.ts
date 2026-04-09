import { useMemo, useState } from "react";
import type { ClothingItem, SavedLook, SelectedOutfitItem } from "../types";

export const useSelectedOutfit = () => {
  const [selectedMap, setSelectedMap] = useState<Map<string, SelectedOutfitItem>>(new Map());
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>(() => {
    const raw = localStorage.getItem("fyndmate_saved_looks");
    if (!raw) return [];
    try {
      return JSON.parse(raw) as SavedLook[];
    } catch {
      return [];
    }
  });

  const applyItem = (item: ClothingItem) => {
    setSelectedMap((previous) => {
      const next = new Map(previous);
      for (const [key, value] of next.entries()) {
        if (value.category === item.category) {
          next.delete(key);
        }
      }
      next.set(item.id, { ...item, appliedAt: Date.now() });
      return next;
    });
  };

  const removeItem = (itemId: string) => {
    setSelectedMap((previous) => {
      const next = new Map(previous);
      next.delete(itemId);
      return next;
    });
  };

  const selectedItems = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);
  const totalPrice = useMemo(
    () => selectedItems.reduce((total, item) => total + item.price, 0),
    [selectedItems]
  );

  const getItemByCategory = (category: ClothingItem["category"]) =>
    selectedItems.find((item) => item.category === category);

  const saveCurrentLook = (query: string) => {
    if (selectedItems.length === 0) return null;
    const look: SavedLook = {
      id: `look-${Date.now()}`,
      createdAt: Date.now(),
      query,
      totalPrice,
      items: selectedItems
    };
    const next = [look, ...savedLooks].slice(0, 20);
    setSavedLooks(next);
    localStorage.setItem("fyndmate_saved_looks", JSON.stringify(next));
    return look;
  };

  return {
    selectedItems,
    totalPrice,
    applyItem,
    removeItem,
    getItemByCategory,
    saveCurrentLook,
    savedLooks
  };
};
