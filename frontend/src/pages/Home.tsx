import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const STATS = [
  { value: "10 sec", label: "Average decision time" },
  { value: "96%", label: "User satisfaction" },
  { value: "Rs2400", label: "Avg monthly savings" }
];

const Home = () => {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 rounded-pill bg-[#E6F7EF] px-4 py-1 text-sm font-medium text-[#1D7346]"
      >
        India&apos;s First AI Shopping Platform
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-4xl font-bold text-apple-dark md:text-6xl"
      >
        Shop Smarter. <span className="text-apple-blue">Style Better.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 max-w-2xl text-lg text-apple-gray"
      >
        Find your perfect product in 10 seconds. See clothes on you before you buy.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-10 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center"
      >
        <Link to="/finder" className="inline-flex items-center gap-2 rounded-pill bg-apple-blue px-7 py-3 text-white">
          <Search size={18} />
          Find Products
        </Link>
        <Link to="/designer" className="inline-flex items-center gap-2 rounded-pill border-2 border-apple-blue px-7 py-3 text-apple-blue">
          <Sparkles size={18} />
          AI Designer
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 rounded-2xl border border-apple-border bg-apple-card p-4 sm:grid-cols-3"
      >
        {STATS.map((stat) => (
          <div key={stat.label}>
            <p className="text-2xl font-bold text-apple-dark">{stat.value}</p>
            <p className="text-sm text-apple-gray">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </main>
  );
};

export default Home;
