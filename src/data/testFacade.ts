/* ============================================================================
 * ФАЙЛ: src/data/testFacade.ts — Режимы фасада, фронтоны и смещение H-профиля (страница «Тест»)
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит настройки тестового фасада (обычный фасад, фасад с фронтоном, отдельный фронтон,
 *   ломаный фронтон с изломом), геометрию кровли и режим смещения H-профиля («Самый выгодный» — минимум остатков,
 *   «Симметрично» — зеркальная раскладка панелей слева и справа), а также считает раскрой панелей и спецификацию.
 *   Контур кровли хранится как ломаная profile: 3 точки у треугольного фронтона, 5 у ломаного — по ней
 *   обрезаются ряды панелей и считается длина J профиля.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Габариты панелей, профилей и формулы прямоугольного фасада — src/data/siding.ts;
 *   сохранённые настройки — localStorage (ключи "test:facade-shape" и "test:siding-input").
 * КАК ИЗМЕНИТЬ: Стартовые параметры — DEFAULT_TEST_FACADE; правило симметричной раскладки — getSeamRule();
 *   подбор выгодного смещения — resolveSeamPositions() (сравнивает кандидатов по числу закупаемых панелей).
 * ========================================================================= */

import {
  SIDING_ELEMENTS,
  calcSiding,
  clampOpening,
  openingLetter,
  openingPerimeterMm,
  rowSegments,
  type FacadeOpening,
  type PanelCut,
  type SidingCalc,
  type SidingInput,
  type SidingPiece,
} from "./siding";

export type TestFacadeMode = "side" | "side-gable" | "gable" | "broken-gable";

/** Раскладка вертикальных стыков H-профиля: четыре независимых варианта, активен ровно один.
 *  «Самый выгодный» — автоматический подбор (сетка слева, сетка справа, симметрия, равномерная)
 *  по минимуму закупаемых панелей; «Симметрично» — зеркально от центра;
 *  «Слева» — целые планки 3 м от левого края, подрезка справа;
 *  «Справа» — зеркально: целые планки от правого края, подрезка слева. */
export type HProfilePlacement = "optimal" | "symmetric" | "left" | "right";

export const H_PROFILE_PLACEMENTS: { id: HProfilePlacement; label: string; hint: string }[] = [
  { id: "optimal", label: "Самый выгодный", hint: "Автоподбор: из вариантов «Симметрично», «Слева» и «Справа» выбирается самый дешёвый." },
  { id: "symmetric", label: "Симметрично", hint: "Раскладка зеркальна: левая и правая части фасада выглядят одинаково." },
  { id: "left", label: "Слева", hint: "Цельные планки начинаются от левого края, подрезка уходит вправо." },
  { id: "right", label: "Справа", hint: "Цельные планки начинаются от правого края, подрезка уходит влево." },
];

export const TEST_FACADE_MODES = [
  { id: "side", label: "Одна сторона" },
  { id: "side-gable", label: "Одна сторона с фронтоном" },
  { id: "gable", label: "Фронтон" },
  { id: "broken-gable", label: "Ломаный фронтон" },
] as const;

export interface GableParameters {
  height: number;
  apexOffset: number;
}

/** Тип фронтона над фасадом: треугольный или ломаный */
export type GableShape = "gable" | "broken";

/** Тип фронтона над фасадом: «none» — стена без фронтона (верх оформляется финишной планкой) */
export type SideGableShape = GableShape | "none";

/** Пять вариантов блока «Тип фронтона»:
 *  none / with-gable / with-broken — стена фасада (без фронтона, с треугольным, с ломаным);
 *  gable / broken-gable — только фронтон без стены (те же режимы, что в верхней панели). */
export type GableType = "none" | "with-gable" | "with-broken" | "gable" | "broken-gable";

export const GABLE_TYPE_OPTIONS: { id: GableType; label: string }[] = [
  { id: "none", label: "Без фронтона" },
  { id: "with-gable", label: "С фронтоном" },
  { id: "with-broken", label: "С ломаным фронтоном" },
  { id: "gable", label: "Фронтон" },
  { id: "broken-gable", label: "Ломаный фронтон" },
];

/** Фронтон над фасадом: помимо высоты и смещения вершины хранит тип и параметры излома */
export interface SideGableParameters extends GableParameters {
  shape: SideGableShape;
  /** Высота излома над основанием, м */
  breakHeight: number;
  /** Отступ излома от края основания по горизонтали, м */
  breakInset: number;
}

/** Ломаный (мансардный) фронтон: по два ската с каждой стороны и излом между ними */
export interface BrokenGableParameters extends GableParameters {
  width: number;
  /** Высота излома над основанием, м */
  breakHeight: number;
  /** Отступ излома от края основания по горизонтали, м */
  breakInset: number;
}

