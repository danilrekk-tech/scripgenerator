import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  size = "md",
}: EmptyStateProps) {
  const sizes = {
    sm: { wrap: "py-8", iconBox: "w-12 h-12", title: "text-base", desc: "text-xs" },
    md: { wrap: "py-12", iconBox: "w-16 h-16", title: "text-lg", desc: "text-sm" },
    lg: { wrap: "py-20", iconBox: "w-20 h-20", title: "text-xl", desc: "text-sm" },
  }[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center text-center px-6 ${sizes.wrap} ${className}`}
    >
      <div className="relative mb-5">
        <div className={`${sizes.iconBox} rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center text-primary/70 shadow-sm`}>
          {icon || <Sparkles className="w-6 h-6" />}
        </div>
        <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl opacity-50 -z-10" />
      </div>
      <h3 className={`${sizes.title} font-semibold tracking-tight text-foreground mb-1.5`}>{title}</h3>
      {description && (
        <p className={`${sizes.desc} text-muted-foreground max-w-md leading-relaxed`}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
