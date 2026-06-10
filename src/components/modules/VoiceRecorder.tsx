import { useState, useRef, useEffect } from "react";
import { useLocalStore, uid } from "@/lib/moduleStore";
import { Mic, Square, Trash2, Download, Send } from "lucide-react";
import { toast } from "sonner";

interface Rec { id: string; name: string; url: string; size: number; createdAt: number; transcript?: string; }

export default function VoiceRecorder({ transcriberUrl, className = "" }: { transcriberUrl: string; className?: string }) {
  const [recs, setRecs] = useLocalStore<Rec[]>("scriptengine-voice-recs", []);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecs((prev) => [{ id: uid(), name: `Запись ${new Date().toLocaleString("ru-RU")}`, url, size: blob.size, createdAt: Date.now() }, ...prev]);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true); setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (e) { toast.error("Нет доступа к микрофону"); }
  };
  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const remove = (id: string) => setRecs(recs.filter((r) => r.id !== id));
  const download = (r: Rec) => { const a = document.createElement("a"); a.href = r.url; a.download = `${r.name}.webm`; a.click(); };
  const sendToTranscriber = (r: Rec) => {
    if (!transcriberUrl) { toast.error("URL транскрайбера не настроен (Настройки)"); return; }
    window.open(transcriberUrl, "_blank");
    toast.info("Загрузите файл вручную в открывшемся окне");
    download(r);
  };

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <header className="px-5 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1"><Mic className="w-4 h-4 text-primary" /><h2 className="text-base font-semibold text-foreground">Голосовая запись</h2></div>
        <p className="text-xs text-muted-foreground">Запишите звонок и отправьте на транскрибацию</p>
      </header>

      <div className="px-5 py-6 border-b border-border/30 flex flex-col items-center gap-3 shrink-0">
        {recording ? (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 rounded-full bg-destructive" />
            </div>
            <p className="text-2xl font-mono font-bold text-foreground">{mmss(elapsed)}</p>
            <button onClick={stop} className="px-6 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium btn-tactile flex items-center gap-2"><Square className="w-4 h-4" />Остановить</button>
          </>
        ) : (
          <button onClick={start} className="w-20 h-20 rounded-full bg-primary text-primary-foreground btn-tactile flex items-center justify-center shadow-glow hover:opacity-90"><Mic className="w-8 h-8" /></button>
        )}
        <p className="text-xs text-muted-foreground">{recording ? "Идёт запись..." : "Нажмите для начала записи"}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {recs.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Нет записей</div>
        ) : recs.map((r) => (
          <div key={r.id} className="glass-card border border-border/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
              <span className="text-[10px] text-muted-foreground">{(r.size / 1024).toFixed(0)} KB</span>
            </div>
            <audio src={r.url} controls className="w-full mb-2" />
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => sendToTranscriber(r)} className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"><Send className="w-3 h-3" />Транскрайбер</button>
              <button onClick={() => download(r)} className="text-xs px-2.5 py-1 rounded-md hover:bg-accent/50 text-muted-foreground flex items-center gap-1"><Download className="w-3 h-3" />Скачать</button>
              <button onClick={() => remove(r.id)} className="text-xs p-1.5 rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