export interface TestFacadeSettings {
  mode: TestFacadeMode;
  sideGable: SideGableParameters;
  gable: GableParameters & { width: number };
  brokenGable: BrokenGableParameters;
  hPlacement: HProfilePlacement;
}

/** Точка верхнего контура кровли: метры от левого края и от земли */
export interface ProfilePoint {
  x: number;
  y: number;
}

export interface GableGeometry {
  mode: "side-gable" | "gable" | "broken-gable";
  /** Тип кровли: треугольная или ломаная — форма не зависит от того, над фасадом фронтон или отдельно */
  shape: GableShape;
  width: number;
  wallHeight: number;
  gableHeight: number;
  totalHeight: number;
  apexX: number;
  apexOffset: number;
  leftSlope: number;
  rightSlope: number;
  /** Верхний контур кровли слева направо: 3 точки у треугольного фронтона, 5 у ломаного */
  profile: ProfilePoint[];
  /** Индекс вершины в profile */
  apexIndex: number;
  /** Высота и отступ излома (0 у треугольного фронтона) */
  breakHeight: number;
  breakInset: number;
  /** Площадь фронтона, м² */
  gableArea: number;
  /** Суммарная длина всех скатов, м */
  slopeLength: number;
}

/** Пределы ломаного фронтона: излом не выходит за 45 % ширины, вершина остаётся между изломами */
export const BROKEN_GABLE_LIMITS = {
  width: { min: 0.5, max: 100 },
  height: { min: 0.3, max: 20 },
  breakHeightMin: 0.05,
  breakInsetMin: 0.05,
  breakInsetRatio: 0.45,
  apexGap: 0.05,
};

/** Готовые пропорции ломаного фронтона: доля высоты и ширины для излома */
export const BROKEN_GABLE_PRESETS: { id: string; label: string; hint: string; heightRatio: number; insetRatio: number }[] = [
  { id: "mansard", label: "Мансарда", hint: "Крутой нижний скат, пологий верхний — больше места под кровлей", heightRatio: 0.6, insetRatio: 0.17 },
  { id: "dutch", label: "Голландский", hint: "Сдержанный излом — классический ломаный фронтон", heightRatio: 0.45, insetRatio: 0.25 },
  { id: "shallow", label: "Пологий", hint: "Низкий излом и широкая верхняя часть", heightRatio: 0.3, insetRatio: 0.33 },
];

export const DEFAULT_TEST_FACADE: TestFacadeSettings = {
  /* По умолчанию на странице «Сайдинг» выбран тип фасада «Без фронтона» */
  mode: "side-gable",
  sideGable: { height: 2.4, apexOffset: 0, shape: "none", breakHeight: 1.4, breakInset: 0.8 },
  gable: { width: 6, height: 2.4, apexOffset: 0 },
  brokenGable: { width: 6, height: 3, breakHeight: 1.8, breakInset: 1, apexOffset: 0 },
  hPlacement: "optimal",
};

/* БЛОК: Стандартные цвета тестового фасада (TEST_FACADE_STANDARD_COLORS)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт стандартный набор для вариантов «Без фронтона», «С фронтоном»
 *   и «С ломаным фронтоном»: сайдинг бежевый, все доборные элементы коричневые.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Палитра SIDING_COLORS и каталог товаров MONLID (src/data/siding.ts, sidingCatalog.ts).
 * КАК ИЗМЕНИТЬ: Замените id цветов на любые доступные: white, gray, ivory, vanilla, green, brown. */
export const TEST_FACADE_STANDARD_COLORS = {
  colorId: "ivory",
  trimColors: {
    hProfile: "brown",
    finish: "brown",
    jamb: "brown",
    jProfile: "brown",
    innerCorner: "brown",
    outerCorner: "brown",
  },
} as const;

/* БЛОК: Применение стандартных цветов и обрамления проёмов (withStandardFacadeColors)
 * ЗА ЧТО ОТВЕЧАЕТ: Ставит бежевый сайдинг, коричневые доборные элементы, а окну и двери — J профиль.
 *   Размеры, положение и количество проёмов не меняются.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Ввод калькулятора целиком.
 * КАК ИЗМЕНИТЬ: Цвета — в TEST_FACADE_STANDARD_COLORS; вид обрамления — в openings ниже. */
export function withStandardFacadeColors(input: SidingInput): SidingInput {
  return {
    ...input,
    colorId: TEST_FACADE_STANDARD_COLORS.colorId,
    trimColors: { ...TEST_FACADE_STANDARD_COLORS.trimColors },
    singleColor: false,
    openings: input.openings.map((opening) => ({ ...opening, trim: "j" as const })),
  };
}

const STORAGE_KEY = "test:facade-shape";
const round2 = (n: number) => Math.round(n * 100) / 100;
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

