/* ============================================================================
 * ФАЙЛ: src/data/siding.ts — Справочник элементов и расчёт обшивки фасада ПВХ сайдингом
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит габариты всех 8 комплектующих сайдинга, стартовую конфигурацию фасада с окном и дверью, алгоритм экономного раскроя 3-метровых панелей (с повторным использованием обрезков и вычетом проёмов) и расчёт спецификации calcSiding().
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Входные размеры фасада, список проёмов, профили краёв и процент запаса (SidingInput) приходят из калькулятора src/components/SidingCalculator.tsx.
 * КАК ИЗМЕНИТЬ:
 *   — Чтобы поменять длину или высоту панели/планок (например, если длина панели станет 3660 мм вместо 3000 мм), измените числа в объекте SIDING_ELEMENTS ниже.
 *   — Чтобы поменять стартовый пример фасада при первом открытии страницы, отредактируйте DEFAULT_SIDING.
 * ========================================================================= */

import { getSidingProduct, SIDING_PRODUCTS, type SidingProductPart } from "./sidingCatalog";

/* БЛОК: Габариты всех 8 элементов системы ПВХ сайдинга в миллиметрах (SIDING_ELEMENTS)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт названия, рабочие размеры в мм (для расчёта) и текстовую подпись габарита (для таблицы спецификации и карточек на странице «Сайдинг»).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Технические характеристики ПВХ сайдинга и доборных планок длиной 3 м.
 * КАК ИЗМЕНИТЬ: Поменяйте name, length/height/width или size здесь. Артикулы и полные названия товаров находятся в src/data/sidingCatalog.ts. */
export const SIDING_ELEMENTS = {
  panel: { name: "Сайдинг ПВХ", art: "", length: 3000, height: 203, size: "3000 × 203 мм" },
  start: { name: "Стартовая планка", art: "", length: 3000, height: 50, size: "3000 × 50 мм" },
  hProfile: { name: "H профиль", art: "", width: 73, length: 3000, size: "73 мм × 3 м" },
  finish: { name: "Финишная планка", art: "", length: 3000, height: 39, size: "3000 × 39 мм" },
  jamb: { name: "Околооконная планка", art: "", width: 97, length: 3000, size: "97 мм × 3 м" },
  jProfile: { name: "J профиль", art: "", width: 41, length: 3000, size: "41 мм × 3 м" },
  innerCorner: { name: "Угол внутренний", art: "", width: 20, length: 3000, size: "20 мм × 3 м" },
  outerCorner: { name: "Угол наружный", art: "", width: 98, length: 3000, size: "98 мм × 3 м" },
} as const;

/* БЛОК: Типы проёмов, краёв фасада и начальная конфигурация по умолчанию (DEFAULT_SIDING, EDGE_LABELS)
 * ЗА ЧТО ОТВЕЧАЕТ: Описывает структуру окна/двери на фасаде, варианты оформления левого и правого края (J профиль, угол внутренний, угол наружный) и стартовый фасад 8 × 3 м.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Задаётся прямо здесь и используется при первом заходе пользователя, пока у него нет сохранённых данных в браузере.
 * КАК ИЗМЕНИТЬ: Поменяйте facadeLength, facadeHeight, sparePct или массив openings в DEFAULT_SIDING для другого стартового примера. */
export type EdgeTrim = "j" | "inner" | "outer";
export type OpeningKind = "window" | "door";
export type OpeningTrim = "j" | "jamb";

export interface FacadeOpening {
  id: string;
  kind: OpeningKind;
  trim: OpeningTrim;
  width: number;
  height: number;
  x: number;
  y: number;
}

/* БЛОК: Цвета ПВХ сайдинга (SIDING_COLORS)
 * ЗА ЧТО ОТВЕЧАЕТ: Список цветов для кнопок «Цвет сайдинга» в калькуляторе и подписи на листе печати.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Задано здесь.
 * КАК ИЗМЕНИТЬ: Поменяйте name (подпись) или hex (цвет кружка), либо добавьте новый объект в массив. */
/* БЛОК: Палитра плана фасада для выбранного цвета (SidingColor.scheme)
 * panel — фон панели; panelLine — ряд; outline — граница фасада; seam — H-профиль;
 * trim/trimEdge — доборные планки; label — подписи и повторные обрезки; tint — светлый акцент для повторных обрезков.
 * Окна, направляющие размерных линий и подписи размеров остаются нейтральными. */
