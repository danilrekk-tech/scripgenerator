import {
  FileText, Users, History, ShieldQuestion, Send, FileSignature, PackagePlus,
  Swords, ListChecks, Calculator, Headphones, Globe, ClipboardList, Waves,
  MessagesSquare, Dumbbell, GraduationCap, BookOpen, Quote, Boxes, UserSquare2,
  Wrench, Library, GitCompare,
} from "lucide-react";
import type { LiteModuleId } from "@/hooks/useLiteModules";

export const LITE_ICONS: Record<LiteModuleId, React.ComponentType<{ className?: string }>> = {
  scripts: FileText,
  clients: Users,
  history: History,
  objections: ShieldQuestion,
  "follow-up": Send,
  kp: FileSignature,
  upsell: PackagePlus,
  "battle-cards": Swords,
  discovery: ListChecks,
  "value-calc": Calculator,
  calls: Headphones,
  "site-audit": Globe,
  "pre-call-brief": ClipboardList,
  "style-lab": Waves,
  simulator: MessagesSquare,
  "objection-trainer": Dumbbell,
  quiz: GraduationCap,
  cases: BookOpen,
  phrases: Quote,
  services: Boxes,
  personas: UserSquare2,
  armory: Wrench,
  wiki: Library,
  competitors: GitCompare,
};
