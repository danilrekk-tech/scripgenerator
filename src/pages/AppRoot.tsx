import { useUiMode } from "@/hooks/useUiMode";
import Index from "./Index";
import LiteApp from "./lite/LiteApp";

/** Выбирает слой интерфейса: расширенный (существующий) или облегчённый. */
export default function AppRoot() {
  const { isLite } = useUiMode();
  return isLite ? <LiteApp /> : <Index />;
}
