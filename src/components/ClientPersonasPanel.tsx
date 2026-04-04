import { useState } from "react";
import type { ClientPersona } from "@/hooks/useClientPersonas";
import { Plus, Trash2, Edit3, Save, X, Users } from "lucide-react";

interface Props {
  personas: ClientPersona[];
  onAdd: (p: Omit<ClientPersona, "id">) => void;
  onUpdate: (id: string, updates: Partial<ClientPersona>) => void;
  onRemove: (id: string) => void;
  className?: string;
}

export default function ClientPersonasPanel({ personas, onAdd, onUpdate, onRemove, className }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", traits: "", communication: "" });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAdd(form);
    setForm({ name: "", role: "", traits: "", communication: "" });
    setShowAdd(false);
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className || ""}`}>
      <div className="p-6 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Персоны клиентов</h2>
            <p className="text-xs text-muted-foreground">Типичные профили для генерации</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="p-2 rounded-lg hover:bg-accent/50 text-primary transition-colors btn-tactile">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showAdd && (
          <div className="glass-card border border-border/50 rounded-xl p-4 space-y-3 mb-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название персоны" className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Должность/Роль" className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <textarea value={form.traits} onChange={(e) => setForm({ ...form, traits: e.target.value })} placeholder="Черты характера" className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none h-16" />
            <textarea value={form.communication} onChange={(e) => setForm({ ...form, communication: e.target.value })} placeholder="Стиль общения" className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none h-16" />
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={!form.name.trim()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium btn-tactile disabled:opacity-30">Добавить</button>
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 border border-border/50 rounded-lg text-xs text-muted-foreground btn-tactile">Отмена</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
        {personas.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Нет персон</p>
          </div>
        )}
        {personas.map((p) => (
          <div key={p.id} className="glass-card border border-border/50 rounded-xl p-4 group">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-medium text-foreground">{p.name}</h3>
                <p className="text-[10px] text-primary font-medium uppercase tracking-wider">{p.role}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onRemove(p.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mb-1"><strong>Черты:</strong> {p.traits}</p>
            <p className="text-[11px] text-muted-foreground"><strong>Общение:</strong> {p.communication}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
