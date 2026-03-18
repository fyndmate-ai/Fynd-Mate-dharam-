import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { AIDesigner } from "../components/AIDesigner";

export function DesignerPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none" />
      <div className="fixed top-0 right-1/4 w-96 h-[600px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-96 h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Top Bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 border-b border-white/5"
        style={{ background: "rgba(5,5,8,0.90)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </button>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-black text-sm gradient-text">FyndMate</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            AI Active · Fashion Stylist
          </div>
        </div>
      </motion.header>

      {/* Page Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative z-10"
      >
        <AIDesigner />
      </motion.main>
    </div>
  );
}
