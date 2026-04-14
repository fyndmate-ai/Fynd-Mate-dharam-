import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import AvatarPanel from "../components/AvatarPanel";
import ClothingCard from "../components/ClothingCard";
import { designerMockItems } from "../data/designerMock";
import { useBodyProfile } from "../hooks/useBodyProfile";
import { useSelectedOutfit } from "../hooks/useSelectedOutfit";
import { designerSearch } from "../services/api";
import type { ClothingItem } from "../types";

const DesignerResults = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const { profile } = useBodyProfile();
  const { selectedItems, totalPrice, applyItem, removeItem, getItemByCategory } = useSelectedOutfit();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [realItemsFound, setRealItemsFound] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileTryOnOpen, setMobileTryOnOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await designerSearch(query, profile?.bodyType, profile?.skinTone, undefined);
        if (ignore) return;
        setItems((data.items.length > 0 ? data.items : designerMockItems).slice(0, 9));
        setRealItemsFound(data.real_items_found ?? 0);
      } catch {
        if (ignore) return;
        setError("Could not fetch live outfits. Showing curated suggestions.");
        setItems(designerMockItems.slice(0, 9));
        setRealItemsFound(0);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    if (!query.trim()) {
      setItems(designerMockItems.slice(0, 9));
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
      toast.error("Select items first to buy this look.");
      return;
    }
    selectedItems.forEach((item) => {
      window.open(item.buy_url, "_blank", "noopener,noreferrer");
    });
    toast.success("Opened buy links for your selected look.");
  };

  const cards = items.length > 0 ? items : designerMockItems.slice(0, 9);

  useEffect(() => {
    if (!profile) {
      navigate("/designer/onboarding", { replace: true });
    }
  }, [navigate, profile]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F8FAFF] via-white to-[#F7F9FD] px-4 py-6 sm:px-6">
      <section className="mx-auto w-full max-w-7xl">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-pill border border-apple-border bg-white px-3 py-1.5 text-xs text-apple-gray">
            <Sparkles size={14} className="text-brand-cyan" />
            AI suggestions from multiple stores
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-apple-dark sm:text-3xl">
            {query ? `Results for "${query}"` : "AI outfit suggestions"}
          </h1>
          <p className="mt-1 text-sm text-apple-gray">
            {realItemsFound > 0 ? `${realItemsFound} live items scanned` : "Curated options ready for virtual try-on"}
          </p>
          {loading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-apple-gray">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="ml-1">AI is styling your look</span>
            </div>
          ) : null}
          {error ? <p className="mt-2 text-sm text-[#C62828]">{error}</p> : null}
        </motion.header>

        <div className="hidden gap-6 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[24px] border border-apple-border bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <div className="grid grid-cols-3 gap-3">
              {cards.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <ClothingCard
                    item={item}
                    selected={selectedItems.some((selected) => selected.id === item.id)}
                    onSelect={applyItem}
                  />
                </motion.div>
              ))}
            </div>
          </section>

          <aside className="rounded-[24px] border border-apple-border bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <p className="mb-3 text-sm font-semibold text-brand-cyan">Try before you buy</p>
            <AvatarPanel
              profile={profile}
              selectedItems={selectedItems}
              totalPrice={totalPrice}
              top={getItemByCategory("top")}
              bottom={getItemByCategory("bottom")}
              shoes={getItemByCategory("shoes")}
              accessory={getItemByCategory("accessory")}
              onRemove={removeItem}
              onBuyCompleteLook={handleBuyCompleteLook}
            />
          </aside>
        </div>

        <section className="space-y-4 lg:hidden">
          <div className="rounded-2xl border border-apple-border bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cards.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  selected={selectedItems.some((selected) => selected.id === item.id)}
                  onSelect={applyItem}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setMobileTryOnOpen(true)}
            className="w-full rounded-2xl bg-apple-blue px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,113,227,0.3)] transition hover:bg-apple-blue-hover"
          >
            View Try-On
          </button>
        </section>
      </section>

      <AnimatePresence>
        {mobileTryOnOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col bg-white p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-cyan">Try before you buy</p>
              <button
                onClick={() => setMobileTryOnOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-apple-border text-apple-dark"
                aria-label="Close try-on view"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-2xl border border-apple-border bg-[#F8FAFF] p-3">
              <AvatarPanel
                profile={profile}
                selectedItems={selectedItems}
                totalPrice={totalPrice}
                top={getItemByCategory("top")}
                bottom={getItemByCategory("bottom")}
                shoes={getItemByCategory("shoes")}
                accessory={getItemByCategory("accessory")}
                onRemove={removeItem}
                onBuyCompleteLook={handleBuyCompleteLook}
              />
            </div>

            <button
              onClick={handleBuyCompleteLook}
              className="mt-4 w-full rounded-2xl bg-brand-cyan px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(6,182,212,0.35)]"
            >
              Buy this look · Rs {totalPrice.toLocaleString("en-IN")}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
};

export default DesignerResults;
