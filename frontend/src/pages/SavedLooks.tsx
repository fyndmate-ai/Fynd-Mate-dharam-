import { Link } from "react-router-dom";
import { useSelectedOutfit } from "../hooks/useSelectedOutfit";

const SavedLooks = () => {
  const { savedLooks } = useSelectedOutfit();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold text-apple-dark">Saved Looks</h1>
      {savedLooks.length === 0 ? (
        <div className="rounded-2xl border border-apple-border bg-white p-6 text-apple-gray">
          No looks saved yet.
        </div>
      ) : (
        <div className="space-y-4">
          {savedLooks.map((look) => (
            <article key={look.id} className="rounded-2xl border border-apple-border bg-white p-4">
              <p className="text-sm text-apple-gray">{look.query || "Custom look"}</p>
              <p className="mt-1 text-lg font-semibold text-apple-dark">
                Total Rs {look.totalPrice.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-sm text-apple-gray">{look.items.map((item) => item.name).join(", ")}</p>
            </article>
          ))}
        </div>
      )}
      <Link to="/designer" className="mt-6 inline-block rounded-pill bg-apple-blue px-5 py-2.5 text-white">
        Back to AI Designer
      </Link>
    </main>
  );
};

export default SavedLooks;