export function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return fallback;
  const parsed = typeof value === "number" ? value : Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? round2(Math.max(min, Math.min(max, parsed))) : fallback;
}

export function clampApexOffset(offset: number, width: number): number {
  return Math.max(-width / 2, Math.min(width / 2, offset));
}

/** Максимальный отступ излома от края: не больше 45 % ширины основания */
export function maxBrokenInset(width: number): number {
  return round2(Math.max(BROKEN_GABLE_LIMITS.breakInsetMin, width * BROKEN_GABLE_LIMITS.breakInsetRatio));
}

/** Вершина ломаного фронтона остаётся между изломами — предел смещения зависит от отступа */
export function maxBrokenApexOffset(width: number, inset: number): number {
  return round2(Math.max(0, width / 2 - inset - BROKEN_GABLE_LIMITS.apexGap));
}

export function sanitizeTestFacade(raw: unknown): TestFacadeSettings {
  const source = record(raw);
  const side = record(source.sideGable);
  const gable = record(source.gable);
  const broken = record(source.brokenGable);
  const width = boundedNumber(gable.width, 6, 0.5, 100);
  const brokenWidth = boundedNumber(broken.width, 6, BROKEN_GABLE_LIMITS.width.min, BROKEN_GABLE_LIMITS.width.max);
  const brokenHeight = boundedNumber(broken.height, 3, BROKEN_GABLE_LIMITS.height.min, BROKEN_GABLE_LIMITS.height.max);
  const brokenInset = boundedNumber(broken.breakInset, 1, BROKEN_GABLE_LIMITS.breakInsetMin, maxBrokenInset(brokenWidth));
  const brokenApexLimit = maxBrokenApexOffset(brokenWidth, brokenInset);
  return {
    mode:
      source.mode === "side-gable" || source.mode === "gable" || source.mode === "broken-gable"
        ? source.mode
        : "side-gable",
    sideGable: {
      height: boundedNumber(side.height, 2.4, 0.1, 20),
      apexOffset: boundedNumber(side.apexOffset, 0, -50, 50),
      shape:
        source.mode === "side"
          ? "none"
          : side.shape === "broken"
            ? "broken"
            : side.shape === "none"
              ? "none"
              : "gable",
      breakHeight: boundedNumber(side.breakHeight, 1.4, BROKEN_GABLE_LIMITS.breakHeightMin, 20),
      breakInset: boundedNumber(side.breakInset, 0.8, BROKEN_GABLE_LIMITS.breakInsetMin, 50),
    },
    gable: {
      width,
      height: boundedNumber(gable.height, 2.4, 0.1, 20),
      apexOffset: clampApexOffset(boundedNumber(gable.apexOffset, 0, -50, 50), width),
    },
    brokenGable: {
      width: brokenWidth,
      height: brokenHeight,
      breakHeight: boundedNumber(
        broken.breakHeight,
        1.8,
        BROKEN_GABLE_LIMITS.breakHeightMin,
        round2(brokenHeight - 0.05),
      ),
      breakInset: brokenInset,
      apexOffset: boundedNumber(broken.apexOffset, 0, -brokenApexLimit, brokenApexLimit),
    },
    hPlacement: sanitizeHPlacement(source.hPlacement, source.hAlign),
  };
}

/** Миграция раскладки: новый формат — одно поле из четырёх (без hAlign); старый формат (placement + align)
 *  маппится без смены швов: symmetric → «Симметрично», optimal+right → «Справа»,
 *  остальное (включая optimal+left по умолчанию) → «Самый выгодный». */
function sanitizeHPlacement(rawPlacement: unknown, rawAlign: unknown): HProfilePlacement {
  const hasAlign = rawAlign === "left" || rawAlign === "right";
  if (!hasAlign) {
    if (rawPlacement === "optimal" || rawPlacement === "symmetric" || rawPlacement === "left" || rawPlacement === "right") {
      return rawPlacement;
    }
    return "optimal";
  }
  if (rawPlacement === "symmetric") return "symmetric";
  if (rawAlign === "right") return "right";
  return "optimal";
}

export function loadTestFacade(storageKey: string = STORAGE_KEY): TestFacadeSettings {
  try {
    return sanitizeTestFacade(JSON.parse(localStorage.getItem(storageKey) ?? "null"));
  } catch {
    return sanitizeTestFacade(null);
  }
}

export function saveTestFacade(settings: TestFacadeSettings, storageKey: string = STORAGE_KEY): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(sanitizeTestFacade(settings)));
  } catch {}
}

/** Текущий тип фронтона для блока «Тип фронтона» */
export function getGableType(settings: TestFacadeSettings): GableType {
  if (settings.mode === "gable") return "gable";
  if (settings.mode === "broken-gable") return "broken-gable";
  if (settings.mode === "side") return "none";
  return settings.sideGable.shape === "none"
    ? "none"
    : settings.sideGable.shape === "broken"
      ? "with-broken"
      : "with-gable";
}

