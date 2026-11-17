/* ============================================================================
 * ФАЙЛ: src/data/roofShapes.ts — Фигуры кровли (прямоугольная, треугольная, трапеция) и раскрой листов
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит типы и параметры трёх форм ската («Прямоугольная», «Треугольная», «Трапеция»),
 *   проверяет введённые размеры, строит точный контур ската, вычисляет длины боковых рёбер и площадь,
 *   а для треугольной и трапециевидной кровли раскладывает листы с учётом перехлёстов, отбрасывает пустые
 *   углы вне ската и повторно использует прямоугольные остатки подрезанных листов (вдоль и поперёк волны).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Параметры формы и размеры листа/перехлёстов приходят из src/components/RoofCalculator.tsx.
 * КАК ИЗМЕНИТЬ:
 *   — Подписи кнопок типов кровли меняются в массиве ROOF_SHAPE_OPTIONS.
 *   — Допустимые границы размеров меняются в ROOF_SHAPE_LIMITS.
 *   — Стартовые значения треугольника и трапеции задаются в createDefaultRoofShapes().
 * ========================================================================= */

export type RoofShape = "rect" | "triangle" | "trapezoid";

export const ROOF_SHAPE_OPTIONS: { id: RoofShape; label: string }[] = [
  { id: "rect", label: "Прямоугольная" },
  { id: "triangle", label: "Треугольная" },
  { id: "trapezoid", label: "Трапеция" },
];

export const ROOF_SHAPE_LIMITS = {
  minSize: 0.2,
  maxSize: 100,
} as const;

/** Настройки прямоугольного ската */
export interface RectRoofParams {
  roofLength: number;
  roofWidth: number;
}

/** Настройки треугольного ската: основание, высота ската и смещение вершины от центра */
export interface TriangleRoofParams {
  base: number;
  height: number;
  /** Смещение вершины от середины основания, м: 0 — равнобедренный, -base/2 — прямой угол слева, +base/2 — справа */
  apexOffset: number;
}

/** Настройки трапециевидного ската: нижнее и верхнее основания, высота ската и смещение узкого основания от центра */
export interface TrapezoidRoofParams {
  bottomBase: number;
  topBase: number;
  height: number;
  /** Смещение от оси симметрии, м: 0 — равнобедренная трапеция, крайние значения — прямоугольная трапеция */
  offset: number;
}

export interface RoofShapesStore {
  shape: RoofShape;
  rect: RectRoofParams;
  triangle: TriangleRoofParams;
  trapezoid: TrapezoidRoofParams;
}

export interface Point2D {
  x: number;
  y: number;
}

/** Геометрия выбранной фигуры в метрах и миллиметрах */
export interface RoofShapeGeometry {
  shape: RoofShape;
  /** Габарит по горизонтали, м */
  spanLength: number;
  /** Габарит по скату (высота), м */
  spanWidth: number;
  /** Точная площадь ската, м² */
  area: number;
  /** Вершины многоугольника в мм (y = 0 — верх/конёк, y = spanWidth*1000 — низ/карниз) */
  polygonMm: Point2D[];
  /** Верхнее основание в м (для трапеции) */
  topBase?: number;
  /** Нижнее основание в м (для треугольника и трапеции) */
  bottomBase?: number;
  /** Координата X верхнего левого угла (или вершины треугольника) в м */
  topLeftX?: number;
  /** Координата X нижнего левого угла в м */
  bottomLeftX?: number;
  /** Длина левого наклонного ребра, м */
  leftEdge: number;
  /** Длина правого наклонного ребра, м */
  rightEdge: number;
  /** Краткое описание размеров для сводки и печати */
  summary: string;
  /** Название фигуры */
  shapeLabel: string;
}

