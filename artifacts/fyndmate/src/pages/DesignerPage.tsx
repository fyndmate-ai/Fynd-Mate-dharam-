import { ArrowLeft, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { AanyaChat } from "../components/AanyaChat";

export function DesignerPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[#D2D2D7] bg-white/95 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-[#1D1D1F]">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            FyndMate AI Designer
          </div>
          <button onClick={() => navigate("/finder")} className="text-[#0071E3] text-sm font-medium">
            Open Finder
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] w-full mx-auto px-4 py-8 flex-1">
        <h1 className="text-4xl md:text-[40px] font-semibold text-center">See your style before you buy.</h1>
        <p className="text-center text-[17px] text-[#6E6E73] mt-3 mb-8">
          Personal avatar try-on, AI stylist chat, and curated outfit cards in one clean studio.
        </p>
        <div className="rounded-[18px] border border-[#D2D2D7] bg-[#F5F5F7] p-4 md:p-6 min-h-[70vh]">
          <AanyaChat />
        </div>
      </main>
    </div>
  );
}
