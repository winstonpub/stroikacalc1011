/* ============================================================================
 * ФАЙЛ: src/components/CellScheme.tsx — Технические векторные чертежи кассет Грильято (50×50, 75×75, 100×100)
 * ЗА ЧТО ОТВЕЧАЕТ: Программно рисует CAD-чертежи кассет 590×590 мм для ячеек 50×50 (11 перегородок, просвет 40 мм), 75×75 (7 перегородок, просвет 65 мм) и 100×100 (5 перегородок, просвет 90 мм) с перекрашиванием профилей в выбранный цвет («Чёрный», «Белый», «Металлик»).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Размер ячейки mm и выбранный цвет colorId передаются из превью src/components/CellSchemePreview.tsx.
 * КАК ИЗМЕНИТЬ: Оттенки металла на чертеже меняются в объектах CELL50_VARIANTS, CELL75_VARIANTS и CELL100_VARIANTS; если когда-нибудь добавите нестандартный размер ячейки, для него автоматически сработает универсальный чертёж в конце функции CellScheme.
 * ========================================================================= */

/* БЛОК: Базовые параметры сетки для резервного универсального чертежа (PARTITIONS, GRID, DIM)
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит число перегородок и цвета размерных линий для любых нестандартных размеров ячейки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Задаётся константами ниже.
 * КАК ИЗМЕНИТЬ: Добавьте пару размер: количество_перегородок в PARTITIONS при добавлении новой ячейки. */
const PARTITIONS: Record<number, number> = { 50: 11, 75: 7, 100: 5 };

const GRID = { x: 110, y: 150, side: 470 };

const DIM = "#5b6166";
const DIM_TEXT = "#1f4f8a";
const GRID_LINE = "#3f4448";

/* БЛОК: Палитры цветов и чертёж кассеты Грильято 50×50 мм (CELL50_VARIANTS, CellScheme50)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует кассету 590×590 мм из 11 горизонтальных и 11 вертикальных планок с выносками размеров 590, 50×50, просветом 40 мм и толщиной профиля 10 мм.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Выбранный цвет colorId ("black" | "white" | "metal").
 * КАК ИЗМЕНИТЬ: Поменяйте цвета градиентов h и v в CELL50_VARIANTS для настройки оттенка решётки. */
const CELL50_VARIANTS: Record<
  string,
  { h: [string, string, string]; v: [string, string, string]; stroke: string; label: string }
> = {
  black: {
    h: ["#62676d", "#34383d", "#15181b"],
    v: ["#6d7278", "#3c4146", "#171a1d"],
    stroke: "#111316",
    label: "Чертёж кассеты Грильято 50×50, цвет профилей Чёрный",
  },
  white: {
    h: ["#ffffff", "#f2f4f6", "#d9dde1"],
    v: ["#ffffff", "#f6f7f8", "#d2d7dc"],
    stroke: "#68717a",
    label: "Чертёж кассеты Грильято 50×50, цвет профилей Белый",
  },
  metal: {
    h: ["#fbfcfd", "#d2d7dd", "#aab1b9"],
    v: ["#f8f9fb", "#d6dbe1", "#a5acb4"],
    stroke: "#4b535b",
    label: "Чертёж кассеты Грильято 50×50, цвет профилей Металлик",
  },
  default: {
    h: ["#fbfcfd", "#d2d7dd", "#aab1b9"],
    v: ["#f8f9fb", "#d6dbe1", "#a5acb4"],
    stroke: "#4b535b",
    label: "Чертёж кассеты Грильято 50×50, цвет профилей Металлик",
  },
};

