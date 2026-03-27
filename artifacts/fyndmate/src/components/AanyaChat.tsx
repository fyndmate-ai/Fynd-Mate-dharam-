import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Send, Sparkles, Loader2, Upload, Camera, ShoppingBag,
  ExternalLink, RefreshCw, X, Wand2, CheckCircle2,
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

type TryOnState = "idle" | "loading" | "done" | "error";

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
const addId = () => ++msgCounter;

/** Client-side canvas: draws person photo (left) + outfit (right) side by side */
function buildSplitPreview(
  personDataUrl: string,
  outfitDataUrl: string
): Promise<string> {
  return new Promise((resolve) => {
    const W = 560, H = 340;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#0d0d14";
    ctx.fillRect(0, 0, W, H);

    const half = W / 2;

    const drawPerson = () => {
      const img = new Image();
      img.onload = () => {
        // cover left half
        const scale = Math.max(half / img.width, H / img.height);
        const sw = img.width * scale, sh = img.height * scale;
        const sx = (half - sw) / 2, sy = (H - sh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, half, H);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh);
        ctx.restore();
        drawOutfit();
      };
      img.onerror = drawOutfit;
      img.src = personDataUrl;
    };

    const drawOutfit = () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.max(half / img.width, H / img.height);
        const sw = img.width * scale, sh = img.height * scale;
        const sx = half + (half - sw) / 2, sy = (H - sh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(half, 0, half, H);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh);
        ctx.restore();
        finish();
      };
      img.onerror = finish;
      img.src = outfitDataUrl;
    };

    const finish = () => {
      // Divider line (cyan)
      ctx.strokeStyle = "#06B6D4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(half, 0);
      ctx.lineTo(half, H);
      ctx.stroke();

      // Label pills
      const pill = (label: string, x: number) => {
        const pw = 70, ph = 24, px = x - pw / 2, py = H - ph - 10;
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 12);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x, py + ph / 2);
      };
      pill("You", half / 2);
      pill("Outfit", half + half / 2);

      // Swap icon in center
      ctx.fillStyle = "#06B6D4";
      ctx.beginPath();
      ctx.arc(half, H / 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔", half, H / 2);

      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };

    drawPerson();
  });
}

