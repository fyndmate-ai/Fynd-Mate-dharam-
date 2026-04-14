import { motion, AnimatePresence } from "framer-motion";
import type { BodyProfile, SelectedOutfitItem } from "../types";

interface AvatarPanelProps {
  profile: BodyProfile | null;
  top?: SelectedOutfitItem;
  bottom?: SelectedOutfitItem;
  shoes?: SelectedOutfitItem;
  accessory?: SelectedOutfitItem;
  selectedItems: SelectedOutfitItem[];
  totalPrice: number;
  onRemove: (id: string) => void;
  recommendationNote?: string;
  withinBudget?: boolean;
  onBuyCompleteLook?: () => void;
  onShareLook?: () => void;
  onSaveLook?: () => void;
}

const OverlayImage = ({ item, className }: { item?: SelectedOutfitItem; className: string }) => (
  <AnimatePresence mode="wait">
    {item ? (
      <motion.img
        key={item.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.9, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        src={item.image_url}
        alt={item.name}
        className={`absolute object-cover ${className}`}
      />
    ) : null}
  </AnimatePresence>
);

const AvatarPanel = ({
  profile,
  top,
  bottom,
  shoes,
  accessory,
  selectedItems,
  totalPrice,
  onRemove,
  recommendationNote,
  withinBudget,
  onBuyCompleteLook,
  onShareLook,
  onSaveLook
}: AvatarPanelProps) => {
  return (
    <aside className="rounded-[20px] bg-[#F0F9FF] p-4">
      <div className="relative mx-auto h-[420px] w-[180px] rounded-3xl border border-apple-border bg-white">
        <div
          className={`absolute left-1/2 top-4 -translate-x-1/2 rounded-full ${
            profile?.bodyType === "plus" ? "h-16 w-16" : "h-14 w-14"
          }`}
          style={{ backgroundColor: profile?.skinToneHex ?? "#C07850" }}
        />
        <div
          className={`absolute left-1/2 top-20 -translate-x-1/2 rounded-[40px] border border-apple-border bg-[#f8fafc] ${
            profile?.bodyType === "slim"
              ? "h-[190px] w-[78px]"
              : profile?.bodyType === "curvy"
                ? "h-[200px] w-[96px]"
                : profile?.bodyType === "plus"
                  ? "h-[210px] w-[112px]"
                  : "h-[190px] w-[86px]"
          }`}
        />
        <div className="absolute left-1/2 top-[310px] h-20 w-6 -translate-x-[125%] rounded-full border border-apple-border bg-[#f8fafc]" />
        <div className="absolute left-1/2 top-[310px] h-20 w-6 translate-x-[25%] rounded-full border border-apple-border bg-[#f8fafc]" />

        <OverlayImage item={accessory} className="left-1/2 top-[24px] h-[50px] w-[120px] -translate-x-1/2 rounded-lg" />
        <OverlayImage item={top} className="left-1/2 top-[90px] h-[120px] w-[140px] -translate-x-1/2 rounded-lg" />
        <OverlayImage item={bottom} className="left-1/2 top-[220px] h-[120px] w-[140px] -translate-x-1/2 rounded-lg" />
        <OverlayImage item={shoes} className="left-1/2 top-[350px] h-[50px] w-[140px] -translate-x-1/2 rounded-lg" />
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {selectedItems.length === 0 ? (
          <p className="text-apple-gray">Select clothing items to build your look.</p>
        ) : (
          selectedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg bg-white p-2">
              <div>
                <p className="text-apple-dark">{item.name}</p>
                <p className="text-xs text-apple-gray">Rs {item.price.toLocaleString("en-IN")}</p>
              </div>
              <button onClick={() => onRemove(item.id)} className="text-xs text-[#C62828]">
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <p className="mt-3 text-base font-semibold text-apple-dark">
        Total look price: Rs {totalPrice.toLocaleString("en-IN")}
      </p>
      {recommendationNote ? (
        <p className={`mt-1 text-xs ${withinBudget ? "text-[#1D7346]" : "text-[#E65100]"}`}>{recommendationNote}</p>
      ) : null}
      <button
        onClick={onBuyCompleteLook}
        className="mt-3 w-full rounded-2xl bg-brand-cyan px-4 py-3 font-medium text-white shadow-[0_10px_24px_rgba(6,182,212,0.35)] transition hover:shadow-[0_14px_28px_rgba(6,182,212,0.45)]"
      >
        Buy Complete Look
      </button>
      <button
        onClick={onShareLook}
        className="mt-2 w-full rounded-2xl border border-brand-cyan px-4 py-3 font-medium text-brand-cyan"
      >
        Share This Look
      </button>
      <button onClick={onSaveLook} className="mt-2 w-full text-center text-sm font-medium text-apple-blue">
        Save This Look
      </button>
    </aside>
  );
};

export default AvatarPanel;
