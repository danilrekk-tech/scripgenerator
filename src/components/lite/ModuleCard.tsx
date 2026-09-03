import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";
import type { LiteModuleMeta } from "@/hooks/useLiteModules";
import { LITE_ICONS } from "./liteIcons";

interface Props {
  module: LiteModuleMeta;
  enabled: boolean;
  onToggle: () => void;
}

export default function ModuleCard({ module, enabled, onToggle }: Props) {
  const Icon = LITE_ICONS[module.id];
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
        enabled ? "border-primary/30 bg-primary/[0.04]" : "border-border/60 bg-card/40"
      }`}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          enabled ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{module.label}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{module.description}</p>
        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
          {module.locked ? "Всегда включён" : enabled ? "Включён" : "Выключен"}
        </p>
      </div>
      {module.locked ? (
        <Lock className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <Switch checked={enabled} onCheckedChange={onToggle} aria-label={module.label} />
      )}
    </div>
  );
}
