import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Check, RotateCcw, Package } from "lucide-react";
import type { ServiceItem } from "@/hooks/useServices";

interface Props {
  services: ServiceItem[];
  onAdd: (service: Omit<ServiceItem, "id">) => void;
  onUpdate: (id: string, updates: Partial<Omit<ServiceItem, "id">>) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
  className?: string;
}

export default function ServicesManager({ services, onAdd, onUpdate, onDelete, onReset, className }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", keyPoints: "" });

  const startEdit = (svc: ServiceItem) => {
    setEditingId(svc.id);
    setDraft({ name: svc.name, description: svc.description, keyPoints: svc.keyPoints.join(", ") });
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setDraft({ name: "", description: "", keyPoints: "" });
  };

  const save = () => {
    const keyPoints = draft.keyPoints.split(",").map((s) => s.trim()).filter(Boolean);
    if (!draft.name.trim()) return;

    if (isAdding) {
      onAdd({ name: draft.name.trim(), description: draft.description.trim(), keyPoints });
      setIsAdding(false);
    } else if (editingId) {
      onUpdate(editingId, { name: draft.name.trim(), description: draft.description.trim(), keyPoints });
      setEditingId(null);
    }
    setDraft({ name: "", description: "", keyPoints: "" });
  };

  const cancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setDraft({ name: "", description: "", keyPoints: "" });
  };

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      <div className="p-6 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Управление услугами</h2>
            </div>
            <p className="text-xs text-muted-foreground">Добавляйте, редактируйте и удаляйте услуги. Данные используются при генерации.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onReset} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Сбросить к стандартным">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={startAdd} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-all btn-tactile flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Добавить
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {/* Add form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <EditForm draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service list */}
        {services.map((svc) => (
          <motion.div key={svc.id} layout className="border border-border rounded-lg bg-card overflow-hidden">
            {editingId === svc.id ? (
              <div className="p-4">
                <EditForm draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{svc.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{svc.description}</p>
                    {svc.keyPoints.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {svc.keyPoints.map((kp, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {kp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(svc)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(svc.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {services.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Нет услуг. Добавьте первую или сбросьте к стандартным.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EditForm({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: { name: string; description: string; keyPoints: string };
  setDraft: (d: { name: string; description: string; keyPoints: string }) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 p-4 border border-primary/20 rounded-lg bg-primary/5">
      <input
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Название услуги"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        autoFocus
      />
      <textarea
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none h-16"
        placeholder="Описание услуги"
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
      />
      <input
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Ключевые пункты через запятую"
        value={draft.keyPoints}
        onChange={(e) => setDraft({ ...draft, keyPoints: e.target.value })}
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-xs border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 btn-tactile flex items-center gap-1">
          <X className="w-3 h-3" /> Отмена
        </button>
        <button onClick={onSave} disabled={!draft.name.trim()} className="px-3 py-1.5 rounded-md text-xs bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 btn-tactile flex items-center gap-1">
          <Check className="w-3 h-3" /> Сохранить
        </button>
      </div>
    </div>
  );
}
