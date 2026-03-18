import { Sparkles, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#020204] py-12 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-24 bg-purple-600/20 blur-[100px]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <span className="text-2xl font-black tracking-tight gradient-text">
                FyndMate
              </span>
            </div>
            <p className="text-white/50 max-w-sm mb-6">
              India's first AI-powered smart shopping and virtual styling platform. Shop smarter, style better, and save money.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> in India
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-white/80">Product</h4>
            <ul className="space-y-3">
              <li><a href="#finder" className="text-white/50 hover:text-white transition-colors">AI Search</a></li>
              <li><a href="#designer" className="text-white/50 hover:text-white transition-colors">Virtual Stylist</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors">Price Compare</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors">Gift Genius</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-white/80">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/50 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors">Affiliate Disclosure</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">© 2025 FyndMate. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white">𝕏</a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white">in</a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white">ig</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
