import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Loader2, RefreshCw, Search, Sparkles, User } from "lucide-react";
import { formatINR } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const LS_PROFILE = "fm_user_profile_v3";
const LS_SAVED = "fm_saved_outfits_v3";

type StudioTab = "try-on" | "saved" | "mix";

interface UserProfile {
  gender: "Female" | "Male" | "Non-binary";
  bodyType: "Slim" | "Muscular" | "Heavy" | "Athletic" | "Curvy";
  heightCm: number;
  skinTone: "Fair" | "Light" | "Medium" | "Tan" | "Deep";
  preferredStyle: string;
}

interface OutfitItem {
  name: string;
  price: number;
}

interface Outfit {
  id: string;
  name: string;
  occasion: string;
  total_price: number;
  items: OutfitItem[];
  color_palette?: string[];
  styling_tip?: string;
  image_url: string;
  buyUrl: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  outfits?: Outfit[];
}

interface ChatStyleResponse {
  success: boolean;
  aanya_response?: string;
  outfits?: Array<{
    name: string;
    occasion: string;
    total_price: number;
    items: OutfitItem[];
    color_palette?: string[];
    styling_tip?: string;
    image_url?: string;
  }>;
}

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function saveProfile(profile: UserProfile) {
  localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
}

function loadSavedOutfits(): Outfit[] {
  try {
    const raw = localStorage.getItem(LS_SAVED);
    return raw ? (JSON.parse(raw) as Outfit[]) : [];
  } catch {
    return [];
  }
}

function saveSavedOutfits(outfits: Outfit[]) {
  localStorage.setItem(LS_SAVED, JSON.stringify(outfits));
}

function normalizeOutfit(raw: NonNullable<ChatStyleResponse["outfits"]>[number], idx: number): Outfit {
  const image = raw.image_url || `https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&sig=${idx}`;
  return {
    id: `${raw.name}-${idx}`.replace(/\s+/g, "-").toLowerCase(),
    name: raw.name,
    occasion: raw.occasion,
    total_price: raw.total_price,
    items: raw.items,
    color_palette: raw.color_palette,
    styling_tip: raw.styling_tip,
    image_url: image,
    buyUrl: `https://amazon.in/s?k=${encodeURIComponent(raw.name)}&tag=fyndmate-21`,
  };
}

