import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBodyProfile } from "../hooks/useBodyProfile";

const SKIN_TONES = [
  { name: "Fair", hex: "#FDDBB4" },
  { name: "Wheatish", hex: "#D4956A" },
  { name: "Medium", hex: "#C07850" },
  { name: "Tan", hex: "#A0623A" },
  { name: "Dark", hex: "#7D4425" }
] as const;

const BODY_TYPES = ["slim", "athletic", "curvy", "plus"] as const;

const DesignerOnboarding = () => {
  const navigate = useNavigate();
  const { saveProfile } = useBodyProfile();
  const [skinIndex, setSkinIndex] = useState(2);
  const [height, setHeight] = useState(170);
  const [bodyType, setBodyType] = useState<(typeof BODY_TYPES)[number]>("athletic");

  const handleSave = () => {
    const skin = SKIN_TONES[skinIndex];
    saveProfile({
      skinTone: skin.name,
      skinToneHex: skin.hex,
      height,
      bodyType
    });
    navigate("/designer");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold text-apple-dark">Set your body profile</h1>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-apple-dark">What&apos;s your skin tone?</h2>
        <div className="flex gap-3">
          {SKIN_TONES.map((tone, index) => (
            <button
              key={tone.name}
              onClick={() => setSkinIndex(index)}
              className={`h-10 w-10 rounded-full border-2 ${skinIndex === index ? "border-apple-blue" : "border-transparent"}`}
              style={{ backgroundColor: tone.hex }}
            />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold text-apple-dark">Your height: {height}cm</h2>
        <input
          type="range"
          min={150}
          max={190}
          value={height}
          onChange={(event) => setHeight(Number(event.target.value))}
          className="w-full"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-apple-dark">Body type</h2>
        <div className="grid grid-cols-2 gap-3">
          {BODY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setBodyType(type)}
              className={`rounded-xl border px-4 py-3 capitalize ${bodyType === type ? "border-apple-blue bg-[#EBF5FF]" : "border-apple-border bg-apple-card"}`}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <button onClick={handleSave} className="rounded-pill bg-apple-blue px-6 py-3 font-medium text-white">
        Save and Continue
      </button>
    </main>
  );
};

export default DesignerOnboarding;
