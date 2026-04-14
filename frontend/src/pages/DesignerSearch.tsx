import { AnimatePresence, motion } from "framer-motion";
import { PencilLine, Search, SendHorizonal } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBodyProfile } from "../hooks/useBodyProfile";

const QUICK_SUGGESTIONS = ["College outfit", "Streetwear", "Office look"];

const DesignerSearch = () => {
  const navigate = useNavigate();
  const { hasProfile, profile } = useBodyProfile();
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    if (!hasProfile) {
      navigate("/designer/onboarding", { replace: true });
    }
  }, [hasProfile, navigate]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isThinking) return;
    setIsThinking(true);
    window.setTimeout(() => {
      navigate(`/designer/results?q=${encodeURIComponent(trimmed)}`);
    }, 650);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F8FAFF] via-white to-[#F7F9FD] px-4 py-8 sm:px-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 rounded-[28px] border border-apple-border bg-white/80 p-6 shadow-[0_24px_60px_rgba(16,24,40,0.08)] backdrop-blur sm:p-8 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="flex w-full flex-1 flex-col justify-center lg:max-w-xl">
          <h1 className="text-center text-4xl font-semibold tracking-tight text-apple-dark sm:text-5xl lg:text-left">
            See your outfit before you buy it
          </h1>
          <p className="mt-4 text-center text-base text-apple-gray lg:text-left">
            Describe what you want and try it instantly on your avatar
          </p>
          <div className="mt-4 flex justify-center lg:justify-start">
            <button
              onClick={() => navigate("/designer/onboarding")}
              className="inline-flex items-center gap-2 rounded-pill border border-apple-border bg-white px-3 py-1.5 text-xs font-medium text-apple-gray transition hover:text-apple-dark"
            >
              <PencilLine size={14} />
              Edit Profile
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-3xl border border-apple-border bg-white p-2 shadow-[0_14px_32px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center gap-2">
              <Search className="ml-2 text-apple-hint" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. Casual outfit for college under ₹2000"
                className="h-12 w-full border-none bg-transparent text-base text-apple-dark outline-none placeholder:text-apple-hint"
              />
              <button
                type="submit"
                disabled={!query.trim() || isThinking}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-apple-blue text-white transition enabled:hover:bg-apple-blue-hover disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send outfit request"
              >
                <SendHorizonal size={18} />
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="rounded-pill border border-apple-border bg-[#F7F9FD] px-4 py-2 text-sm text-apple-gray transition hover:text-apple-dark"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {isThinking ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-5 flex items-center gap-2 text-sm text-apple-gray"
              >
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="ml-1">AI is preparing your try-on</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="flex w-full max-w-sm flex-1 items-center justify-center rounded-[24px] border border-apple-border bg-gradient-to-b from-white to-[#F3F7FF] p-6"
        >
          <div className="relative h-[380px] w-[190px] rounded-3xl border border-apple-border bg-white">
            <div
              className="absolute left-1/2 top-4 h-14 w-14 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: profile?.skinToneHex ?? "#CD9165" }}
            />
            <div className="absolute left-1/2 top-20 h-[190px] w-[90px] -translate-x-1/2 rounded-[44px] border border-apple-border bg-[#F8FAFD]" />
            <div className="absolute left-1/2 top-[307px] h-20 w-6 -translate-x-[120%] rounded-full border border-apple-border bg-[#F8FAFD]" />
            <div className="absolute left-1/2 top-[307px] h-20 w-6 translate-x-[20%] rounded-full border border-apple-border bg-[#F8FAFD]" />
          </div>
        </motion.div>
      </section>
    </main>
  );
};

export default DesignerSearch;