function CellScheme50({ className, colorId = "default" }: { className?: string; colorId?: string }) {
  const variant = CELL50_VARIANTS[colorId] ?? CELL50_VARIANTS.default;
  const uid =
    colorId === "black"
      ? "cell50b"
      : colorId === "white"
        ? "cell50w"
        : colorId === "metal"
          ? "cell50m"
          : "cell50";
  const barsH = [
    132.61, 178.37, 224.14, 269.9, 315.66, 361.42, 407.19, 452.95, 498.71, 544.47, 590.24,
  ];
  const barsV = [
    146.61, 192.37, 238.14, 283.9, 329.66, 375.42, 421.19, 466.95, 512.71, 558.47, 604.24,
  ];
  const bar = 9.15;

  return (
    <svg
      viewBox="0 0 760 760"
      className={className}
      role="img"
      aria-label={variant.label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-barH`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={variant.h[0]} />
          <stop offset="50%" stopColor={variant.h[1]} />
          <stop offset="100%" stopColor={variant.h[2]} />
        </linearGradient>
        <linearGradient id={`${uid}-barV`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={variant.v[0]} />
          <stop offset="50%" stopColor={variant.v[1]} />
          <stop offset="100%" stopColor={variant.v[2]} />
        </linearGradient>
        <filter id="cell50-softShadow" x="-4%" y="-4%" width="108%" height="108%">
          <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodColor="#000000" floodOpacity="0.3" />
        </filter>
        <marker
          id="cell50-arr"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path d="M 0,1 L 11,6 L 0,11 Z" fill="#0f1216" />
        </marker>
      </defs>

      <g filter="url(#cell50-softShadow)">
        {barsH.map((y) => (
          <rect
            key={`h-${y}`}
            x="110"
            y={y}
            width="540"
            height={bar}
            fill={`url(#${uid}-barH)`}
            stroke={variant.stroke}
            strokeWidth="1.6"
          />
        ))}
        {barsV.map((x) => (
          <rect
            key={`v-${x}`}
            x={x}
            y="96"
            width={bar}
            height="540"
            fill={`url(#${uid}-barV)`}
            stroke={variant.stroke}
            strokeWidth="1.6"
          />
        ))}
      </g>

      <g fill="#0f1216" stroke="#0f1216">
        <line x1="110" y1="88" x2="110" y2="30" strokeWidth="1.6" />
        <line x1="650" y1="88" x2="650" y2="30" strokeWidth="1.6" />
        <line
          x1="110"
          y1="58"
          x2="650"
          y2="58"
          strokeWidth="2.1"
          markerStart="url(#cell50-arr)"
          markerEnd="url(#cell50-arr)"
        />
        <text
          x="380"
          y="50"
          textAnchor="middle"
          fontSize="22"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
        >
          590
        </text>

        <line x1="102" y1="96" x2="44" y2="96" strokeWidth="1.6" />
        <line x1="102" y1="636" x2="44" y2="636" strokeWidth="1.6" />
        <line
          x1="68"
          y1="96"
          x2="68"
          y2="636"
          strokeWidth="2.1"
          markerStart="url(#cell50-arr)"
          markerEnd="url(#cell50-arr)"
        />
        <text
          x="58"
          y="366"
          textAnchor="middle"
          fontSize="22"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
          transform="rotate(-90 58 366)"
        >
          590
        </text>

        <rect
          x="476.1"
          y="507.86"
          width="45.76"
          height="45.76"
          fill="none"
          strokeWidth="2.4"
          strokeDasharray="6 4"
        />
        <line x1="498.98" y1="553.63" x2="498.98" y2="672" strokeWidth="1.6" strokeDasharray="5 4" />
        <line x1="498.98" y1="672" x2="561" y2="672" strokeWidth="1.8" />
        <text
          x="569"
          y="679"
          textAnchor="start"
          fontSize="27"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="800"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="5"
          paintOrder="stroke"
        >
          50×50
        </text>

        <line x1="110" y1="644" x2="110" y2="690" strokeWidth="1.6" />
        <line x1="146.61" y1="644" x2="146.61" y2="690" strokeWidth="1.6" />
        <line x1="192.37" y1="644" x2="192.37" y2="690" strokeWidth="1.6" />
        <line x1="201.53" y1="644" x2="201.53" y2="690" strokeWidth="1.6" />

        <line
          x1="110"
          y1="672"
          x2="146.61"
          y2="672"
          strokeWidth="2.1"
          markerStart="url(#cell50-arr)"
          markerEnd="url(#cell50-arr)"
        />
        <text
          x="128.31"
          y="707"
          textAnchor="middle"
          fontSize="20"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
        >
          40
        </text>

        <line x1="192.37" y1="672" x2="201.53" y2="672" strokeWidth="2.1" />
        <line x1="196.95" y1="672" x2="236.95" y2="672" strokeWidth="1.8" />
        <text
          x="244.95"
          y="679"
          textAnchor="start"
          fontSize="20"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
        >
          10
        </text>
      </g>
    </svg>
  );
}