/** Применяет выбранный тип: три «С…» остаются в режиме «Одна сторона с фронтоном», два отдельных переключают режим */
export function applyGableType(settings: TestFacadeSettings, type: GableType): TestFacadeSettings {
  if (type === "gable") return { ...settings, mode: "gable" };
  if (type === "broken-gable") return { ...settings, mode: "broken-gable" };
  const shape: SideGableShape = type === "none" ? "none" : type === "with-broken" ? "broken" : "gable";
  return { ...settings, mode: "side-gable", sideGable: { ...settings.sideGable, shape } };
}

export function getGableGeometry(input: SidingInput, settings: TestFacadeSettings): GableGeometry | null {
  if (settings.mode === "side") return null;
  // «Без фронтона»: стена с прямым верхом — расчёт и чертёж такие же, как у режима «Одна сторона»
  if (settings.mode === "side-gable" && settings.sideGable.shape === "none") return null;
  const standalone = settings.mode === "gable" || settings.mode === "broken-gable";
  /* Форма кровли выбирается отдельно от режима: у «Одна сторона с фронтоном» тип задаётся кнопками
     «Фронтон» / «Ломаный фронтон» в подблоке «Фронтон над фасадом» */
  const shape: GableShape =
    settings.mode === "broken-gable" || (!standalone && settings.sideGable.shape === "broken")
      ? "broken"
      : "gable";
  const broken = shape === "broken";
  const parameters =
    settings.mode === "broken-gable" ? settings.brokenGable : settings.mode === "gable" ? settings.gable : settings.sideGable;
  const breaks = standalone ? settings.brokenGable : settings.sideGable;
  const width = boundedNumber(
    "width" in parameters ? parameters.width : input.facadeLength,
    6,
    0.5,
    100,
  );
  const wallHeight = standalone ? 0 : boundedNumber(input.facadeHeight, 3, 0.5, 100);
  const gableHeight = boundedNumber(parameters.height, broken ? 3 : 2.4, broken ? BROKEN_GABLE_LIMITS.height.min : 0.1, 20);
  const breakInset = broken
    ? boundedNumber(breaks.breakInset, 1, BROKEN_GABLE_LIMITS.breakInsetMin, maxBrokenInset(width))
    : 0;
  const apexLimit = broken ? maxBrokenApexOffset(width, breakInset) : width / 2;
  const apexOffset = boundedNumber(parameters.apexOffset, 0, -apexLimit, apexLimit);
  const apexX = width / 2 + apexOffset;
  const breakHeight = broken
    ? boundedNumber(breaks.breakHeight, 1.8, BROKEN_GABLE_LIMITS.breakHeightMin, round2(gableHeight - 0.05))
    : 0;

  const totalHeight = round2(wallHeight + gableHeight);
  const breakY = round2(wallHeight + breakHeight);
  /* Контур кровли: у ломаного фронтона между краем и вершиной добавляется точка излома */
  const profile: ProfilePoint[] = broken
    ? [
        { x: 0, y: wallHeight },
        { x: breakInset, y: breakY },
        { x: apexX, y: totalHeight },
        { x: width - breakInset, y: breakY },
        { x: width, y: wallHeight },
      ]
    : [
        { x: 0, y: wallHeight },
        { x: apexX, y: totalHeight },
        { x: width, y: wallHeight },
      ];
  const apexIndex = broken ? 2 : 1;

  let leftSlope = 0;
  let rightSlope = 0;
  for (let i = 1; i < profile.length; i++) {
    const length = Math.hypot(profile[i].x - profile[i - 1].x, profile[i].y - profile[i - 1].y);
    if (i <= apexIndex) leftSlope += length;
    else rightSlope += length;
  }

  const gableArea = broken
    ? (width - breakInset) * breakHeight + ((width - 2 * breakInset) * (gableHeight - breakHeight)) / 2
    : (width * gableHeight) / 2;

  return {
    mode: settings.mode,
    shape,
    width,
    wallHeight,
    gableHeight,
    totalHeight,
    apexX,
    apexOffset,
    leftSlope,
    rightSlope,
    profile,
    apexIndex,
    breakHeight,
    breakInset,
    gableArea: round2(gableArea),
    slopeLength: round2(leftSlope + rightSlope),
  };
}

/** Край обшивки на заданной высоте: интерполяция по контуру, точки отсортированы по возрастанию y */
function boundaryAtHeight(points: ProfilePoint[], y: number): number {
  const first = points[0];
  const last = points[points.length - 1];
  if (y <= first.y) return first.x;
  if (y >= last.y) return last.x;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (y <= b.y) {
      const dy = b.y - a.y;
      return dy <= 1e-9 ? b.x : a.x + (b.x - a.x) * ((y - a.y) / dy);
    }
  }
  return last.x;
}

