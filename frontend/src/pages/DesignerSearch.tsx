import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchInput from "../components/SearchInput";
import { useBodyProfile } from "../hooks/useBodyProfile";
import { useVoiceSearch } from "../hooks/useVoiceSearch";

const FESTIVAL_CHIPS = ["Diwali Outfits", "College Casual", "Office Wear", "Wedding Guest", "Summer"];

const DesignerSearch = () => {
  const navigate = useNavigate();
  const { hasProfile } = useBodyProfile();
  const [query, setQuery] = useState("");
  const { isListening, startListening, stopListening } = useVoiceSearch(setQuery);

  useEffect(() => {
    if (!hasProfile) {
      navigate("/designer/onboarding", { replace: true });
    }
  }, [hasProfile, navigate]);

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate(`/designer/results?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-10 sm:px-6">
      <h1 className="mb-3 text-center text-3xl font-bold text-apple-dark md:text-5xl">
        What outfit are you looking for?
      </h1>
      <p className="mb-8 text-center text-apple-gray">Describe style, occasion, or item.</p>
      <SearchInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSearch}
        placeholder="casual shirts for college"
        isListening={isListening}
        onMicClick={isListening ? stopListening : startListening}
      />
      <div className="mt-5 flex w-full max-w-2xl gap-2 overflow-x-auto pb-1">
        {FESTIVAL_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setQuery(chip)}
            className="shrink-0 rounded-pill border border-apple-border bg-apple-card px-4 py-2 text-sm text-apple-gray hover:text-apple-dark"
          >
            {chip}
          </button>
        ))}
      </div>
    </main>
  );
};

export default DesignerSearch;
