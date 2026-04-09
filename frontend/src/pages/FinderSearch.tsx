import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchInput from "../components/SearchInput";
import { useVoiceSearch } from "../hooks/useVoiceSearch";

const HINTS = ["Laptops", "Earphones", "Phones", "Fashion"];

const FinderSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { isListening, startListening, stopListening } = useVoiceSearch(setQuery);

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate(`/finder/results?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-10 sm:px-6">
      <h1 className="mb-3 text-center text-3xl font-bold text-apple-dark md:text-5xl">What are you looking for?</h1>
      <p className="mb-8 text-center text-apple-gray">Describe in your own words — budget, use, anything.</p>
      <SearchInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSearch}
        placeholder="best laptop for college under 20000"
        isListening={isListening}
        onMicClick={isListening ? stopListening : startListening}
      />
      <div className="mt-5 flex w-full max-w-2xl gap-2 overflow-x-auto pb-1">
        {HINTS.map((hint) => (
          <button
            key={hint}
            onClick={() => setQuery(`best ${hint.toLowerCase()} for daily use`)}
            className="shrink-0 rounded-pill border border-apple-border bg-apple-card px-3 py-1.5 text-sm text-apple-gray hover:text-apple-dark"
          >
            {hint}
          </button>
        ))}
      </div>
    </main>
  );
};

export default FinderSearch;