export function gableSpanAtHeight(geometry: GableGeometry, y: number): [number, number] {
  const { profile, apexIndex } = geometry;
  return [
    boundaryAtHeight(profile.slice(0, apexIndex + 1), y),
    boundaryAtHeight(profile.slice(apexIndex).reverse(), y),
  ];
}

export function gableHeightAtX(geometry: GableGeometry, x: number): number {
  const { apexX, width, wallHeight, gableHeight, profile } = geometry;
  if (Math.abs(x - apexX) < 1e-9) return wallHeight + gableHeight;
  /* Треугольный фронтон считаем прежней формулой — результат совпадает с обычным калькулятором бит в бит */
  if (profile.length === 3) {
    const ratio = x < apexX ? x / apexX : (width - x) / (width - apexX);
    return wallHeight + gableHeight * Math.max(0, Math.min(1, ratio));
  }
  const cx = Math.max(profile[0].x, Math.min(profile[profile.length - 1].x, x));
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1];
    const b = profile[i];
    if (cx <= b.x) {
      const dx = b.x - a.x;
      return dx <= 1e-9 ? b.y : a.y + (b.y - a.y) * ((cx - a.x) / dx);
    }
  }
  return profile[profile.length - 1].y;
}

function unionLength(intervals: [number, number][]): number {
  let end = 0;
  let length = 0;
  for (const [a, b] of intervals.sort((x, y) => x[0] - y[0])) {
    length += Math.max(0, b - Math.max(end, a));
    end = Math.max(end, b);
  }
  return length;
}

/* БЛОК: Размеры фасада в миллиметрах (facadeLengthMm, facadeHeightMm) */
function facadeLengthMm(input: SidingInput, geometry: GableGeometry | null): number {
  return Math.max(100, Math.round((geometry ? geometry.width : input.facadeLength) * 1000));
}

function facadeHeightMm(input: SidingInput, geometry: GableGeometry | null): number {
  return Math.max(100, Math.round((geometry ? geometry.totalHeight : input.facadeHeight) * 1000));
}

/* БЛОК: Проёмы с учётом формы (facadeOpenings, clampGableOpening)
 * ЗА ЧТО ОТВЕЧАЕТ: У фасада со стеной окна и двери остаются в прямоугольной части стены.
 *   У отдельных фронтонов («Фронтон», «Ломаный фронтон») дверей нет — показываются только окна,
 *   вписанные в контур кровли (треугольник или ломаная из пяти точек).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Ввод пользователя и геометрия из getGableGeometry().
 * КАК ИЗМЕНИТЬ: Минимальный размер проёма 0,1 м задан в clampOpening (src/data/siding.ts). */
function facadeOpenings(input: SidingInput, geometry: GableGeometry | null): FacadeOpening[] {
  if (geometry && geometry.mode !== "side-gable") {
    const width = geometry.width;
    const height = Math.max(0.1, geometry.gableHeight);
    return input.openings
      .filter((opening) => opening.kind === "window")
      .map((opening) => clampGableOpening(opening, geometry, clampOpening(opening, width, height)));
  }
  const width = facadeLengthMm(input, geometry) / 1000;
  const height = Math.max(0.1, geometry ? geometry.wallHeight : facadeHeightMm(input, geometry) / 1000);
  return input.openings.map((opening) => clampOpening(opening, width, height));
}

/** Вписывает окно в контур отдельного фронтона.
 *  Сначала пытаемся сохранить ширину: если верх окна упирается в узкое место у вершины,
 *  уменьшаем высоту до уровня, где скаты ещё пропускают заданную ширину. Если окно шире
 *  доступного пролёта даже у основания, уменьшаем уже ширину. Положение x сдвигаем внутрь
 *  пересечения пролётов низа и верха окна. Все размеры — в целых миллиметрах. */
