import type { ClothingItem } from "../types";

interface ClothingCardProps {
  item: ClothingItem;
  selected: boolean;
  onSelect: (item: ClothingItem) => void;
}

const sourceColors: Record<ClothingItem["source"], string> = {
  Amazon: "bg-[#FFF3E0] text-[#E65100]",
  Flipkart: "bg-[#E6F1FB] text-[#0C447C]",
  Myntra: "bg-[#FCEEF2] text-[#C0235A]"
};

const ClothingCard = ({ item, selected, onSelect }: ClothingCardProps) => {
  return (
    <button
      onClick={() => onSelect(item)}
      className={`overflow-hidden rounded-[16px] border bg-white text-left transition duration-200 ${
        selected
          ? "scale-[1.02] border-2 border-brand-cyan shadow-[0_0_0_4px_rgba(6,182,212,0.2)]"
          : "border-[#E5E5EA] hover:-translate-y-1 hover:border-apple-blue hover:shadow-[0_14px_30px_rgba(0,113,227,0.15)]"
      }`}
    >
      <img src={item.image_url} alt={item.name} className="aspect-square w-full object-cover bg-apple-card" />
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-semibold text-apple-dark">{item.name}</p>
        <p className="text-sm font-bold text-apple-dark">Rs {item.price.toLocaleString("en-IN")}</p>
        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${sourceColors[item.source]}`}>
          {item.source}
        </span>
        {typeof item.compatibility_score === "number" ? (
          <p className="text-[10px] text-apple-gray">Color fit: {item.compatibility_score}%</p>
        ) : null}
      </div>
    </button>
  );
};

export default ClothingCard;
