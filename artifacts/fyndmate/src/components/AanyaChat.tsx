import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Sparkles, Loader2, Volume2, MessageSquare } from "lucide-react";

interface Message {
  role: "user" | "ai";
  text: string;
  id: number;
}

interface AanyaChatProps {
  context?: {
    body_type?: string;
    occasion?: string;
    budget?: number;
    skin_tone?: string;
  };
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const SUGGESTIONS = [
  "What to wear for a college party?",
  "Best outfit under ₹1500?",
  "Colours for wheatish skin?",
  "Diwali festive look ideas?",
  "Office look for summer?",
  "Wedding guest outfit?",
];

export function AanyaChat({ context }: AanyaChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgId = useRef(0);

  /* ── Speech Recognition ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      setInputText(final || interim);
      if (final) { setListening(false); sendMessage(final.trim()); }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  /* ── Initial greeting ── */
  useEffect(() => {
    addAI("Hi! I'm Aanya, your personal AI fashion stylist! ✨ Type or speak your question — I'll help with outfits, colours, budgets, and trending Indian fashion.");
  }, []);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const addAI = (text: string) =>
    setMessages(prev => [...prev, { role: "ai", text, id: ++msgId.current }]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN"; utter.rate = 0.95; utter.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.startsWith("en-IN") || v.lang.startsWith("en-GB")) || voices[0];
    if (v) utter.voice = v;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg || loading) return;
    setInputText("");
    setMessages(prev => [...prev, { role: "user", text: msg, id: ++msgId.current }]);
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/designer/voice-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context }),
      });
      const data = await res.json();
      const reply = data.reply ?? "Great choice! Let me think of the perfect look for you.";
      addAI(reply);
      speakText(reply);
    } catch {
      const fb = "Try a classic kurta with palazzo pants — timeless, budget-friendly, and perfect for any Indian occasion!";
      addAI(fb);
      speakText(fb);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, context]);

  const toggleListen = () => {
    if (listening) {
      recognitionRef.current?.stop(); setListening(false);
    } else if (recognitionRef.current && !loading) {
      window.speechSynthesis.cancel(); setSpeaking(false); setInputText("");
      try { recognitionRef.current.start(); setListening(true); } catch { setListening(false); }
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <section className="py-16 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            Live AI Stylist
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            Ask <span className="gradient-text">Aanya</span> Anything
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Your personal AI fashion stylist — type your question or tap the mic to speak. Aanya knows Indian fashion, budgets, and your style.
          </p>
        </div>

        {/* Chat Box */}
        <div className="glass-cyan overflow-hidden" style={{ borderRadius: "1.25rem" }}>

          {/* Chat Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-white/5"
            style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(124,58,237,0.10))" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#050508]" />
              </div>
              <div>
                <div className="font-black text-white flex items-center gap-2 text-sm">
                  Aanya
                  {speaking && (
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Volume2 className="w-3 h-3 animate-pulse" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Speaking</span>
                    </span>
                  )}
                  {listening && (
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Listening</span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white/40">AI Fashion Stylist · Powered by Groq</div>
              </div>
            </div>
            <MessageSquare className="w-5 h-5 text-white/20" />
          </div>

          {/* Messages */}
          <div className="px-5 py-4 space-y-3 overflow-y-auto" style={{ minHeight: 280, maxHeight: 380 }}>

            {/* Quick suggestion chips */}
            {messages.length <= 1 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mb-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/15 transition-colors"
                    style={{ background: "rgba(6,182,212,0.07)" }}
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}

            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mb-0.5"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed"
                  style={msg.role === "user"
                    ? { background: "linear-gradient(135deg, #7C3AED, #5B21B6)", borderRadius: "1rem 1rem 0.25rem 1rem", color: "#fff" }
                    : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "1rem 1rem 1rem 0.25rem", color: "rgba(255,255,255,0.9)" }
                  }
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div
                  className="px-4 py-3 flex items-center gap-1.5"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "1rem 1rem 1rem 0.25rem" }}
                >
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Waveform while listening */}
          <AnimatePresence>
            {listening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 py-2.5 flex items-center gap-2 border-t border-white/5"
              >
                <span className="text-xs text-red-400 font-medium">Listening...</span>
                <div className="flex items-end gap-0.5">
                  {[...Array(14)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [3, 12 + (i % 4) * 5, 3] }}
                      transition={{ duration: 0.3 + i * 0.03, repeat: Infinity, repeatType: "mirror" }}
                      className="w-0.5 rounded-full"
                      style={{ background: "linear-gradient(to top, #7C3AED, #06B6D4)" }}
                    />
                  ))}
                </div>
                {inputText && <span className="text-xs text-white/40 italic ml-2 truncate max-w-[200px]">"{inputText}"</span>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input bar */}
          <div className="px-4 py-4 border-t border-white/5" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: listening ? "1px solid rgba(220,38,38,0.4)" : "1px solid rgba(6,182,212,0.25)",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                placeholder={listening ? "Listening to you..." : "Ask about outfits, colours, budgets..."}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none disabled:opacity-40 min-w-0"
              />

              {/* Mic button */}
              {voiceSupported && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={toggleListen}
                  disabled={loading}
                  title={listening ? "Stop" : "Speak"}
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-40"
                  style={listening
                    ? { background: "linear-gradient(135deg, #DC2626, #991B1B)", boxShadow: "0 0 14px rgba(220,38,38,0.5)" }
                    : { background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.35)" }
                  }
                >
                  {listening
                    ? <MicOff className="w-4 h-4 text-white" />
                    : <Mic className="w-4 h-4 text-purple-300" />
                  }
                </motion.button>
              )}

              {/* Send button */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => sendMessage()}
                disabled={!inputText.trim() || loading}
                className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center disabled:opacity-30 transition-all"
                style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
              >
                {loading
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </motion.button>
            </div>
            <p className="text-center text-[10px] text-white/20 mt-2.5">
              Powered by Groq · Aanya knows Indian fashion, trends & budgets
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