export function clampGableOpening(
  opening: FacadeOpening,
  geometry: GableGeometry,
  fallback?: FacadeOpening,
): FacadeOpening {
  const base = fallback ?? clampOpening(opening, geometry.width, Math.max(0.1, geometry.gableHeight));
  const H = Math.max(0.1, geometry.gableHeight);
  const y = Math.min(Math.max(0, base.y), H - 0.1);
  let height = Math.min(base.height, H - y);
  let width = base.width;

  const spanWidthAt = (top: number) => {
    const [left, right] = gableSpanAtHeight(geometry, Math.min(H, Math.max(y, top)));
    return right - left;
  };

  // Если заданная ширина не проходит у верха окна, опускаем верх до уровня, где она проходит.
  if (spanWidthAt(y + height) < width) {
    if (spanWidthAt(y) < width) {
      width = Math.max(0.1, spanWidthAt(y));
    } else {
      let low = y;
      let high = y + height;
      for (let i = 0; i < 24; i++) {
        const mid = (low + high) / 2;
        if (spanWidthAt(mid) >= width) low = mid;
        else high = mid;
      }
      height = Math.max(0.1, low - y);
    }
  }

  const [bottomLeft, bottomRight] = gableSpanAtHeight(geometry, y);
  const [topLeft, topRight] = gableSpanAtHeight(geometry, y + height);
  const leftBound = Math.max(bottomLeft, topLeft);
  const rightBound = Math.min(bottomRight, topRight);
  width = Math.min(width, Math.max(0.1, rightBound - leftBound));

  const slMm = Math.ceil(leftBound * 1000 - 1e-9);
  const srMm = Math.floor(rightBound * 1000 + 1e-9);
  const widthMm = Math.min(Math.round(width * 1000), Math.max(100, srMm - slMm));
  const xMm = Math.min(Math.max(Math.round(base.x * 1000), slMm), Math.max(slMm, srMm - widthMm));
  return { ...base, width: widthMm / 1000, height: Math.round(height * 1000) / 1000, x: xMm / 1000, y: Math.round(y * 1000) / 1000 };
}

/* БЛОК: Правила расстановки швов H-профиля (getSeamRule)
 * ЗА ЧТО ОТВЕЧАЕТ: Четыре независимых варианта (активен ровно один):
 *   «Самый выгодный» — та же сетка 3 м от левого края, что и стандартный калькулятор (база для автоподбора);
 *   «Слева» — целые планки 3 м от левого края, подрезка справа;
 *   «Справа» — зеркально: целые планки от правого края, подрезка слева;
 *   «Симметрично» — одинаковые подрезы с двух сторон, центр зеркален.
 *   Возвращает позиции швов в мм.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Длину фасада в мм и вариант placement.
 * КАК ИЗМЕНИТЬ: Длина панели берётся из SIDING_ELEMENTS.panel.length. */
export function getSeamRule(lengthMm: number, placement: HProfilePlacement): number[] {
  const L = Math.max(100, Math.round(lengthMm));
  const panelLen = SIDING_ELEMENTS.panel.length;
  if (L <= panelLen) return [];

  if (placement === "right") {
    const seams: number[] = [];
    for (let x = L - panelLen; x > 0; x -= panelLen) seams.push(x);
    seams.sort((a, b) => a - b);
    return seams;
  }

  if (placement === "symmetric") {
    // Симметричная раскладка: [край, 3 м, 3 м, …, край], края одинаковы слева и справа.
    const middle = Math.floor(L / panelLen);
    const edge = Math.round((L - middle * panelLen) / 2);
    const seams: number[] = [];
    if (edge > 0) seams.push(edge);
    for (let i = 1; i < middle; i++) seams.push(edge + i * panelLen);
    if (edge > 0) seams.push(L - edge);
    return seams;
  }

  // «Самый выгодный» и «Слева»: сетка 3 м от левого края, подрезка справа (как стандартный калькулятор).
  const seams: number[] = [];
  for (let x = panelLen; x < L; x += panelLen) seams.push(x);
  return seams;
}

/* БЛОК: Равномерная раскладка — кандидат автоподбора «Самого выгодного» (equalSplitRule) */
function equalSplitRule(lengthMm: number): number[] {
  const L = Math.max(100, Math.round(lengthMm));
  const panelLen = SIDING_ELEMENTS.panel.length;
  const parts = Math.max(1, Math.ceil(L / panelLen));
  if (parts <= 1) return [];
  return Array.from({ length: parts - 1 }, (_, i) => Math.round(((i + 1) * L) / parts));
}

interface RawPiece {
  row: number;
  x0: number;
  x1: number;
  lenMm: number;
  near?: string;
}

/* БЛОК: Раскрой заготовок по заданным швам (buildRawPieces)
 * ЗА ЧТО ОТВЕЧАЕТ: Делит каждый ряд панели по швам H-профиля, вырезает проёмы и обрезает ряды по скатам фронтона. */
