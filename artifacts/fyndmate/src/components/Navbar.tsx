import { useState, useEffect } from "react";
import { Sparkles, Menu, X } from "lucide-react";
import { useLocation } from "wouter";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", action: () => navigate("/") },
    { name: "AI Finder", action: () => navigate("/finder") },
    { name: "AI Designer", action: () => navigate("/designer") },
    { name: "Features", action: () => {
      navigate("/");
      setTimeout(() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }), 100);
    }},
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-[#050508]/85 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span className="text-xl font-black tracking-tight gradient-text">
              FyndMate
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={link.action}
                className="text-sm font-medium text-white/70 hover:text-purple-400 transition-colors"
              >
                {link.name}
              </button>
            ))}
          </div>

          <div className="hidden md:block">
            <button
              onClick={() => navigate("/finder")}
              className="shimmer-btn rounded-full px-6 py-2.5 text-sm animate-shimmer"
            >
              Try Free
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#050508]/95 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => { link.action(); setMobileMenuOpen(false); }}
                className="text-white/80 font-medium py-2 border-b border-white/5 text-left"
              >
                {link.name}
              </button>
            ))}
            <button
              onClick={() => { navigate("/finder"); setMobileMenuOpen(false); }}
              className="shimmer-btn rounded-xl px-6 py-3 text-sm animate-shimmer mt-2 w-full"
            >
              Try Free
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
