import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, ChevronRight, ChevronDown, Copy, Loader2, Sparkles } from "lucide-react";
import { streamScript } from "@/lib/streamChat";
import { toast } from "sonner";
import { SCENARIO_PRESETS } from "@/lib/toolPresets";
import heroScenario from "@/assets/hero-scenario.jpg";

interface ScenarioNode {
  id: string;
  label: string;
  response: string;
  children: ScenarioNode[];
}

interface Props {
  serviceNames: string[];
  className?: string;
}

export default function ScenarioBuilder({ serviceNames, className }: Props) {
  const [service, setService] = useState(serviceNames[0] || "SEO-продвижение");
  const [situation, setSituation] = useState("Холодный звонок");
  const [tree, setTree] = useState<ScenarioNode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const generateTree = useCallback(() => {
    if (isGenerating) return;
    setIsGenerating(true);
    let result = "";
    streamScript({
      config: {
        mode: "scenario-builder",
        service,
        situation,
        context: `Сгенерируй дерево сценариев разговора для продажи "${service}". Ситуация: ${situation}. Формат JSON массив: [{"id":"1","label":"Клиент: ...", "response":"Менеджер: ...", "children":[...]}]. 3-4 ветки, каждая с 2-3 уровнями вложенности. Ответ строго JSON без markdown.`,
        tone: "Уверенный эксперт",
      },
      onDelta: (chunk) => { result += chunk; },
      onDone: () => {
        setIsGenerating(false);
        try {
          const jsonMatch = result.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setTree(parsed);
            const ids = new Set<string>();
            const collect = (nodes: ScenarioNode[]) => { nodes.forEach(n => { ids.add(n.id); collect(n.children || []); }); };
            collect(parsed);
            setExpandedNodes(ids);
            toast.success("Сценарий сгенерирован");
          } else {
            toast.error("Не удалось разобрать ответ");
          }
        } catch {
          toast.error("Ошибка парсинга сценария");
        }
      },
      onError: (msg) => { setIsGenerating(false); toast.error(msg); },
    });
  }, [service, situation, isGenerating]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyNode = (node: ScenarioNode) => {
    const text = `${node.label}\n→ ${node.response}`;
    navigator.clipboard.writeText(text);
    toast.success("Скопировано");
  };

  const renderNode = (node: ScenarioNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }} className="my-1.5">
        <div className="glass-card border border-border/50 rounded-xl p-3 group hover:border-primary/20 transition-all">
          <div className="flex items-start gap-2">
            {hasChildren && (
              <button onClick={() => toggleNode(node.id)} className="p-0.5 mt-0.5 rounded hover:bg-accent/50 text-muted-foreground shrink-0">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
            {!hasChildren && <div className="w-4.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-destructive/80">{node.label}</p>
              <p className="text-xs text-foreground mt-1">{node.response}</p>
            </div>
            <button onClick={() => copyNode(node)} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent/50 text-muted-foreground transition-all shrink-0">
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              {node.children.map(child => renderNode(child, depth + 1))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Конструктор сценариев</h2>
        </div>
        <p className="text-xs text-muted-foreground">Визуальное дерево разговора с ветвлениями</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Услуга</label>
            <div className="flex flex-wrap gap-1.5">
              {serviceNames.map(s => (
                <button key={s} onClick={() => setService(s)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all btn-tactile ${service === s ? "chip-active" : "chip-inactive"}`}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Ситуация</label>
            <div className="flex flex-wrap gap-1.5">
              {["Холодный звонок", "Повторный контакт", "Входящий запрос", "Дожим"].map(s => (
                <button key={s} onClick={() => setSituation(s)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all btn-tactile ${situation === s ? "chip-active" : "chip-inactive"}`}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Готовые сценарии
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SCENARIO_PRESETS.map(p => (
                <button key={p.label} onClick={() => { setService(p.service); setSituation(p.situation); }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border/50 glass-card text-muted-foreground hover:text-foreground hover:border-primary/30 btn-tactile">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generateTree} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 btn-tactile transition-all">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
            {isGenerating ? "Генерация..." : "Построить сценарий"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tree.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="relative w-full max-w-[340px] mb-4">
              <img src={heroScenario} alt="" loading="lazy" className="w-full rounded-2xl opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent rounded-2xl" />
            </div>
            <p className="text-sm font-medium text-foreground">Постройте дерево разговора</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">AI создаст ветвящийся сценарий со всеми возможными ответами клиента</p>
          </div>
        ) : (
          tree.map(node => renderNode(node))
        )}
      </div>
    </div>
  );
}