/** Отдельный уложенный кусок листа на треугольном или трапециевидном скате */
export interface ShapedPiece {
  key: string;
  label: string;
  sheetNo: number;
  /** true, если кусок вырезан из остатка другого листа */
  reused: boolean;
  /** Как именно использован остаток: по ширине (вдоль) или по длине (поперёк) */
  reuseAxis?: "width" | "length";
  /** Всего кусков, вырезанных из этого целого листа */
  groupSize: number;
  /** Есть ли косой рез по ребру ската */
  sloped: boolean;
  row: number;
  col: number;
  /** Прямоугольник исходной заготовки на скате в мм */
  boxXMm: number;
  boxYMm: number;
  boxWMm: number;
  boxHMm: number;
  /** Фактические размеры требуемой заготовки в мм */
  wMm: number;
  hMm: number;
  /** Многоугольник куска, обрезанный по контуру ската (мм) */
  clippedMm: Point2D[];
  /** Центр и доступные размеры видимой области для подписи номера (мм) */
  labelXMm: number;
  labelYMm: number;
  labelWMm: number;
  labelHMm: number;
  /** Выходит ли прямоугольная заготовка за контур ската (есть ли отход подрезки) */
  hasTrim: boolean;
}

/** Полоса перехлёста (в мм), готовая к отрисовке внутри clipPath ската */
export interface ShapedOverlapBand {
  key: string;
  axis: "x" | "y";
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const toMm = (meters: number) => Math.max(0, Math.round(meters * 1000));
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const fmt2 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const m2 = (v: number) => fmt2.format(r2(v));
const mc = (v: number) => fmtCompact.format(r2(v));

const LETTERS = "абвгдежзиклмнопрстуфхцчшщэюя";
function pieceSuffix(i: number) {
  const base = LETTERS[i % LETTERS.length];
  const cycle = Math.floor(i / LETTERS.length);
  return cycle > 0 ? `${base}${cycle}` : base;
}

/* БЛОК: Стартовые параметры всех трёх фигур (createDefaultRoofShapes)
 * ЗА ЧТО ОТВЕЧАЕТ: Создаёт аккуратные начальные размеры прямоугольника, равнобедренного треугольника
 *   и равнобедренной трапеции на основе стартовой длины/ширины кровли из админки. */
export function createDefaultRoofShapes(roofLength = 10, roofWidth = 6): RoofShapesStore {
  const L = clamp(Number.isFinite(roofLength) ? roofLength : 10, ROOF_SHAPE_LIMITS.minSize, ROOF_SHAPE_LIMITS.maxSize);
  const W = clamp(Number.isFinite(roofWidth) ? roofWidth : 6, ROOF_SHAPE_LIMITS.minSize, ROOF_SHAPE_LIMITS.maxSize);
  return {
    shape: "rect",
    rect: { roofLength: L, roofWidth: W },
    triangle: { base: L, height: W, apexOffset: 0 },
    trapezoid: {
      bottomBase: L,
      topBase: r2(Math.max(ROOF_SHAPE_LIMITS.minSize, L * 0.5)),
      height: W,
      offset: 0,
    },
  };
}

export function clampTriangleParams(p: TriangleRoofParams): TriangleRoofParams {
  const base = Number.isFinite(p.base) ? Math.min(ROOF_SHAPE_LIMITS.maxSize, Math.max(0, p.base)) : 0;
  const height = Number.isFinite(p.height) ? Math.min(ROOF_SHAPE_LIMITS.maxSize, Math.max(0, p.height)) : 0;
  const half = base / 2;
  const apexOffset = r3(clamp(Number.isFinite(p.apexOffset) ? p.apexOffset : 0, -half, half));
  return { base, height, apexOffset };
}

export function clampTrapezoidParams(p: TrapezoidRoofParams): TrapezoidRoofParams {
  const bottomBase = Number.isFinite(p.bottomBase) ? Math.min(ROOF_SHAPE_LIMITS.maxSize, Math.max(0, p.bottomBase)) : 0;
  const topBase = Number.isFinite(p.topBase) ? Math.min(ROOF_SHAPE_LIMITS.maxSize, Math.max(0, p.topBase)) : 0;
  const height = Number.isFinite(p.height) ? Math.min(ROOF_SHAPE_LIMITS.maxSize, Math.max(0, p.height)) : 0;
  const halfDiff = Math.abs(bottomBase - topBase) / 2;
  const offset = r3(clamp(Number.isFinite(p.offset) ? p.offset : 0, -halfDiff, halfDiff));
  return { bottomBase, topBase, height, offset };
}

/* БЛОК: Построение геометрии ската (buildRoofShapeGeometry)
 * ЗА ЧТО ОТВЕЧАЕТ: Возвращает вершины многоугольника в мм, точную площадь, длины боковых рёбер и подпись для сводки. */
export function buildRoofShapeGeometry(store: RoofShapesStore): RoofShapeGeometry {
  if (store.shape === "triangle") {
    const t = clampTriangleParams(store.triangle);
    const baseMm = toMm(t.base);
    const heightMm = toMm(t.height);
    const base = baseMm / 1000;
    const height = heightMm / 1000;
    const apexXMm = clamp(Math.round(baseMm / 2 + t.apexOffset * 1000), 0, baseMm);
    const apexX = apexXMm / 1000;
    const leftEdge = r2(Math.hypot(apexX, height));
    const rightEdge = r2(Math.hypot(base - apexX, height));
    const area = r2((baseMm * heightMm) / 2e6);
    const polygonMm: Point2D[] =
      baseMm > 0 && heightMm > 0
        ? [
            { x: apexXMm, y: 0 },
            { x: baseMm, y: heightMm },
            { x: 0, y: heightMm },
          ]
        : [];
    return {
      shape: "triangle",
      spanLength: base,
      spanWidth: height,
      area,
      polygonMm,
      bottomBase: base,
      topLeftX: apexX,
      bottomLeftX: 0,
      leftEdge,
      rightEdge,
      summary: `${m2(base)} × ${m2(height)} м`,
      shapeLabel: "Треугольная",
    };
  }

  if (store.shape === "trapezoid") {
    const tr = clampTrapezoidParams(store.trapezoid);
    const bottomMm = toMm(tr.bottomBase);
    const topMm = toMm(tr.topBase);
    const heightMm = toMm(tr.height);
    const spanMm = Math.max(bottomMm, topMm);
    const diffMm = Math.abs(bottomMm - topMm);
    const leftInsetMm = clamp(Math.round(diffMm / 2 + tr.offset * 1000), 0, diffMm);
    const rightInsetMm = diffMm - leftInsetMm;

    const topLeftMm = topMm <= bottomMm ? leftInsetMm : 0;
    const bottomLeftMm = topMm <= bottomMm ? 0 : leftInsetMm;

    const bottomBase = bottomMm / 1000;
    const topBase = topMm / 1000;
    const height = heightMm / 1000;
    const leftEdge = r2(Math.hypot(leftInsetMm / 1000, height));
    const rightEdge = r2(Math.hypot(rightInsetMm / 1000, height));
    const area = r2(((bottomMm + topMm) * heightMm) / 2e6);

    const polygonMm: Point2D[] =
      spanMm > 0 && heightMm > 0 && (bottomMm > 0 || topMm > 0)
        ? [
            { x: topLeftMm, y: 0 },
            { x: topLeftMm + topMm, y: 0 },
            { x: bottomLeftMm + bottomMm, y: heightMm },
            { x: bottomLeftMm, y: heightMm },
          ]
        : [];

    return {
      shape: "trapezoid",
      spanLength: spanMm / 1000,
      spanWidth: height,
      area,
      polygonMm,
      topBase,
      bottomBase,
      topLeftX: topLeftMm / 1000,
      bottomLeftX: bottomLeftMm / 1000,
      leftEdge,
      rightEdge,
      summary: `${mc(bottomBase)}/${mc(topBase)} × ${mc(height)}\u00A0м`,
      shapeLabel: "Трапеция",
    };
  }

  const Lmm = toMm(store.rect.roofLength);
  const Wmm = toMm(store.rect.roofWidth);
  const L = Lmm / 1000;
  const W = Wmm / 1000;
  return {
    shape: "rect",
    spanLength: L,
    spanWidth: W,
    area: r2((Lmm * Wmm) / 1e6),
    polygonMm:
      Lmm > 0 && Wmm > 0
        ? [
            { x: 0, y: 0 },
            { x: Lmm, y: 0 },
            { x: Lmm, y: Wmm },
            { x: 0, y: Wmm },
          ]
        : [],
    topBase: L,
    bottomBase: L,
    topLeftX: 0,
    bottomLeftX: 0,
    leftEdge: W,
    rightEdge: W,
    summary: `${m2(L)} × ${m2(W)} м`,
    shapeLabel: "Прямоугольная",
  };
}

/* БЛОК: Отсечение многоугольника ската прямоугольником листа (clipPolygonToRect, polygonArea)
 * ЗА ЧТО ОТВЕЧАЕТ: Вычисляет точную часть листа, попадающую внутрь треугольника или трапеции. */
function clipEdge(pts: Point2D[], inside: (p: Point2D) => boolean, intersect: (a: Point2D, b: Point2D) => Point2D): Point2D[] {
  if (pts.length === 0) return [];
  const out: Point2D[] = [];
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const prev = pts[(i + pts.length - 1) % pts.length];
    const curIn = inside(cur);
    const prevIn = inside(prev);
    if (curIn) {
      if (!prevIn) out.push(intersect(prev, cur));
      out.push(cur);
    } else if (prevIn) {
      out.push(intersect(prev, cur));
    }
  }
  return out;
}

