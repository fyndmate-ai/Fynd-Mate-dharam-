import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Banknote,
  BadgeCheck,
  ChevronRight,
  Menu,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  UserCircle2,
  WalletCards,
  X,
} from "lucide-react";
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { FinderPage } from "./pages/FinderPage";
import { DesignerPage } from "./pages/DesignerPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function AppNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Shop", href: "#shop" },
    { label: "AI Finder", href: "#finder" },
    { label: "AI Designer", href: "#tryon" },
    { label: "Features", href: "#features" },
    { label: "Aanya", href: "#aanya" },
  ];

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#D2D2D7] ${scrolled ? "shadow-sm" : ""}`}>
      <nav className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-[#1D1D1F] font-semibold">
          <Sparkles className="w-4 h-4" /> FyndMate
        </button>

        <div className="hidden md:flex items-center gap-8 text-sm text-[#1D1D1F]">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-[#0071E3] transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4 text-[#1D1D1F]">
          <Search className="w-4 h-4" />
          <UserCircle2 className="w-4 h-4" />
          <button onClick={() => navigate("/finder")} className="text-[#0071E3] text-sm font-medium">
            Get Started
          </button>
        </div>

        <button onClick={() => setMenuOpen((p) => !p)} className="md:hidden text-[#1D1D1F]">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-[#D2D2D7] bg-white px-4 py-3 space-y-2">
          {links.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="block text-[#1D1D1F] py-1.5">
              {link.label}
            </a>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              navigate("/finder");
            }}
            className="text-[#0071E3] text-sm font-medium"
          >
            Get Started
          </button>
        </div>
      )}
    </header>
  );
}

function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`py-20 ${className}`}>
      <div className="max-w-[1200px] mx-auto px-4">{children}</div>
    </section>
  );
}

