import { memo } from "react";

/**
 * BlueprintHero — inline SVG "чертёж" вместо цветной картинки.
 * Единый визуальный язык: сетка + тонкие линии основного цвета + тематический силуэт.
 * Никаких рамок: рендерится как фон интерфейса.
 */
type Variant =
  | "simulator"
  | "suflyor"
  | "kp"
  | "quiz"
  | "scenario"
  | "style"
  | "brief"
  | "objections"
  | "call-analyzer"
  | "generic";

interface Props {
  variant?: Variant;
  className?: string;
  ratio?: "wide" | "tall" | "banner"; // banner = 640x160
}

function Grid() {
  return (
    <>
      <defs>
        <pattern id="bp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.18" />
        </pattern>
        <pattern id="bp-dots" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="0.8" fill="currentColor" opacity="0.25" />
        </pattern>
        <linearGradient id="bp-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bp-grid)" />
      <rect width="100%" height="100%" fill="url(#bp-dots)" />
      <rect width="100%" height="100%" fill="url(#bp-fade)" />
    </>
  );
}

function Corners() {
  return (
    <g stroke="currentColor" strokeWidth="0.8" opacity="0.5" fill="none">
      <path d="M 8 8 L 8 24 M 8 8 L 24 8" />
      <path d="M 632 8 L 632 24 M 632 8 L 616 8" />
      <path d="M 8 232 L 8 216 M 8 232 L 24 232" />
      <path d="M 632 232 L 632 216 M 632 232 L 616 232" />
    </g>
  );
}