export interface SidingColor {
  id: string;
  name: string;
  hex: string;
  scheme: {
    panel: string;
    panelLine: string;
    outline: string;
    seam: string;
    trim: string;
    trimEdge: string;
    label: string;
    tint: string;
  };
}

export const SIDING_COLORS: readonly SidingColor[] = [
  {
    id: "white", name: "Белый", hex: "#f7f7f4",
    scheme: { panel: "#f7f7f4", panelLine: "#d9d9d4", outline: "#8a8a80", seam: "#92938a", trim: "#e4e4de", trimEdge: "#9a9a8f", label: "#505449", tint: "#d5d8ca" },
  },
  {
    id: "gray", name: "Серый", hex: "#a3a7a8",
    scheme: { panel: "#a3a7a8", panelLine: "#858b8e", outline: "#526065", seam: "#69767c", trim: "#8b959b", trimEdge: "#5b6d77", label: "#29383f", tint: "#d6dee2" },
  },
  {
    id: "ivory", name: "Бежевый", hex: "#ece3cc",
    scheme: { panel: "#ece3cc", panelLine: "#c9bda1", outline: "#907f5d", seam: "#a18f6a", trim: "#d9cba9", trimEdge: "#aa9365", label: "#635334", tint: "#e5c987" },
  },
  {
    id: "vanilla", name: "Ваниль", hex: "#f3e1a6",
    scheme: { panel: "#f3e1a6", panelLine: "#c9b984", outline: "#9b843e", seam: "#b29a54", trim: "#ddc779", trimEdge: "#a68b36", label: "#65501f", tint: "#e6c54d" },
  },
  {
    id: "green", name: "Зелёный", hex: "#8fb38a",
    scheme: { panel: "#8fb38a", panelLine: "#719a72", outline: "#48714c", seam: "#567e56", trim: "#729970", trimEdge: "#4c724d", label: "#29452c", tint: "#c0dbb7" },
  },
  {
    id: "brown", name: "Коричневый", hex: "#8a6047",
    scheme: { panel: "#8a6047", panelLine: "#73503c", outline: "#513728", seam: "#5f3e2c", trim: "#80543c", trimEdge: "#4d3022", label: "#38261b", tint: "#b28c70" },
  },
];

export function getSidingColor(id: string): SidingColor {
  // «ivory» — прежний идентификатор цвета, оставлен для сохранённых расчётов.
  const normalized = id === "beige" ? "ivory" : id;
  return SIDING_COLORS.find((c) => c.id === normalized) ?? SIDING_COLORS[0];
}

/** Доступные цвета берутся из каталога товаров, отдельно для каждого материала. */
export function getAvailableSidingColors(part: SidingProductPart): SidingColor[] {
  return SIDING_COLORS.filter((color) => Boolean(getSidingProduct(part, color.id)));
}

/** Коричневых панелей в каталоге нет, поэтому некорректный сохранённый цвет заменяется белым. */
export function getSidingPanelColor(id: string): SidingColor {
  const color = getSidingColor(id);
  return getSidingProduct("panel", color.id) ? color : getSidingColor("white");
}

/* БЛОК: Цвета комплектующих и режим «Один цвет»
 * Доступные варианты определяются товарами в sidingCatalog.ts. Если цвет ранее сохранён, но для
 * изделия он недоступен, используется белый. В едином режиме предлагаются цвета, которые есть
 * у всех комплектующих, необходимых для текущего фасада. Стартовая планка пока без артикула. */
export type SidingTrimPart = Exclude<SidingProductPart, "panel" | "start">;

export const SIDING_TRIM_PARTS: readonly { key: SidingTrimPart; name: string }[] = [
  { key: "hProfile", name: SIDING_ELEMENTS.hProfile.name },
  { key: "finish", name: SIDING_ELEMENTS.finish.name },
  { key: "jamb", name: SIDING_ELEMENTS.jamb.name },
  { key: "jProfile", name: SIDING_ELEMENTS.jProfile.name },
  { key: "innerCorner", name: SIDING_ELEMENTS.innerCorner.name },
  { key: "outerCorner", name: SIDING_ELEMENTS.outerCorner.name },
];

