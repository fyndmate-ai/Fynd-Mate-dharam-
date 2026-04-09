import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { finderMockProducts } from "../data/finderMock";
import { finderSearch } from "../services/api";
import type { Product } from "../types";

const FinderResults = () => {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [explanation, setExplanation] = useState("");
  const [budgetLock, setBudgetLock] = useState<number | null>(null);
  const [realProductsFound, setRealProductsFound] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await finderSearch(query);
        if (ignore) return;
        setProducts(data.products.length > 0 ? data.products : finderMockProducts);
        setExplanation(data.explanation);
        setBudgetLock(data.budget_lock ?? null);
        setRealProductsFound(data.real_products_found ?? 0);
      } catch {
        if (ignore) return;
        setError("Something went wrong. Showing best fallback results.");
        setProducts(finderMockProducts);
        setExplanation("Fallback ranking loaded due to temporary API issue.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if (!query.trim()) {
      setProducts(finderMockProducts);
      setExplanation("Fallback ranking loaded.");
      setLoading(false);
      return;
    }
    void run();
    return () => {
      ignore = true;
    };
  }, [query]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-8 text-2xl font-semibold text-apple-dark md:text-3xl">
        Found best matches for: <span className="text-apple-blue">{query}</span>
      </h1>
      <div className="mb-4 text-xs text-apple-gray">
        {realProductsFound > 0 ? `${realProductsFound} live products scanned` : "Using fallback catalog"}
      </div>
      <div className="mb-6 rounded-2xl bg-[#E6F7EF] px-4 py-3 text-sm text-[#1D7346]">
        {(() => {
          const savings = (products.length > 0 ? products : finderMockProducts).reduce(
            (sum, product) => sum + (product.savings_vs_avg ?? 0),
            0
          );
          return savings > 0
            ? `FyndMate savings tracker: Rs ${savings.toLocaleString("en-IN")} potential savings across recommendations.`
            : "FyndMate savings tracker will appear when price spread data is available.";
        })()}
      </div>
      {budgetLock ? (
        <div className="mb-6 rounded-2xl bg-[#E6F1FB] px-4 py-3 text-sm text-[#0C447C]">
          Budget lock detected: under Rs {budgetLock.toLocaleString("en-IN")}
        </div>
      ) : null}
      {error ? <p className="mb-4 text-sm text-[#C62828]">{error}</p> : null}
      {loading ? <p className="mb-4 text-sm text-apple-gray">Finding best options...</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        {(products.length > 0 ? products : finderMockProducts).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <details className="mt-8 rounded-2xl border border-apple-border bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold text-apple-dark">
          Why FyndMate chose this →
        </summary>
        <p className="mt-2 text-sm text-apple-gray">{explanation || "No explanation available."}</p>
      </details>
    </main>
  );
};

export default FinderResults;
