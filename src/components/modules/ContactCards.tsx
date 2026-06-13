import { useState } from "react";
import { useLocalStore, uid } from "@/lib/moduleStore";
import { Plus, Trash2, Users, Phone, Mail, Building2, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface Contact {
  id: string;
  company: string;
  decisionMaker: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
  tags: string[];
  created: number;
}

const SAMPLE: Contact[] = [
  { id: uid(), company: "ТД Северный", decisionMaker: "Анна Петрова", role: "Маркетинг-директор", phone: "+7 999 123-45-67", email: "petrova@sever.ru", notes: "Интересен SEO. Прошлый подрядчик не показал результатов.", tags: ["тёплый", "SEO"], created: Date.now() },
  { id: uid(), company: "MedClinic", decisionMaker: "Игорь Соколов", role: "Управляющий", phone: "+7 905 555-22-11", email: "sokolov@med.ru", notes: "Нужна срочно ФЗ-152. Бюджет ограничен.", tags: ["горячий", "ФЗ-152"], created: Date.now() },
];

export default function ContactCards({ className = "" }: { className?: string }) {
  const [contacts, setContacts] = useLocalStore<Contact[]>("scriptengine-contacts", SAMPLE);
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState<Omit<Contact, "id" | "created" | "tags">>({ company: "", decisionMaker: "", role: "", phone: "", email: "", notes: "" });
  const [tagInput, setTagInput] = useState("");
  const [filter, setFilter] = useState("");

  const add = () => {
    if (!draft.company.trim()) return;
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    setContacts([{ id: uid(), ...draft, tags, created: Date.now() }, ...contacts]);
    setDraft({ company: "", decisionMaker: "", role: "", phone: "", email: "", notes: "" }); setTagInput(""); setShow(false);
  };

  const filtered = contacts.filter((c) => !filter || `${c.company} ${c.decisionMaker} ${c.tags.join(" ")}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <header className="px-5 py-4 border-b border-border/50 shrink-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-primary" /><h2 className="text-base font-semibold text-foreground">Контакт-карточки</h2></div>
          <p className="text-xs text-muted-foreground">Лёгкая CRM для ваших клиентов</p>
        </div>
        <button onClick={() => setShow(!show)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium btn-tactile flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Добавить</button>
      </header>

      <div className="px-5 py-2 border-b border-border/30 shrink-0">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Поиск по компании, ЛПР, тегам..." className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
      </div>

      {show && (
        <div className="px-5 py-3 border-b border-border/30 grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
          <input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="Компания *" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
          <input value={draft.decisionMaker} onChange={(e) => setDraft({ ...draft, decisionMaker: e.target.value })} placeholder="ЛПР" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
          <input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Должность" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
          <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Телефон" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
          <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Теги через запятую" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
          <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Заметки" rows={2} className="md:col-span-2 glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
          <button onClick={add} className="md:col-span-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium btn-tactile">Сохранить</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          contacts.length === 0 ? (
            <EmptyState
              icon={<Users className="w-7 h-7" />}
              title="Здесь будут ваши клиенты"
              description="Добавляйте компании, ЛПР и заметки — всё в одной карточке. Теги помогут быстро находить нужных."
            />
          ) : (
            <EmptyState
              icon={<Search className="w-6 h-6" />}
              title="Ничего не найдено"
              description={`По запросу «${filter}» нет совпадений`}
              size="sm"
            />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((c) => (
              <div key={c.id} className="glass-card border border-border/50 rounded-xl p-4 group hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-foreground"><Building2 className="w-3.5 h-3.5 text-primary" /><p className="text-sm font-semibold truncate">{c.company}</p></div>
                    {c.decisionMaker && <p className="text-xs text-muted-foreground mt-1">{c.decisionMaker} {c.role && `· ${c.role}`}</p>}
                  </div>
                  <button onClick={() => setContacts(contacts.filter((x) => x.id !== c.id))} className="opacity-0 group-hover:opacity-100 p-1 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                {c.tags.length > 0 && <div className="flex flex-wrap gap-1 mb-2">{c.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">#{t}</span>)}</div>}
                <div className="space-y-1 text-xs text-muted-foreground">
                  {c.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.phone}</div>}
                  {c.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.email}</div>}
                </div>
                {c.notes && <p className="text-[11px] text-foreground/80 mt-2 line-clamp-3 border-t border-border/30 pt-2">{c.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
