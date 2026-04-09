import type { Product } from "../types";

const riskStyle: Record<Product["return_risk"], string> = {
  low: "bg-[#E6F7EF] text-[#1D7346]",
  medium: "bg-[#FFF3E0] text-[#E65100]",
  high: "bg-[#FFEBEE] text-[#C62828]"
};

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const bestPlatform = product.amazon_price <= product.flipkart_price ? "amazon" : "flipkart";

  return (
    <article className="overflow-hidden rounded-[20px] border border-[#E5E5EA] bg-white transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
      <img src={product.image_url} alt={product.name} className="h-48 w-full object-cover bg-apple-card" />
      <div className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-[0.08em] text-apple-hint">{product.brand}</p>
        <h3 className="text-lg font-semibold text-apple-dark">{product.name}</h3>
        <p className="font-mono text-2xl font-bold">Rs {product.price.toLocaleString("en-IN")}</p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-pill bg-[#E6F7EF] px-3 py-1 text-xs font-semibold text-[#1D7346]">
            {product.match_score}% Match
          </span>
          <span
            className={`rounded-pill px-3 py-1 text-xs font-semibold ${
              product.fake_review_warning ? "bg-[#FFEBEE] text-[#C62828]" : "bg-[#E6F7EF] text-[#1D7346]"
            }`}
          >
            {product.fake_review_warning ? "Suspicious Reviews" : "Reviews Genuine"}
          </span>
          <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${riskStyle[product.return_risk]}`}>
            Return {product.return_risk}
          </span>
        </div>
        {typeof product.use_case_score === "number" ? (
          <p className="text-xs text-apple-gray">Use-case performance: {product.use_case_score}%</p>
        ) : null}

        <div className="rounded-xl border border-apple-border bg-apple-card p-3 text-sm text-apple-dark">
          <p className="font-medium">Price compare</p>
          <p>
            Amazon: <strong>Rs {product.amazon_price.toLocaleString("en-IN")}</strong>
          </p>
          <p>
            Flipkart: <strong>Rs {product.flipkart_price.toLocaleString("en-IN")}</strong>{" "}
            <span className="text-[#1D7346]">Best deal: {bestPlatform}</span>
          </p>
          {typeof product.savings_vs_avg === "number" && product.savings_vs_avg > 0 ? (
            <p className="text-xs text-[#1D7346]">
              Savings vs average: Rs {product.savings_vs_avg.toLocaleString("en-IN")}
            </p>
          ) : null}
        </div>

        <details className="rounded-xl border border-apple-border bg-white p-3">
          <summary className="cursor-pointer font-medium text-apple-dark">See Details</summary>
          <div className="mt-2 space-y-2 text-sm text-apple-gray">
            <p>
              <strong className="text-apple-dark">Pros:</strong> {product.pros.join(" • ")}
            </p>
            <p>
              <strong className="text-apple-dark">Cons:</strong> {product.cons.join(" • ")}
            </p>
            {product.return_risk_reason ? (
              <p>
                <strong className="text-apple-dark">Return Risk Note:</strong> {product.return_risk_reason}
              </p>
            ) : null}
            <p>
              <strong className="text-apple-dark">Review Signal:</strong> {product.fake_review_reason}
            </p>
            <p>{product.explanation}</p>
          </div>
        </details>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={product.buy_amazon_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-[#FF9900] px-4 py-2 text-center text-sm font-medium text-black"
          >
            Buy Amazon
          </a>
          <a
            href={product.buy_flipkart_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-[#2874F0] px-4 py-2 text-center text-sm font-medium text-white"
          >
            Buy Flipkart
          </a>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
