import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AvatarPanel from "../components/AvatarPanel";
import ClothingCard from "../components/ClothingCard";
import { designerMockItems } from "../data/designerMock";
import { useBodyProfile } from "../hooks/useBodyProfile";
import { useSelectedOutfit } from "../hooks/useSelectedOutfit";
import { designerSearch } from "../services/api";
import type { ClothingItem } from "../types";

const DesignerResults = () => {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const { profile } = useBodyProfile();
  const { selectedItems, totalPrice, applyItem, removeItem, getItemByCategory, saveCurrentLook, savedLooks } =
    useSelectedOutfit();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [budgetLock, setBudgetLock] = useState<number | null>(null);
  const [realItemsFound, setRealItemsFound] = useState<number>(0);
  const [occasionTag, setOccasionTag] = useState<string>("");
  const [seasonalTag, setSeasonalTag] = useState<string>("");
  const [recommendationNote, setRecommendationNote] = useState<string>("");
  const [recommendationBudgetState, setRecommendationBudgetState] = useState<boolean | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await designerSearch(
          query,
          profile?.bodyType,
          profile?.skinTone,
          undefined
        );
        if (ignore) return;
        setItems(data.items.length > 0 ? data.items : designerMockItems);
        setBudgetLock(data.budget_lock ?? null);
        setRealItemsFound(data.real_items_found ?? 0);
        setOccasionTag(data.occasion_tag ?? "");
        setSeasonalTag(data.seasonal_tag ?? "");
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendationNote(data.recommendations[0].note);
          setRecommendationBudgetState(data.recommendations[0].within_budget);
        } else {
          setRecommendationNote("");
          setRecommendationBudgetState(undefined);
        }
      } catch {
        if (ignore) return;
        setError("Could not fetch live outfits. Showing fallback looks.");
        setItems(designerMockItems);
        setRealItemsFound(0);
        setRecommendationNote("");
        setRecommendationBudgetState(undefined);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    if (!query.trim()) {
      setItems(designerMockItems);
      setLoading(false);
      return;
    }
    void run();
    return () => {
      ignore = true;
    };
  }, [profile?.bodyType, profile?.skinTone, query]);

  const handleBuyCompleteLook = () => {
    if (selectedItems.length === 0) {
      toast.error("Select items first to buy complete look.");
      return;
    }
    selectedItems.forEach((item) => {
      window.open(item.buy_url, "_blank", "noopener,noreferrer");
    });
    toast.success("Opened buy links for selected outfit.");
  };

  const handleShareLook = async () => {
    if (selectedItems.length === 0) {
      toast.error("Select items first to share look.");
      return;
    }
    const shareText = `My FyndMate look (${query || "custom look"}) - Total Rs ${totalPrice.toLocaleString(
      "en-IN"
    )}: ${selectedItems.map((item) => item.name).join(", ")}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FyndMate Look", text: shareText });
        toast.success("Look shared.");
        return;
      } catch {
        // fall through to clipboard
      }
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText);
      toast.success("Look details copied to clipboard.");
      return;
    }
    toast.error("Sharing is not available in this browser.");
  };

  const handleSaveLook = () => {
    const saved = saveCurrentLook(query);
    if (!saved) {
      toast.error("Select items first to save look.");
      return;
    }
    toast.success("Look saved to your collection.");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-apple-dark">
        Styling results for: <span className="text-[#06B6D4]">{query}</span>
      </h1>
      <p className="mb-3 text-xs text-apple-gray">
        {realItemsFound > 0 ? `${realItemsFound} live clothing items scanned` : "Using fallback styling catalog"}
      </p>
      <div className="mb-5 flex flex-wrap gap-2">
        {occasionTag ? (
          <span className="rounded-pill bg-[#E6F1FB] px-3 py-1 text-xs font-semibold text-[#0C447C]">
            Occasion: {occasionTag}
          </span>
        ) : null}
        {seasonalTag ? (
          <span className="rounded-pill bg-[#FFF3E0] px-3 py-1 text-xs font-semibold text-[#E65100]">
            Season: {seasonalTag}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[30%_45%_25%]">
        <aside className="rounded-2xl border border-apple-border bg-white p-4">
          <p className="font-medium text-apple-dark">Refine Search</p>
          <p className="mt-2 text-sm text-apple-gray">{query}</p>
          <div className="mt-4 rounded-xl bg-apple-card p-3 text-sm text-apple-dark">
            <p className="font-medium">Body Profile</p>
            <p className="mt-1 text-apple-gray">
              {profile ? `${profile.bodyType} · ${profile.height}cm · ${profile.skinTone}` : "Not set"}
            </p>
          </div>
          {budgetLock ? (
            <p className="mt-3 text-xs text-[#0C447C]">
              Budget lock: under Rs {budgetLock.toLocaleString("en-IN")}
            </p>
          ) : null}
          {error ? <p className="mt-3 text-xs text-[#C62828]">{error}</p> : null}
          {loading ? <p className="mt-3 text-xs text-apple-gray">Finding outfit suggestions...</p> : null}
          {savedLooks.length > 0 ? (
            <div className="mt-4 rounded-xl border border-apple-border bg-white p-3">
              <p className="text-xs font-semibold text-apple-dark">Saved Looks: {savedLooks.length}</p>
              <Link to="/designer/saved" className="mt-1 inline-block text-xs font-medium text-apple-blue">
                View collection
              </Link>
            </div>
          ) : null}
        </aside>

        <section className="grid grid-cols-2 gap-2 rounded-2xl border border-apple-border bg-white p-3 sm:gap-3 sm:p-4 md:grid-cols-3">
          {(items.length > 0 ? items : designerMockItems).map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              selected={selectedItems.some((selected) => selected.id === item.id)}
              onSelect={applyItem}
            />
          ))}
        </section>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <AvatarPanel
            profile={profile}
            selectedItems={selectedItems}
            totalPrice={totalPrice}
            top={getItemByCategory("top")}
            bottom={getItemByCategory("bottom")}
            shoes={getItemByCategory("shoes")}
            accessory={getItemByCategory("accessory")}
            onRemove={removeItem}
            recommendationNote={recommendationNote}
            withinBudget={recommendationBudgetState}
            onBuyCompleteLook={handleBuyCompleteLook}
            onShareLook={handleShareLook}
            onSaveLook={handleSaveLook}
          />
        </div>
      </div>

      {selectedItems.length > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-apple-border bg-white/95 p-3 backdrop-blur lg:hidden">
          <button
            onClick={handleBuyCompleteLook}
            className="w-full rounded-xl bg-brand-cyan px-4 py-3 text-sm font-semibold text-white"
          >
            Buy Complete Look · Rs {totalPrice.toLocaleString("en-IN")}
          </button>
        </div>
      ) : null}
    </main>
  );
};

export default DesignerResults;
