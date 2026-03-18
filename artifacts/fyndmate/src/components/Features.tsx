import { Search, ShieldAlert, BadgeCheck, DollarSign, Wand2, UserCheck, Gift, Calendar, Maximize, Palette, Wallet, TrendingUp, Link as LinkIcon, Layers, Target, SaveAll, Share, MapPin, Map, Mic, Bell, Leaf, Star, PiggyBank } from "lucide-react";

export function Features() {
  const features = [
    { icon: Search, title: "Smart AI Search", desc: "Find perfect products instantly using natural language", color: "text-purple-400" },
    { icon: ShieldAlert, title: "Return Risk Analyzer", desc: "Know the return difficulty before you buy", color: "text-yellow-400" },
    { icon: BadgeCheck, title: "Fake Review Detector", desc: "Trust verified reviews only. AI filters out bots.", color: "text-red-400", large: true },
    { icon: DollarSign, title: "Price Intelligence", desc: "Best deals across all platforms", color: "text-green-400" },
    { icon: Wand2, title: "AI Fashion Stylist", desc: "Personalized outfit suggestions", color: "text-pink-400" },
    { icon: UserCheck, title: "Virtual Try-On", desc: "See clothes on yourself before ordering", color: "text-cyan-400", large: true },
    { icon: Gift, title: "Gift Genius", desc: "Perfect gifts for everyone", color: "text-rose-400" },
    { icon: Calendar, title: "Festival Fashion", desc: "Dress for every Indian celebration", color: "text-orange-400" },
    { icon: Maximize, title: "Body-Type Styling", desc: "Fits your unique shape perfectly", color: "text-indigo-400" },
    { icon: Palette, title: "Skin Tone Matching", desc: "Colors that complement you", color: "text-amber-400" },
    { icon: Wallet, title: "Budget Optimizer", desc: "Max style, min spend", color: "text-emerald-400" },
    { icon: TrendingUp, title: "Trend Tracker", desc: "Stay fashion-forward", color: "text-blue-400" },
    { icon: LinkIcon, title: "Affiliate Links", desc: "Direct buy shortcuts", color: "text-gray-400" },
    { icon: Layers, title: "Multi-platform Compare", desc: "Amazon, Flipkart, Myntra in one place", color: "text-teal-400" },
    { icon: Target, title: "Match Score", desc: "AI confidence rating", color: "text-fuchsia-400" },
    { icon: SaveAll, title: "Style Saving", desc: "Save your favorite looks", color: "text-violet-400" },
    { icon: Share, title: "Look Sharing", desc: "Share outfits socially", color: "text-sky-400" },
    { icon: MapPin, title: "Occasion Planner", desc: "Right outfit for every event", color: "text-lime-400" },
    { icon: Map, title: "Indian Fashion Focus", desc: "Kurtis, sarees, ethnic wear AI", color: "text-orange-500" },
    { icon: Mic, title: "Voice Search", desc: "Speak your style need", color: "text-cyan-300" },
    { icon: Bell, title: "Smart Notifications", desc: "Price drop alerts", color: "text-yellow-300" },
    { icon: Leaf, title: "Sustainable Fashion", desc: "Eco-friendly choices", color: "text-green-500" },
    { icon: Star, title: "Celebrity-Inspired", desc: "Bollywood style looks", color: "text-purple-300" },
    { icon: PiggyBank, title: "Savings Tracker", desc: "Track money saved", color: "text-emerald-300" },
  ];

  return (
    <section id="features" className="py-24 bg-[#050508]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">24 Features. <span className="gradient-text">1 App.</span></h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">Everything you need to shop smarter and style better, powered by advanced AI.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className={`glass p-5 hover:-translate-y-1 hover:bg-white/5 transition-all duration-300 ${feature.large ? 'col-span-2 row-span-2' : 'col-span-1'}`}
            >
              <div className={`mb-4 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 ${feature.large ? 'w-12 h-12 mb-6' : ''}`}>
                <feature.icon className={`${feature.color} ${feature.large ? 'w-6 h-6' : 'w-5 h-5'}`} />
              </div>
              <h3 className={`font-bold text-white/90 mb-2 ${feature.large ? 'text-xl' : 'text-sm'}`}>{feature.title}</h3>
              <p className={`text-white/50 ${feature.large ? 'text-base' : 'text-xs'}`}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
