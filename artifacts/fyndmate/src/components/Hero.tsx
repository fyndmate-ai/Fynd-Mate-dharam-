import { motion } from "framer-motion";
import { Search, Zap, Clock, TrendingDown, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export function Hero() {
  const [, navigate] = useLocation();
  const headlineWords1 = "Shop Smarter.".split(" ");
  const headlineWords2 = "Style Better.".split(" ");

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.04)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      
      {/* Spotlight Beams */}
      <div className="absolute top-0 left-1/4 w-96 h-[800px] bg-purple-600/20 blur-[120px] -rotate-45 rounded-[100%]" />
      <div className="absolute top-0 right-1/4 w-96 h-[800px] bg-cyan-600/20 blur-[120px] rotate-45 rounded-[100%]" />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] animate-float" />
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: "2s" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <div className="flex flex-col items-start pt-12 lg:pt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-semibold mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live AI Models Active
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[1.1] mb-6">
            <div className="flex flex-wrap gap-x-3 sm:gap-x-4">
              {headlineWords1.map((word, i) => (
                <motion.span
                  key={`w1-${i}`}
                  initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                  className="text-white block"
                >
                  {word}
                </motion.span>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 mt-2">
              {headlineWords2.map((word, i) => (
                <motion.span
                  key={`w2-${i}`}
                  initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                  className="gradient-text block"
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 1 }}
            className="text-lg sm:text-xl text-white/50 max-w-xl mb-10 leading-relaxed"
          >
            India's most intelligent shopping companion. Find perfect products, avoid fake reviews, and let AI style your next look.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <button
              onClick={() => navigate("/finder")}
              className="shimmer-btn animate-shimmer text-center px-8 py-4 rounded-xl flex items-center justify-center gap-2 text-lg"
            >
              <Search className="w-5 h-5" />
              Find Products with AI
            </button>
            <button
              onClick={() => navigate("/designer")}
              className="glass border border-white/10 hover:bg-white/5 transition-colors text-white text-center px-8 py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-lg"
            >
              <Zap className="w-5 h-5 text-cyan-400" />
              Style Me with AI
            </button>
          </motion.div>

          {/* Stats Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex flex-wrap gap-4 mt-12"
          >
            <div className="glass-purple px-4 py-2 flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs text-white/50 uppercase font-bold">Search Time</div>
                <div className="font-bold">&lt; 10 sec</div>
              </div>
            </div>
            <div className="glass-cyan px-4 py-2 flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs text-white/50 uppercase font-bold">Avg Savings</div>
                <div className="font-bold">₹2,400</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Content - Floating Card */}
        <div className="hidden lg:block relative h-[600px] w-full perspective-1000">
          <motion.div 
            initial={{ opacity: 0, rotateY: 20, rotateX: 10, z: -100 }}
            animate={{ opacity: 1, rotateY: -5, rotateX: 5, z: 0 }}
            transition={{ delay: 0.8, duration: 1.5, type: "spring" }}
            className="absolute inset-0 flex items-center justify-center animate-float"
          >
            <div className="w-[380px] glass-purple p-6 shadow-2xl shadow-purple-500/20 transform rotate-3">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="text-white w-6 h-6" />
                </div>
                <span className="glass px-3 py-1 text-xs font-bold text-green-400">98% Match</span>
              </div>
              <div className="h-48 rounded-xl bg-[#0a0a0f] border border-white/5 mb-6 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop" alt="Product" className="w-full h-full object-cover opacity-80 mix-blend-lighten" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <div className="text-sm font-bold text-white mb-1">Sony WH-1000XM5</div>
                  <div className="text-xs text-cyan-400">Best price found on Amazon</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-gradient-to-r from-purple-500 to-cyan-500" />
                </div>
                <div className="h-2 w-3/4 bg-white/5 rounded-full" />
                <div className="h-2 w-1/2 bg-white/5 rounded-full" />
              </div>
              <div className="mt-6 flex gap-2">
                <div className="flex-1 py-3 text-center rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-bold">
                  ₹22,990
                </div>
                <div className="flex-1 py-3 text-center rounded-lg bg-white/5 text-white/50 border border-white/5 line-through text-sm font-bold">
                  ₹29,990
                </div>
              </div>

              {/* Prompt button on card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/finder")}
                className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" /> Search Something Like This
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
