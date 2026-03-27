import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Send, Sparkles, Loader2, Upload, Camera, ShoppingBag,
  ExternalLink, RefreshCw, X,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface Outfit {
  name: string;
  occasion: string;
  total_price: number;
  items: { name: string; price: number }[];
  color_palette?: string[];
  styling_tip?: string;
  image_url?: string;
}

type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "ai"; text: string; outfits?: Outfit[] };

const SUGGESTIONS = [
  "Casual under ₹1000",
  "Wedding look",
  "Office wear",
  "Festival outfit",
  "Gym wear",
  "College style",
];

const WELCOME_BULLETS = [
  "Show me casual outfits under ₹1000",
  "I want a wedding look for slim body type",
  "Office wear for women under ₹2000",
  "Festival outfit with gold and red colors",
];

let msgCounter = 0;

export function AanyaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [previewOutfit, setPreviewOutfit] = useState<Outfit | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Speech Recognition ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setVoiceSupported(true);
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
      if (final) {
        setListening(false);
        setTimeout(() => sendMessage(final.trim()), 400);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  /* ── Initial greeting ── */
  useEffect(() => {
    setMessages([{
      id: ++msgCounter,
      role: "ai",
      text: "__welcome__",
    }]);
  }, []);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg || loading) return;
    setInputText("");

    setMessages(prev => [...prev, { id: ++msgCounter, role: "user", text: msg }]);
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/api/designer/chat-style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, user_profile: {} }),
      });
      const data = await res.json();
      const outfits: Outfit[] = data.outfits || [];
      const reply = data.aanya_response || "Here are some outfits I found for you! ✨";

      setMessages(prev => [...prev, {
        id: ++msgCounter,
        role: "ai",
        text: reply,
        outfits: outfits.length > 0 ? outfits : undefined,
      }]);

      if (outfits.length > 0 && !previewOutfit) {
        setPreviewOutfit(outfits[0]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: ++msgCounter,
        role: "ai",
        text: "I'd love to help! Try asking about casual outfits, wedding looks, or office wear! ✨",
      }]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, previewOutfit]);

  const handleTryThis = async (outfit: Outfit) => {
    setPreviewOutfit(outfit);
    if (!uploadedPhoto) return;
    setTryOnLoading(true);
    try {
      const b64 = uploadedPhoto.split(",")[1] || uploadedPhoto;
      const res = await fetch(`${BASE}/api/designer/try-on`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_image_base64: b64,
          clothing_image_url: outfit.image_url || "",
        }),
      });
      const data = await res.json();
      if (data.success && data.result_image) {
        setUploadedPhoto(`data:image/jpeg;base64,${data.result_image}`);
      }
    } catch {}
    setTryOnLoading(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleListen = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else if (recognitionRef.current && !loading) {
      window.speechSynthesis?.cancel();
      setInputText("");
      try { recognitionRef.current.start(); setListening(true); } catch { setListening(false); }
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div
      className="flex gap-0 overflow-hidden rounded-2xl border border-white/8"
      style={{ height: "calc(100vh - 80px)", background: "#0d0d14" }}
    >
      {/* ══════════════════════ LEFT: CHAT (60%) ══════════════════════ */}
      <div className="flex flex-col" style={{ flex: "0 0 60%", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Chat Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.10))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0d0d14]" />
            </div>
            <div>
              <div className="font-black text-white text-sm flex items-center gap-2">
                Aanya
                <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold uppercase tracking-wider">Live</span>
              </div>
              <div className="text-[11px] text-white/40">AI Fashion Stylist · Powered by Groq</div>
            </div>
          </div>
          <div className="text-[11px] text-white/30 hidden sm:block">Just type what you want to wear</div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "#111118" }}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Aanya Avatar */}
                {msg.role === "ai" && (
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center self-end mb-0.5"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                  {/* Message Bubble */}
                  {msg.text === "__welcome__" ? (
                    <div
                      className="px-4 py-3.5 text-sm leading-relaxed"
                      style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem 1rem 1rem 0.25rem" }}
                    >
                      <p className="text-white/90 mb-2">
                        Hi! I'm Aanya, your personal AI fashion stylist! ✨
                      </p>
                      <p className="text-white/60 text-xs mb-3">
                        Tell me what you're looking for — any style, occasion, or budget. I'll find perfect outfits for you instantly!
                      </p>
                      <p className="text-white/40 text-xs mb-1.5 font-semibold uppercase tracking-wider">Try saying:</p>
                      <ul className="space-y-1">
                        {WELCOME_BULLETS.map((b, i) => (
                          <li key={i} className="text-xs text-cyan-400/80 flex items-start gap-1.5">
                            <span className="text-cyan-500 mt-0.5">•</span> {b}
                          </li>
                        ))}
                      </ul>

                      {/* Quick chips */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {SUGGESTIONS.map(s => (
                          <button
                            key={s}
                            onClick={() => sendMessage(s)}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/15 transition-colors"
                            style={{ background: "rgba(6,182,212,0.07)" }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="px-4 py-2.5 text-sm leading-relaxed"
                      style={msg.role === "user"
                        ? { background: "linear-gradient(135deg, #6D28D9, #7C3AED)", borderRadius: "1rem 1rem 0.25rem 1rem", color: "#fff" }
                        : { background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem 1rem 1rem 0.25rem", color: "rgba(255,255,255,0.9)" }
                      }
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Outfit Cards (inside AI message) */}
                  {msg.role === "ai" && (msg as any).outfits && (msg as any).outfits.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-1 w-full" style={{ scrollbarWidth: "thin" }}>
                      {((msg as any).outfits as Outfit[]).map((outfit, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.07 }}
                          className="flex-shrink-0 w-32 rounded-xl overflow-hidden cursor-pointer group"
                          style={{
                            background: "#0d0d14",
                            border: previewOutfit?.name === outfit.name
                              ? "1.5px solid rgba(6,182,212,0.7)"
                              : "1px solid rgba(255,255,255,0.08)",
                            transition: "border-color 0.2s",
                          }}
                        >
                          {/* Outfit Image */}
                          <div className="relative h-28 overflow-hidden bg-black/40">
                            <img
                              src={outfit.image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300"}
                              alt={outfit.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          </div>

                          {/* Outfit Info */}
                          <div className="p-2">
                            <p className="text-[10px] font-bold text-white/90 leading-tight mb-0.5 line-clamp-1">{outfit.name}</p>
                            <p className="text-[10px] text-cyan-400 font-bold mb-2">{formatINR(outfit.total_price)}</p>

                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleTryThis(outfit)}
                                className="w-full py-1 rounded-lg text-[10px] font-bold text-center transition-all hover:opacity-90"
                                style={{ background: "linear-gradient(135deg, #06B6D4, #0891B2)" }}
                              >
                                Try This
                              </button>
                              <a
                                href={`https://amazon.in/s?k=${encodeURIComponent(outfit.name)}&tag=fyndmate-21`}
                                target="_blank" rel="noreferrer"
                                className="w-full py-1 rounded-lg text-[10px] font-bold text-center transition-all hover:opacity-90"
                                style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Buy Now
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div
                className="px-4 py-3 flex items-center gap-1.5"
                style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem 1rem 1rem 0.25rem" }}
              >
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  />
                ))}
                <span className="text-[10px] text-white/30 ml-2">Aanya is finding outfits for you...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice waveform bar */}
        <AnimatePresence>
          {listening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 py-2.5 flex items-center gap-2 flex-shrink-0"
              style={{ background: "#111118", borderTop: "1px solid rgba(255,255,255,0.05)" }}
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
              {inputText && <span className="text-xs text-white/40 italic ml-2 truncate max-w-[180px]">"{inputText}"</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar */}
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ background: "#0d0d14", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: listening
                ? "1px solid rgba(220,38,38,0.4)"
                : "1px solid rgba(6,182,212,0.2)",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder={listening ? "Listening to you..." : "Ask Aanya anything about fashion..."}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none disabled:opacity-40 min-w-0"
            />

            {voiceSupported && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={toggleListen}
                disabled={loading}
                className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-40"
                style={listening
                  ? { background: "linear-gradient(135deg, #DC2626, #991B1B)", boxShadow: "0 0 12px rgba(220,38,38,0.5)" }
                  : { background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }
                }
              >
                {listening ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-purple-300" />}
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => sendMessage()}
              disabled={!inputText.trim() || loading}
              className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center disabled:opacity-30 transition-all"
              style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
            >
              {loading
                ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                : <Send className="w-3.5 h-3.5 text-white" />
              }
            </motion.button>
          </div>
          <p className="text-center text-[10px] text-white/15 mt-2">
            Powered by Groq · Aanya knows Indian fashion, trends & budgets
          </p>
        </div>
      </div>

      {/* ══════════════════════ RIGHT: PREVIEW (40%) ══════════════════════ */}
      <div
        className="flex flex-col"
        style={{ flex: "0 0 40%", background: "#0a0a11" }}
      >
        {/* Panel Header */}
        <div
          className="px-4 py-3.5 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-sm font-bold text-white/70">Virtual Try-On</span>
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <Camera className="w-3.5 h-3.5" />
            Upload photo to try on
          </div>
        </div>

        {/* Photo Upload Zone */}
        <div className="px-4 pt-4 flex-shrink-0">
          <div
            className="relative rounded-xl overflow-hidden cursor-pointer group"
            style={{
              height: uploadedPhoto ? 160 : 110,
              border: "2px dashed rgba(255,255,255,0.1)",
              transition: "all 0.3s",
              background: "rgba(255,255,255,0.02)",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadedPhoto ? (
              <>
                <img
                  src={uploadedPhoto}
                  alt="Your photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4" /> Change Photo
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedPhoto(null); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-white/30">
                <Upload className="w-7 h-7" />
                <div className="text-center">
                  <p className="text-xs font-medium">Upload your photo</p>
                  <p className="text-[10px] text-white/20">for virtual try-on</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 my-3 border-t border-white/5" />

        {/* Outfit Preview */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {previewOutfit ? (
            <motion.div
              key={previewOutfit.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Label */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Currently Previewing</span>
                {tryOnLoading && (
                  <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Applying...
                  </span>
                )}
              </div>

              {/* Outfit Image — large */}
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4", background: "#0d0d14" }}>
                <img
                  src={previewOutfit.image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"}
                  alt={previewOutfit.name}
                  className="w-full h-full object-cover"
                />
                {tryOnLoading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p className="text-xs text-white/70">Applying outfit...</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-0.5">{previewOutfit.occasion}</p>
                  <p className="font-black text-white text-sm leading-tight">{previewOutfit.name}</p>
                </div>
              </div>

              {/* Price + Items */}
              <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/50">Total</span>
                  <span className="font-black text-white text-base">{formatINR(previewOutfit.total_price)}</span>
                </div>
                {previewOutfit.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[11px] text-white/40">{item.name}</span>
                    <span className="text-[11px] text-white/60 font-medium">{formatINR(item.price)}</span>
                  </div>
                ))}
              </div>

              {/* Color Palette */}
              {previewOutfit.color_palette && previewOutfit.color_palette.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30">Palette:</span>
                  <div className="flex gap-1.5">
                    {previewOutfit.color_palette.slice(0, 5).map((color, ci) => (
                      <div
                        key={ci}
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Styling Tip */}
              {previewOutfit.styling_tip && (
                <p className="text-[11px] text-white/40 italic leading-relaxed">
                  💡 {previewOutfit.styling_tip}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="space-y-2">
                <a
                  href={`https://amazon.in/s?k=${encodeURIComponent(previewOutfit.name + " " + (previewOutfit.items[0]?.name || "outfit"))}&tag=fyndmate-21`}
                  target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: "#ff9900", color: "#000" }}
                >
                  <ShoppingBag className="w-4 h-4" /> Buy on Amazon
                </a>
                <a
                  href={`https://flipkart.com/search?q=${encodeURIComponent(previewOutfit.name)}`}
                  target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: "#047BD5", color: "#fff" }}
                >
                  <ExternalLink className="w-4 h-4" /> Buy on Flipkart
                </a>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <Sparkles className="w-8 h-8 text-purple-500/50" />
              </div>
              <div>
                <p className="text-white/30 text-sm font-medium mb-1">No outfit selected yet</p>
                <p className="text-white/20 text-xs leading-relaxed max-w-[180px] mx-auto">
                  Ask Aanya for outfit suggestions, then click "Try This" on any card
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