function Content({ variant }: { variant: Variant }) {
  const s = "currentColor";
  const cx = 320, cy = 120;
  switch (variant) {
    case "simulator":
      return (
        <g stroke={s} strokeWidth="1" fill="none" opacity="0.75">
          {/* two speech bubbles */}
          <path d="M 120 80 h 130 a 12 12 0 0 1 12 12 v 40 a 12 12 0 0 1 -12 12 h -100 l -20 16 v -16 h -10 a 12 12 0 0 1 -12 -12 v -40 a 12 12 0 0 1 12 -12 z" />
          <path d="M 390 90 h 130 a 12 12 0 0 1 12 12 v 40 a 12 12 0 0 1 -12 12 h -100 l -20 16 v -16 h -10 a 12 12 0 0 1 -12 -12 v -40 a 12 12 0 0 1 12 -12 z" />
          <line x1="130" y1="105" x2="240" y2="105" opacity="0.5" />
          <line x1="130" y1="120" x2="220" y2="120" opacity="0.5" />
          <line x1="400" y1="115" x2="520" y2="115" opacity="0.5" />
          <line x1="400" y1="130" x2="500" y2="130" opacity="0.5" />
          {/* headphones icon */}
          <circle cx={cx} cy="200" r="14" opacity="0.6" />
          <path d="M 306 200 a 14 14 0 0 1 28 0" />
        </g>
      );
    case "suflyor":
      return (
        <g stroke={s} strokeWidth="1" fill="none" opacity="0.75">
          {/* mic + waveform */}
          <rect x="300" y="60" width="40" height="70" rx="18" />
          <path d="M 285 115 a 35 35 0 0 0 70 0" />
          <line x1="320" y1="150" x2="320" y2="175" />
          <line x1="300" y1="180" x2="340" y2="180" />
          {/* waveform */}
          <polyline points="60,205 90,205 100,180 115,225 130,190 145,210 165,205 180,200 200,215 220,205 240,205 260,195 280,220 300,205 320,205 340,205 360,215 380,190 400,225 420,180 435,205 460,205 480,195 500,220 520,205 540,205 580,205" opacity="0.6" />
        </g>
      );
    case "kp":
      return (
        <g stroke={s} strokeWidth="1" fill="none" opacity="0.75">
          {/* document with lines */}
          <path d="M 240 40 h 130 l 30 30 v 150 h -160 z" />
          <line x1="370" y1="40" x2="370" y2="70" />
          <line x1="370" y1="70" x2="400" y2="70" />
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1="260" y1={90 + i * 18} x2={i === 5 ? 340 : 380} y2={90 + i * 18} opacity="0.5" />
          ))}
          {/* stamp */}
          <circle cx="440" cy="180" r="26" opacity="0.5" strokeDasharray="3 3" />
          <text x="440" y="184" textAnchor="middle" fontSize="9" fill={s} opacity="0.55">КП</text>
        </g>
      );
    case "quiz":
      return (
        <g stroke={s} strokeWidth="1" fill="none" opacity="0.75">
          <circle cx={cx} cy="105" r="42" />
          <text x={cx} y="115" textAnchor="middle" fontSize="42" fill={s} opacity="0.7" fontFamily="serif">?</text>
          <rect x="140" y="175" width="90" height="26" rx="6" opacity="0.5" />
          <rect x="245" y="175" width="90" height="26" rx="6" opacity="0.5" />
          <rect x="350" y="175" width="90" height="26" rx="6" opacity="0.5" />
          <rect x="245" y="175" width="90" height="26" rx="6" strokeWidth="1.6" />
        </g>
      );
    case "scenario":
      return (
        <g stroke={s} strokeWidth="1" fill="none" opacity="0.75">
          {/* node graph */}
          <circle cx="120" cy="120" r="16" />
          <circle cx="240" cy="70" r="14" />
          <circle cx="240" cy="170" r="14" />
          <circle cx="380" cy="120" r="16" />
          <circle cx="520" cy="70" r="14" />
          <circle cx="520" cy="170" r="14" />
          <line x1="136" y1="115" x2="226" y2="76" />
          <line x1="136" y1="125" x2="226" y2="164" />
          <line x1="254" y1="70" x2="366" y2="112" />
          <line x1="254" y1="170" x2="366" y2="128" />
          <line x1="396" y1="115" x2="506" y2="76" />
          <line x1="396" y1="125" x2="506" y2="164" />
        </g>
      );
    case "style":
      return (
        <g stroke={s} strokeWidth="1" fill="none" opacity="0.75">
          {/* palette/waveform mix */}
          <path d="M 200 200 a 100 100 0 1 1 220 -20" />
          <circle cx="210" cy="180" r="10" />
          <circle cx="260" cy="140" r="10" />
          <circle cx="320" cy="115" r="10" />
          <circle cx="380" cy="130" r="10" />
          <circle cx="425" cy="170" r="10" />
          <text x={cx} y="70" textAnchor="middle" fontSize="14" fill={s} opacity="0.6">Aa Bb Cc</text>
        </g>
      );
    case "brief":
      return (
        <g stroke={s} strokeWidth="1" fill="none" opacity="0.75">
          <rect x="220" y="60" width="200" height="140" rx="6" />
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i} x1="240" y1={90 + i * 22} x2={i % 2 ? 380 : 400} y2={90 + i * 22} opacity="0.55" />
          ))}
          <path d="M 240 90 h 6 M 240 112 h 6 M 240 134 h 6 M 240 156 h 6 M 240 178 h 6" strokeWidth="2" />
        </g>
      );
    case "objections":
      return (
        <g stroke={s} strokeWidth="1" fill="none" opacity="0.75">
          {/* shield with X pattern */}
          <path d="M 320 40 l 80 30 v 60 c 0 40 -40 70 -80 90 c -40 -20 -80 -50 -80 -90 v -60 z" />
          <line x1="290" y1="100" x2="350" y2="160" />
          <line x1="350" y1="100" x2="290" y2="160" />
        </g>
      );
    case "call-analyzer":
      return (
        <g stroke={s} strokeWidth="1" fill="none" opacity="0.75">
          {/* wave with markers */}
          <polyline points="40,150 80,150 95,110 115,190 135,125 155,170 180,150 210,150 230,180 260,120 290,160 320,150 350,150 380,190 410,110 435,170 470,150 500,150 530,175 560,125 590,150" />
          <circle cx="115" cy="190" r="4" fill={s} />
          <circle cx="290" cy="160" r="4" fill={s} />
          <circle cx="410" cy="110" r="4" fill={s} />
          <text x={cx} y="220" textAnchor="middle" fontSize="9" fill={s} opacity="0.6">ANALYSIS</text>
        </g>
      );
    default:
      return (
        <g stroke={s} strokeWidth="1" fill="none" opacity="0.6">
          <circle cx={cx} cy={cy} r="60" />
          <circle cx={cx} cy={cy} r="30" />
        </g>
      );
  }
}

function BlueprintHero({ variant = "generic", className = "", ratio = "wide" }: Props) {
  const viewBox = ratio === "banner" ? "0 0 640 160" : "0 0 640 240";
  return (
    <div className={`relative w-full text-primary ${className}`} aria-hidden>
      <svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="block">
        <Grid />
        <Corners />
        <Content variant={variant} />
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
    </div>
  );
}

export default memo(BlueprintHero);
