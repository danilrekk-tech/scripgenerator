import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
}
interface Separator {
  type: "separator";
}
type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  /** Controlled selected tab index (index among all items, skipping separators). Null = nothing selected. */
  selectedIndex?: number | null;
  onChange?: (index: number | null) => void;
}

const buttonVariants = {
  initial: { gap: 0, paddingLeft: ".5rem", paddingRight: ".5rem" },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring" as const, bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  selectedIndex,
  onChange,
}: ExpandableTabsProps) {
  const [internalSelected, setInternalSelected] = React.useState<number | null>(null);
  const isControlled = selectedIndex !== undefined;
  const selected = isControlled ? selectedIndex : internalSelected;
  const outsideClickRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (outsideClickRef.current && !outsideClickRef.current.contains(e.target as Node)) {
        if (!isControlled) setInternalSelected(null);
        onChange?.(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isControlled, onChange]);

  const handleSelect = (index: number) => {
    if (!isControlled) setInternalSelected(index);
    onChange?.(index);
  };

  const SeparatorEl = () => <div className="mx-1 h-[24px] w-[1px] shrink-0 bg-border" aria-hidden="true" />;

  return (
    <div ref={outsideClickRef} className={cn("flex flex-wrap items-center gap-[2px] rounded-2xl border border-border/50 bg-background/40 px-[3px] py-[3px]", className)}>
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <SeparatorEl key={`separator-${index}`} />;
        }
        const Icon = tab.icon;
        const isSelected = selected === index;
        return (
          <motion.button
            key={`tab-${index}-${tab.title}`}
            initial={false}
            animate={buttonVariants.animate(isSelected)}
            transition={transition}
            onClick={() => handleSelect(index)}
            className={cn(
              "relative flex items-center rounded-xl py-2 text-sm font-medium transition-colors duration-300",
              isSelected ? cn("bg-muted", activeColor) : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            <Icon size={16} className="shrink-0" />
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  initial={spanVariants.initial}
                  animate={spanVariants.animate}
                  exit={spanVariants.exit}
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap text-[13px] font-medium"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
