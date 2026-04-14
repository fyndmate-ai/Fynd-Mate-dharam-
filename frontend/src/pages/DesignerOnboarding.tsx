import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Upload, UserRound } from "lucide-react";
import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBodyProfile } from "../hooks/useBodyProfile";

const SKIN_TONES = [
  { name: "Fair", hex: "#F9D8C0" },
  { name: "Light", hex: "#E8B791" },
  { name: "Medium", hex: "#CD9165" },
  { name: "Tan", hex: "#9F6643" },
  { name: "Dark", hex: "#5C3522" }
] as const;

const BODY_TYPES = ["slim", "average", "athletic"] as const;
const TOTAL_STEPS = 4;

const stepTitle: Record<number, string> = {
  1: "Choose your model",
  2: "What's your skin tone?",
  3: "Tell us about your body",
  4: "Upload your photo (optional)"
};

const stepSubtitle: Record<number, string> = {
  1: "This helps us create your avatar",
  2: "We’ll match your avatar and outfit suggestions",
  3: "",
  4: "For more accurate avatar"
};

const DesignerOnboarding = () => {
  const navigate = useNavigate();
  const { saveProfile } = useBodyProfile();

  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [skinIndex, setSkinIndex] = useState(2);
  const [height, setHeight] = useState(170);
  const [bodyType, setBodyType] = useState<(typeof BODY_TYPES)[number]>("average");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [showReady, setShowReady] = useState(false);
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false);

  const progress = useMemo(() => (step / TOTAL_STEPS) * 100, [step]);
  const skin = SKIN_TONES[skinIndex];

  const canContinue =
    (step === 1 && Boolean(gender)) ||
    (step === 2 && skinIndex >= 0) ||
    (step === 3 && Boolean(bodyType)) ||
    step === 4;

  const readPhotoFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(typeof reader.result === "string" ? reader.result : undefined);
    };
    reader.readAsDataURL(file);
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    readPhotoFile(event.target.files?.[0]);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    readPhotoFile(event.dataTransfer.files?.[0]);
  };

  const goNext = () => {
    if (!canContinue) return;
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
      return;
    }
    setShowReady(true);
  };

  const startDesigning = () => {
    if (isCreatingAvatar) return;
    setIsCreatingAvatar(true);

    window.setTimeout(() => {
      saveProfile({
        gender: gender ?? "female",
        skinTone: skin.name,
        skinToneHex: skin.hex,
        height,
        bodyType,
        photoDataUrl
      });
      navigate("/designer", { replace: true });
    }, 900);
  };

  const goBack = () => {
    if (showReady) {
      setShowReady(false);
      return;
    }
    if (step <= 1) return;
    setStep((prev) => prev - 1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F9FBFF] via-[#F8FAFD] to-white px-4 py-8 sm:px-6">
      <section className="mx-auto w-full max-w-xl rounded-[28px] border border-apple-border bg-white/80 p-6 shadow-[0_24px_60px_rgba(16,24,40,0.08)] backdrop-blur sm:p-8">
        {!showReady ? (
          <>
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm text-apple-gray">
                <span>Step {step} of 4</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#E9ECF4]">
                <motion.div
                  className="h-full rounded-full bg-apple-blue"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <h1 className="text-center text-3xl font-semibold tracking-tight text-apple-dark">{stepTitle[step]}</h1>
                {stepSubtitle[step] ? (
                  <p className="mt-2 text-center text-sm text-apple-gray">{stepSubtitle[step]}</p>
                ) : null}

                {step === 1 ? (
                  <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(["male", "female"] as const).map((item) => {
                      const selected = gender === item;
                      return (
                        <button
                          key={item}
                          onClick={() => setGender(item)}
                          className={`rounded-2xl border px-6 py-7 text-center transition ${
                            selected
                              ? "border-apple-blue bg-[#EEF6FF] shadow-[0_0_0_4px_rgba(0,113,227,0.08)]"
                              : "border-apple-border bg-white hover:bg-apple-card"
                          }`}
                        >
                          <UserRound className="mx-auto mb-3 text-apple-hint" size={22} />
                          <p className="text-lg font-medium capitalize text-apple-dark">{item}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
                    {SKIN_TONES.map((tone, index) => {
                      const selected = skinIndex === index;
                      return (
                        <button
                          key={tone.name}
                          onClick={() => setSkinIndex(index)}
                          className="group flex flex-col items-center gap-2"
                          aria-label={tone.name}
                        >
                          <span
                            className={`h-11 w-11 rounded-full border-2 transition sm:h-14 sm:w-14 ${
                              selected
                                ? "border-apple-blue shadow-[0_0_0_6px_rgba(0,113,227,0.12)]"
                                : "border-white shadow-[0_4px_14px_rgba(15,23,42,0.1)]"
                            }`}
                            style={{ backgroundColor: tone.hex }}
                          />
                          <span className={`text-xs ${selected ? "text-apple-dark" : "text-apple-gray"}`}>
                            {tone.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="mt-8 space-y-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-apple-gray">
                        <span>Height</span>
                        <span className="font-medium text-apple-dark">{height} cm</span>
                      </div>
                      <input
                        type="range"
                        min={150}
                        max={190}
                        value={height}
                        onChange={(event) => setHeight(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E9ECF4] accent-apple-blue"
                      />
                      <div className="mt-1 flex justify-between text-xs text-apple-hint">
                        <span>150</span>
                        <span>190</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {BODY_TYPES.map((type) => {
                        const selected = bodyType === type;
                        return (
                          <button
                            key={type}
                            onClick={() => setBodyType(type)}
                            className={`rounded-2xl border px-4 py-4 capitalize transition ${
                              selected
                                ? "border-apple-blue bg-[#EEF6FF] shadow-[0_0_0_4px_rgba(0,113,227,0.08)]"
                                : "border-apple-border bg-white hover:bg-apple-card"
                            }`}
                          >
                            <span className="text-base font-medium text-apple-dark">{type}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {step === 4 ? (
                  <div className="mt-8">
                    <label
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={onDrop}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                        isDragging
                          ? "border-apple-blue bg-[#EEF6FF]"
                          : "border-apple-border bg-[#FAFBFD] hover:bg-apple-card"
                      }`}
                    >
                      {photoDataUrl ? (
                        <img
                          src={photoDataUrl}
                          alt="Uploaded profile preview"
                          className="mb-3 h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        <Upload className="mb-3 text-apple-hint" size={24} />
                      )}
                      <p className="text-sm font-medium text-apple-dark">
                        {photoDataUrl ? "Photo uploaded" : "Drag & drop your photo here"}
                      </p>
                      <p className="mt-1 text-xs text-apple-gray">or click to upload</p>
                      <input type="file" accept="image/*" className="hidden" onChange={onFileInput} />
                    </label>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={goBack}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                  step === 1
                    ? "cursor-not-allowed border-apple-border text-apple-hint opacity-60"
                    : "border-apple-border text-apple-dark hover:bg-apple-card"
                }`}
                disabled={step === 1}
              >
                Back
              </button>
              <button
                onClick={goNext}
                disabled={!canContinue}
                className="ml-auto rounded-2xl bg-apple-blue px-5 py-3 text-sm font-semibold text-white transition enabled:hover:bg-apple-blue-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === TOTAL_STEPS ? "Create My Avatar" : "Continue"}
              </button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            <CheckCircle2 size={28} className="mb-3 text-[#16A34A]" />
            <h1 className="text-3xl font-semibold tracking-tight text-apple-dark">Your avatar is ready</h1>
            <p className="mt-2 max-w-md text-sm text-apple-gray">
              We’ve created your personalized model based on your profile
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
              transition={{ y: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } }}
              className="mt-6 flex w-full max-w-xs items-center justify-center rounded-3xl border border-apple-border bg-gradient-to-b from-white to-[#F4F8FF] p-5"
            >
              <div className="relative h-[300px] w-[150px] rounded-3xl border border-apple-border bg-white">
                <div
                  className="absolute left-1/2 top-4 h-12 w-12 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: skin.hex }}
                />
                <div className="absolute left-1/2 top-16 h-[150px] w-[70px] -translate-x-1/2 rounded-[36px] border border-apple-border bg-[#F8FAFD]" />
                <div className="absolute left-1/2 top-[233px] h-16 w-5 -translate-x-[120%] rounded-full border border-apple-border bg-[#F8FAFD]" />
                <div className="absolute left-1/2 top-[233px] h-16 w-5 translate-x-[20%] rounded-full border border-apple-border bg-[#F8FAFD]" />
              </div>
            </motion.div>

            {isCreatingAvatar ? (
              <div className="mt-5 flex items-center gap-2 text-sm text-apple-gray">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="ml-1">Creating your avatar model...</span>
              </div>
            ) : null}

            <div className="mt-7 flex w-full items-center gap-3">
              <button
                onClick={goBack}
                disabled={isCreatingAvatar}
                className="rounded-2xl border border-apple-border px-4 py-3 text-sm font-medium text-apple-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                Back
              </button>
              <button
                onClick={startDesigning}
                disabled={isCreatingAvatar}
                className="ml-auto rounded-2xl bg-apple-blue px-5 py-3 text-sm font-semibold text-white transition enabled:hover:bg-apple-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                Start Designing
              </button>
            </div>
          </motion.div>
        )}
      </section>
    </main>
  );
};

export default DesignerOnboarding;
