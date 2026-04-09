import { useRef, useState } from "react";

type VoiceRecognition = {
  start: () => void;
  stop: () => void;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export const useVoiceSearch = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  const startListening = () => {
    const Constructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Constructor) return;

    const recognition = new Constructor() as VoiceRecognition;
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { isListening, startListening, stopListening };
};
