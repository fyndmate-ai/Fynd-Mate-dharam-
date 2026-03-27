import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Send, Sparkles, Loader2, Upload, Camera, ShoppingBag,
  ExternalLink, RefreshCw, X, Wand2, CheckCircle2, Heart, Share2, Plus,
  Minus, ShoppingCart, Flame,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const LS_SAVED = "fm_saved_looks";

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

interface MixItem { name: string; price: number; from: string }

type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "ai"; text: string; outfits?: Outfit[] };

type TryOnState = "idle" | "loading" | "done" | "error";
type RightTab = "preview" | "saved" | "mix";

const SUGGESTIONS = ["Casual under ₹1000", "Wedding look", "Office wear", "Festival outfit", "Gym wear", "College style"];
const FESTIVALS = [
  { label: "🪔 Diwali", msg: "Show me Diwali festival outfit with traditional Indian look" },
  { label: "🌙 Eid", msg: "Eid outfit under ₹3000 for women" },
  { label: "🎨 Holi", msg: "Holi outfit that is colorful and easy to wash" },
  { label: "💃 Navratri", msg: "Navratri garba outfit with chaniya choli" },
  { label: "❄️ Summer", msg: "Light summer outfit for hot Indian weather under ₹1500" },
];
const WELCOME_BULLETS = [
  "Show me casual outfits under ₹1000",
  "I want a wedding look for slim body type",
  "Office wear for women under ₹2000",
  "Festival outfit with gold and red colors",
];

let msgCounter = 0;
const addId = () => ++msgCounter;

function loadSavedLooks(): Outfit[] {
  try { return JSON.parse(localStorage.getItem(LS_SAVED) || "[]"); } catch { return []; }
}
function persistSavedLooks(looks: Outfit[]) {
  localStorage.setItem(LS_SAVED, JSON.stringify(looks));
}

function buildSplitPreview(personDataUrl: string, outfitDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const W = 560, H = 340;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0d0d14";
    ctx.fillRect(0, 0, W, H);
    const half = W / 2;

    const drawPerson = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.max(half / img.width, H / img.height);
        const sw = img.width * scale, sh = img.height * scale;
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, half, H); ctx.clip();
        ctx.drawImage(img, (half - sw) / 2, (H - sh) / 2, sw, sh);
        ctx.restore(); drawOutfit();
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
        ctx.save(); ctx.beginPath(); ctx.rect(half, 0, half, H); ctx.clip();
        ctx.drawImage(img, half + (half - sw) / 2, (H - sh) / 2, sw, sh);
        ctx.restore(); finish();
      };
      img.onerror = finish;
      img.src = outfitDataUrl;
    };

    const finish = () => {
      ctx.strokeStyle = "#06B6D4"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(half, 0); ctx.lineTo(half, H); ctx.stroke();
      const pill = (label: string, x: number) => {
        const pw = 70, ph = 22, px = x - pw / 2, py = H - ph - 10;
        ctx.fillStyle = "rgba(0,0,0,0.72)"; ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 11); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(label, x, py + ph / 2);
      };
      pill("You", half / 2); pill("Outfit", half + half / 2);
      ctx.fillStyle = "#06B6D4"; ctx.beginPath(); ctx.arc(half, H / 2, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("↔", half, H / 2);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    drawPerson();
  });
}

function buildAvatar(photoDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const S = 200;
    const canvas = document.createElement("canvas");
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      // Circular clip
      ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); ctx.clip();
      const scale = Math.max(S / img.width, S / img.height);
      const sw = img.width * scale, sh = img.height * scale;
      ctx.drawImage(img, (S - sw) / 2, (S - sh) / 2, sw, sh);
      // Gradient ring
      const grad = ctx.createLinearGradient(0, 0, S, S);
      grad.addColorStop(0, "#7C3AED"); grad.addColorStop(1, "#06B6D4");
      ctx.strokeStyle = grad; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2); ctx.stroke();
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => resolve(photoDataUrl);
    img.src = photoDataUrl;
  });
}