export const SIDING_TRIM_ROW_KEYS: Record<SidingTrimPart, string> = {
  hProfile: "h",
  finish: "finish",
  jamb: "jamb",
  jProfile: "j",
  innerCorner: "inner",
  outerCorner: "outer",
};

export const DEFAULT_TRIM_COLORS: Record<SidingTrimPart, string> = {
  hProfile: "white",
  finish: "white",
  jamb: "white",
  jProfile: "white",
  innerCorner: "white",
  outerCorner: "white",
};

export function getTrimColor(
  input: { colorId?: string; singleColor?: boolean; trimColors?: Partial<Record<SidingTrimPart, string>> },
  part: SidingTrimPart,
): SidingColor {
  const requested = input.singleColor ? input.colorId : input.trimColors?.[part];
  const color = getSidingColor(requested ?? DEFAULT_TRIM_COLORS[part]);
  return getSidingProduct(part, color.id) ? color : getSidingColor(DEFAULT_TRIM_COLORS[part]);
}

export function normalizeTrimColors(value: unknown): Record<SidingTrimPart, string> {
  const src = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const result = { ...DEFAULT_TRIM_COLORS };
  for (const { key } of SIDING_TRIM_PARTS) {
    const color = getSidingColor(String(src[key] ?? DEFAULT_TRIM_COLORS[key]));
    result[key] = getSidingProduct(key, color.id) ? color.id : DEFAULT_TRIM_COLORS[key];
  }
  return result;
}

/** Общие цвета для панелей и всех необходимых в текущем расчёте комплектующих. */
export function getUnifiedSidingColors(rows: readonly Pick<SidingRow, "key" | "qty">[]): SidingColor[] {
  const required: SidingProductPart[] = ["panel"];
  for (const { key } of SIDING_TRIM_PARTS) {
    if (rows.some((row) => row.key === SIDING_TRIM_ROW_KEYS[key] && row.qty > 0)) required.push(key);
  }
  return getAvailableSidingColors("panel").filter((color) =>
    required.every((part) => Boolean(getSidingProduct(part, color.id))),
  );
}

export interface SidingInput {
  colorId: string;
  /** Цвета комплектующих, включая околооконную планку; если не задано — белый */
  trimColors?: Partial<Record<SidingTrimPart, string>>;
  /** «Один цвет» доступен для оттенков, общих для необходимых материалов. */
  singleColor?: boolean;
  facadeLength: number;
  facadeHeight: number;
  leftEdge: EdgeTrim;
  rightEdge: EdgeTrim;
  straightTop: boolean;
  sparePct: number;
  openings: FacadeOpening[];
}

export const DEFAULT_SIDING: SidingInput = {
  colorId: "white",
  trimColors: { ...DEFAULT_TRIM_COLORS },
  singleColor: false,
  facadeLength: 8,
  facadeHeight: 3,
  leftEdge: "outer",
  rightEdge: "outer",
  straightTop: true,
  sparePct: 0,
  openings: [
    { id: "o-1", kind: "window", trim: "jamb", width: 1.2, height: 1.4, x: 1.2, y: 0.9 },
    { id: "o-2", kind: "door", trim: "j", width: 0.9, height: 2.1, x: 5.6, y: 0 },
  ],
};

export const EDGE_LABELS: Record<EdgeTrim, string> = {
  j: "J профиль",
  inner: "Угол внутренний",
  outer: "Угол наружный",
};

export const OPENING_LETTERS = "АБВГДЕЖЗИКЛМНПРСТУФХЦЧШЩЭЮЯ";

/* БЛОК: Вспомогательные функции работы с окнами и дверьми (openingLetter, clampOpening, openingPerimeterMm, createOpening)
 * ЗА ЧТО ОТВЕЧАЕТ: Присваивает проёмам русские буквы (А, Б, В…), удерживает проёмы строго внутри границ стены, считает П-образный периметр обрамления (верх + 2 бока) и создаёт новые окно (1×1 м по центру) или дверь (0,9×2,1 м снизу по центру).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Вызывается калькулятором SidingCalculator.tsx при добавлении и редактировании проёмов.
 * КАК ИЗМЕНИТЬ: Чтобы изменить стандартный размер добавляемого окна или двери, поменяйте числа в строках const width = ... и const height = ... внутри createOpening. */