function HomePage() {
  const categories = useMemo(
    () => [
      { title: "AI Product Finder", text: "Find your perfect product in 10 seconds", icon: Search, href: "/finder" },
      { title: "Virtual Try-On", text: "See clothes on you before buying", icon: Shirt, href: "/designer" },
      { title: "Fake Review Detection", text: "Never get fooled by fake reviews again", icon: ShieldCheck, href: "/finder" },
      { title: "Price Comparison", text: "Compare Amazon, Flipkart and Myntra instantly", icon: WalletCards, href: "/finder" },
      { title: "Ask Aanya", text: "Your personal AI fashion stylist", icon: Sparkles, href: "/designer" },
      { title: "Savings Tracker", text: "See how much FyndMate saved you", icon: Banknote, href: "/finder" },
    ],
    [],
  );
  const [, navigate] = useLocation();

  return (
    <main className="bg-white text-[#1D1D1F]">
      <AppNav />

      <Section className="pt-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-[56px] font-bold leading-tight tracking-tight">
            The smarter way
            <br />
            to shop online.
          </h1>
          <p className="mt-5 text-[17px] md:text-[21px] leading-[1.5] text-[#6E6E73]">
            FyndMate finds your perfect product in 10 seconds. Catches fake reviews. Compares real prices.
            And shows you wearing it before you buy.
          </p>
          <div className="mt-7 flex justify-center items-center gap-6">
            <button onClick={() => navigate("/finder")} className="bg-[#0071E3] text-white rounded-full px-6 py-2.5 text-[17px] font-medium">
              Try AI Finder
            </button>
            <button onClick={() => navigate("/designer")} className="text-[#0071E3] text-[17px] font-medium flex items-center gap-1">
              Try AI Designer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-4 text-[14px] text-[#6E6E73]">Free to use · No signup required · India's first AI shopping platform</p>
        </div>
        <motion.img
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=1400"
          alt="FyndMate preview"
          className="mt-12 rounded-3xl border border-[#D2D2D7] shadow-sm w-full max-w-5xl mx-auto"
          loading="lazy"
        />
      </Section>

      <Section id="shop">
        <h2 className="text-center text-4xl md:text-[40px] font-semibold mb-10">What would you like to do today?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.href)}
              className="text-left rounded-[18px] bg-[#F5F5F7] border border-[#D2D2D7] p-6 hover:-translate-y-1 hover:shadow-md transition duration-300"
            >
              <card.icon className="w-8 h-8 text-[#1D1D1F]" />
              <h3 className="mt-5 text-[21px] font-semibold">{card.title}</h3>
              <p className="text-[17px] text-[#6E6E73] mt-1">{card.text}</p>
              <p className="text-[#0071E3] text-[17px] mt-6">Explore →</p>
            </button>
          ))}
        </div>
      </Section>

      <Section id="finder">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-4xl md:text-[40px] font-semibold leading-tight">
              Find anything.
              <br />
              In 10 seconds.
            </h2>
            <p className="mt-4 text-[17px] text-[#6E6E73]">
              Describe what you need in plain language. FyndMate&apos;s AI searches thousands of products, catches fake
              reviews, compares prices across platforms, and gives you one honest recommendation.
            </p>
            <ul className="mt-6 space-y-2 text-[17px] text-[#1D1D1F]">
              <li>✓ Natural language search in English or Hinglish</li>
              <li>✓ Fake review detection</li>
              <li>✓ Price comparison across Amazon, Flipkart, Myntra</li>
              <li>✓ Return risk score</li>
              <li>✓ Honest pros and cons</li>
            </ul>
            <a href="/finder" className="inline-flex mt-6 text-[#0071E3] text-[17px] font-medium">Try AI Finder →</a>
          </div>
          <div className="rounded-[18px] border border-[#D2D2D7] bg-[#F5F5F7] p-6">
            <div className="bg-white rounded-xl border border-[#D2D2D7] p-4">
              <p className="text-sm text-[#6E6E73]">Search</p>
              <p className="text-[17px] mt-1">Best running shoes under ₹3000 for daily walk</p>
            </div>
            <div className="bg-white rounded-xl border border-[#D2D2D7] p-4 mt-4">
              <p className="text-sm font-semibold">Top Match · 94%</p>
              <p className="text-[17px] mt-1">Nike Revolution 7</p>
              <p className="text-[#6E6E73] text-sm mt-1">Low return risk · Genuine review pattern</p>
              <div className="flex gap-2 mt-3 text-xs">
                <span className="bg-[#F5F5F7] px-2 py-1 rounded">Amazon ₹2,799</span>
                <span className="bg-[#F5F5F7] px-2 py-1 rounded">Flipkart ₹2,999</span>
                <span className="bg-[#F5F5F7] px-2 py-1 rounded">Myntra ₹3,099</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="tryon">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200"
            alt="Virtual try on"
            className="rounded-[18px] border border-[#D2D2D7] w-full"
            loading="lazy"
          />
          <div>
            <h2 className="text-4xl md:text-[40px] font-semibold leading-tight">
              See it on you.
              <br />
              Before you buy it.
            </h2>
            <p className="mt-4 text-[17px] text-[#6E6E73]">
              Upload your photo. FyndMate&apos;s AI instantly shows you wearing any outfit. No more buying clothes that
              don&apos;t look right.
            </p>
            <ul className="mt-6 space-y-2 text-[17px]">
              <li>✓ Works for all body types</li>
              <li>✓ Indian fashion focus</li>
              <li>✓ Occasion-based styling</li>
              <li>✓ Festival and seasonal looks</li>
            </ul>
            <a href="/designer" className="inline-flex mt-6 text-[#0071E3] text-[17px] font-medium">Try Virtual Try-On →</a>
          </div>
        </div>
      </Section>

      <Section id="aanya" className="bg-[#F5F5F7]">
        <h2 className="text-center text-4xl md:text-[40px] font-semibold">Meet Aanya.</h2>
        <p className="text-center text-[21px] text-[#6E6E73] mt-2">Your personal AI fashion stylist.</p>
        <div className="max-w-4xl mx-auto mt-10 rounded-[18px] border border-[#D2D2D7] bg-white p-6">
          <p className="text-[17px]"><strong>User:</strong> I need a casual outfit under ₹1000</p>
          <p className="text-[17px] mt-4"><strong>Aanya:</strong> Here are 4 perfect casual looks for you! 🌟</p>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            {["Relaxed Tee + Denim", "Smart Kurti Set", "Street Casual Combo", "Weekend Minimal Fit"].map((item) => (
              <div key={item} className="rounded-xl bg-[#F5F5F7] border border-[#D2D2D7] p-3 text-[14px]">{item}</div>
            ))}
          </div>
        </div>
        <p className="text-center text-[#6E6E73] mt-6 text-[17px]">
          Ask Aanya anything about fashion, budgets, occasions, or styling tips.
        </p>
        <div className="text-center mt-4">
          <a href="/designer" className="text-[#0071E3] text-[17px] font-medium">Chat with Aanya →</a>
        </div>
      </Section>

      <Section id="features">
        <h2 className="text-center text-4xl md:text-[40px] font-semibold mb-10">Every feature you need. Nothing you don&apos;t.</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="md:col-span-2 rounded-[18px] bg-[#1D1D1F] text-white p-6">
            <h3 className="text-[21px] font-semibold">Fake Review Detection</h3>
            <p className="mt-2 text-[17px] text-white/80">
              Our AI analyzes review patterns, timing, language and ratings to catch suspicious reviews before you trust them.
            </p>
          </div>
          <div className="md:col-span-2 rounded-[18px] p-6 text-white bg-gradient-to-br from-[#0071E3] to-[#50a2ff]">
            <h3 className="text-[21px] font-semibold">Virtual Try-On</h3>
            <p className="mt-2 text-[17px] text-white/90">Powered by IDM-VTON — the most advanced try-on AI model available.</p>
          </div>
          {[
            "Budget Lock",
            "Voice Search",
            "Match Score",
            "Return Risk",
            "Price History",
            "Savings Tracker",
            "Occasion Styling",
            "Color Match",
          ].map((name) => (
            <div key={name} className="rounded-[18px] bg-[#F5F5F7] border border-[#D2D2D7] p-5">
              <BadgeCheck className="w-5 h-5 mb-3" />
              <h4 className="text-[17px] font-semibold">{name}</h4>
              <p className="text-[14px] text-[#6E6E73] mt-1">Smart feature for better shopping confidence.</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="text-center text-4xl md:text-[40px] font-semibold mb-10">Loved by shoppers across India.</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            ["FyndMate caught 3 fake reviews on a product I almost bought. Saved me ₹2000!", "Priya S., Mumbai"],
            ["The virtual try-on actually works. I returned 80% less clothes after using it.", "Rahul K., Bangalore"],
            ["Aanya helped me find a complete Diwali outfit under ₹1500. Perfect!", "Sneha M., Delhi"],
            ["Price comparison showed same product ₹400 cheaper on Flipkart. Instant saving.", "Arjun T., Hyderabad"],
            ["Voice search in Hindi works perfectly. Finally an app that understands me.", "Meena R., Jaipur"],
            ["The match score feature is genius. Every recommendation has been spot on.", "Vikram P., Chennai"],
          ].map(([quote, person]) => (
            <div key={person} className="rounded-[18px] bg-white border border-[#D2D2D7] p-5 hover:-translate-y-1 hover:shadow-sm transition">
              <p className="text-[#1D1D1F]">★★★★★</p>
              <p className="text-[17px] text-[#6E6E73] mt-3">{quote}</p>
              <p className="text-[14px] mt-4">{person}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-[#F5F5F7]">
        <h2 className="text-center text-4xl md:text-[40px] font-semibold mb-10">How FyndMate works.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["01", "Describe your need", "Type or speak what you're looking for in plain English or Hinglish", Search],
            ["02", "AI finds and styles", "FyndMate searches products, checks reviews, compares prices, and suggests outfits", Sparkles],
            ["03", "Buy with confidence", "See real prices, honest reviews, and even try on clothes before you click buy", ShoppingBag],
          ].map(([num, title, text, Icon]) => (
            <div key={title} className="rounded-[18px] bg-white border border-[#D2D2D7] p-6">
              <p className="text-3xl font-semibold text-[#D2D2D7]">{num}</p>
              <h3 className="text-[21px] font-semibold mt-2">{title}</h3>
              <p className="text-[17px] text-[#6E6E73] mt-2">{text}</p>
              <Icon className="w-6 h-6 mt-4 text-[#1D1D1F]" />
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#D2D2D7] text-center">
          {[["10 sec", "Average decision time"], ["96%", "User satisfaction rate"], ["₹2,400", "Average monthly savings"]].map(([num, label]) => (
            <div key={num} className="py-6">
              <p className="text-5xl font-semibold">{num}</p>
              <p className="text-[17px] text-[#6E6E73] mt-2">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      <footer className="bg-[#F5F5F7] border-t border-[#D2D2D7] mt-8">
        <div className="max-w-[1200px] mx-auto px-4 py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[
            ["Shop", ["AI Finder", "AI Designer", "Virtual Try-On"]],
            ["Features", ["Fake Review Detection", "Price Comparison", "Aanya Stylist"]],
            ["Company", ["About", "Careers", "Press"]],
            ["Support", ["Help Center", "Contact", "FAQ"]],
          ].map(([title, items]) => (
            <div key={title}>
              <h4 className="font-semibold mb-3">{title}</h4>
              <ul className="space-y-2 text-[#6E6E73]">
                {(items as string[]).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-[1200px] mx-auto px-4 py-4 border-t border-[#D2D2D7] text-[14px] text-[#6E6E73]">
          © 2025 FyndMate · Privacy Policy · Terms · Made in India
        </div>
      </footer>
    </main>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Switch>
          <Route path="/finder" component={FinderPage} />
          <Route path="/designer" component={DesignerPage} />
          <Route component={HomePage} />
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