export function clipPolygonToRect(poly: Point2D[], x0: number, y0: number, x1: number, y1: number): Point2D[] {
  if (poly.length < 3 || x1 <= x0 || y1 <= y0) return [];
  const lerpX = (a: Point2D, b: Point2D, x: number): Point2D => {
    const dx = b.x - a.x;
    const t = Math.abs(dx) < 1e-9 ? 0 : (x - a.x) / dx;
    return { x, y: a.y + (b.y - a.y) * t };
  };
  const lerpY = (a: Point2D, b: Point2D, y: number): Point2D => {
    const dy = b.y - a.y;
    const t = Math.abs(dy) < 1e-9 ? 0 : (y - a.y) / dy;
    return { x: a.x + (b.x - a.x) * t, y };
  };
  let pts = clipEdge(poly, (p) => p.x >= x0 - 1e-6, (a, b) => lerpX(a, b, x0));
  pts = clipEdge(pts, (p) => p.x <= x1 + 1e-6, (a, b) => lerpX(a, b, x1));
  pts = clipEdge(pts, (p) => p.y >= y0 - 1e-6, (a, b) => lerpY(a, b, y0));
  pts = clipEdge(pts, (p) => p.y <= y1 + 1e-6, (a, b) => lerpY(a, b, y1));
  return pts;
}

