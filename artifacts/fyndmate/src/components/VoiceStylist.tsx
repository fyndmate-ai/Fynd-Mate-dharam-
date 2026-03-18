import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, Sparkles, MessageCircle, Loader2 } from "lucide-react";

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

export function VoiceStylist({ context }: VoiceStylistProps) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [pulse, setPulse] = useState(false);

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

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
      setTranscript(final || interim);
      if (final) {
        setListening(false);
        sendMessage(final.trim());
      }
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      addAIMessage("Hi! I'm Aanya, your AI fashion stylist! Ask me anything — what to wear, which colours suit you, best budget picks, or festival looks. Just tap the mic and speak!");
    }
  }, [open]);

  const addAIMessage = (text: string) => {
    setMessages(prev => [...prev, { role: "ai", text, id: ++msgIdRef.current }]);
  };

  const sendMessage = useCallback(async (text: string) => {
    setTranscript("");
    setMessages(prev => [...prev, { role: "user", text, id: ++msgIdRef.current }]);
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/api/designer/voice-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context }),
      });
      const data = await res.json();
      const reply = data.reply || "Great question! I'm thinking of the perfect style for you.";
      addAIMessage(reply);
      speakText(reply);
    } catch {
      const fallback = "Great question! Try a classic kurta with palazzo pants for a stunning Indian look on any budget.";
      addAIMessage(fallback);
      speakText(fallback);
    } finally {
      setLoading(false);
    }
  }, [context]);

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

  const startListening = () => {
    if (!recognitionRef.current || listening) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setTranscript("");
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
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

  if (!supported) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl shadow-cyan-500/30 border border-cyan-500/40 font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)" }}
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <Mic className="w-4 h-4" />
            Talk to Aanya · Live AI Stylist
          </motion.button>
        )}
      </AnimatePresence>

      {/* Voice Chat Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(5,5,8,0.75)", backdropFilter: "blur(12px)" }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="w-full sm:w-[440px] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
              style={{ background: "#0a0a14", border: "1px solid rgba(124,58,237,0.25)", maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.10))" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-white text-sm flex items-center gap-2">
                      Aanya
                      {speaking && (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <Volume2 className="w-3 h-3 animate-pulse" />
                          <span className="text-[10px] font-bold">Speaking</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40">Live AI Fashion Stylist · Powered by Groq</div>
                  </div>
                </div>
                <button onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[220px]" style={{ maxHeight: "50vh" }}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-0.5"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "text-white rounded-br-sm"
                          : "text-white/90 rounded-bl-sm"
                      }`}
                      style={
                        msg.role === "user"
                          ? { background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }
                          : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
                      }
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="text-xs text-white/50">Aanya is thinking...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Live Transcript */}
              <AnimatePresence>
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 py-2 border-t border-white/5 flex items-center gap-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span className="text-xs text-white/50 italic truncate">{transcript}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mic Controls */}
              <div className="px-5 py-5 border-t border-white/5 flex flex-col items-center gap-3">
                <motion.button
                  animate={pulse ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  onClick={listening ? stopListening : startListening}
                  disabled={loading}
                  className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all disabled:opacity-50"
                  style={
                    listening
                      ? { background: "linear-gradient(135deg, #DC2626, #991B1B)", boxShadow: "0 0 30px rgba(220,38,38,0.5)" }
                      : { background: "linear-gradient(135deg, #7C3AED, #06B6D4)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }
                  }
                >
                  {listening && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-30"
                      style={{ background: "linear-gradient(135deg, #DC2626, #991B1B)" }} />
                  )}
                  {listening ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
                </motion.button>

                <p className="text-xs text-white/40 text-center">
                  {listening
                    ? "Listening... tap to stop"
                    : loading
                    ? "Aanya is responding..."
                    : speaking
                    ? "Tap mic to interrupt & ask again"
                    : "Tap mic and speak your fashion question"}
                </p>

                {/* Waveform visual when listening */}
                <AnimatePresence>
                  {listening && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-end gap-1 h-6">
                      {[...Array(9)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 16 + Math.random() * 8, 4] }}
                          transition={{ duration: 0.4 + i * 0.05, repeat: Infinity, repeatType: "mirror" }}
                          className="w-1 rounded-full"
                          style={{ background: "linear-gradient(to top, #7C3AED, #06B6D4)" }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
