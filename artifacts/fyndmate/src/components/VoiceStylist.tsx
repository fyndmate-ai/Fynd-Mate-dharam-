import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, Sparkles, Send, Loader2, MessageCircle } from "lucide-react";

interface Message {
  role: "user" | "ai";
  text: string;
  id: number;
}

interface VoiceStylistProps {
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
  "Best colours for wheatish skin?",
  "Outfit under ₹1500 for a date?",
  "Festival look for Diwali?",
];

export function VoiceStylist({ context }: VoiceStylistProps) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgIdRef = useRef(0);

  /* ── Speech Recognition setup ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return; }

    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setInputText(final || interim);
      if (final) {
        setListening(false);
        handleSend(final.trim());
      }
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ── Greeting on open ── */
  useEffect(() => {
    if (open && messages.length === 0) {
      addAIMessage("Hi! I'm Aanya, your personal AI fashion stylist! 💫 Type or speak your question — I'll help you find the perfect look, colours, and budget-friendly picks.");
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  /* ── Helpers ── */
  const addAIMessage = (text: string) =>
    setMessages(prev => [...prev, { role: "ai", text, id: ++msgIdRef.current }]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    utter.rate = 0.95;
    utter.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en-IN") || v.lang.startsWith("en-GB")) || voices[0];
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  /* ── Send message (shared by text + voice) ── */
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg || loading) return;
    setInputText("");
    setMessages(prev => [...prev, { role: "user", text: msg, id: ++msgIdRef.current }]);
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/designer/voice-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context }),
      });
      const data = await res.json();
      const reply = data.reply || "Great question! Let me think of the perfect style for you.";
      addAIMessage(reply);
      speakText(reply);
    } catch {
      const fallback = "Try a classic kurta with palazzo pants — timeless, budget-friendly, and stunning for any Indian occasion!";
      addAIMessage(fallback);
      speakText(fallback);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, context]);

  /* ── Voice controls ── */
  const startListening = () => {
    if (!recognitionRef.current || listening || loading) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setInputText("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch { setListening(false); }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleClose = () => {
    stopListening();
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl shadow-purple-500/30 border border-purple-500/30 font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)" }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <MessageCircle className="w-4 h-4" />
            Chat with Aanya · AI Stylist
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-end sm:justify-end p-0 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 24, stiffness: 320 }}
              className="w-full sm:w-[400px] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/40"
              style={{
                background: "#0c0c18",
                border: "1px solid rgba(124,58,237,0.2)",
                height: "min(580px, 92vh)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.12))", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
                    >
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0c0c18]" />
                  </div>
                  <div>
                    <div className="font-black text-white text-sm flex items-center gap-2">
                      Aanya
                      {speaking && (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <Volume2 className="w-3 h-3 animate-pulse" />
                          <span className="text-[9px] font-bold uppercase tracking-wide">Speaking</span>
                        </span>
                      )}
                      {listening && (
                        <span className="flex items-center gap-1 text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-[9px] font-bold uppercase tracking-wide">Listening</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/40">AI Fashion Stylist · Type or speak</div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {/* Suggestion chips — only when no user messages yet */}
                {messages.length <= 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 pb-1">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="text-[11px] px-3 py-1.5 rounded-full border border-purple-500/30 text-purple-300 hover:bg-purple-500/15 transition-colors"
                        style={{ background: "rgba(124,58,237,0.08)" }}
                      >
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mb-0.5"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
                      >
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user" ? "rounded-2xl rounded-br-sm text-white" : "rounded-2xl rounded-bl-sm text-white/90"
                      }`}
                      style={
                        msg.role === "user"
                          ? { background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }
                          : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }
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
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                          className="w-1.5 h-1.5 rounded-full bg-purple-400"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Waveform (listening state) */}
              <AnimatePresence>
                {listening && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-2 flex items-center justify-center gap-1"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <span className="text-xs text-red-400 mr-2 font-medium">Listening...</span>
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [3, 10 + (i % 3) * 6, 3] }}
                        transition={{ duration: 0.35 + i * 0.04, repeat: Infinity, repeatType: "mirror" }}
                        className="w-0.5 rounded-full"
                        style={{ background: "linear-gradient(to top, #7C3AED, #06B6D4)" }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Bar */}
              <div
                className="px-3 py-3 flex-shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
              >
                <div
                  className="flex items-center gap-2 rounded-2xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    placeholder={listening ? "Listening..." : "Ask Aanya about fashion..."}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50 min-w-0"
                  />

                  {/* Mic button */}
                  {voiceSupported && (
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={listening ? stopListening : startListening}
                      disabled={loading}
                      title={listening ? "Stop listening" : "Speak your question"}
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-40"
                      style={
                        listening
                          ? { background: "linear-gradient(135deg, #DC2626, #991B1B)", boxShadow: "0 0 12px rgba(220,38,38,0.5)" }
                          : { background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.4)" }
                      }
                    >
                      {listening
                        ? <MicOff className="w-3.5 h-3.5 text-white" />
                        : <Mic className="w-3.5 h-3.5 text-purple-300" />
                      }
                    </motion.button>
                  )}

                  {/* Send button */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => handleSend()}
                    disabled={!inputText.trim() || loading}
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
                  >
                    {loading
                      ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      : <Send className="w-3.5 h-3.5 text-white" />
                    }
                  </motion.button>
                </div>

                <p className="text-center text-[10px] text-white/20 mt-2">
                  Powered by Groq · Aanya knows Indian fashion best
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
