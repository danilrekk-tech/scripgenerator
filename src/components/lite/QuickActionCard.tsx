import { ArrowRight } from "lucide-react";

interface Props {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export default function QuickActionCard({ label, description, icon: Icon, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.04]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/40 text-foreground">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-[15px] font-medium text-foreground">{label}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
