import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Sparkles, Loader2, Heart, Share2, ShoppingBag } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import { useSuggestOutfits } from "@workspace/api-client-react";
import { formatINR } from "@/lib/utils";

export function AIDesigner() {
  const [image, setImage] = useState<string | null>(null);
  const [bodyType, setBodyType] = useState("Athletic");
  const [occasion, setOccasion] = useState("Casual");
  const [budget, setBudget] = useState([3000]);
  const [skinTone, setSkinTone] = useState("Medium");

  const outfitMutation = useSuggestOutfits();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  const handleStyleMe = () => {
    outfitMutation.mutate({
      data: {
        body_type: bodyType.toLowerCase(),
        occasion: occasion.toLowerCase(),
        budget: budget[0],
        skin_tone: skinTone.toLowerCase(),
      }
    });
  };

  const bodyTypes = ["Slim", "Athletic", "Curvy", "Plus Size"];
  const occasions = ["College", "Office", "Wedding", "Party", "Festival", "Casual"];
  const skinTones = [
    { name: "Fair", color: "#FAD6D6" },
    { name: "Wheatish", color: "#E0B394" },
    { name: "Medium", color: "#C68E65" },
    { name: "Olive", color: "#A8704A" },
    { name: "Brown", color: "#835234" },
    { name: "Dark", color: "#5C3A21" }
  ];

  return (
    <section id="designer" className="py-24 relative bg-[#0a0a0f] border-t border-white/5">
      <div className="absolute top-1/2 left-0 w-1/3 h-1/2 bg-cyan-600/10 blur-[150px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">AI Fashion <span className="gradient-text">Designer</span></h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">Upload your photo, set your preferences, and let our AI style you perfectly for any occasion.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Panel - Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" /> Upload Photo
              </h3>
              
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? "border-cyan-400 bg-cyan-400/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"} ${image ? "p-2" : ""}`}
              >
                <input {...getInputProps()} />
                {image ? (
                  <div className="relative rounded-lg overflow-hidden h-48 group">
                    <img src={image} alt="Upload preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-sm font-bold">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6">
                    <Upload className="w-8 h-8 text-white/30 mb-3" />
                    <p className="text-sm text-white/60 mb-1">Drag & drop your photo here</p>
                    <p className="text-xs text-white/40">or click to browse</p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 block">Body Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {bodyTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setBodyType(type)}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${bodyType === type ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50" : "bg-white/5 text-white/60 border border-transparent hover:bg-white/10"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 block">Occasion</label>
                <div className="flex flex-wrap gap-2">
                  {occasions.map(occ => (
                    <button
                      key={occ}
                      onClick={() => setOccasion(occ)}
                      className={`py-1.5 px-3 rounded-full text-xs font-semibold transition-all ${occasion === occ ? "bg-purple-500/20 text-purple-300 border border-purple-500/50" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Total Budget</label>
                  <span className="text-xs font-bold text-cyan-400">₹{budget[0]}</span>
                </div>
                <Slider.Root 
                  className="relative flex items-center select-none touch-none w-full h-5" 
                  value={budget} 
                  onValueChange={setBudget} 
                  max={15000} 
                  min={1000} 
                  step={500}
                >
                  <Slider.Track className="bg-white/10 relative grow rounded-full h-1.5">
                    <Slider.Range className="absolute bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-black/50 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </Slider.Root>
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 block">Skin Tone (For Color Matching)</label>
                <div className="flex justify-between">
                  {skinTones.map(tone => (
                    <button
                      key={tone.name}
                      onClick={() => setSkinTone(tone.name)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${skinTone === tone.name ? "border-cyan-400 scale-110" : "border-transparent hover:scale-105"}`}
                      style={{ backgroundColor: tone.color }}
                      title={tone.name}
                    />
                  ))}
                </div>
              </div>

              <button 
                onClick={handleStyleMe}
                disabled={outfitMutation.isPending}
                className="cyan-btn w-full py-4 text-lg mt-4 flex items-center justify-center gap-2"
              >
                {outfitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {outfitMutation.isPending ? "Generating Looks..." : "Style Me with AI"}
              </button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-8">
            <div className="glass h-full min-h-[600px] p-6 relative overflow-hidden">
              {!outfitMutation.isSuccess && !outfitMutation.isPending && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-[spin_4s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full border border-purple-500/30 animate-[spin_3s_linear_infinite_reverse]" />
                    <Sparkles className="w-8 h-8 text-white/40" />
                  </div>
                  <h3 className="text-xl font-bold text-white/70 mb-2">Ready to transform your look</h3>
                  <p className="text-white/40 max-w-sm">Upload a photo and set your preferences to see personalized AI outfits with virtual try-on.</p>
                </div>
              )}

              {outfitMutation.isPending && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050508]/80 backdrop-blur-sm z-20">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin" />
                    <div className="absolute inset-2 border-4 border-t-purple-500 border-l-transparent border-b-cyan-500 border-r-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
                  </div>
                  <p className="text-lg font-bold gradient-text animate-pulse">Designing your perfect look...</p>
                </div>
              )}

              <AnimatePresence>
                {outfitMutation.isSuccess && outfitMutation.data?.outfits && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid sm:grid-cols-2 gap-6 h-full"
                  >
                    {outfitMutation.data.outfits.map((outfit, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-cyan group hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                      >
                        <div className="h-64 bg-[#050508] relative overflow-hidden">
                          {/* using generated image or unsplash if not available, but assuming user provided fashion image in requirements */}
                          <img 
                            src={`${import.meta.env.BASE_URL}images/indian-fashion-placeholder.png`} 
                            alt={outfit.name} 
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <div className="absolute top-4 right-4 flex gap-2">
                            <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-white/20 hover:text-red-400 transition-colors">
                              <Heart className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">{outfit.occasion}</div>
                            <h4 className="text-lg font-bold leading-tight">{outfit.name}</h4>
                          </div>
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex gap-2 mb-4">
                            {outfit.color_palette?.map((color, cIdx) => (
                              <div key={cIdx} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                            ))}
                          </div>
                          
                          <div className="space-y-2 mb-4 flex-1">
                            {outfit.items.map((item, iIdx) => (
                              <div key={iIdx} className="flex justify-between text-sm">
                                <span className="text-white/70">{item.name}</span>
                                <span className="font-medium">{formatINR(item.price)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="text-xs text-white/50 bg-white/5 p-3 rounded-lg mb-4 italic">
                            <span className="font-bold text-white/70 not-italic block mb-1">Stylist Note:</span>
                            "{outfit.styling_tip}"
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                            <div className="font-black text-lg">{formatINR(outfit.total_price)}</div>
                            <button className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm">
                              <ShoppingBag className="w-4 h-4" /> Buy Look
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
