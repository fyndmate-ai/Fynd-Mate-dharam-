import { FormEvent, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Search, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { useLocation } from "wouter";
import { formatINR } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type FinderResponse = {
  success: boolean;
  main_product?: {
    product_name: string;
    brand: string;
    estimated_price: number;
    match_score: number;
    pros: string[];
    cons: string[];
    explanation: string;
    return_risk: "low" | "medium" | "high";
    prices?: {
      amazon: { price: number; affiliate_url: string };
      flipkart: { price: number; affiliate_url: string };
      myntra?: { url: string };
      savings: number;
    };
  };
};

export function FinderPage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("Best running shoes under ₹3000");
  const [budget, setBudget] = useState(3000);
  const [useCase, setUseCase] = useState("daily walking");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FinderResponse | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/finder/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, budget, use_case: useCase }),
      });
      const data = (await res.json()) as FinderResponse;
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F]">
      <header className="sticky top-0 z-40 h-14 border-b border-[#D2D2D7] bg-white/95 backdrop-blur">
        <div className="max-w-[1200px] h-full mx-auto px-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4" /> FyndMate Finder
          </div>
          <button onClick={() => navigate("/designer")} className="text-[#0071E3] text-sm font-medium">Try Designer</button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-20">
        <h1 className="text-5xl md:text-[56px] font-bold leading-tight text-center">
          Find products faster.
          <br />
          Buy smarter.
        </h1>
        <p className="text-center text-[21px] text-[#6E6E73] mt-4">
          Natural language search + fake review checks + live price comparison.
        </p>

        <form onSubmit={onSubmit} className="mt-10 rounded-[18px] border border-[#D2D2D7] bg-[#F5F5F7] p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <label className="text-sm">
              Search
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#D2D2D7] bg-white px-3 py-2.5"
              />
            </label>
            <label className="text-sm">
              Budget
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-[#D2D2D7] bg-white px-3 py-2.5"
              />
            </label>
            <label className="text-sm">
              Use case
              <input
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#D2D2D7] bg-white px-3 py-2.5"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-full bg-[#0071E3] text-white px-6 py-2.5 text-[17px] font-medium inline-flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Analyze Product
          </button>
        </form>

        {result?.main_product && (
          <div className="mt-8 grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-[18px] border border-[#D2D2D7] bg-white p-6">
              <p className="text-[14px] text-[#6E6E73]">Top Recommendation</p>
              <h2 className="text-[40px] leading-tight font-semibold mt-1">{result.main_product.product_name}</h2>
              <p className="text-[17px] text-[#6E6E73] mt-2">{result.main_product.explanation}</p>
              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#F5F5F7] border border-[#D2D2D7] p-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Pros</p>
                  <ul className="mt-2 text-sm text-[#6E6E73] space-y-1">
                    {result.main_product.pros?.slice(0, 4).map((pro) => <li key={pro}>• {pro}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] border border-[#D2D2D7] p-4">
                  <p className="text-sm font-semibold">Things to know</p>
                  <ul className="mt-2 text-sm text-[#6E6E73] space-y-1">
                    {result.main_product.cons?.slice(0, 4).map((con) => <li key={con}>• {con}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-[#D2D2D7] bg-[#F5F5F7] p-5">
              <p className="text-sm text-[#6E6E73]">Match Score</p>
              <p className="text-4xl font-semibold mt-1">{result.main_product.match_score}%</p>
              <p className="text-sm text-[#6E6E73] mt-1">Return risk: {result.main_product.return_risk}</p>
              <p className="text-sm mt-4">Estimated Price</p>
              <p className="text-2xl font-semibold">{formatINR(result.main_product.estimated_price)}</p>

              {result.main_product.prices && (
                <div className="mt-5 space-y-2">
                  <a
                    href={result.main_product.prices.amazon.affiliate_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-xl border border-[#D2D2D7] bg-white px-3 py-2 text-sm flex items-center justify-between"
                  >
                    Amazon {formatINR(result.main_product.prices.amazon.price)} <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={result.main_product.prices.flipkart.affiliate_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-xl border border-[#D2D2D7] bg-white px-3 py-2 text-sm flex items-center justify-between"
                  >
                    Flipkart {formatINR(result.main_product.prices.flipkart.price)} <ExternalLink className="w-4 h-4" />
                  </a>
                  <div className="text-sm text-[#1D7346] flex items-center gap-1">
                    <Tag className="w-4 h-4" /> Savings: {formatINR(result.main_product.prices.savings)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