/* БЛОК: Палитры цветов и чертёж кассеты Грильято 75×75 мм (CELL75_VARIANTS, CellScheme75)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует кассету 590×590 мм из 7 горизонтальных и 7 вертикальных планок с выносками размеров 590, 75×75, просветом 65 мм и толщиной профиля 10 мм.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Выбранный цвет colorId из калькулятора.
 * КАК ИЗМЕНИТЬ: Цвета градиентов задаются в CELL75_VARIANTS. */
const CELL75_VARIANTS: Record<
  string,
  { h: [string, string, string]; v: [string, string, string]; stroke: string; label: string }
> = {
  black: {
    h: ["#62676d", "#34383d", "#15181b"],
    v: ["#6d7278", "#3c4146", "#171a1d"],
    stroke: "#111316",
    label: "Чертёж кассеты Грильято 75×75, цвет профилей Чёрный",
  },
  white: {
    h: ["#ffffff", "#f2f4f6", "#d9dde1"],
    v: ["#ffffff", "#f6f7f8", "#d2d7dc"],
    stroke: "#68717a",
    label: "Чертёж кассеты Грильято 75×75, цвет профилей Белый",
  },
  metal: {
    h: ["#fbfcfd", "#d2d7dd", "#aab1b9"],
    v: ["#f8f9fb", "#d6dbe1", "#a5acb4"],
    stroke: "#4b535b",
    label: "Чертёж кассеты Грильято 75×75, цвет профилей Металлик",
  },
  default: {
    h: ["#fbfcfd", "#d2d7dd", "#aab1b9"],
    v: ["#f8f9fb", "#d6dbe1", "#a5acb4"],
    stroke: "#4b535b",
    label: "Чертёж кассеты Грильято 75×75, цвет профилей Металлик",
  },
};

