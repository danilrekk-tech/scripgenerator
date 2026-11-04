import { useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Кнопка голосового ввода: дописывает распознанную речь к текущему тексту. */
export default function VoiceInputButton({ value, onChange, disabled, className = "" }: Props) {
  const baseRef = useRef("");
  const { supported, listening, error, start, stop } = useSpeechInput((t) => {
    onChange((baseRef.current ? baseRef.current + " " : "") + t);
  });
  if (error) toast.error(error, { id: "speech-err" });

  const click = () => {
    if (!supported) { toast.error("Голосовой ввод работает в Chrome, Edge и Safari"); return; }
    if (listening) stop();
    else { baseRef.current = value.trim(); start(); }
  };

  return (
    <button
      type="button"
      onClick={click}
      disabled={disabled}
      aria-label={listening ? "Остановить запись" : "Ответить голосом"}
      title={listening ? "Остановить запись" : "Ответить голосом"}
      className={`shrink-0 px-3 py-2.5 rounded-xl border transition-all btn-tactile disabled:opacity-50 ${
        listening ? "bg-destructive text-destructive-foreground border-destructive animate-pulse" : "glass-input border-border/50 text-foreground hover:border-primary/50"
      } ${className}`}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
