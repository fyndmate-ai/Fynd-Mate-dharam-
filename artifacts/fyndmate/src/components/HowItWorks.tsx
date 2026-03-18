import { Search, Cpu, ShoppingBag } from "lucide-react";

export function HowItWorks() {
  const steps = [
    { icon: Search, title: "Describe Your Need", desc: "Tell FyndMate what you're looking for or upload a photo for style inspiration." },
    { icon: Cpu, title: "AI Finds & Styles", desc: "Our AI scans millions of products, checks reviews, compares prices, and builds outfits." },
    { icon: ShoppingBag, title: "Buy with Confidence", desc: "Get the best deal with a high match score and verified authentic reviews." },
  ];

  return (
    <section className="py-24 relative bg-gradient-to-b from-[#0a0a0f] to-[#050508]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">How <span className="gradient-text">It Works</span></h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-cyan-500/0 border-t border-dashed border-white/20" />

          {steps.map((step, i) => (
            <div key={i} className="relative glass-purple p-8 text-center group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                <step.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">{step.title}</h3>
              <p className="text-white/60 leading-relaxed">{step.desc}</p>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/5 rounded-full border border-white/10 flex items-center justify-center font-black text-white/30 text-xl">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
