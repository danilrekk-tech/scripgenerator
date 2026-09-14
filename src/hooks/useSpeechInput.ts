import { useCallback, useEffect, useRef, useState } from "react";

/** Распознавание речи в браузере (ru-RU) для голосового ввода ответов. */
type AnyRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: unknown) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
};

function getCtor(): (new () => AnyRecognition) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => AnyRecognition) | null;
}

export function useSpeechInput(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<AnyRecognition | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const supported = typeof window !== "undefined" && !!getCtor();

  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* noop */ } }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) { setError("Браузер не поддерживает распознавание речи"); return; }
    setError(null);
    try {
      const rec = new Ctor();
      rec.lang = "ru-RU";
      rec.continuous = true;
      rec.interimResults = true;
      let finalText = "";
      rec.onresult = (e: unknown) => {
        const ev = e as { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> };
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          const text = res[0]?.transcript || "";
          if (res.isFinal) finalText += text + " ";
          else interim += text;
        }
        onTextRef.current((finalText + interim).replace(/\s+/g, " ").trim());
      };
      rec.onerror = (e: unknown) => {
        const code = (e as { error?: string })?.error;
        setError(code === "not-allowed" ? "Нет доступа к микрофону" : "Ошибка распознавания речи");
        setListening(false);
      };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setError("Не удалось запустить микрофон");
      setListening(false);
    }
  }, []);

  const toggle = useCallback(() => { listening ? stop() : start(); }, [listening, start, stop]);

  return { supported, listening, error, start, stop, toggle };
}