export function openingLetter(index: number): string {
  const base = OPENING_LETTERS[index % OPENING_LETTERS.length];
  const cycle = Math.floor(index / OPENING_LETTERS.length);
  return cycle > 0 ? `${base}${cycle}` : base;
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const toMm = (m: number) => Math.round(r2(Math.max(0, m)) * 1000);

export function clampOpening(o: FacadeOpening, L: number, H: number): FacadeOpening {
  const width = Math.min(Math.max(o.width, 0.1), L);
  const height = Math.min(Math.max(o.height, 0.1), H);
  const x = Math.min(Math.max(o.x, 0), Math.max(0, r2(L - width)));
  const y = Math.min(Math.max(o.y, 0), Math.max(0, r2(H - height)));
  return { ...o, width: r2(width), height: r2(height), x: r2(x), y: r2(y) };
}

export function openingPerimeterMm(o: FacadeOpening): number {
  return toMm(o.width) + 2 * toMm(o.height);
}

export function createOpening(
  kind: OpeningKind,
  facadeLength: number,
  facadeHeight: number,
): FacadeOpening {
  const width = kind === "window" ? 1 : 0.9;
  const height = kind === "window" ? 1 : 2.1;
  return clampOpening(
    {
      id: `o-${Date.now()}`,
      kind,
      trim: "j",
      width,
      height,
      x: Math.max(0, (facadeLength - width) / 2),
      y: kind === "window" ? Math.max(0, (facadeHeight - height) / 2) : 0,
    },
    facadeLength,
    facadeHeight,
  );
}

/* БЛОК: Вычисление свободных отрезков ряда и видимых частей панели вокруг проёмов (rowSegments, getVisibleSidingRects)
 * ЗА ЧТО ОТВЕЧАЕТ: Вырезает проём из горизонтального ряда 203 мм только там, где проём перекрывает всю высоту ряда целиком (чтобы полосы под окном, над окном и над дверью учитывались полностью), и находит видимые участки панели для аккуратной отрисовки номеров на схеме.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Принимает ширину/высоту фасада в мм и массив проёмов openings.
 * КАК ИЗМЕНИТЬ: Логику геометрии менять не нужно — она учитывает любые размеры и координаты проёмов. */
export function rowSegments(
  Lmm: number,
  rowY0: number,
  rowY1: number,
  openings: FacadeOpening[],
): [number, number][] {
  const cuts = openings
    .filter((o) => {
      const y0 = toMm(o.y);
      const y1 = y0 + toMm(o.height);
      return y0 <= rowY0 && y1 >= rowY1;
    })
    .map((o) => [toMm(o.x), toMm(o.x) + toMm(o.width)] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  const segments: [number, number][] = [];
  let cursor = 0;
  for (const [a, b] of cuts) {
    if (a > cursor) segments.push([cursor, Math.min(a, Lmm)]);
    cursor = Math.max(cursor, b);
    if (cursor >= Lmm) break;
  }
  if (cursor < Lmm) segments.push([cursor, Lmm]);
  return segments.filter(([a, b]) => b - a > 1);
}

export interface SidingPiece {
  row: number;
  x0: number;
  x1: number;
  lenMm: number;
  panel: number;
  pieceIndex: number;
  label: string;
  near?: string;
}

export interface SidingRectMm {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export function getVisibleSidingRects(
  piece: Pick<SidingPiece, "row" | "x0" | "x1">,
  facadeHeightMm: number,
  openings: FacadeOpening[],
): SidingRectMm[] {
  const y0 = piece.row * SIDING_ELEMENTS.panel.height;
  let visible: SidingRectMm[] = [{
    x0: piece.x0,
    x1: piece.x1,
    y0,
    y1: Math.min(y0 + SIDING_ELEMENTS.panel.height, facadeHeightMm),
  }];

  for (const opening of openings) {
    const ox0 = toMm(opening.x);
    const ox1 = ox0 + toMm(opening.width);
    const oy0 = toMm(opening.y);
    const oy1 = oy0 + toMm(opening.height);
    visible = visible.flatMap((rect) => {
      const x0 = Math.max(rect.x0, ox0);
      const x1 = Math.min(rect.x1, ox1);
      const y0 = Math.max(rect.y0, oy0);
      const y1 = Math.min(rect.y1, oy1);
      if (x0 >= x1 || y0 >= y1) return [rect];

      return [
        { ...rect, x1: x0 },
        { ...rect, x0: x1 },
        { x0, x1, y0: rect.y0, y1: y0 },
        { x0, x1, y0: y1, y1: rect.y1 },
      ].filter((part) => part.x1 > part.x0 && part.y1 > part.y0);
    });
  }

  return visible;
}

export interface PanelCut {
  panel: number;
  items: SidingPiece[];
  usedMm: number;
  wasteMm: number;
}

export interface SidingRow {
  key: string;
  /** Полное название товара для спецификации. */
  name: string;
  /** Короткое название для компактного листа с планом фасада. */
  shortName?: string;
  /** Выбранный цвет элемента; у стартовой планки цвет не указывается. */
  colorName?: string;
  art: string;
  size: string;
  qty: number;
  note?: string;
  accent?: boolean;
}

/* БЛОК: Главная функция раскроя панелей и расчёта комплектующих сайдинга (calcSiding)
 * ЗА ЧТО ОТВЕЧАЕТ:
 *   1. Делит стену на ряды по 203 мм и режет их по вертикальным стыкам каждые 3 м с вычетом проёмов.
 *   2. Раскладывает все заготовки по целым 3-метровым панелям (алгоритм Best Fit), чтобы обрезки шли в дело, и помечает куски одной панели номерами вида «12а», «12б».
 *   3. Считает H-профиль (без участков за проёмами), стартовую и финишную планки, околооконные планки, J-профили и углы, после чего применяет процентный запас withSpare().
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Входные данные SidingInput, размеры элементов из SIDING_ELEMENTS и названия/артикулы из SIDING_PRODUCTS.
 * КАК ИЗМЕНИТЬ: Пояснения в колонке «Применение» таблицы спецификации редактируются в поле note каждого объекта внутри массива table. */
export function calcSiding(input: SidingInput) {
  const E = SIDING_ELEMENTS;
  const L = Math.max(toMm(input.facadeLength), 100);
  const H = Math.max(toMm(input.facadeHeight), 100);
  const openings = input.openings.map((o) => clampOpening(o, L / 1000, H / 1000));
  const panelLen = E.panel.length;
  const sparePct = Math.min(50, Math.max(0, Number(input.sparePct) || 0));
  const withSpare = (baseQty: number) =>
    baseQty > 0 ? Math.round((baseQty * (100 + sparePct)) / 100) : 0;

  const rows = Math.ceil(H / E.panel.height);

  interface RawPiece {
    row: number;
    x0: number;
    x1: number;
    lenMm: number;
    near?: string;
  }
  const raw: RawPiece[] = [];

  for (let r = 0; r < rows; r++) {
    const y0 = r * E.panel.height;
    const y1 = Math.min((r + 1) * E.panel.height, H);
    for (const [a, b] of rowSegments(L, y0, y1, openings)) {
      let x = a;
      while (x < b) {
        const nextGrid = (Math.floor(x / panelLen) + 1) * panelLen;
        const xEnd = Math.min(b, nextGrid);
        const nearIndex = openings.findIndex((o) => {
          const oy0 = toMm(o.y);
          const oy1 = oy0 + toMm(o.height);
          if (!(oy0 < y1 && oy1 > y0)) return false;
          const ox0 = toMm(o.x);
          const ox1 = ox0 + toMm(o.width);
          return ox0 <= xEnd && ox1 >= x;
        });
        raw.push({
          row: r,
          x0: x,
          x1: xEnd,
          lenMm: xEnd - x,
          near:
            nearIndex >= 0
              ? `у ${openings[nearIndex].kind === "window" ? "Окна" : "Двери"} ${openingLetter(nearIndex)}`
              : undefined,
        });
        x = xEnd;
      }
    }
  }

  const sorted = [...raw].sort(
    (p, q) => q.lenMm - p.lenMm || p.row - q.row || p.x0 - q.x0,
  );
  interface Bin {
    used: number;
    items: RawPiece[];
  }
  const bins: Bin[] = [];
  for (const piece of sorted) {
    let best = -1;
    let bestLeft = Infinity;
    bins.forEach((bin, i) => {
      const left = panelLen - bin.used - piece.lenMm;
      if (left >= 0 && left < bestLeft) {
        bestLeft = left;
        best = i;
      }
    });
    if (best >= 0) {
      bins[best].used += piece.lenMm;
      bins[best].items.push(piece);
    } else {
      bins.push({ used: piece.lenMm, items: [piece] });
    }
  }

  const PIECE_LETTERS = "абвгдежзиклмнопрстуфхцчшщэюя";
  const pieces: SidingPiece[] = [];
  const panelPlan: PanelCut[] = bins.map((bin, binIndex) => {
    const items = [...bin.items]
      .sort((a, b) => a.row - b.row || a.x0 - b.x0)
      .map((p, pieceIndex) => {
        const piece: SidingPiece = {
          row: p.row,
          x0: p.x0,
          x1: p.x1,
          lenMm: p.lenMm,
          panel: binIndex + 1,
          pieceIndex,
          label:
            bin.items.length > 1
              ? `${binIndex + 1}${PIECE_LETTERS[pieceIndex % PIECE_LETTERS.length]}`
              : `${binIndex + 1}`,
          near: p.near,
        };
        pieces.push(piece);
        return piece;
      });
    return { panel: binIndex + 1, items, usedMm: bin.used, wasteMm: panelLen - bin.used };
  });
  pieces.sort((a, b) => a.row - b.row || a.x0 - b.x0);

  const basePanels = bins.length;
  const panels = withSpare(basePanels);
  const cutLengthMm = raw.reduce((sum, p) => sum + p.lenMm, 0);

  const seamLines = Math.max(0, Math.ceil(L / panelLen) - 1);
  let hLengthMm = 0;
  for (let s = 1; s <= seamLines; s++) {
    const sx = s * panelLen;
    let covered = 0;
    for (const o of openings) {
      const ox0 = toMm(o.x);
      const ox1 = ox0 + toMm(o.width);
      if (sx >= ox0 && sx <= ox1) covered += toMm(o.height);
    }
    hLengthMm += Math.max(0, H - Math.min(covered, H));
  }
  const baseH = hLengthMm > 0 ? Math.ceil(hLengthMm / E.hProfile.length) : 0;
  const hPieces = withSpare(baseH);

  const baseStart = Math.ceil(L / E.start.length);
  const startPieces = withSpare(baseStart);

  const jambOpenings = openings.filter((o) => o.trim === "jamb");
  const jambLengthMm = jambOpenings.reduce((sum, o) => sum + openingPerimeterMm(o), 0);
  const baseJamb = jambOpenings.reduce(
    (sum, o) => sum + Math.ceil(openingPerimeterMm(o) / E.jamb.length),
    0,
  );
  const jambPieces = withSpare(baseJamb);
  const jambFinishPieces = jambLengthMm > 0 ? Math.ceil(jambLengthMm / E.finish.length) : 0;

  const topFinishPieces = input.straightTop ? Math.ceil(L / E.finish.length) : 0;
  const baseFinish = topFinishPieces + jambFinishPieces;
  const finishPieces = withSpare(baseFinish);

  const jOpenings = openings.filter((o) => o.trim === "j");
  const jOpeningLength = jOpenings.reduce((sum, o) => sum + openingPerimeterMm(o), 0);
  const jEdgeCount = Number(input.leftEdge === "j") + Number(input.rightEdge === "j");
  const jLengthMm = jOpeningLength + jEdgeCount * H;
  const baseJ = jLengthMm > 0 ? Math.ceil(jLengthMm / E.jProfile.length) : 0;
  const jPieces = withSpare(baseJ);

  const innerCount = Number(input.leftEdge === "inner") + Number(input.rightEdge === "inner");
  const outerCount = Number(input.leftEdge === "outer") + Number(input.rightEdge === "outer");
  const baseInner = innerCount * Math.ceil(H / E.innerCorner.length);
  const baseOuter = outerCount * Math.ceil(H / E.outerCorner.length);
  const innerPieces = withSpare(baseInner);
  const outerPieces = withSpare(baseOuter);

  const facadeArea = r2((L * H) / 1e6);
  const openingsArea = r2(openings.reduce((sum, o) => sum + toMm(o.width) * toMm(o.height), 0) / 1e6);
  const netArea = r2(Math.max(0, facadeArea - openingsArea));
  const panelsArea = r2((panels * E.panel.length * E.panel.height) / 1e6);
  const wasteArea = r2(Math.max(0, panelsArea - netArea));
  const wastePct = netArea > 0 ? r2((wasteArea / netArea) * 100) : 0;

  const panelColor = getSidingPanelColor(input.colorId);
  const panelProduct = getSidingProduct("panel", panelColor.id) ?? SIDING_PRODUCTS.panel.white;
  const trimProduct = (part: SidingTrimPart) =>
    getSidingProduct(part, getTrimColor(input, part).id) ?? SIDING_PRODUCTS[part].white;

  const table: SidingRow[] = [
    {
      key: "panel",
      name: panelProduct.name,
      shortName: E.panel.name,
      art: panelProduct.art,
      colorName: panelColor.name,
      size: E.panel.size,
      qty: panels,
      note: "горизонтально, без перехлёста · обрезки в дело",
      accent: true,
    },
    {
      key: "start",
      name: (getSidingProduct("start", "white") ?? SIDING_PRODUCTS.start.white).name,
      shortName: E.start.name,
      art: (getSidingProduct("start", "white") ?? SIDING_PRODUCTS.start.white).art,
      colorName: "Белый",
      size: E.start.size,
      qty: startPieces,
      note: "по низу фасада",
    },
    {
      key: "h",
      name: trimProduct("hProfile").name,
      shortName: E.hProfile.name,
      art: trimProduct("hProfile").art,
      colorName: getTrimColor(input, "hProfile").name,
      size: E.hProfile.size,
      qty: hPieces,
      note:
        seamLines > 0
          ? `стыков: ${seamLines} · за проёмами не ставится`
          : "стыков нет",
    },
    {
      key: "finish",
      name: trimProduct("finish").name,
      shortName: E.finish.name,
      art: trimProduct("finish").art,
      colorName: getTrimColor(input, "finish").name,
      size: E.finish.size,
      qty: finishPieces,
      note:
        [input.straightTop ? "верх фасада" : null, jambFinishPieces > 0 ? "под околооконные планки" : null]
          .filter(Boolean)
          .join(" + ") || "не требуется",
    },
    {
      key: "jamb",
      name: trimProduct("jamb").name,
      shortName: E.jamb.name,
      art: trimProduct("jamb").art,
      colorName: getTrimColor(input, "jamb").name,
      size: E.jamb.size,
      qty: jambPieces,
      note: jambOpenings.length > 0 ? `проёмов: ${jambOpenings.length} (3 стороны)` : "не требуется",
    },
    {
      key: "j",
      name: trimProduct("jProfile").name,
      shortName: E.jProfile.name,
      art: trimProduct("jProfile").art,
      colorName: getTrimColor(input, "jProfile").name,
      size: E.jProfile.size,
      qty: jPieces,
      note:
        [
          jOpenings.length > 0 ? `проёмы: ${jOpenings.length}` : null,
          jEdgeCount > 0 ? `края фасада: ${jEdgeCount}` : null,
        ]
          .filter(Boolean)
          .join(" + ") || "не требуется",
    },
    {
      key: "inner",
      name: trimProduct("innerCorner").name,
      shortName: E.innerCorner.name,
      art: trimProduct("innerCorner").art,
      colorName: getTrimColor(input, "innerCorner").name,
      size: E.innerCorner.size,
      qty: innerPieces,
      note: innerCount > 0 ? `краёв: ${innerCount}` : "не требуется",
    },
    {
      key: "outer",
      name: trimProduct("outerCorner").name,
      shortName: E.outerCorner.name,
      art: trimProduct("outerCorner").art,
      colorName: getTrimColor(input, "outerCorner").name,
      size: E.outerCorner.size,
      qty: outerPieces,
      note: outerCount > 0 ? `краёв: ${outerCount}` : "не требуется",
    },
  ];

  return {
    L,
    H,
    openings,
    rows,
    sparePct,
    panels,
    pieces,
    panelPlan,
    cutLengthMm,
    seamLines,
    hLengthMm,
    facadeArea,
    openingsArea,
    netArea,
    panelsArea,
    wasteArea,
    wastePct,
    table,
  };
}

export type SidingCalc = ReturnType<typeof calcSiding>;