async function shareLook(outfit: Outfit | null, tryOnResult: string | null) {
  const text = outfit
    ? `Check out this outfit I found on FyndMate! "${outfit.name}" — ${formatINR(outfit.total_price)} 🛍️ AI-powered fashion at fyndmate.app`
    : "Check out my virtual try-on on FyndMate! 🛍️";

  if (navigator.share) {
    try { await navigator.share({ title: "My FyndMate Look", text, url: "https://fyndmate.app" }); return; }
    catch { /* fall through */ }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

export function AanyaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewOutfit, setPreviewOutfit] = useState<Outfit | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [tryOnState, setTryOnState] = useState<TryOnState>("idle");
  const [tryOnLabel, setTryOnLabel] = useState<"ai" | "preview">("preview");
  const [shareStatus, setShareStatus] = useState<"idle" | "sharing" | "copied">("idle");

  const [savedLooks, setSavedLooks] = useState<Outfit[]>(loadSavedLooks);
  const [rightTab, setRightTab] = useState<RightTab>("preview");
  const [mixItems, setMixItems] = useState<MixItem[]>([]);

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Voice ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setVoiceSupported(true);
    const rec = new SR();
    rec.lang = "en-IN"; rec.continuous = false; rec.interimResults = true;
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

  useEffect(() => {
    setMessages([{ id: addId(), role: "ai", text: "__welcome__" }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const pushAI = (text: string, outfits?: Outfit[]) =>
    setMessages(prev => [...prev, { id: addId(), role: "ai", text, outfits }]);

  /* ── Send ── */
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg || loading) return;
    setInputText("");
    setMessages(prev => [...prev, { id: addId(), role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/designer/chat-style`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, user_profile: {} }),
      });
      const data = await res.json();
      const outfits: Outfit[] = data.outfits || [];
      pushAI(data.aanya_response || "Here are some outfits! ✨", outfits.length ? outfits : undefined);
      if (outfits.length && !previewOutfit) { setPreviewOutfit(outfits[0]); setTryOnResult(null); setTryOnState("idle"); }
    } catch {
      pushAI("I'd love to help! Try asking about casual outfits, wedding looks, or office wear! ✨");
    } finally { setLoading(false); }
  }, [inputText, loading, previewOutfit]);

  /* ── Try This ── */
  const handleTryThis = async (outfit: Outfit) => {
    setPreviewOutfit(outfit); setTryOnResult(null); setTryOnState("idle");
    setRightTab("preview");
    if (!uploadedPhoto) {
      pushAI("Upload your photo on the right to see this outfit on you! 📸 Just tap the upload area.");
      return;
    }
    setTryOnState("loading");
    try {
      const b64 = uploadedPhoto.startsWith("data:") ? uploadedPhoto.split(",")[1] : uploadedPhoto;
      const res = await fetch(`${BASE}/api/designer/try-on`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_image_base64: b64, clothing_image_url: outfit.image_url || "" }),
      });
      const data = await res.json();
      if (data.success && data.result_image) {
        setTryOnResult(`data:image/jpeg;base64,${data.result_image}`);
        setTryOnLabel("ai"); setTryOnState("done"); return;
      }
      const outfitDataUrl = data.clothing_image_b64
        ? `data:${data.clothing_mime || "image/jpeg"};base64,${data.clothing_image_b64}`
        : (outfit.image_url || "");
      if (outfitDataUrl) {
        const composite = await buildSplitPreview(uploadedPhoto, outfitDataUrl);
        setTryOnResult(composite); setTryOnLabel("preview"); setTryOnState("done");
      } else { setTryOnState("error"); }
    } catch {
      try {
        const composite = await buildSplitPreview(uploadedPhoto, outfit.image_url || "");
        setTryOnResult(composite); setTryOnLabel("preview"); setTryOnState("done");
      } catch { setTryOnState("error"); }
    }
  };

  /* ── Save Look ── */
  const isLookSaved = (outfit: Outfit) => savedLooks.some(s => s.name === outfit.name);
  const toggleSaveLook = (outfit: Outfit) => {
    setSavedLooks(prev => {
      const next = isLookSaved(outfit) ? prev.filter(s => s.name !== outfit.name) : [...prev, outfit];
      persistSavedLooks(next); return next;
    });
  };

  /* ── Mix & Match ── */
  const isInMix = (itemName: string) => mixItems.some(m => m.name === itemName);
  const toggleMixItem = (item: { name: string; price: number }, outfitName: string) => {
    setMixItems(prev => isInMix(item.name)
      ? prev.filter(m => m.name !== item.name)
      : [...prev, { ...item, from: outfitName }]
    );
  };
  const mixTotal = mixItems.reduce((sum, m) => sum + m.price, 0);

  /* ── Share ── */
  const handleShare = async () => {
    setShareStatus("sharing");
    const result = await shareLook(previewOutfit, tryOnResult);
    setShareStatus(result === "copied" ? "copied" : "idle");
    setTimeout(() => setShareStatus("idle"), 2500);
  };

  /* ── Photo Upload ── */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev.target?.result as string;
      setUploadedPhoto(url);
      setTryOnResult(null); setTryOnState("idle");
      const av = await buildAvatar(url);
      setAvatarUrl(av);
    };
    reader.readAsDataURL(file);
  };

  const toggleListen = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
    else if (recognitionRef.current && !loading) {
      setInputText("");
      try { recognitionRef.current.start(); setListening(true); } catch { setListening(false); }
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ── Right Panel content ── */
  const renderRightContent = () => {
    /* Saved Looks tab */
    if (rightTab === "saved") {
      return (
        <div className="flex-1 overflow-y-auto space-y-3">
          {savedLooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <Heart className="w-10 h-10 text-white/15" />
              <p className="text-white/30 text-sm">No saved looks yet</p>
              <p className="text-white/20 text-xs">Tap ❤ on any outfit card to save</p>
            </div>
          ) : (
            savedLooks.map((outfit, i) => (
              <div key={i} className="rounded-xl overflow-hidden group cursor-pointer"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => { setPreviewOutfit(outfit); setRightTab("preview"); }}>
                <div className="relative h-28">
                  <img src={outfit.image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300"}
                    alt={outfit.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-cyan-400 font-bold uppercase">{outfit.occasion}</p>
                      <p className="text-xs font-bold text-white">{outfit.name}</p>
                    </div>
                    <span className="text-xs font-black text-white">{formatINR(outfit.total_price)}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleSaveLook(outfit); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                    <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    /* Mix & Match tab */
    if (rightTab === "mix") {
      return (
        <div className="flex-1 overflow-y-auto space-y-3">
          {mixItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <ShoppingCart className="w-10 h-10 text-white/15" />
              <p className="text-white/30 text-sm">No items mixed yet</p>
              <p className="text-white/20 text-xs">Click + on any outfit item in the chat</p>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Your Custom Look</p>
              {mixItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <p className="text-xs font-bold text-white/90">{item.name}</p>
                    <p className="text-[10px] text-white/40">from {item.from}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400">{formatINR(item.price)}</span>
                    <button onClick={() => setMixItems(prev => prev.filter((_, ii) => ii !== i))}
                      className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-colors">
                      <Minus className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="rounded-xl p-3" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-white/70">Mix Total</span>
                  <span className="text-base font-black text-purple-300">{formatINR(mixTotal)}</span>
                </div>
                <a href={`https://amazon.in/s?k=${encodeURIComponent(mixItems[0]?.name || "outfit")}`}
                  target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold"
                  style={{ background: "#ff9900", color: "#000" }}>
                  <ShoppingBag className="w-4 h-4" /> Buy on Amazon
                </a>
              </div>
              <button onClick={() => setMixItems([])}
                className="w-full text-xs text-white/30 hover:text-white/60 transition-colors py-1">
                Clear Mix
              </button>
            </>
          )}
        </div>
      );
    }

    /* Preview tab (default) */
    if (tryOnState === "loading") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            <motion.div className="absolute inset-0 rounded-full border-2 border-cyan-400"
              animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white/80 mb-1">Aanya is styling you...</p>
            <p className="text-xs text-white/40">Building your virtual preview</p>
          </div>
        </div>
      );
    }

    if (tryOnState === "done" && tryOnResult) {
      return (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              {tryOnLabel === "ai"
                ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">AI Try-On Result</span></>
                : <><Wand2 className="w-3.5 h-3.5 text-cyan-400" /><span className="text-white/40">Style Preview</span></>
              }
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleShare}
                className="flex items-center gap-1.5 text-[10px] font-bold text-purple-300 hover:text-purple-200 transition-colors px-2 py-1 rounded-lg border border-purple-500/30 bg-purple-500/10">
                <Share2 className="w-3 h-3" />
                {shareStatus === "copied" ? "Copied!" : shareStatus === "sharing" ? "..." : "Share"}
              </button>
              <button onClick={() => { setTryOnResult(null); setTryOnState("idle"); }}
                className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Reset</button>
            </div>
          </div>
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
                {previewOutfit.styling_tip && <p className="text-[11px] text-white/40 italic">💡 {previewOutfit.styling_tip}</p>}
              </div>
              <BuyButtons outfit={previewOutfit} />
            </>
          )}
        </div>
      );
    }

    if (previewOutfit) {
      return (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Outfit Preview</span>
            <button onClick={handleShare}
              className="flex items-center gap-1.5 text-[10px] font-bold text-purple-300 hover:text-purple-200 transition-colors px-2 py-1 rounded-lg border border-purple-500/30 bg-purple-500/10">
              <Share2 className="w-3 h-3" />
              {shareStatus === "copied" ? "Copied!" : "Share"}
            </button>
          </div>
          <div className="relative rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: "3/4", background: "#0d0d14" }}>
            <img src={previewOutfit.image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"}
              alt={previewOutfit.name} className="w-full h-full object-cover" />
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
              <div key={i} className="flex justify-between items-center">
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
          {previewOutfit.styling_tip && <p className="text-[11px] text-white/40 italic leading-relaxed">💡 {previewOutfit.styling_tip}</p>}
          {!uploadedPhoto && (
            <div className="rounded-xl p-3 flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-colors"
              style={{ border: "1px dashed rgba(6,182,212,0.3)" }}
              onClick={() => fileInputRef.current?.click()}>
              <Camera className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <p className="text-[11px] text-cyan-300/80">Upload your photo to try this on!</p>
            </div>
          )}
          <BuyButtons outfit={previewOutfit} />
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)" }}>
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
    <div className="flex overflow-hidden rounded-2xl border border-white/8" style={{ height: "calc(100vh - 80px)", background: "#0d0d14" }}>

      {/* ══════ LEFT: CHAT ══════ */}
      <div className="flex flex-col" style={{ flex: "0 0 60%", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Chat Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(6,182,212,0.09))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Your avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
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
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center self-end mb-0.5"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                  {msg.text === "__welcome__"
                    ? <WelcomeBubble onChip={sendMessage} />
                    : (
                      <div className="px-4 py-2.5 text-sm leading-relaxed"
                        style={msg.role === "user"
                          ? { background: "linear-gradient(135deg, #6D28D9, #7C3AED)", borderRadius: "1rem 1rem 0.25rem 1rem", color: "#fff" }
                          : { background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem 1rem 1rem 0.25rem", color: "rgba(255,255,255,0.9)" }
                        }>
                        {msg.text}
                      </div>
                    )}

                  {msg.role === "ai" && (msg as any).outfits?.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-1 max-w-full" style={{ scrollbarWidth: "thin" }}>
                      {((msg as any).outfits as Outfit[]).map((outfit: Outfit, i: number) => (
                        <OutfitCard key={i} outfit={outfit}
                          selected={previewOutfit?.name === outfit.name}
                          saved={isLookSaved(outfit)}
                          inMix={outfit.items.some(it => isInMix(it.name))}
                          onTryThis={() => handleTryThis(outfit)}
                          onSave={() => toggleSaveLook(outfit)}
                          onMixItem={(item) => { toggleMixItem(item, outfit.name); setRightTab("mix"); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-3 flex items-center gap-1.5" style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem 1rem 1rem 0.25rem" }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
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
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="px-5 py-2 flex items-center gap-2 flex-shrink-0"
              style={{ background: "#111118", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-xs text-red-400 font-medium">Listening...</span>
              <div className="flex items-end gap-0.5">
                {[...Array(14)].map((_, i) => (
                  <motion.div key={i} animate={{ height: [3, 12 + (i % 4) * 5, 3] }}
                    transition={{ duration: 0.3 + i * 0.03, repeat: Infinity, repeatType: "mirror" }}
                    className="w-0.5 rounded-full" style={{ background: "linear-gradient(to top, #7C3AED, #06B6D4)" }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="px-4 py-3 flex-shrink-0" style={{ background: "#0d0d14", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: listening ? "1px solid rgba(220,38,38,0.4)" : "1px solid rgba(6,182,212,0.2)" }}>
            <input ref={inputRef} type="text" value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKey} disabled={loading}
              placeholder={listening ? "Listening..." : "Ask Aanya anything about fashion..."}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none disabled:opacity-40 min-w-0" />
            {voiceSupported && (
              <motion.button whileTap={{ scale: 0.85 }} onClick={toggleListen} disabled={loading}
                className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-40"
                style={listening ? { background: "linear-gradient(135deg, #DC2626, #991B1B)", boxShadow: "0 0 12px rgba(220,38,38,0.5)" } : { background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                {listening ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-purple-300" />}
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => sendMessage()} disabled={!inputText.trim() || loading}
              className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center disabled:opacity-30 transition-all"
              style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
              {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
            </motion.button>
          </div>
          <p className="text-center text-[10px] text-white/15 mt-2">Powered by Groq · Aanya knows Indian fashion, trends & budgets</p>
        </div>
      </div>

      {/* ══════ RIGHT: PREVIEW ══════ */}
      <div className="flex flex-col" style={{ flex: "0 0 40%", background: "#0a0a11" }}>

        {/* Panel Header + Tabs */}
        <div className="flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold text-white/70">Style Studio</span>
            {uploadedPhoto && <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Photo ready</span>}
          </div>
          <div className="flex border-t border-white/5">
            {([
              { key: "preview", label: "Try-On", icon: <Wand2 className="w-3 h-3" /> },
              { key: "saved", label: `Saved${savedLooks.length > 0 ? ` (${savedLooks.length})` : ""}`, icon: <Heart className="w-3 h-3" /> },
              { key: "mix", label: `Mix${mixItems.length > 0 ? ` (${mixItems.length})` : ""}`, icon: <Flame className="w-3 h-3" /> },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setRightTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold transition-all ${rightTab === tab.key ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/30 hover:text-white/60"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Upload Zone */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="relative rounded-xl overflow-hidden cursor-pointer group transition-all"
            style={{ height: uploadedPhoto ? 110 : 84, border: uploadedPhoto ? "1.5px solid rgba(6,182,212,0.35)" : "2px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
            onClick={() => fileInputRef.current?.click()}>
            {uploadedPhoto ? (
              <>
                <img src={uploadedPhoto} alt="Your photo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Change</span>
                </div>
                <button onClick={e => { e.stopPropagation(); setUploadedPhoto(null); setAvatarUrl(null); setTryOnResult(null); setTryOnState("idle"); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ background: "rgba(6,182,212,0.2)", backdropFilter: "blur(4px)" }}>
                  <p className="text-[10px] text-cyan-300 text-center font-medium">Tap "Try This" to see outfit on you</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1.5 text-white/30">
                <Upload className="w-5 h-5" />
                <p className="text-xs font-medium">Upload photo · Create Style Avatar</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          {/* Avatar display when photo uploaded */}
          {avatarUrl && rightTab === "preview" && (
            <div className="flex items-center gap-2 mt-2">
              <img src={avatarUrl} alt="Style Avatar" className="w-8 h-8 rounded-full object-cover" />
              <span className="text-[10px] text-white/40">Your Style Avatar created ✨</span>
            </div>
          )}
        </div>

        <div className="mx-4 border-t border-white/5 flex-shrink-0" />

        {/* Main preview area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 flex flex-col">
          {renderRightContent()}
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
      <p className="text-white/55 text-xs mb-3">Any style, occasion, budget — just tell me and I'll find perfect outfits instantly!</p>
      <p className="text-white/35 text-[10px] mb-1.5 font-bold uppercase tracking-wider">Try saying:</p>
      <ul className="space-y-1 mb-3">
        {WELCOME_BULLETS.map((b, i) => (
          <li key={i} className="text-xs text-cyan-400/80 flex items-start gap-1.5">
            <span className="text-cyan-500 mt-0.5">•</span> {b}
          </li>
        ))}
      </ul>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => onChip(s)}
            className="text-[11px] px-2.5 py-1 rounded-full border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/15 transition-colors"
            style={{ background: "rgba(6,182,212,0.07)" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Festival chips */}
      <div className="border-t border-white/8 pt-3">
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mb-2">🎊 Festival & Seasonal Mode</p>
        <div className="flex flex-wrap gap-1.5">
          {FESTIVALS.map(f => (
            <button key={f.label} onClick={() => onChip(f.msg)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-purple-500/25 text-purple-300 hover:bg-purple-500/15 transition-colors"
              style={{ background: "rgba(124,58,237,0.07)" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OutfitCard({
  outfit, selected, saved, inMix, onTryThis, onSave, onMixItem,
}: {
  outfit: Outfit; selected: boolean; saved: boolean; inMix: boolean;
  onTryThis: () => void; onSave: () => void; onMixItem: (item: { name: string; price: number }) => void;
}) {
  const [showItems, setShowItems] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className="flex-shrink-0 w-36 rounded-xl overflow-hidden cursor-pointer group"
      style={{ background: "#0d0d14", border: selected ? "1.5px solid rgba(6,182,212,0.7)" : "1px solid rgba(255,255,255,0.08)", transition: "border-color 0.2s" }}>

      {/* Image */}
      <div className="relative h-28 overflow-hidden bg-black/40">
        <img src={outfit.image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300"}
          alt={outfit.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button onClick={(e) => { e.stopPropagation(); onSave(); }}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
          <Heart className={`w-3 h-3 ${saved ? "text-red-400 fill-red-400" : "text-white/60"}`} />
        </button>
        {selected && (
          <div className="absolute top-1.5 left-1.5 w-4.5 h-4.5 rounded-full bg-cyan-400 flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-[10px] font-bold text-white/90 leading-tight mb-0.5 line-clamp-1">{outfit.name}</p>
        <p className="text-[10px] text-cyan-400 font-bold mb-2">{formatINR(outfit.total_price)}</p>
        <div className="flex flex-col gap-1">
          <button onClick={onTryThis}
            className="w-full py-1 rounded-lg text-[10px] font-bold text-center transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #06B6D4, #0891B2)" }}>
            Try This
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowItems(!showItems); }}
            className="w-full py-1 rounded-lg text-[10px] font-bold text-center transition-all hover:opacity-90 flex items-center justify-center gap-1"
            style={{ background: inMix ? "rgba(124,58,237,0.4)" : "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}>
            <Plus className="w-2.5 h-2.5" /> Mix
          </button>
        </div>

        {/* Item list for mix & match */}
        <AnimatePresence>
          {showItems && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-1">
              {outfit.items.map((item, i) => (
                <button key={i} onClick={() => onMixItem(item)}
                  className={`w-full flex items-center justify-between px-1.5 py-1 rounded-lg text-[9px] transition-colors ${isInMixLocal(item.name, outfit) ? "bg-purple-500/30" : "bg-white/5 hover:bg-white/10"}`}>
                  <span className="text-white/70 truncate mr-1">{item.name}</span>
                  <span className="text-cyan-400 font-bold flex-shrink-0">{formatINR(item.price)}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Helper for OutfitCard to check if item is in mix (avoids needing global state in subcomponent)
function isInMixLocal(_name: string, _outfit: Outfit) { return false; }

function BuyButtons({ outfit }: { outfit: Outfit }) {
  return (
    <div className="space-y-2">
      <a href={`https://amazon.in/s?k=${encodeURIComponent(outfit.name + " " + (outfit.items[0]?.name || ""))}`}
        target="_blank" rel="noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
        style={{ background: "#ff9900", color: "#000" }}>
        <ShoppingBag className="w-4 h-4" /> Buy on Amazon
      </a>
      <a href={`https://flipkart.com/search?q=${encodeURIComponent(outfit.name)}`}
        target="_blank" rel="noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
        style={{ background: "#047BD5", color: "#fff" }}>
        <ExternalLink className="w-4 h-4" /> Buy on Flipkart
      </a>
      <a href={`https://myntra.com/search?q=${encodeURIComponent(outfit.name.replace(/\s+/g, "-").toLowerCase())}`}
        target="_blank" rel="noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold"
        style={{ background: "rgba(255,63,108,0.15)", border: "1px solid rgba(255,63,108,0.35)", color: "#ff3f6c" }}>
        <ExternalLink className="w-4 h-4" /> Buy on Myntra
      </a>
    </div>
  );
}
