import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Gift, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink, ShieldCheck, TrendingDown } from "lucide-react";
import { useSearchProduct, useFindGifts } from "@workspace/api-client-react";
import { formatINR } from "@/lib/utils";

export function AIFinder() {
  const [activeTab, setActiveTab] = useState<"search" | "gift">("search");
  
  // Search State
  const [query, setQuery] = useState("");
  const [useCase, setUseCase] = useState("general");
  const [platform, setPlatform] = useState("all");

  // Gift State
  const [recipient, setRecipient] = useState("");
  const [interests, setInterests] = useState("");
  const [giftBudget, setGiftBudget] = useState<number>(2000);

  const searchMutation = useSearchProduct();
  const giftMutation = useFindGifts();

  const useCases = ["Gaming", "Travel", "Gym", "Office", "Daily", "Gift"];
  const platforms = ["Amazon", "Flipkart", "Myntra", "All"];

  const handleSearch = () => {
    if (!query) return;
    searchMutation.mutate({ data: { query, use_case: useCase, platform } });
  };

  const handleGiftSearch = () => {
    if (!recipient || !interests) return;
    giftMutation.mutate({ data: { recipient, interests, budget: giftBudget } });
  };

  const loadingMessages = [
    "Analyzing millions of products...",
    "Checking price histories...",
    "Scanning for fake reviews...",
    "Finding the best value..."
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  // Cycle loading messages
  useState(() => {
    if (searchMutation.isPending || giftMutation.isPending) {
      const interval = setInterval(() => setMsgIdx(i => (i + 1) % loadingMessages.length), 1500);
      return () => clearInterval(interval);
    }
  });

  return (
    <section id="finder" className="py-24 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">AI Product <span className="gradient-text">Finder</span></h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">Describe what you need, and our AI will find the perfect product, verify reviews, and get you the best price.</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="glass p-1 rounded-xl inline-flex">
            <button 
              onClick={() => setActiveTab("search")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "search" ? "bg-purple-600 text-white shadow-lg" : "text-white/50 hover:text-white"}`}
            >
              <Search className="w-4 h-4 inline-block mr-2 mb-0.5" /> Product Search
            </button>
            <button 
              onClick={() => setActiveTab("gift")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "gift" ? "bg-cyan-600 text-white shadow-lg" : "text-white/50 hover:text-white"}`}
            >
              <Gift className="w-4 h-4 inline-block mr-2 mb-0.5" /> Gift Genius
            </button>
          </div>
        </div>

        {/* Form Area */}
        <div className="glass-purple p-6 md:p-8 animate-pulse-glow max-w-4xl mx-auto mb-16">
          {activeTab === "search" ? (
            <div className="space-y-6">
              <div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="E.g., I need noise cancelling earphones for gym under 2k..."
                  className="w-full bg-[#050508]/50 border border-purple-500/20 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[120px] resize-none text-lg"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Use Case</label>
                <div className="flex flex-wrap gap-2">
                  {useCases.map(uc => (
                    <button 
                      key={uc}
                      onClick={() => setUseCase(uc.toLowerCase())}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${useCase === uc.toLowerCase() ? "bg-purple-500/20 border-purple-500 text-purple-300" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}
                    >
                      {uc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-2">
                  {platforms.map(p => (
                    <button 
                      key={p}
                      onClick={() => setPlatform(p.toLowerCase())}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${platform === p.toLowerCase() ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-white/40 hover:text-white/70"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={searchMutation.isPending || !query}
                  className="shimmer-btn animate-shimmer px-8 py-3 w-full md:w-auto"
                >
                  {searchMutation.isPending ? "Searching..." : "Find with AI"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Who is this for?</label>
                  <input 
                    type="text" 
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="E.g., 25yo Brother"
                    className="w-full bg-[#050508]/50 border border-cyan-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Budget (₹)</label>
                  <input 
                    type="number" 
                    value={giftBudget}
                    onChange={(e) => setGiftBudget(Number(e.target.value))}
                    className="w-full bg-[#050508]/50 border border-cyan-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Interests & Hobbies</label>
                <textarea
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="E.g., Loves photography, hiking, and drinking craft coffee..."
                  className="w-full bg-[#050508]/50 border border-cyan-500/20 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500 min-h-[100px] resize-none"
                />
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button 
                  onClick={handleGiftSearch}
                  disabled={giftMutation.isPending || !recipient || !interests}
                  className="cyan-btn animate-shimmer px-8 py-3 w-full md:w-auto"
                >
                  {giftMutation.isPending ? "Finding Gifts..." : "Find Perfect Gift"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        <AnimatePresence>
          {(searchMutation.isPending || giftMutation.isPending) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="text-purple-300 font-medium animate-pulse">{loadingMessages[msgIdx]}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {(searchMutation.isError || giftMutation.isError) && (
          <div className="glass border-red-500/30 p-6 text-center text-red-400 max-w-md mx-auto">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Something went wrong analyzing the products. Please try again or change your query.</p>
          </div>
        )}

        {/* Results Area */}
        <AnimatePresence>
          {searchMutation.isSuccess && activeTab === "search" && searchMutation.data?.main_product && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Main Product Card */}
              <div className="glass border-purple-500/30 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />
                
                <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
                  {/* Left Col - Identity */}
                  <div className="md:col-span-1">
                    <div className="inline-block bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-4 border border-purple-500/30">
                      Best Overall Match
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{searchMutation.data.main_product.product_name}</h3>
                    <p className="text-white/50 mb-6">by {searchMutation.data.main_product.brand}</p>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-[#050508] border-2 border-green-500">
                        <span className="text-xl font-black text-green-400">{searchMutation.data.main_product.match_score}%</span>
                      </div>
                      <div className="text-sm font-medium text-white/70">
                        AI Confidence<br/>Score
                      </div>
                    </div>

                    <div className="space-y-2">
                      {searchMutation.data.main_product.fake_review_warning ? (
                        <div className="flex items-start gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                          <div className="text-xs text-red-300 font-medium">Warning: {searchMutation.data.main_product.fake_review_reason}</div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                          <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
                          <div className="text-xs text-green-300 font-medium">Reviews verified authentic by AI.</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mid Col - Pros/Cons */}
                  <div className="md:col-span-1 space-y-6">
                    <div>
                      <h4 className="text-sm font-bold uppercase text-white/40 mb-3">Why it matches</h4>
                      <ul className="space-y-2">
                        {searchMutation.data.main_product.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase text-white/40 mb-3">Trade-offs</h4>
                      <ul className="space-y-2">
                        {searchMutation.data.main_product.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right Col - Pricing & Buying */}
                  <div className="md:col-span-1 glass-purple p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold uppercase text-purple-300 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" /> Price Intelligence
                      </h4>
                      
                      {searchMutation.data.prices && (
                        <div className="space-y-2 mb-6">
                          <div className={`p-3 rounded-lg border flex justify-between items-center ${searchMutation.data.prices.best_deal === 'amazon' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Amazon</span>
                              {searchMutation.data.prices.best_deal === 'amazon' && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">BEST</span>}
                            </div>
                            <span className="font-bold">{formatINR(searchMutation.data.prices.amazon.price)}</span>
                          </div>
                          <div className={`p-3 rounded-lg border flex justify-between items-center ${searchMutation.data.prices.best_deal === 'flipkart' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Flipkart</span>
                              {searchMutation.data.prices.best_deal === 'flipkart' && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">BEST</span>}
                            </div>
                            <span className="font-bold">{formatINR(searchMutation.data.prices.flipkart.price)}</span>
                          </div>
                          {(searchMutation.data.prices as any).myntra && (
                            <div className="p-3 rounded-lg border border-white/5 bg-white/5 flex justify-between items-center">
                              <span className="font-medium text-sm text-white/60">Myntra</span>
                              <span className="text-xs text-white/40 italic">Fashion picks</span>
                            </div>
                          )}
                        </div>
                      )}

                      {searchMutation.data.prices?.savings && searchMutation.data.prices.savings > 0 && (
                        <div className="text-center text-sm text-green-400 font-bold mb-4">
                          You save {formatINR(searchMutation.data.prices.savings)} by choosing the best deal!
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <a 
                        href={searchMutation.data.prices?.amazon.affiliate_url || "#"} 
                        target="_blank" rel="noreferrer"
                        className="w-full block text-center py-3 bg-[#ff9900] hover:bg-[#ff9900]/90 text-black font-bold rounded-xl transition-colors"
                      >
                        Buy on Amazon
                      </a>
                      <a 
                        href={searchMutation.data.prices?.flipkart.affiliate_url || "#"} 
                        target="_blank" rel="noreferrer"
                        className="w-full block text-center py-3 bg-[#047BD5] hover:bg-[#047BD5]/90 text-white font-bold rounded-xl transition-colors"
                      >
                        Buy on Flipkart
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternatives */}
              {searchMutation.data.main_product.alternatives && searchMutation.data.main_product.alternatives.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-6">Other Good Options</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {searchMutation.data.main_product.alternatives.map((alt, i) => (
                      <div key={i} className="glass p-5 hover:border-purple-500/30 transition-colors group">
                        <div className="font-bold text-lg mb-1 group-hover:text-purple-300 transition-colors">{alt.name}</div>
                        <div className="text-cyan-400 font-bold mb-3">{formatINR(alt.price)}</div>
                        <p className="text-sm text-white/60 leading-relaxed">{alt.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Gift Results */}
          {giftMutation.isSuccess && activeTab === "gift" && giftMutation.data?.gifts && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-3 gap-6"
            >
              {giftMutation.data.gifts.map((gift, i) => (
                <div key={i} className="glass border-cyan-500/20 p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-[20px] group-hover:bg-cyan-500/20 transition-all" />
                  <Gift className="w-8 h-8 text-cyan-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2 pr-4">{gift.name}</h3>
                  <div className="text-green-400 font-bold text-lg mb-4">{formatINR(gift.price)}</div>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">{gift.reason}</p>
                  <button className="w-full py-2.5 rounded-lg border border-cyan-500/30 text-cyan-300 font-semibold hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2">
                    Search Prices <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