function polygonAreaAndCentroid(pts: Point2D[]): { area: number; cx: number; cy: number } {
  if (pts.length < 3) return { area: 0, cx: 0, cy: 0 };
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const cross = a.x * b.y - b.x * a.y;
    twiceArea += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  const area = Math.abs(twiceArea) / 2;
  if (area < 1e-3) {
    const sx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const sy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { area: 0, cx: sx, cy: sy };
  }
  return { area, cx: cx / (3 * twiceArea), cy: cy / (3 * twiceArea) };
}

function boundsOf(pts: Point2D[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

function countSpan(span: number, sheet: number, useful: number) {
  if (span <= 0 || sheet <= 0) return 0;
  if (span <= sheet) return 1;
  return Math.ceil((span - sheet) / useful) + 1;
}

/* БЛОК: Гильотинная укладка заготовок в целые листы без поворота (packPiecesIntoSheets)
 * ЗА ЧТО ОТВЕЧАЕТ: Раскладывает прямоугольные заготовки wMm × hMm внутри листов sheetW × sheetL
 *   строго вдоль волны (без поворота на 90°), используя остатки по ширине и по длине. */
interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
  axis: "width" | "length";
}

interface SheetBin {
  free: FreeRect[];
  items: { idx: number; axis?: "width" | "length" }[];
}

function packPiecesIntoSheets(
  items: { wMm: number; hMm: number; row: number; col: number }[],
  sheetW: number,
  sheetL: number,
): { sheetNo: number; label: string; reused: boolean; reuseAxis?: "width" | "length"; groupSize: number }[] {
  const order = items
    .map((item, idx) => ({ ...item, idx, area: item.wMm * item.hMm }))
    .sort((a, b) => b.area - a.area || b.hMm - a.hMm || b.wMm - a.wMm || a.row - b.row || a.col - b.col);

  const bins: SheetBin[] = [];

  const splitFree = (rect: FreeRect, w: number, h: number): FreeRect[] => {
    const remW = rect.w - w;
    const remH = rect.h - h;
    const out: FreeRect[] = [];
    // Выбираем разрез, оставляющий более крупный цельный остаток
    const vertMax = Math.max(remW * rect.h, w * remH);
    const horzMax = Math.max(rect.w * remH, remW * h);
    if (vertMax >= horzMax) {
      if (remW >= 10) out.push({ x: rect.x + w, y: rect.y, w: remW, h: rect.h, axis: "width" });
      if (remH >= 10) out.push({ x: rect.x, y: rect.y + h, w, h: remH, axis: "length" });
    } else {
      if (remH >= 10) out.push({ x: rect.x, y: rect.y + h, w: rect.w, h: remH, axis: "length" });
      if (remW >= 10) out.push({ x: rect.x + w, y: rect.y, w: remW, h, axis: "width" });
    }
    return out;
  };

  for (const item of order) {
    const w = Math.min(sheetW, Math.max(1, item.wMm));
    const h = Math.min(sheetL, Math.max(1, item.hMm));
    let bestBin = -1;
    let bestRect = -1;
    let bestWaste = Infinity;

    for (let b = 0; b < bins.length; b++) {
      const free = bins[b].free;
      for (let f = 0; f < free.length; f++) {
        const r = free[f];
        if (w <= r.w && h <= r.h) {
          const waste = r.w * r.h - w * h;
          if (waste < bestWaste) {
            bestWaste = waste;
            bestBin = b;
            bestRect = f;
          }
        }
      }
    }

    if (bestBin >= 0) {
      const bin = bins[bestBin];
      const chosen = bin.free[bestRect];
      bin.free.splice(bestRect, 1, ...splitFree(chosen, w, h));
      bin.items.push({ idx: item.idx, axis: chosen.axis });
    } else {
      const root: FreeRect = { x: 0, y: 0, w: sheetW, h: sheetL, axis: "width" };
      bins.push({
        free: splitFree(root, w, h),
        items: [{ idx: item.idx }],
      });
    }
  }

  // Нумеруем листы в порядке появления на кровле (сверху вниз, слева направо)
  const orderedBins = [...bins].sort((a, b) => {
    const ia = items[a.items[0].idx];
    const ib = items[b.items[0].idx];
    return ia.row - ib.row || ia.col - ib.col;
  });

  const result = new Array<{
    sheetNo: number;
    label: string;
    reused: boolean;
    reuseAxis?: "width" | "length";
    groupSize: number;
  }>(items.length);

  orderedBins.forEach((bin, bIdx) => {
    const sheetNo = bIdx + 1;
    const sorted = [...bin.items].sort((a, b) => {
      const ia = items[a.idx];
      const ib = items[b.idx];
      return ia.row - ib.row || ia.col - ib.col;
    });
    const groupSize = sorted.length;
    sorted.forEach((entry, pos) => {
      result[entry.idx] = {
        sheetNo,
        label: pos === 0 ? String(sheetNo) : `${sheetNo}${pieceSuffix(pos - 1)}`,
        reused: pos > 0,
        reuseAxis: pos > 0 ? entry.axis ?? "width" : undefined,
        groupSize,
      };
    });
  });

  return result;
}

/* БЛОК: Полный расчёт раскладки листов для треугольной и трапециевидной кровли (calcShapedRoofLayout)
 * ЗА ЧТО ОТВЕЧАЕТ: Раскладывает листы по скату, отсекает пустые углы, упаковывает обрезки в целые листы
 *   и формирует куски и полосы перехлёстов для чертежа RoofLayout. */
export function calcShapedRoofLayout(
  geometry: RoofShapeGeometry,
  sheetWidthM: number,
  sheetLengthM: number,
  overlapWidthMm: number,
  overlapLengthMm: number,
) {
  const spanLmm = toMm(geometry.spanLength);
  const spanWmm = toMm(geometry.spanWidth);
  const sheetWmm = toMm(sheetWidthM);
  const sheetLmm = toMm(sheetLengthM);
  const overlapWmm = Math.max(0, Math.round(overlapWidthMm));
  const overlapLmm = Math.max(0, Math.round(overlapLengthMm));
  const usefulWmm = Math.min(sheetWmm, Math.max(10, sheetWmm - overlapWmm));
  const usefulLmm = Math.min(sheetLmm, Math.max(10, sheetLmm - overlapLmm));

  const gridCols = countSpan(spanLmm, sheetWmm, usefulWmm);
  const gridRows = countSpan(spanWmm, sheetLmm, usefulLmm);
  const poly = geometry.polygonMm;

  // Защита от зависания на сверхбольших размерах (например, 100×100 м при крошечном листе)
  const MAX_CELLS = 2500;
  const rawCells: {
    row: number;
    col: number;
    cellX0: number;
    cellY0: number;
    cellX1: number;
    cellY1: number;
    boxXMm: number;
    boxYMm: number;
    boxWMm: number;
    boxHMm: number;
    wMm: number;
    hMm: number;
    sloped: boolean;
    hasTrim: boolean;
    clippedMm: Point2D[];
    labelXMm: number;
    labelYMm: number;
    labelWMm: number;
    labelHMm: number;
  }[] = [];

  const cellGrid = new Map<string, number>();
  const rowCounts = new Map<number, number>();

  if (poly.length >= 3 && gridCols > 0 && gridRows > 0 && gridCols * gridRows <= MAX_CELLS) {
    for (let row = 0; row < gridRows; row++) {
      const y0 = row * usefulLmm;
      const y1 = Math.min(spanWmm, y0 + sheetLmm);
      const isLastRow = row === gridRows - 1;
      const visY1 = isLastRow ? y1 : Math.min(y1, y0 + usefulLmm);

      for (let col = 0; col < gridCols; col++) {
        const x0 = col * usefulWmm;
        const x1 = Math.min(spanLmm, x0 + sheetWmm);
        const isLastCol = col === gridCols - 1;
        const visX1 = isLastCol ? x1 : Math.min(x1, x0 + usefulWmm);

        const clipped = clipPolygonToRect(poly, x0, y0, x1, y1);
        if (clipped.length < 3) continue;
        const { area, cx, cy } = polygonAreaAndCentroid(clipped);
        // Пропускаем микроскопические касания угла (< 5 см²)
        if (area < 500) continue;

        const b = boundsOf(clipped);
        const bw = b.maxX - b.minX;
        const bh = b.maxY - b.minY;
        if (bw < 2 || bh < 2) continue;

        const wMm = Math.min(sheetWmm, Math.max(1, Math.ceil(bw)));
        const hMm = Math.min(sheetLmm, Math.max(1, Math.ceil(bh)));
        const boxArea = bw * bh;
        const sloped = area < boxArea - 1000;
        const hasTrim = sloped || wMm < sheetWmm - 1 || hMm < sheetLmm - 1;

        // Видимая область ячейки (без нахлёста справа и снизу) для аккуратной подписи номера
        const visClip = clipPolygonToRect(poly, x0, y0, visX1, visY1);
        const visInfo = polygonAreaAndCentroid(visClip);
        const vb = visClip.length >= 3 ? boundsOf(visClip) : b;
        const useVis = visInfo.area >= 200;

        const idx = rawCells.length;
        cellGrid.set(`${row}:${col}`, idx);
        rowCounts.set(row, (rowCounts.get(row) ?? 0) + 1);

        rawCells.push({
          row,
          col,
          cellX0: x0,
          cellY0: y0,
          cellX1: x1,
          cellY1: y1,
          boxXMm: b.minX,
          boxYMm: b.minY,
          boxWMm: bw,
          boxHMm: bh,
          wMm,
          hMm,
          sloped,
          hasTrim,
          clippedMm: clipped,
          labelXMm: useVis ? visInfo.cx : cx,
          labelYMm: useVis ? visInfo.cy : cy,
          labelWMm: Math.max(0, (useVis ? vb.maxX - vb.minX : bw) * (sloped ? 0.62 : 0.9)),
          labelHMm: Math.max(0, (useVis ? vb.maxY - vb.minY : bh) * (sloped ? 0.62 : 0.9)),
        });
      }
    }
  }

  const packed = packPiecesIntoSheets(rawCells, sheetWmm, sheetLmm);

  let savedW = 0;
  let savedL = 0;
  const pieces: ShapedPiece[] = rawCells.map((cell, idx) => {
    const p = packed[idx];
    if (p.reused) {
      if (p.reuseAxis === "length") savedL += 1;
      else savedW += 1;
    }
    return {
      key: `sp-${cell.row}-${cell.col}`,
      label: p.label,
      sheetNo: p.sheetNo,
      reused: p.reused,
      reuseAxis: p.reuseAxis,
      groupSize: p.groupSize,
      sloped: cell.sloped,
      row: cell.row,
      col: cell.col,
      boxXMm: cell.boxXMm,
      boxYMm: cell.boxYMm,
      boxWMm: cell.boxWMm,
      boxHMm: cell.boxHMm,
      wMm: cell.wMm,
      hMm: cell.hMm,
      clippedMm: cell.clippedMm,
      labelXMm: cell.labelXMm,
      labelYMm: cell.labelYMm,
      labelWMm: cell.labelWMm,
      labelHMm: cell.labelHMm,
      hasTrim: cell.hasTrim,
    };
  });

  // Полосы перехлёстов только между реально уложенными соседними листами и внутри ската
  const overlapBands: ShapedOverlapBand[] = [];
  for (const cell of rawCells) {
    if (overlapWmm > 0 && cellGrid.has(`${cell.row}:${cell.col + 1}`)) {
      const bx0 = (cell.col + 1) * usefulWmm;
      const bx1 = Math.min(cell.cellX1, spanLmm);
      if (bx1 - bx0 > 1) {
        const clip = clipPolygonToRect(poly, bx0, cell.cellY0, bx1, cell.cellY1);
        if (polygonAreaAndCentroid(clip).area > 200) {
          overlapBands.push({
            key: `sbx-${cell.row}-${cell.col}`,
            axis: "x",
            xMm: bx0,
            yMm: cell.cellY0,
            wMm: bx1 - bx0,
            hMm: cell.cellY1 - cell.cellY0,
          });
        }
      }
    }
    if (overlapLmm > 0 && cellGrid.has(`${cell.row + 1}:${cell.col}`)) {
      const by0 = (cell.row + 1) * usefulLmm;
      const by1 = Math.min(cell.cellY1, spanWmm);
      if (by1 - by0 > 1) {
        const clip = clipPolygonToRect(poly, cell.cellX0, by0, cell.cellX1, by1);
        if (polygonAreaAndCentroid(clip).area > 200) {
          overlapBands.push({
            key: `sby-${cell.row}-${cell.col}`,
            axis: "y",
            xMm: cell.cellX0,
            yMm: by0,
            wMm: cell.cellX1 - cell.cellX0,
            hMm: by1 - by0,
          });
        }
      }
    }
  }

  let sheets = pieces.reduce((max, p) => Math.max(max, p.sheetNo), 0);
  // Запасная формула на случай сверхкрупного ската (> MAX_CELLS ячеек)
  if (rawCells.length === 0 && gridCols * gridRows > MAX_CELLS && geometry.area > 0) {
    const usefulArea = (usefulWmm * usefulLmm) / 1e6;
    sheets = Math.ceil((geometry.area / Math.max(usefulArea, 0.01)) * 1.08);
  }

  const maxColsInRow = rowCounts.size > 0 ? Math.max(...rowCounts.values()) : gridCols;
  const activeRows = rowCounts.size > 0 ? rowCounts.size : gridRows;
  const roofArea = geometry.area;
  const sheetsArea = r2((sheets * sheetWmm * sheetLmm) / 1e6);
  const wasteArea = r2(Math.max(0, sheetsArea - roofArea));
  const wastePct = sheetsArea > 0 ? (wasteArea / sheetsArea) * 100 : 0;

  return {
    columns: maxColsInRow,
    rows: activeRows,
    sheets,
    totalPieces: pieces.length,
    savedW,
    savedL,
    roofArea,
    sheetsArea,
    wasteArea,
    wastePct,
    seams: overlapBands.length,
    pieces,
    overlapBands,
    hasWaste: pieces.some((p) => p.hasTrim) || wasteArea > 0.01,
  };
}
