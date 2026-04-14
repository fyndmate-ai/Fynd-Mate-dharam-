import { AnimatePresence, motion } from "framer-motion";
import { Mic, SendHorizonal } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { finderMockProducts } from "../data/finderMock";
import { useVoiceSearch } from "../hooks/useVoiceSearch";
import { finderSearch } from "../services/api";
import type { Product } from "../types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: Product[];
}

const PLACEHOLDER = "e.g. Best running shoes under ₹3000 for daily use";

const ProductPreviewCard = ({ product, isMain }: { product: Product; isMain: boolean }) => (
  <motion.article
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28 }}
    className="overflow-hidden rounded-2xl border border-apple-border bg-white"
  >
    <img src={product.image_url} alt={product.name} className="h-40 w-full object-cover bg-apple-card" />
    <div className="space-y-2 p-4">
      <p className="text-sm text-apple-hint">{isMain ? "Best match" : "Alternative"}</p>
      <h3 className="line-clamp-2 text-base font-semibold text-apple-dark">{product.name}</h3>
      <p className="text-lg font-bold text-apple-dark">₹{product.price.toLocaleString("en-IN")}</p>
      <p className="line-clamp-2 text-sm text-apple-gray">{product.explanation}</p>
    </div>
  </motion.article>
);

interface ChatComposerProps {
  value: string;
  isListening: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onMicClick: () => void;
  compact?: boolean;
}

const ChatComposer = ({
  value,
  isListening,
  disabled = false,
  onChange,
  onSubmit,
  onMicClick,
  compact = false
}: ChatComposerProps) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full rounded-3xl border border-apple-border bg-white/95 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur ${
        compact ? "max-w-4xl" : "max-w-3xl"
      }`}
    >
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={PLACEHOLDER}
          className="h-12 w-full rounded-2xl border-none bg-transparent px-3 text-base text-apple-dark outline-none placeholder:text-apple-hint"
        />
        <button
          type="button"
          onClick={onMicClick}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
            isListening
              ? "border-[#C62828] bg-[#C62828] text-white"
              : "border-apple-border bg-apple-card text-apple-hint hover:text-apple-dark"
          }`}
          aria-label="Toggle voice input"
        >
          <Mic size={18} />
        </button>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-apple-blue text-white transition enabled:hover:bg-apple-blue-hover disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <SendHorizonal size={18} />
        </button>
      </div>
    </form>
  );
};

const FinderSearch = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const { isListening, startListening, stopListening } = useVoiceSearch(setQuery);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isTyping) return;

    setHasStartedChat(true);
    setQuery("");
    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: "user", text: trimmedQuery }]);
    setIsTyping(true);

    try {
      const data = await finderSearch(trimmedQuery);
      const selectedProducts = (data.products.length ? data.products : finderMockProducts).slice(0, 3);
      const text = data.explanation || "I found a strong top pick and two alternatives based on your request.";
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-assistant`, role: "assistant", text, products: selectedProducts }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-fallback`,
          role: "assistant",
          text: "I couldn't fetch live results right now, so here are the best curated options.",
          products: finderMockProducts.slice(0, 3)
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#F7F7FA] px-4 text-apple-dark sm:px-6">
      <AnimatePresence mode="wait">
        {!hasStartedChat ? (
          <motion.section
            key="finder-home"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3 }}
            className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center"
          >
            <h1 className="mb-8 text-center text-4xl font-semibold tracking-tight md:text-6xl">
              What do you want to buy?
            </h1>
            <ChatComposer
              value={query}
              onChange={setQuery}
              onSubmit={() => void handleSearch()}
              isListening={isListening}
              onMicClick={isListening ? stopListening : startListening}
            />
          </motion.section>
        ) : (
          <motion.section
            key="finder-chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto h-screen w-full max-w-5xl pb-28 pt-6"
          >
            <div className="h-full overflow-y-auto pb-8">
              <div className="space-y-5">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-3xl rounded-3xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-apple-blue text-white"
                          : "border border-apple-border bg-white text-apple-dark"
                      }`}
                    >
                      <p className="text-sm leading-relaxed sm:text-base">{message.text}</p>

                      {message.role === "assistant" && message.products ? (
                        <div className="mt-4 space-y-3">
                          <ProductPreviewCard product={message.products[0]} isMain />
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {message.products.slice(1, 3).map((product) => (
                              <ProductPreviewCard key={product.id} product={product} isMain={false} />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ))}

                {isTyping ? (
                  <div className="flex justify-start">
                    <div className="rounded-3xl border border-apple-border bg-white px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div ref={endRef} />
            </div>

            <motion.div layout className="absolute inset-x-4 bottom-4 mx-auto max-w-5xl sm:inset-x-6">
              <ChatComposer
                compact
                value={query}
                onChange={setQuery}
                onSubmit={() => void handleSearch()}
                isListening={isListening}
                disabled={isTyping}
                onMicClick={isListening ? stopListening : startListening}
              />
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
};

export default FinderSearch;