export function AanyaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Right panel state
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [previewOutfit, setPreviewOutfit] = useState<Outfit | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null); // data URL
  const [tryOnState, setTryOnState] = useState<TryOnState>("idle");
  const [tryOnLabel, setTryOnLabel] = useState<"ai" | "preview">("preview");

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
      if (final) { setListening(false); setTimeout(() => sendMessage(final.trim()), 400); }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  /* ── Initial greeting ── */
  useEffect(() => {
    setMessages([{ id: addId(), role: "ai", text: "__welcome__" }]);
  }, []);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const pushAI = (text: string, outfits?: Outfit[]) =>
    setMessages(prev => [...prev, { id: addId(), role: "ai", text, outfits }]);

  /* ── Send message ── */
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg || loading) return;
    setInputText("");
    setMessages(prev => [...prev, { id: addId(), role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/designer/chat-style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, user_profile: {} }),
      });
      const data = await res.json();
      const outfits: Outfit[] = data.outfits || [];
      pushAI(data.aanya_response || "Here are some outfits I found! ✨", outfits.length ? outfits : undefined);
      if (outfits.length && !previewOutfit) {
        setPreviewOutfit(outfits[0]);
        setTryOnResult(null);
        setTryOnState("idle");
      }
    } catch {
      pushAI("I'd love to help! Try asking about casual outfits, wedding looks, or office wear! ✨");
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, previewOutfit]);

  /* ── Try This (the key feature) ── */
  const handleTryThis = async (outfit: Outfit) => {
    setPreviewOutfit(outfit);
    setTryOnResult(null);
    setTryOnState("idle");

    if (!uploadedPhoto) {
      // Friendly nudge from Aanya
      pushAI("Upload your photo on the right panel to see this outfit on you! 📸 Just tap the upload area.");
      return;
    }

    setTryOnState("loading");

    try {
      const b64 = uploadedPhoto.startsWith("data:")
        ? uploadedPhoto.split(",")[1]
        : uploadedPhoto;

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
        // Real AI try-on result from HuggingFace
        setTryOnResult(`data:image/jpeg;base64,${data.result_image}`);
        setTryOnLabel("ai");
        setTryOnState("done");
        return;
      }

      // Fallback: build client-side split-view preview using the clothing image
      const outfitDataUrl = data.clothing_image_b64
        ? `data:${data.clothing_image_mime || "image/jpeg"};base64,${data.clothing_image_b64}`
        : (outfit.image_url || "");

      if (outfitDataUrl) {
        const composite = await buildSplitPreview(uploadedPhoto, outfitDataUrl);
        setTryOnResult(composite);
        setTryOnLabel("preview");
        setTryOnState("done");
      } else {
        setTryOnState("error");
      }
    } catch {
      // Even if everything fails, build split-view with the raw URL (might have CORS)
      try {
        const composite = await buildSplitPreview(uploadedPhoto, outfit.image_url || "");
        setTryOnResult(composite);
        setTryOnLabel("preview");
        setTryOnState("done");
      } catch {
        setTryOnState("error");
      }
    }
  };

  /* ── Photo upload ── */
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedPhoto(ev.target?.result as string);
      setTryOnResult(null);
      setTryOnState("idle");
    };
    reader.readAsDataURL(file);
  };

  /* ── Voice ── */
  const toggleListen = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
    else if (recognitionRef.current && !loading) {
      window.speechSynthesis?.cancel();
      setInputText("");
      try { recognitionRef.current.start(); setListening(true); } catch { setListening(false); }
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ── Right Panel ── */
  const renderRightPanel = () => {
    /* Try-on loading */
    if (tryOnState === "loading") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-400"
              animate={{ scale: [1, 1.5, 1.5], opacity: [0.8, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white/80 mb-1">Aanya is styling you...</p>
            <p className="text-xs text-white/40">Compositing your look</p>
          </div>
        </div>
      );
    }

    /* Try-on result */
    if (tryOnState === "done" && tryOnResult) {
      return (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
              {tryOnLabel === "ai"
                ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">AI Try-On Result</span></>
                : <><Wand2 className="w-3.5 h-3.5 text-cyan-400" /><span>Style Preview</span></>
              }
            </div>
            <button
              onClick={() => { setTryOnResult(null); setTryOnState("idle"); }}
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Split-view or AI result image */}
          <div className="rounded-xl overflow-hidden border border-white/8">
            <img src={tryOnResult} alt="Try-on preview" className="w-full" />
          </div>

          {previewOutfit && (
            <>
              <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-white/80">{previewOutfit.name}</span>
                  <span className="text-xs font-black text-cyan-400">{formatINR(previewOutfit.total_price)}</span>
                </div>
                {previewOutfit.styling_tip && (
                  <p className="text-[11px] text-white/40 italic">💡 {previewOutfit.styling_tip}</p>
                )}
              </div>
              <BuyButtons outfit={previewOutfit} />
            </>
          )}
        </div>
      );
    }

    /* Outfit selected, no try-on yet */
    if (previewOutfit) {
      return (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Outfit Preview</span>

          <div
            className="relative rounded-xl overflow-hidden flex-shrink-0"
            style={{ aspectRatio: "3/4", background: "#0d0d14" }}
          >
            <img
              src={previewOutfit.image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"}
              alt={previewOutfit.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-0.5">{previewOutfit.occasion}</p>
              <p className="font-black text-white text-sm">{previewOutfit.name}</p>
            </div>
          </div>

          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Total</span>
              <span className="font-black text-white">{formatINR(previewOutfit.total_price)}</span>
            </div>
            {previewOutfit.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-[11px] text-white/40">{item.name}</span>
                <span className="text-[11px] text-white/60">{formatINR(item.price)}</span>
              </div>
            ))}
          </div>

          {previewOutfit.color_palette && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30">Palette</span>
              <div className="flex gap-1.5">
                {previewOutfit.color_palette.slice(0, 6).map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>
          )}

          {previewOutfit.styling_tip && (
            <p className="text-[11px] text-white/40 italic leading-relaxed">💡 {previewOutfit.styling_tip}</p>
          )}

          {!uploadedPhoto && (
            <div
              className="rounded-xl p-3 flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-colors"
              style={{ border: "1px dashed rgba(6,182,212,0.3)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <p className="text-[11px] text-cyan-300/80">Upload your photo above to see this outfit on you!</p>
            </div>
          )}

          <BuyButtons outfit={previewOutfit} />
        </div>
      );
    }

    /* Empty state */
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)" }}
        >
          <Sparkles className="w-8 h-8 text-purple-500/40" />
        </div>
        <div>
          <p className="text-white/30 text-sm font-medium mb-1">No outfit selected</p>
          <p className="text-white/20 text-xs leading-relaxed max-w-[180px] mx-auto">
            Ask Aanya for outfit suggestions, then tap "Try This" on any card
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex overflow-hidden rounded-2xl border border-white/8"
      style={{ height: "calc(100vh - 80px)", background: "#0d0d14" }}
    >

      {/* ══════ LEFT: CHAT (60%) ══════ */}
      <div className="flex flex-col" style={{ flex: "0 0 60%", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Chat Header */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(6,182,212,0.09))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "#111118" }}>
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center self-end mb-0.5" style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                  {/* Bubble */}
                  {msg.text === "__welcome__" ? (
                    <WelcomeBubble onChip={sendMessage} />
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

                  {/* Outfit Cards */}
                  {msg.role === "ai" && (msg as any).outfits?.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-1 max-w-full" style={{ scrollbarWidth: "thin" }}>
                      {((msg as any).outfits as Outfit[]).map((outfit: Outfit, i: number) => (
                        <OutfitCard
                          key={i}
                          outfit={outfit}
                          selected={previewOutfit?.name === outfit.name}
                          onTryThis={() => handleTryThis(outfit)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing dots */}
          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-3 flex items-center gap-1.5" style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem 1rem 1rem 0.25rem" }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                ))}
                <span className="text-[10px] text-white/30 ml-2">Aanya is finding outfits...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice waveform */}
        <AnimatePresence>
          {listening && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-5 py-2.5 flex items-center gap-2 flex-shrink-0" style={{ background: "#111118", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-xs text-red-400 font-medium">Listening...</span>
              <div className="flex items-end gap-0.5">
                {[...Array(14)].map((_, i) => (
                  <motion.div key={i} animate={{ height: [3, 12 + (i % 4) * 5, 3] }} transition={{ duration: 0.3 + i * 0.03, repeat: Infinity, repeatType: "mirror" }} className="w-0.5 rounded-full" style={{ background: "linear-gradient(to top, #7C3AED, #06B6D4)" }} />
                ))}
              </div>
              {inputText && <span className="text-xs text-white/40 italic ml-2 truncate max-w-[180px]">"{inputText}"</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <div className="px-4 py-3 flex-shrink-0" style={{ background: "#0d0d14", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: listening ? "1px solid rgba(220,38,38,0.4)" : "1px solid rgba(6,182,212,0.2)" }}
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
              <motion.button whileTap={{ scale: 0.85 }} onClick={toggleListen} disabled={loading}
                className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-40"
                style={listening ? { background: "linear-gradient(135deg, #DC2626, #991B1B)", boxShadow: "0 0 12px rgba(220,38,38,0.5)" } : { background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}
              >
                {listening ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-purple-300" />}
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => sendMessage()} disabled={!inputText.trim() || loading}
              className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center disabled:opacity-30 transition-all"
              style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
            </motion.button>
          </div>
          <p className="text-center text-[10px] text-white/15 mt-2">Powered by Groq · Aanya knows Indian fashion, trends & budgets</p>
        </div>
      </div>

      {/* ══════ RIGHT: PREVIEW (40%) ══════ */}
      <div className="flex flex-col" style={{ flex: "0 0 40%", background: "#0a0a11" }}>

        {/* Panel Header */}
        <div className="px-4 py-3.5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-sm font-bold text-white/70">Virtual Try-On</span>
          {uploadedPhoto && (
            <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Photo ready
            </span>
          )}
        </div>

        {/* Photo Upload Zone */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div
            className="relative rounded-xl overflow-hidden cursor-pointer group transition-all"
            style={{ height: uploadedPhoto ? 130 : 96, border: uploadedPhoto ? "1.5px solid rgba(6,182,212,0.35)" : "2px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadedPhoto ? (
              <>
                <img src={uploadedPhoto} alt="Your photo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Change Photo</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setUploadedPhoto(null); setTryOnResult(null); setTryOnState("idle"); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ background: "rgba(6,182,212,0.2)", backdropFilter: "blur(4px)" }}>
                  <p className="text-[10px] text-cyan-300 text-center font-medium">Click an outfit's "Try This" to see it on you</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-white/30">
                <Upload className="w-6 h-6" />
                <div className="text-center">
                  <p className="text-xs font-medium">Upload your photo</p>
                  <p className="text-[10px] text-white/20">for virtual try-on</p>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>

        <div className="mx-4 border-t border-white/5 flex-shrink-0" />

        {/* Main preview area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
          {renderRightPanel()}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function WelcomeBubble({ onChip }: { onChip: (s: string) => void }) {
  return (
    <div className="px-4 py-3.5 text-sm leading-relaxed" style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem 1rem 1rem 0.25rem" }}>
      <p className="text-white/90 mb-2">Hi! I'm Aanya, your personal AI fashion stylist! ✨</p>
      <p className="text-white/55 text-xs mb-3">Tell me what you're looking for — any style, occasion, or budget. I'll find perfect outfits instantly!</p>
      <p className="text-white/35 text-[10px] mb-1.5 font-bold uppercase tracking-wider">Try saying:</p>
      <ul className="space-y-1 mb-3">
        {WELCOME_BULLETS.map((b, i) => (
          <li key={i} className="text-xs text-cyan-400/80 flex items-start gap-1.5">
            <span className="text-cyan-500 mt-0.5">•</span> {b}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => onChip(s)} className="text-[11px] px-2.5 py-1 rounded-full border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/15 transition-colors" style={{ background: "rgba(6,182,212,0.07)" }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function OutfitCard({ outfit, selected, onTryThis }: { outfit: Outfit; selected: boolean; onTryThis: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-shrink-0 w-32 rounded-xl overflow-hidden cursor-pointer group"
      style={{ background: "#0d0d14", border: selected ? "1.5px solid rgba(6,182,212,0.7)" : "1px solid rgba(255,255,255,0.08)", transition: "border-color 0.2s" }}
    >
      <div className="relative h-28 overflow-hidden bg-black/40">
        <img
          src={outfit.image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300"}
          alt={outfit.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-[10px] font-bold text-white/90 leading-tight mb-0.5 line-clamp-1">{outfit.name}</p>
        <p className="text-[10px] text-cyan-400 font-bold mb-2">{formatINR(outfit.total_price)}</p>
        <div className="flex flex-col gap-1">
          <button onClick={onTryThis} className="w-full py-1 rounded-lg text-[10px] font-bold text-center transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #06B6D4, #0891B2)" }}>
            Try This
          </button>
          <a
            href={`https://amazon.in/s?k=${encodeURIComponent(outfit.name)}`}
            target="_blank" rel="noreferrer"
            className="w-full py-1 rounded-lg text-[10px] font-bold text-center transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
            onClick={e => e.stopPropagation()}
          >
            Buy Now
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function BuyButtons({ outfit }: { outfit: Outfit }) {
  return (
    <div className="space-y-2">
      <a
        href={`https://amazon.in/s?k=${encodeURIComponent(outfit.name + " " + (outfit.items[0]?.name || ""))}`}
        target="_blank" rel="noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
        style={{ background: "#ff9900", color: "#000" }}
      >
        <ShoppingBag className="w-4 h-4" /> Buy on Amazon
      </a>
      <a
        href={`https://flipkart.com/search?q=${encodeURIComponent(outfit.name)}`}
        target="_blank" rel="noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
        style={{ background: "#047BD5", color: "#fff" }}
      >
        <ExternalLink className="w-4 h-4" /> Buy on Flipkart
      </a>
    </div>
  );
}