function buildRawPieces(
  input: SidingInput,
  geometry: GableGeometry | null,
  seams: number[],
): { rows: number; openings: FacadeOpening[]; raw: RawPiece[] } {
  const E = SIDING_ELEMENTS;
  const L = facadeLengthMm(input, geometry);
  const H = facadeHeightMm(input, geometry);
  const wallH = geometry ? Math.round(geometry.wallHeight * 1000) : H;
  const openings = facadeOpenings(input, geometry);
  const rows = Math.ceil(H / E.panel.height);
  const bounds = [0, ...seams.filter((x) => x > 0 && x < L), L];
  const raw: RawPiece[] = [];

  for (let row = 0; row < rows; row++) {
    const y0 = row * E.panel.height;
    const y1 = Math.min(H, y0 + E.panel.height);
    const [spanLeft, spanRight] = geometry ? gableSpanAtHeight(geometry, y0 / 1000) : [0, L / 1000];
    const minX = geometry ? Math.max(0, Math.floor(spanLeft * 1000 + 1e-7)) : 0;
    const maxX = geometry ? Math.min(L, Math.ceil(spanRight * 1000 - 1e-7)) : L;

    for (const [a, b] of rowSegments(L, y0, y1, openings)) {
      let x = Math.max(a, minX);
      const end = Math.min(b, maxX);
      while (x < end) {
        const nextBoundary = bounds.find((value) => value > x) ?? L;
        const xEnd = Math.min(end, nextBoundary);
        if (xEnd > x) {
          const nearIndex = openings.findIndex((o) =>
            o.y * 1000 < y1 && (o.y + o.height) * 1000 > y0 &&
            o.x * 1000 <= xEnd && (o.x + o.width) * 1000 >= x,
          );
          raw.push({
            row,
            x0: x,
            x1: xEnd,
            lenMm: xEnd - x,
            near: nearIndex >= 0
              ? `у ${openings[nearIndex].kind === "window" ? "Окна" : "Двери"} ${openingLetter(nearIndex)}`
              : geometry && y1 > wallH ? "подрезка по скату" : undefined,
          });
        }
        x = xEnd;
      }
    }
  }
  return { rows, openings, raw };
}

/* БЛОК: Укладка заготовок в целые панели 3 м (packRaw)
 * ЗА ЧТО ОТВЕЧАЕТ: Алгоритм Best Fit — обрезки идут в дело внутри одной панели, а повторное использование
 *   помечается номерами вида «12а». Позиции и отходы каждой панели попадают в план раскроя. */
function packRaw(raw: RawPiece[]): {
  bins: { used: number; items: RawPiece[] }[];
  pieces: SidingPiece[];
  panelPlan: PanelCut[];
} {
  const panelLen = SIDING_ELEMENTS.panel.length;
  const sorted = [...raw].sort((p, q) => q.lenMm - p.lenMm || p.row - q.row || p.x0 - q.x0);
  const bins: { used: number; items: RawPiece[] }[] = [];
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
  return { bins, pieces, panelPlan };
}

/* БЛОК: Позиции швов H-профиля (resolveSeamPositions)
 * ЗА ЧТО ОТВЕЧАЕТ: «Слева»/«Справа»/«Симметрично» возвращают свою сетку напрямую.
 *   «Самый выгодный» сравнивает кандидатов (сетка слева, сетка справа, симметрия, равномерная)
 *   по числу закупаемых панелей 3 м и берёт вариант с минимумом остатков; при равенстве —
 *   тот, где меньше швов.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Фасад, форма (geometry) и вариант placement.
 * КАК ИЗМЕНИТЬ: Набор кандидатов — массив candidates ниже. */
export function resolveSeamPositions(
  input: SidingInput,
  geometry: GableGeometry | null,
  placement: HProfilePlacement,
): number[] {
  const L = facadeLengthMm(input, geometry);
  if (placement !== "optimal") return getSeamRule(L, placement);

  const candidates = [
    getSeamRule(L, "left"),
    getSeamRule(L, "right"),
    getSeamRule(L, "symmetric"),
    equalSplitRule(L),
  ];
  let best = candidates[0];
  let bestBins = Infinity;
  let bestSeams = Infinity;
  for (const seams of candidates) {
    const { raw } = buildRawPieces(input, geometry, seams);
    const bins = packRaw(raw).bins.length;
    if (bins < bestBins || (bins === bestBins && seams.length < bestSeams)) {
      best = seams;
      bestBins = bins;
      bestSeams = seams.length;
    }
  }
  return best;
}

/* БЛОК: Отдельный расчёт тестового фасада (calcTestFacade)
 * ЗА ЧТО ОТВЕЧАЕТ: Считает раскрой и спецификацию для фронтона и для фасада с произвольным смещением
 *   H-профиля; прямоугольный фасад с сеткой швов 3 м совпадает с calcSiding из src/data/siding.ts.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Ввод, форма (geometry) и режим смещения (placement) либо готовые позиции швов.
 * КАК ИЗМЕНИТЬ: Формулы количества материалов — ниже; исходные названия и артикулы берутся из calcSiding. */