function UserProfileModal({
  open,
  onSave,
}: {
  open: boolean;
  onSave: (profile: UserProfile) => void;
}) {
  const [gender, setGender] = useState<UserProfile["gender"]>("Female");
  const [bodyType, setBodyType] = useState<UserProfile["bodyType"]>("Athletic");
  const [heightCm, setHeightCm] = useState(170);
  const [skinTone, setSkinTone] = useState<UserProfile["skinTone"]>("Medium");
  const [preferredStyle, setPreferredStyle] = useState("Casual");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-[18px] border border-[#D2D2D7] bg-white p-6">
        <h2 className="text-[28px] font-semibold text-[#1D1D1F]">Create your personal avatar profile</h2>
        <p className="text-[14px] text-[#6E6E73] mt-1">One-time setup for accurate virtual try-on.</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <Field label="Gender">
            <select value={gender} onChange={(e) => setGender(e.target.value as UserProfile["gender"])} className={fieldClass}>
              <option>Female</option>
              <option>Male</option>
              <option>Non-binary</option>
            </select>
          </Field>
          <Field label="Body type">
            <select value={bodyType} onChange={(e) => setBodyType(e.target.value as UserProfile["bodyType"])} className={fieldClass}>
              <option>Slim</option>
              <option>Muscular</option>
              <option>Heavy</option>
              <option>Athletic</option>
              <option>Curvy</option>
            </select>
          </Field>
          <Field label="Height (cm)">
            <input type="number" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value || 170))} className={fieldClass} />
          </Field>
          <Field label="Skin tone">
            <select value={skinTone} onChange={(e) => setSkinTone(e.target.value as UserProfile["skinTone"])} className={fieldClass}>
              <option>Fair</option>
              <option>Light</option>
              <option>Medium</option>
              <option>Tan</option>
              <option>Deep</option>
            </select>
          </Field>
        </div>
        <Field label="Preferred style" className="mt-4">
          <input value={preferredStyle} onChange={(e) => setPreferredStyle(e.target.value)} className={fieldClass} />
        </Field>
        <button
          onClick={() => onSave({ gender, bodyType, heightCm, skinTone, preferredStyle })}
          className="mt-5 rounded-full bg-[#0071E3] text-white text-[17px] px-6 py-2.5"
        >
          Save profile
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[14px] text-[#6E6E73]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const fieldClass = "w-full rounded-xl border border-[#D2D2D7] bg-white px-3 py-2.5 text-[14px] text-[#1D1D1F]";

function OutfitCard({
  outfit,
  onTryOn,
  onSave,
  saved,
}: {
  outfit: Outfit;
  onTryOn: () => void;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <div className="min-w-[230px] rounded-[18px] border border-[#D2D2D7] bg-[#F5F5F7] overflow-hidden">
      <img src={outfit.image_url} alt={outfit.name} className="h-36 w-full object-cover" loading="lazy" />
      <div className="p-4">
        <h4 className="text-[21px] font-semibold leading-tight">{outfit.name}</h4>
        <p className="text-[14px] text-[#6E6E73] mt-1">{outfit.occasion}</p>
        <p className="text-[17px] mt-2">{formatINR(outfit.total_price)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={onTryOn} className="rounded-full px-3 py-1.5 text-[14px] bg-[#0071E3] text-white">Try On</button>
          <a href={outfit.buyUrl} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1.5 text-[14px] bg-white border border-[#D2D2D7] text-center inline-flex justify-center items-center gap-1">
            Buy <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <button onClick={onSave} className="text-[14px] text-[#0071E3] mt-2">{saved ? "Saved" : "Save outfit"}</button>
      </div>
    </div>
  );
}

export function AanyaChat() {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile());
  const [showProfile, setShowProfile] = useState(() => !loadProfile());
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "hello", role: "ai", text: "Hi, I’m Aanya. Ask me: Show me baggy jeans under ₹2000." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<StudioTab>("try-on");
  const [activeOutfit, setActiveOutfit] = useState<Outfit | null>(null);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>(() => loadSavedOutfits());
  const [mixOutfits, setMixOutfits] = useState<Outfit[]>([]);
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);

  const mixTotal = useMemo(() => mixOutfits.reduce((sum, item) => sum + item.total_price, 0), [mixOutfits]);

  const send = async (forced?: string) => {
    const text = (forced ?? input).trim();
    if (!text || loading || !profile) return;
    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/designer/chat-style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          user_profile: {
            body_type: profile.bodyType.toLowerCase(),
            budget_hint: 2500,
            occasion_hint: "casual",
          },
        }),
      });
      const data = (await res.json()) as ChatStyleResponse;
      const outfits = (data.outfits || []).map(normalizeOutfit);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", text: data.aanya_response || "Here are the best picks for you.", outfits },
      ]);
      if (outfits.length > 0) setActiveOutfit(outfits[0]);
    } finally {
      setLoading(false);
    }
  };

  const tryOn = async (outfit: Outfit) => {
    setActiveOutfit(outfit);
    setTab("try-on");
    if (!avatarPhoto) return;
    try {
      const b64 = avatarPhoto.split(",")[1] || avatarPhoto;
      const res = await fetch(`${BASE}/api/designer/try-on`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_image_base64: b64, clothing_image_url: outfit.image_url }),
      });
      const data = (await res.json()) as { success: boolean; result_image?: string; clothing_image_b64?: string; clothing_mime?: string };
      if (data.success && data.result_image) {
        setTryOnImage(`data:image/jpeg;base64,${data.result_image}`);
      } else if (data.clothing_image_b64) {
        setTryOnImage(`data:${data.clothing_mime || "image/jpeg"};base64,${data.clothing_image_b64}`);
      } else {
        setTryOnImage(outfit.image_url);
      }
    } catch {
      setTryOnImage(outfit.image_url);
    }
  };

  const saveOutfit = (outfit: Outfit) => {
    setSavedOutfits((prev) => {
      const exists = prev.some((item) => item.id === outfit.id);
      const next = exists ? prev.filter((item) => item.id !== outfit.id) : [...prev, outfit];
      saveSavedOutfits(next);
      return next;
    });
  };

  if (!profile) {
    return (
      <>
        <UserProfileModal open onSave={(p) => { saveProfile(p); setProfile(p); setShowProfile(false); }} />
        <div className="h-[65vh] rounded-[18px] border border-[#D2D2D7] bg-white flex items-center justify-center text-[#6E6E73]">Preparing studio...</div>
      </>
    );
  }

  return (
    <>
      <UserProfileModal open={showProfile} onSave={(p) => { saveProfile(p); setProfile(p); setShowProfile(false); }} />
      <div className="grid lg:grid-cols-2 gap-4 h-full">
        <div className="rounded-[18px] border border-[#D2D2D7] bg-white flex flex-col h-[65vh] lg:h-full">
          <div className="px-4 py-3 border-b border-[#D2D2D7] flex items-center justify-between">
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /><span className="font-semibold">Aanya Chat</span></div>
            <button onClick={() => setShowProfile(true)} className="text-[14px] text-[#0071E3] inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> Edit profile</button>
          </div>

          <div className="px-4 py-3 border-b border-[#D2D2D7] flex flex-wrap gap-2">
            {["Baggy jeans under ₹2000", "Office look under ₹3000", "Wedding guest outfit", "Streetwear outfit"].map((prompt) => (
              <button key={prompt} onClick={() => send(prompt)} className="text-[14px] px-3 py-1 rounded-full border border-[#D2D2D7] bg-[#F5F5F7] hover:bg-white">
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`text-[14px] p-3 rounded-2xl w-fit max-w-[85%] ${msg.role === "user" ? "ml-auto bg-[#0071E3] text-white" : "bg-[#F5F5F7] text-[#1D1D1F]"}`}>
                  {msg.text}
                </div>
                {msg.outfits && (
                  <div className="flex gap-3 overflow-x-auto mt-3 pb-1">
                    {msg.outfits.map((outfit) => (
                      <OutfitCard
                        key={outfit.id}
                        outfit={outfit}
                        onTryOn={() => tryOn(outfit)}
                        onSave={() => saveOutfit(outfit)}
                        saved={savedOutfits.some((item) => item.id === outfit.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 text-[14px] text-[#6E6E73] bg-[#F5F5F7] rounded-full px-3 py-1.5">
                <Loader2 className="w-4 h-4 animate-spin" /> Aanya is styling...
              </div>
            )}
          </div>

          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              send();
            }}
            className="p-3 border-t border-[#D2D2D7]"
          >
            <div className="flex items-center gap-2 rounded-full border border-[#D2D2D7] px-3 py-2">
              <Search className="w-4 h-4 text-[#6E6E73]" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Show me baggy jeans under ₹2000"
                className="flex-1 bg-transparent outline-none text-[14px]"
              />
            </div>
          </form>
        </div>

        <div className="rounded-[18px] border border-[#D2D2D7] bg-white h-[65vh] lg:h-full flex flex-col">
          <div className="p-3 border-b border-[#D2D2D7] flex items-center justify-between">
            <div className="text-[14px] font-semibold">Style Studio</div>
            <button onClick={() => setTryOnImage(null)} className="text-[14px] text-[#0071E3] inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div className="grid grid-cols-3 border-b border-[#D2D2D7] text-[14px]">
            <button onClick={() => setTab("try-on")} className={`py-2 ${tab === "try-on" ? "text-[#0071E3] border-b-2 border-[#0071E3]" : "text-[#6E6E73]"}`}>Try-On</button>
            <button onClick={() => setTab("saved")} className={`py-2 ${tab === "saved" ? "text-[#0071E3] border-b-2 border-[#0071E3]" : "text-[#6E6E73]"}`}>Saved</button>
            <button onClick={() => setTab("mix")} className={`py-2 ${tab === "mix" ? "text-[#0071E3] border-b-2 border-[#0071E3]" : "text-[#6E6E73]"}`}>Mix</button>
          </div>

          <div className="p-4 border-b border-[#D2D2D7]">
            <label className="text-[14px] text-[#6E6E73] block mb-2">Upload your photo for try-on</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setAvatarPhoto(reader.result as string);
                reader.readAsDataURL(file);
              }}
              className="text-[14px]"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {tab === "try-on" && (
              <div className="space-y-3">
                <div className="rounded-[18px] bg-[#F5F5F7] border border-[#D2D2D7] p-4">
                  <div className="relative w-full h-[320px] flex items-center justify-center overflow-hidden rounded-xl">
                    {avatarPhoto ? (
                      <img src={avatarPhoto} alt="Avatar photo" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    ) : (
                      <div className="text-[14px] text-[#6E6E73]">Upload photo to generate personal avatar preview</div>
                    )}
                    {tryOnImage ? (
                      <motion.img
                        key={tryOnImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={tryOnImage}
                        alt="Try-on result"
                        className="absolute inset-6 w-[calc(100%-3rem)] h-[calc(100%-3rem)] object-contain rounded-xl border border-[#D2D2D7]"
                      />
                    ) : (
                      activeOutfit && <img src={activeOutfit.image_url} alt={activeOutfit.name} className="absolute inset-6 w-[calc(100%-3rem)] h-[calc(100%-3rem)] object-contain" />
                    )}
                  </div>
                </div>

                {activeOutfit ? (
                  <div className="rounded-xl bg-[#F5F5F7] border border-[#D2D2D7] p-3">
                    <p className="text-[14px] text-[#6E6E73]">Current look</p>
                    <p className="text-[21px] font-semibold leading-tight">{activeOutfit.name}</p>
                    <p className="text-[17px]">{formatINR(activeOutfit.total_price)}</p>
                    <button
                      onClick={() => setMixOutfits((prev) => prev.some((o) => o.id === activeOutfit.id) ? prev : [...prev, activeOutfit])}
                      className="mt-2 text-[14px] text-[#0071E3]"
                    >
                      Add to Mix
                    </button>
                  </div>
                ) : (
                  <p className="text-[14px] text-[#6E6E73]">Select an outfit from chat to start try-on.</p>
                )}
              </div>
            )}

            {tab === "saved" && (
              <div className="space-y-2">
                {savedOutfits.length === 0 ? (
                  <p className="text-[14px] text-[#6E6E73]">No saved outfits yet.</p>
                ) : (
                  savedOutfits.map((item) => (
                    <button key={item.id} onClick={() => tryOn(item)} className="w-full text-left rounded-xl border border-[#D2D2D7] bg-[#F5F5F7] p-3">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-[14px] text-[#6E6E73]">{formatINR(item.total_price)}</p>
                    </button>
                  ))
                )}
              </div>
            )}

            {tab === "mix" && (
              <div className="space-y-2">
                {mixOutfits.length === 0 ? (
                  <p className="text-[14px] text-[#6E6E73]">No mixed outfits yet.</p>
                ) : (
                  <>
                    {mixOutfits.map((item) => (
                      <div key={item.id} className="rounded-xl border border-[#D2D2D7] bg-[#F5F5F7] p-3">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-[14px] text-[#6E6E73]">{formatINR(item.total_price)}</p>
                      </div>
                    ))}
                    <div className="rounded-xl border border-[#D2D2D7] bg-white p-3">
                      <p className="text-[14px] text-[#6E6E73]">Mix total</p>
                      <p className="text-[21px] font-semibold">{formatINR(mixTotal)}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!input && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-[14px] text-[#6E6E73] mt-3"
          >
            Ask: “Show me office outfit under ₹2500” · “Diwali look under ₹1500”
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}
