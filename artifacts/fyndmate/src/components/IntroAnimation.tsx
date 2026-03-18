import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("fyndmate_intro");
    if (hasSeenIntro) {
      setIsVisible(false);
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("fyndmate_intro", "true");
      onComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  const letters = "FyndMate".split("");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.15, transition: { duration: 0.8, ease: "easeInOut" } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050508] overflow-hidden"
        >
          {/* Light Burst */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2, 4], opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/30 rounded-full blur-[100px]"
          />

          <div className="relative flex flex-col items-center z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <Sparkles className="w-12 h-12 text-purple-400" />
            </motion.div>

            <div className="flex space-x-1 text-5xl md:text-7xl font-black tracking-tight">
              {letters.map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  transition={{
                    delay: 0.8 + i * 0.07,
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                  className={i >= 4 ? "gradient-text" : "text-white"}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="mt-6 text-white/40 font-medium tracking-widest uppercase text-sm"
            >
              Shop Smarter · Style Better
            </motion.p>
          </div>

          {/* Loading Bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "200px" }}
            transition={{ delay: 2, duration: 1, ease: "easeInOut" }}
            className="absolute bottom-24 h-[2px] bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