function CellScheme75({ className, colorId = "default" }: { className?: string; colorId?: string }) {
  const variant = CELL75_VARIANTS[colorId] ?? CELL75_VARIANTS.default;
  const uid =
    colorId === "black"
      ? "cell75b"
      : colorId === "white"
        ? "cell75w"
        : colorId === "metal"
          ? "cell75m"
          : "cell75";

  const bar = 9.15;
  const barsH = [155.49, 224.14, 292.78, 361.42, 430.07, 498.71, 567.36];
  const barsV = [169.49, 238.14, 306.78, 375.42, 444.07, 512.71, 581.36];

  const mono = "'JetBrains Mono', monospace";

  return (
    <svg
      viewBox="0 0 760 760"
      className={className}
      role="img"
      aria-label={variant.label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-barH`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={variant.h[0]} />
          <stop offset="50%" stopColor={variant.h[1]} />
          <stop offset="100%" stopColor={variant.h[2]} />
        </linearGradient>
        <linearGradient id={`${uid}-barV`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={variant.v[0]} />
          <stop offset="50%" stopColor={variant.v[1]} />
          <stop offset="100%" stopColor={variant.v[2]} />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-4%" y="-4%" width="108%" height="108%">
          <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodColor="#000000" floodOpacity="0.3" />
        </filter>
        <marker
          id={`${uid}-arr`}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path d="M 0,1 L 11,6 L 0,11 Z" fill="#0f1216" />
        </marker>
      </defs>

      <g filter={`url(#${uid}-soft)`}>
        {barsH.map((y) => (
          <rect
            key={`h-${y}`}
            x="110"
            y={y}
            width="540"
            height={bar}
            fill={`url(#${uid}-barH)`}
            stroke={variant.stroke}
            strokeWidth="1.6"
          />
        ))}
        {barsV.map((x) => (
          <rect
            key={`v-${x}`}
            x={x}
            y="96"
            width={bar}
            height="540"
            fill={`url(#${uid}-barV)`}
            stroke={variant.stroke}
            strokeWidth="1.6"
          />
        ))}
      </g>

      <g fill="#0f1216" stroke="#0f1216">
        <line x1="110" y1="88" x2="110" y2="30" strokeWidth="1.6" />
        <line x1="650" y1="88" x2="650" y2="30" strokeWidth="1.6" />
        <line
          x1="110"
          y1="58"
          x2="650"
          y2="58"
          strokeWidth="2.1"
          markerStart={`url(#${uid}-arr)`}
          markerEnd={`url(#${uid}-arr)`}
        />
        <text
          x="380"
          y="50"
          textAnchor="middle"
          fontSize="22"
          fontFamily={mono}
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
        >
          590
        </text>

        <line x1="102" y1="96" x2="44" y2="96" strokeWidth="1.6" />
        <line x1="102" y1="636" x2="44" y2="636" strokeWidth="1.6" />
        <line
          x1="68"
          y1="96"
          x2="68"
          y2="636"
          strokeWidth="2.1"
          markerStart={`url(#${uid}-arr)`}
          markerEnd={`url(#${uid}-arr)`}
        />
        <text
          x="58"
          y="366"
          textAnchor="middle"
          fontSize="22"
          fontFamily={mono}
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
          transform="rotate(-90 58 366)"
        >
          590
        </text>

        <rect
          x="453.22"
          y="507.86"
          width="68.64"
          height="68.64"
          fill="none"
          stroke="#0f1216"
          strokeWidth="2.4"
          strokeDasharray="6 4"
        />
        <line x1="487.54" y1="576.51" x2="487.54" y2="672" strokeWidth="1.6" strokeDasharray="5 4" />
        <line x1="487.54" y1="672" x2="561" y2="672" strokeWidth="1.8" />
        <text
          x="569"
          y="679"
          textAnchor="start"
          fontSize="27"
          fontFamily={mono}
          fontWeight="800"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="5"
          paintOrder="stroke"
        >
          75×75
        </text>

        <line x1="110" y1="644" x2="110" y2="690" strokeWidth="1.6" />
        <line x1="169.49" y1="644" x2="169.49" y2="690" strokeWidth="1.6" />
        <line x1="238.14" y1="644" x2="238.14" y2="690" strokeWidth="1.6" />
        <line x1="247.29" y1="644" x2="247.29" y2="690" strokeWidth="1.6" />

        <line
          x1="110"
          y1="672"
          x2="169.49"
          y2="672"
          strokeWidth="2.1"
          markerStart={`url(#${uid}-arr)`}
          markerEnd={`url(#${uid}-arr)`}
        />
        <text
          x="139.75"
          y="707"
          textAnchor="middle"
          fontSize="20"
          fontFamily={mono}
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
        >
          65
        </text>

        <line x1="238.14" y1="672" x2="247.29" y2="672" strokeWidth="2.1" />
        <line x1="242.71" y1="672" x2="282.71" y2="672" strokeWidth="1.8" />
        <text
          x="290.71"
          y="679"
          textAnchor="start"
          fontSize="20"
          fontFamily={mono}
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
        >
          10
        </text>
      </g>
    </svg>
  );
}

/* БЛОК: Палитры цветов и чертёж кассеты Грильято 100×100 мм (CELL100_VARIANTS, CellScheme100)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует кассету 590×590 мм из 5 горизонтальных и 5 вертикальных планок с выносками размеров 590, 100×100, просветом 90 мм и толщиной профиля 10 мм.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Выбранный цвет colorId из калькулятора.
 * КАК ИЗМЕНИТЬ: Цвета градиентов задаются в CELL100_VARIANTS. */
const CELL100_VARIANTS: Record<
  string,
  { h: [string, string, string]; v: [string, string, string]; stroke: string; label: string }
> = {
  black: {
    h: ["#62676d", "#34383d", "#15181b"],
    v: ["#6d7278", "#3c4146", "#171a1d"],
    stroke: "#111316",
    label: "Чертёж кассеты Грильято 100×100, цвет профилей Чёрный",
  },
  white: {
    h: ["#ffffff", "#f2f4f6", "#d9dde1"],
    v: ["#ffffff", "#f6f7f8", "#d2d7dc"],
    stroke: "#68717a",
    label: "Чертёж кассеты Грильято 100×100, цвет профилей Белый",
  },
  metal: {
    h: ["#fbfcfd", "#d2d7dd", "#aab1b9"],
    v: ["#f8f9fb", "#d6dbe1", "#a5acb4"],
    stroke: "#4b535b",
    label: "Чертёж кассеты Грильято 100×100, цвет профилей Металлик",
  },
  default: {
    h: ["#fbfcfd", "#d2d7dd", "#aab1b9"],
    v: ["#f8f9fb", "#d6dbe1", "#a5acb4"],
    stroke: "#4b535b",
    label: "Чертёж кассеты Грильято 100×100, цвет профилей Металлик",
  },
};

function CellScheme100({ className, colorId = "default" }: { className?: string; colorId?: string }) {
  const variant = CELL100_VARIANTS[colorId] ?? CELL100_VARIANTS.default;
  const uid =
    colorId === "black"
      ? "cell100b"
      : colorId === "white"
        ? "cell100w"
        : colorId === "metal"
          ? "cell100m"
          : "cell100";

  const bar = 9.15;
  const barsH = [178.37, 269.9, 361.42, 452.95, 544.47];
  const barsV = [192.37, 283.9, 375.42, 466.95, 558.47];

  const mono = "'JetBrains Mono', monospace";

  return (
    <svg
      viewBox="0 0 760 760"
      className={className}
      role="img"
      aria-label={variant.label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-barH`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={variant.h[0]} />
          <stop offset="50%" stopColor={variant.h[1]} />
          <stop offset="100%" stopColor={variant.h[2]} />
        </linearGradient>
        <linearGradient id={`${uid}-barV`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={variant.v[0]} />
          <stop offset="50%" stopColor={variant.v[1]} />
          <stop offset="100%" stopColor={variant.v[2]} />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-4%" y="-4%" width="108%" height="108%">
          <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodColor="#000000" floodOpacity="0.3" />
        </filter>
        <marker
          id={`${uid}-arr`}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path d="M 0,1 L 11,6 L 0,11 Z" fill="#0f1216" />
        </marker>
      </defs>

      <g filter={`url(#${uid}-soft)`}>
        {barsH.map((y) => (
          <rect
            key={`h-${y}`}
            x="110"
            y={y}
            width="540"
            height={bar}
            fill={`url(#${uid}-barH)`}
            stroke={variant.stroke}
            strokeWidth="1.6"
          />
        ))}
        {barsV.map((x) => (
          <rect
            key={`v-${x}`}
            x={x}
            y="96"
            width={bar}
            height="540"
            fill={`url(#${uid}-barV)`}
            stroke={variant.stroke}
            strokeWidth="1.6"
          />
        ))}
      </g>

      <g fill="#0f1216" stroke="#0f1216">
        <line x1="110" y1="88" x2="110" y2="30" strokeWidth="1.6" />
        <line x1="650" y1="88" x2="650" y2="30" strokeWidth="1.6" />
        <line
          x1="110"
          y1="58"
          x2="650"
          y2="58"
          strokeWidth="2.1"
          markerStart={`url(#${uid}-arr)`}
          markerEnd={`url(#${uid}-arr)`}
        />
        <text
          x="380"
          y="50"
          textAnchor="middle"
          fontSize="22"
          fontFamily={mono}
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
        >
          590
        </text>

        <line x1="102" y1="96" x2="44" y2="96" strokeWidth="1.6" />
        <line x1="102" y1="636" x2="44" y2="636" strokeWidth="1.6" />
        <line
          x1="68"
          y1="96"
          x2="68"
          y2="636"
          strokeWidth="2.1"
          markerStart={`url(#${uid}-arr)`}
          markerEnd={`url(#${uid}-arr)`}
        />
        <text
          x="58"
          y="366"
          textAnchor="middle"
          fontSize="22"
          fontFamily={mono}
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
          transform="rotate(-90 58 366)"
        >
          590
        </text>

        <rect
          x="384.58"
          y="462.1"
          width="91.53"
          height="91.53"
          fill="none"
          stroke="#0f1216"
          strokeWidth="2.4"
          strokeDasharray="6 4"
        />
        <line x1="430.34" y1="553.63" x2="430.34" y2="672" strokeWidth="1.6" strokeDasharray="5 4" />
        <line x1="430.34" y1="672" x2="528.6" y2="672" strokeWidth="1.8" />
        <text
          x="536.6"
          y="679"
          textAnchor="start"
          fontSize="27"
          fontFamily={mono}
          fontWeight="800"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="5"
          paintOrder="stroke"
        >
          100×100
        </text>

        <line x1="110" y1="644" x2="110" y2="690" strokeWidth="1.6" />
        <line x1="192.37" y1="644" x2="192.37" y2="690" strokeWidth="1.6" />
        <line x1="283.9" y1="644" x2="283.9" y2="690" strokeWidth="1.6" />
        <line x1="293.05" y1="644" x2="293.05" y2="690" strokeWidth="1.6" />

        <line
          x1="110"
          y1="672"
          x2="192.37"
          y2="672"
          strokeWidth="2.1"
          markerStart={`url(#${uid}-arr)`}
          markerEnd={`url(#${uid}-arr)`}
        />
        <text
          x="151.19"
          y="707"
          textAnchor="middle"
          fontSize="20"
          fontFamily={mono}
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
        >
          90
        </text>

        <line x1="283.9" y1="672" x2="293.05" y2="672" strokeWidth="2.1" />
        <line x1="288.47" y1="672" x2="328.47" y2="672" strokeWidth="1.8" />
        <text
          x="336.47"
          y="679"
          textAnchor="start"
          fontSize="20"
          fontFamily={mono}
          fontWeight="700"
          fill="#0f1216"
          stroke="#ffffff"
          strokeWidth="4"
          paintOrder="stroke"
        >
          10
        </text>
      </g>
    </svg>
  );
}

/* БЛОК: Переключатель чертежей кассет по размеру ячейки (CellScheme)
 * ЗА ЧТО ОТВЕЧАЕТ: Выбирает точный чертёж CellScheme50, CellScheme75 или CellScheme100, а для любого иного числа строит автоматический контурный чертёж.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Число mm и код цвета colorId из CellSchemePreview.tsx.
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
export function CellScheme({
  mm,
  className,
  colorId,
}: {
  mm: number;
  className?: string;
  colorId?: string;
}) {
  if (mm === 50) return <CellScheme50 className={className} colorId={colorId} />;
  if (mm === 75) return <CellScheme75 className={className} colorId={colorId} />;
  if (mm === 100) return <CellScheme100 className={className} colorId={colorId} />;
  const parts = PARTITIONS[mm] ?? 5;
  const step = GRID.side / (parts + 1);
  const verticals = Array.from({ length: parts }, (_, i) => Math.round(GRID.x + step * (i + 1)));
  const horizontals = Array.from({ length: parts }, (_, i) => Math.round(GRID.y + step * (i + 1)));

  const right = GRID.x + GRID.side;
  const bottom = GRID.y + GRID.side;

  return (
    <svg
      viewBox="0 0 700 780"
      className={className}
      role="img"
      aria-label={`Схема ячейки Грильято ${mm}×${mm} мм`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="700" height="780" fill="#ffffff" />

      <text
        x={345}
        y={64}
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="44"
        fontWeight="700"
        fill={DIM_TEXT}
      >
        {mm}×{mm}
      </text>

      <g stroke={DIM} strokeWidth="1.6" fill="none">
        <line x1={GRID.x} y1={GRID.y - 4} x2={GRID.x} y2={92} />
        <line x1={right} y1={GRID.y - 4} x2={right} y2={92} />
        <line x1={GRID.x} y1={110} x2={right} y2={110} />
        <line x1={GRID.x - 8} y1={118} x2={GRID.x + 8} y2={102} />
        <line x1={right - 8} y1={118} x2={right + 8} y2={102} />
      </g>
      <text
        x={345}
        y={98}
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="30"
        fontWeight="700"
        fill={DIM_TEXT}
      >
        590
      </text>

      <g stroke={DIM} strokeWidth="1.6" fill="none">
        <line x1={GRID.x - 4} y1={GRID.y} x2={58} y2={GRID.y} />
        <line x1={GRID.x - 4} y1={bottom} x2={58} y2={bottom} />
        <line x1={65} y1={GRID.y} x2={65} y2={bottom} />
        <line x1={57} y1={GRID.y + 8} x2={73} y2={GRID.y - 8} />
        <line x1={57} y1={bottom + 8} x2={73} y2={bottom - 8} />
      </g>
      <text
        x={46}
        y={385}
        textAnchor="middle"
        transform="rotate(-90 46 385)"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="30"
        fontWeight="700"
        fill={DIM_TEXT}
      >
        590
      </text>

      <g stroke={DIM} strokeWidth="1.5" fill="none">
        <line x1={500} y1={170} x2={628} y2={170} />
        <line x1={GRID.x} y1={200} x2={628} y2={200} />
        <line x1={620} y1={170} x2={620} y2={200} />
        <line x1={612} y1={178} x2={628} y2={162} />
        <line x1={612} y1={208} x2={628} y2={192} />
      </g>
      <text
        x={636}
        y={194}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="26"
        fontWeight="700"
        fill={DIM_TEXT}
      >
        10
      </text>

      <g stroke={DIM} strokeWidth="1.5" fill="none">
        <line x1={GRID.x} y1={385} x2={628} y2={385} />
        <line x1={584} y1={330} x2={628} y2={330} />
        <line x1={620} y1={330} x2={620} y2={385} />
        <line x1={612} y1={338} x2={628} y2={322} />
        <line x1={612} y1={393} x2={628} y2={377} />
      </g>
      <text
        x={636}
        y={368}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="26"
        fontWeight="700"
        fill={DIM_TEXT}
      >
        40
      </text>

      <rect
        x={GRID.x}
        y={GRID.y}
        width={GRID.side}
        height={GRID.side}
        fill="#ffffff"
        stroke={GRID_LINE}
        strokeWidth="2.4"
      />
      <g stroke={GRID_LINE} strokeWidth="1.8">
        {verticals.map((x) => (
          <g key={`v${x}`}>
            <line x1={x - 4} y1={GRID.y} x2={x - 4} y2={bottom} />
            <line x1={x + 4} y1={GRID.y} x2={x + 4} y2={bottom} />
          </g>
        ))}
        {horizontals.map((y) => (
          <g key={`h${y}`}>
            <line x1={GRID.x} y1={y - 4} x2={right} y2={y - 4} />
            <line x1={GRID.x} y1={y + 4} x2={right} y2={y + 4} />
          </g>
        ))}
      </g>

      <g stroke={GRID_LINE} strokeWidth="2.2">
        <line x1={270} y1={640} x2={270} y2={692} />
        <line x1={284} y1={640} x2={284} y2={692} />
        <line x1={440} y1={640} x2={440} y2={692} />
        <line x1={454} y1={640} x2={454} y2={692} />
      </g>
      <text
        x={316}
        y={684}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="30"
        fontWeight="700"
        fill={DIM_TEXT}
      >
        40
      </text>
      <text
        x={486}
        y={684}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="30"
        fontWeight="700"
        fill={DIM_TEXT}
      >
        10
      </text>
    </svg>
  );
}

export default CellScheme;
