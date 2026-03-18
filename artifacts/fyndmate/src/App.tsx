import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

// Components
import { IntroAnimation } from "./components/IntroAnimation";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { AIFinder } from "./components/AIFinder";
import { AIDesigner } from "./components/AIDesigner";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { Footer } from "./components/Footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Home() {
  const [introDone, setIntroDone] = useState(
    !!sessionStorage.getItem("fyndmate_intro")
  );

  return (
    <>
      <IntroAnimation onComplete={() => setIntroDone(true)} />
      
      <AnimatePresence>
        {introDone && (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="bg-[#050508] min-h-screen text-white selection:bg-purple-500/30"
          >
            <Navbar />
            <Hero />
            <Marquee />
            <AIFinder />
            <AIDesigner />
            <Features />
            <HowItWorks />
            <Footer />
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}

export default App;
