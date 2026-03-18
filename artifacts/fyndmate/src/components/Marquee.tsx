import { Fragment } from "react";
import { Sparkles } from "lucide-react";

export function Marquee() {
  const features = [
    "Smart AI Search", "Return Risk Analyzer", "Fake Review Detector", 
    "Price Intelligence", "AI Fashion Stylist", "Virtual Try-On", 
    "Gift Genius", "Festival Fashion", "Body-Type Styling", 
    "Skin Tone Matching", "Budget Optimizer", "Trend Tracker",
    "Multi-platform Compare", "Match Score", "Style Saving", 
    "Look Sharing", "Occasion Planner", "Indian Fashion Focus", 
    "Voice Search", "Smart Notifications", "Sustainable Fashion", 
    "Celebrity-Inspired", "Savings Tracker"
  ];

  const mid = Math.ceil(features.length / 2);
  const row1 = features.slice(0, mid);
  const row2 = features.slice(mid);

  const MarqueeRow = ({ items, reverse = false }: { items: string[], reverse?: boolean }) => (
    <div className="flex overflow-hidden relative w-full border-y border-white/5 py-4 my-2 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div className={`flex whitespace-nowrap ${reverse ? 'animate-[marquee_25s_linear_infinite_reverse]' : 'animate-[marquee_30s_linear_infinite]'} w-max`}>
        {[...Array(3)].map((_, i) => (
          <Fragment key={i}>
            {items.map((feature, j) => (
              <div key={`${i}-${j}`} className="flex items-center gap-6 mx-6">
                <span className="text-lg font-bold text-white/40 uppercase tracking-wider">{feature}</span>
                <Sparkles className="w-4 h-4 text-purple-500/50" />
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <section className="py-12 bg-[#050508]">
      <MarqueeRow items={row1} />
      <MarqueeRow items={row2} reverse />
    </section>
  );
}