export function calcTestFacade(
  input: SidingInput,
  geometry: GableGeometry | null = null,
  placement: HProfilePlacement = "optimal",
  seamsOverride?: number[],
): SidingCalc {
  const E = SIDING_ELEMENTS;
  const L = facadeLengthMm(input, geometry);
  const H = facadeHeightMm(input, geometry);
  const wallH = geometry ? Math.round(geometry.wallHeight * 1000) : H;
  const seams = seamsOverride ?? resolveSeamPositions(input, geometry, placement);
  const gableOpenings = facadeOpenings(input, geometry);

  const base = geometry
    ? calcSiding({
        ...input,
        facadeLength: geometry.width,
        facadeHeight: geometry.wallHeight || geometry.gableHeight,
        openings: gableOpenings,
        sparePct: 0,
      })
    : calcSiding(input);

  const { rows, openings, raw } = buildRawPieces(input, geometry, seams);
  const { bins, pieces, panelPlan } = packRaw(raw);
  const sparePct = Math.min(50, Math.max(0, Number(input.sparePct) || 0));
  const withSpare = (n: number) => (n > 0 ? Math.round((n * (100 + sparePct)) / 100) : 0);

  // Длина H-профиля: по каждому шву минус высоты проёмов в месте стыка.
  let hLengthMm = 0;
  for (const sx of seams) {
    const height = geometry ? gableHeightAtX(geometry, sx / 1000) * 1000 : H;
    const covered = unionLength(openings
      .filter((o) => sx >= o.x * 1000 && sx <= (o.x + o.width) * 1000)
      .map((o) => [o.y * 1000, Math.min(height, (o.y + o.height) * 1000)] as [number, number]));
    hLengthMm += Math.max(0, height - covered);
  }
  hLengthMm = Math.ceil(hLengthMm);

  /* Скаты фронтона всегда оформляются J профилем: финишная планка по косым линиям не ставится.
     Финишная планка по верху нужна только прямоугольному фасаду («Одна сторона»). */
  const slopeMm = geometry ? (geometry.leftSlope + geometry.rightSlope) * 1000 : 0;
  const topEdgeMm = geometry ? 0 : input.straightTop ? L : 0;
  const jambOpenings = openings.filter((o) => o.trim === "jamb");
  const jambLengthMm = jambOpenings.reduce((sum, o) => sum + openingPerimeterMm(o), 0);
  const jOpeningLength = openings.filter((o) => o.trim === "j").reduce((sum, o) => sum + openingPerimeterMm(o), 0);
  const verticalJMm = (Number(input.leftEdge === "j") + Number(input.rightEdge === "j")) * (geometry ? wallH : H);
  const jTotalMm = slopeMm + jOpeningLength + verticalJMm;
  const innerCount = Number(input.leftEdge === "inner") + Number(input.rightEdge === "inner");
  const outerCount = Number(input.leftEdge === "outer") + Number(input.rightEdge === "outer");

  const quantities: Record<string, number> = {
    panel: bins.length,
    start: Math.ceil(L / E.start.length),
    h: hLengthMm > 0 ? Math.ceil(hLengthMm / E.hProfile.length) : 0,
    finish:
      Math.ceil(topEdgeMm / E.finish.length) +
      (jambLengthMm > 0 ? Math.ceil(jambLengthMm / E.finish.length) : 0),
    jamb: jambOpenings.reduce((sum, o) => sum + Math.ceil(openingPerimeterMm(o) / E.jamb.length), 0),
    j: jTotalMm > 0 ? Math.ceil(jTotalMm / E.jProfile.length) : 0,
    inner: innerCount * Math.ceil(wallH / E.innerCorner.length),
    outer: outerCount * Math.ceil(wallH / E.outerCorner.length),
  };

  const panels = withSpare(bins.length);
  const facadeArea = round2(
    geometry ? geometry.width * geometry.wallHeight + geometry.gableArea : (L * H) / 1e6,
  );
  const openingsArea = base.openingsArea;
  const netArea = round2(Math.max(0, facadeArea - openingsArea));
  const panelsArea = round2((panels * E.panel.length * E.panel.height) / 1e6);
  const wasteArea = round2(Math.max(0, panelsArea - netArea));

  return {
    ...base,
    L,
    H,
    rows,
    openings,
    panels,
    sparePct,
    pieces,
    panelPlan,
    cutLengthMm: raw.reduce((sum, piece) => sum + piece.lenMm, 0),
    seamLines: seams.length,
    hLengthMm,
    facadeArea,
    netArea,
    panelsArea,
    wasteArea,
    wastePct: netArea > 0 ? round2((wasteArea / netArea) * 100) : 0,
    table: base.table.map((item) => ({
      ...item,
      qty: withSpare(quantities[item.key] ?? 0),
      note: geometry
        ? item.key === "j"
          ? "по скатам фронтона, краям и проёмам"
          : item.key === "finish"
            ? jambLengthMm > 0
              ? "под околооконные планки"
              : "не требуется — скаты оформлены J профилем"
            : item.note
        : item.note,
    })),
  };
}
