import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Gift, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink,
  ShieldCheck, TrendingDown, Mic, MicOff, RotateCcw, Brain, PackageOpen, Star,
  ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { useSearchProduct, useFindGifts } from "@workspace/api-client-react";
import { formatINR } from "@/lib/utils";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const SAVINGS_KEY = "fm_total_savings";
function addToSavings(amount: number) {
  const cur = parseInt(localStorage.getItem(SAVINGS_KEY) || "0");
  localStorage.setItem(SAVINGS_KEY, String(cur + Math.abs(Math.round(amount))));
}
export function getTotalSavings() {
  return parseInt(localStorage.getItem(SAVINGS_KEY) || "0");
}

const RISK_CONFIG = {
  low: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", label: "Low Return Risk" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", label: "Medium Return Risk" },
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", label: "High Return Risk" },
};

export function AIFinder() {
  const [activeTab, setActiveTab] = useState<"search" | "gift">("search");

  // Search State
  const [query, setQuery] = useState("");
  const [useCase, setUseCase] = useState("general");
  const [platform, setPlatform] = useState("all");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [totalSavings, setTotalSavings] = useState(getTotalSavings());

  // Gift State
  const [recipient, setRecipient] = useState("");
  const [interests, setInterests] = useState("");
  const [giftBudget, setGiftBudget] = useState<number>(2000);

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);

  const searchMutation = useSearchProduct();
  const giftMutation = useFindGifts();

  const useCases = ["Gaming", "Travel", "Gym", "Office", "Daily", "Gift"];
  const platforms = ["Amazon", "Flipkart", "Myntra", "All"];

  /* ── Voice Search Setup ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setVoiceSupported(true);
    const rec = new SR();
    rec.lang = "hi-IN";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      setQuery(final || interim);
      if (final) { setListening(false); }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const toggleListen = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
    else if (recognitionRef.current) {
      try { recognitionRef.current.start(); setListening(true); } catch { setListening(false); }
    }
  };

  const handleSearch = () => {
    if (!query) return;
    setShowExplanation(false);
    searchMutation.mutate({ data: { query, use_case: useCase, platform } });
  };

  const handleGiftSearch = () => {
    if (!recipient || !interests) return;
    giftMutation.mutate({ data: { recipient, interests, budget: giftBudget } });
  };

  /* Track savings when result comes in */
  useEffect(() => {
    if (searchMutation.isSuccess && searchMutation.data?.prices?.savings) {
      addToSavings(searchMutation.data.prices.savings);
      setTotalSavings(getTotalSavings());
    }
  }, [searchMutation.isSuccess]);

  const loadingMessages = [
    "Fetching real Amazon products...",
    "Running AI analysis...",
    "Scanning for fake reviews...",
    "Comparing prices across platforms...",
    "Calculating return risk...",
  ];
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    if (!searchMutation.isPending && !giftMutation.isPending) return;
    const iv = setInterval(() => setMsgIdx(i => (i + 1) % loadingMessages.length), 1400);
    return () => clearInterval(iv);
  }, [searchMutation.isPending, giftMutation.isPending]);

  const prod = searchMutation.data?.main_product;
  const riskKey = ((prod as any)?.return_risk || "low").toLowerCase() as "low" | "medium" | "high";
  const riskCfg = RISK_CONFIG[riskKey] || RISK_CONFIG.low;

  return (
    <section id="finder" className="py-16 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            AI Product <span className="gradient-text">Finder</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Describe what you need in plain language — or speak in Hindi/Hinglish. AI finds the perfect product, verifies reviews, and locks in the best price.
          </p>
          {totalSavings > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-bold">
              <Zap className="w-4 h-4" />
              FyndMate has saved you {formatINR(totalSavings)} so far!
            </motion.div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="glass p-1 rounded-xl inline-flex">
            <button onClick={() => setActiveTab("search")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "search" ? "bg-purple-600 text-white shadow-lg" : "text-white/50 hover:text-white"}`}>
              <Search className="w-4 h-4 inline-block mr-2 mb-0.5" /> Product Search
            </button>
            <button onClick={() => setActiveTab("gift")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "gift" ? "bg-cyan-600 text-white shadow-lg" : "text-white/50 hover:text-white"}`}>
              <Gift className="w-4 h-4 inline-block mr-2 mb-0.5" /> Gift Genius
            </button>
          </div>
        </div>

        {/* Form Area */}
        <div className="glass-purple p-6 md:p-8 animate-pulse-glow max-w-4xl mx-auto mb-10">
          {activeTab === "search" ? (
            <div className="space-y-6">
              {/* Voice + Text input */}
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSearch(); }}
                  placeholder={listening ? "Listening... speak now!" : "E.g., noise cancelling earphones for gym under ₹2000 | हिंदी में भी बोल सकते हैं"}
                  className="w-full bg-[#050508]/50 border border-purple-500/20 rounded-xl p-4 pr-14 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[110px] resize-none text-base"
                  style={{ borderColor: listening ? "rgba(239,68,68,0.5)" : undefined }}
                />
                {voiceSupported && (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={toggleListen}
                    className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={listening
                      ? { background: "linear-gradient(135deg, #DC2626, #991B1B)", boxShadow: "0 0 16px rgba(220,38,38,0.6)" }
                      : { background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.4)" }
                    }
                    title={listening ? "Stop listening" : "Speak in Hindi or English"}
                  >
                    {listening
                      ? <MicOff className="w-4 h-4 text-white" />
                      : <Mic className="w-4 h-4 text-purple-300" />
                    }
                  </motion.button>
                )}
                {listening && (
                  <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                    <span className="text-xs text-red-400 font-medium">Listening...</span>
                    <div className="flex items-end gap-0.5">
                      {[...Array(8)].map((_, i) => (
                        <motion.div key={i} animate={{ height: [2, 8 + (i % 3) * 4, 2] }}
                          transition={{ duration: 0.3 + i * 0.05, repeat: Infinity, repeatType: "mirror" }}
                          className="w-0.5 rounded-full bg-red-400" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Use Case chips */}
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Use Case</label>
                <div className="flex flex-wrap gap-2">
                  {useCases.map(uc => (
                    <button key={uc} onClick={() => setUseCase(uc.toLowerCase())}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${useCase === uc.toLowerCase() ? "bg-purple-500/20 border-purple-500 text-purple-300" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}>
                      {uc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-2">
                  {platforms.map(p => (
                    <button key={p} onClick={() => setPlatform(p.toLowerCase())}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${platform === p.toLowerCase() ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-white/40 hover:text-white/70"}`}>
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  {voiceSupported && (
                    <span className="text-xs text-white/30 flex items-center gap-1">
                      <Mic className="w-3 h-3" /> Hinglish voice search supported
                    </span>
                  )}
                  <button onClick={handleSearch} disabled={searchMutation.isPending || !query}
                    className="shimmer-btn animate-shimmer px-8 py-3 w-full md:w-auto">
                    {searchMutation.isPending ? "Analyzing..." : "Find with AI"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Who is this for?</label>
                  <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)}
                    placeholder="E.g., 25yo Brother, Mom"
                    className="w-full bg-[#050508]/50 border border-cyan-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Budget (₹)</label>
                  <input type="number" value={giftBudget} onChange={(e) => setGiftBudget(Number(e.target.value))}
                    className="w-full bg-[#050508]/50 border border-cyan-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Interests & Hobbies</label>
                <textarea value={interests} onChange={(e) => setInterests(e.target.value)}
                  placeholder="E.g., Loves photography, hiking, and drinking craft coffee..."
                  className="w-full bg-[#050508]/50 border border-cyan-500/20 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500 min-h-[100px] resize-none" />
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button onClick={handleGiftSearch} disabled={giftMutation.isPending || !recipient || !interests}
                  className="cyan-btn animate-shimmer px-8 py-3 w-full md:w-auto">
                  {giftMutation.isPending ? "Finding Gifts..." : "Find Perfect Gift"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        <AnimatePresence>
          {(searchMutation.isPending || giftMutation.isPending) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
                <motion.div className="absolute inset-0 rounded-full border-2 border-purple-400"
                  animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }} />
              </div>
              <p className="text-purple-300 font-medium">{loadingMessages[msgIdx]}</p>
              <p className="text-white/30 text-xs mt-1">Ctrl+Enter to search faster next time</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {(searchMutation.isError || giftMutation.isError) && (
          <div className="glass border-red-500/30 p-6 text-center text-red-400 max-w-md mx-auto mb-8">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">Couldn't analyze products. Try rephrasing your query.</p>
          </div>
        )}

        {/* ══ PRODUCT RESULTS ══ */}
        <AnimatePresence>
          {searchMutation.isSuccess && activeTab === "search" && prod && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

              {/* Main Product Card */}
              <div className="glass border-purple-500/30 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />

                <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">

                  {/* Col 1: Identity + Scores */}
                  <div className="md:col-span-1 space-y-4">
                    <div className="inline-block bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold tracking-wider border border-purple-500/30">
                      ✦ Best Overall Match
                    </div>
                    <h3 className="text-xl font-bold">{prod.product_name}</h3>
                    <p className="text-white/50 text-sm">by {prod.brand}</p>

                    {/* Match Score */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-full flex items-center justify-center bg-[#050508] border-2 border-green-500">
                        <span className="text-lg font-black text-green-400">{prod.match_score}%</span>
                      </div>
                      <div className="text-xs text-white/60">
                        <div className="font-bold text-white/80 mb-0.5">AI Match Score</div>
                        Overall fit for your need
                      </div>
                    </div>

                    {/* Use-Case Performance Score */}
                    {(prod as any).use_case_score && (
                      <div className="p-3 rounded-xl" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" /> Use-Case Performance
                          </span>
                          <span className="text-sm font-black text-purple-300">{(prod as any).use_case_score}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(prod as any).use_case_score}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: "linear-gradient(90deg, #7C3AED, #06B6D4)" }}
                          />
                        </div>
                        <p className="text-[10px] text-white/40 mt-1">Rated for {useCase} use</p>
                      </div>
                    )}

                    {/* Return Risk Score */}
                    <div className="p-3 rounded-xl" style={{ background: riskCfg.bg, border: `1px solid ${riskCfg.border}` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <PackageOpen className="w-4 h-4" style={{ color: riskCfg.color }} />
                        <span className="text-xs font-bold" style={{ color: riskCfg.color }}>{riskCfg.label}</span>
                      </div>
                      <p className="text-[11px] text-white/55 leading-relaxed">{(prod as any).return_risk_reason}</p>
                    </div>

                    {/* Fake Review Detection */}
                    {(prod as any).fake_review_warning ? (
                      <div className="flex items-start gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-red-300">{(prod as any).fake_review_reason}</div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                        <ShieldCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-green-300">{(prod as any).fake_review_reason || "Reviews verified authentic by AI."}</div>
                      </div>
                    )}
                  </div>

                  {/* Col 2: Pros / Cons / Regret Alert */}
                  <div className="md:col-span-1 space-y-5">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-white/40 mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Why it matches
                      </h4>
                      <ul className="space-y-2">
                        {prod.pros.map((pro: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-white/40 mb-3 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-red-400" /> Trade-offs
                      </h4>
                      <ul className="space-y-2">
                        {prod.cons.map((con: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> {con}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Regret Alert */}
                    {(prod as any).regret_alert && (
                      <div className="flex items-start gap-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-amber-300 mb-0.5">Regret Alert</div>
                          <div className="text-xs text-amber-200/70">{(prod as any).regret_alert}</div>
                        </div>
                      </div>
                    )}

                    {/* AI Explanation (toggle) */}
                    {(prod as any).explanation && (
                      <div>
                        <button
                          onClick={() => setShowExplanation(!showExplanation)}
                          className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors group"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          {showExplanation ? "Hide" : "Show"} AI Explanation
                          {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <AnimatePresence>
                          {showExplanation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 p-3 rounded-xl text-sm text-white/70 leading-relaxed"
                              style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)" }}
                            >
                              <Star className="w-3.5 h-3.5 text-cyan-400 inline mr-1.5 mb-0.5" />
                              {(prod as any).explanation}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Col 3: Price Intelligence + Buy */}
                  <div className="md:col-span-1 glass-purple p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold uppercase text-purple-300 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" /> Price Intelligence
                      </h4>

                      {searchMutation.data?.prices && (
                        <div className="space-y-2 mb-4">
                          {(["amazon", "flipkart"] as const).map(plat => {
                            const p = searchMutation.data!.prices![plat];
                            const isBest = searchMutation.data!.prices!.best_deal === plat;
                            return (
                              <div key={plat} className={`p-3 rounded-lg border flex justify-between items-center ${isBest ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10"}`}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm capitalize">{plat}</span>
                                  {isBest && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">BEST</span>}
                                </div>
                                <div className="text-right">
                                  <div className="font-bold">{formatINR(p.price)}</div>
                                  <div className="text-[10px] text-white/40">{(p as any).delivery || "2-4 days"}</div>
                                </div>
                              </div>
                            );
                          })}
                          <div className="p-3 rounded-lg border border-white/8 bg-white/4 flex justify-between items-center">
                            <span className="font-medium text-sm text-white/60">Myntra</span>
                            <span className="text-xs text-white/35 italic">Fashion items only</span>
                          </div>
                        </div>
                      )}

                      {searchMutation.data?.prices?.savings && searchMutation.data.prices.savings > 0 && (
                        <div className="text-center text-sm text-green-400 font-bold mb-4 p-2 rounded-lg bg-green-500/8 border border-green-500/20">
                          💰 Save {formatINR(searchMutation.data.prices.savings)} by choosing the best deal!
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <a href={searchMutation.data?.prices?.amazon.affiliate_url || "#"}
                        target="_blank" rel="noreferrer"
                        className="w-full block text-center py-3 bg-[#ff9900] hover:bg-[#ff9900]/90 text-black font-bold rounded-xl transition-colors">
                        Buy on Amazon
                      </a>
                      <a href={searchMutation.data?.prices?.flipkart.affiliate_url || "#"}
                        target="_blank" rel="noreferrer"
                        className="w-full block text-center py-3 bg-[#047BD5] hover:bg-[#047BD5]/90 text-white font-bold rounded-xl transition-colors">
                        Buy on Flipkart
                      </a>
                      <button onClick={() => searchMutation.reset()}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white/40 hover:text-white/70 text-xs transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" /> New Search
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternatives */}
              {prod.alternatives && prod.alternatives.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-6">Other Good Options</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {prod.alternatives.map((alt: any, i: number) => (
                      <div key={i} className="glass p-5 hover:border-purple-500/30 transition-colors group">
                        <div className="font-bold text-lg mb-1 group-hover:text-purple-300 transition-colors">{alt.name}</div>
                        <div className="text-cyan-400 font-bold mb-3">{formatINR(alt.price)}</div>
                        <p className="text-sm text-white/60 leading-relaxed">{alt.reason}</p>
                        <a href={`https://amazon.in/s?k=${encodeURIComponent(alt.name)}`} target="_blank" rel="noreferrer"
                          className="mt-4 flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
                          <ExternalLink className="w-3 h-3" /> Search on Amazon
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ GIFT RESULTS ══ */}
          {giftMutation.isSuccess && activeTab === "gift" && giftMutation.data?.gifts && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-6">
              {giftMutation.data.gifts.map((gift: any, i: number) => (
                <div key={i} className="glass border-cyan-500/20 p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-[20px] group-hover:bg-cyan-500/20 transition-all" />
                  <Gift className="w-8 h-8 text-cyan-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2 pr-4">{gift.name}</h3>
                  <div className="text-green-400 font-bold text-lg mb-4">{formatINR(gift.price)}</div>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">{gift.reason}</p>
                  <a href={`https://amazon.in/s?k=${encodeURIComponent(gift.name)}`} target="_blank" rel="noreferrer"
                    className="w-full py-2.5 rounded-lg border border-cyan-500/30 text-cyan-300 font-semibold hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2">
                    Search Prices <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
