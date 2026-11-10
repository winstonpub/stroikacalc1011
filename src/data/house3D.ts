/* ============================================================================
 * ФАЙЛ: src/data/house3D.ts — Габариты и кровля дома для «3D вида» и «Вида сверху» (страница «Тест»)
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит стартовые размеры дома (длина 6 м, ширина 6 м, высота стен 3 м, подъём крыши 2,4 м),
 *   тип и цвет кровли, допустимые пределы, проверку ввода и сохранение настроек в памяти браузера.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Значения по умолчанию заданы здесь; сохранённые размеры — localStorage, ключ "test:house-3d".
 * КАК ИЗМЕНИТЬ: Стартовые размеры — в DEFAULT_HOUSE_3D, пределы — в HOUSE_3D_LIMITS. Размеры не зависят от фасада калькулятора.
 * ========================================================================= */

export type HouseRoofType = "hip" | "gable" | "shed";
export type HouseRoofColor = "brown" | "green" | "blue" | "gray" | "white" | "light-gray";

export const ROOF_TYPES: { id: HouseRoofType; label: string }[] = [
  { id: "hip", label: "Вальмовая" },
  { id: "gable", label: "Двухскатная" },
  { id: "shed", label: "Односкатная" },
];

export const ROOF_COLORS: { id: HouseRoofColor; label: string; hex: string; shade: string; edge: string }[] = [
  { id: "brown", label: "Коричневый", hex: "#86563d", shade: "#69412f", edge: "#4b3026" },
  { id: "green", label: "Зеленый", hex: "#527359", shade: "#3a5944", edge: "#2b4334" },
  { id: "blue", label: "Синий", hex: "#496d8e", shade: "#35536f", edge: "#294156" },
  { id: "gray", label: "Серый", hex: "#626a70", shade: "#4b545b", edge: "#353e44" },
  { id: "white", label: "Белый", hex: "#f5f5ef", shade: "#d9dbd6", edge: "#a1a7a4" },
  { id: "light-gray", label: "Светло-серый", hex: "#c6ccd0", shade: "#a7b1b7", edge: "#77838b" },
];

export interface HouseDimensions {
  /** Длина дома, м */
  length: number;
  /** Ширина дома, м */
  width: number;
  /** Высота стен, м */
  height: number;
  /** Подъём крыши от верха стены до конька, м */
  roofHeight: number;
  roofType: HouseRoofType;
  roofColor: HouseRoofColor;
}

export const DEFAULT_HOUSE_3D: HouseDimensions = {
  length: 6,
  width: 6,
  height: 3,
  roofHeight: 2.4,
  roofType: "gable",
  roofColor: "gray",
};

/** Совместимость с прежним именем константы */
export const HOUSE_3D = DEFAULT_HOUSE_3D;

export const HOUSE_3D_LIMITS: Record<"length" | "width" | "height" | "roofHeight", { min: number; max: number; step: number }> = {
  length: { min: 1, max: 30, step: 0.1 },
  width: { min: 1, max: 30, step: 0.1 },
  height: { min: 1, max: 8, step: 0.1 },
  roofHeight: { min: 0, max: 6, step: 0.1 },
};

const STORAGE_KEY = "test:house-3d";

const round1 = (v: number) => Math.round(v * 10) / 10;

export function clampHouseValue(key: keyof typeof HOUSE_3D_LIMITS, value: number): number {
  const { min, max } = HOUSE_3D_LIMITS[key];
  if (!Number.isFinite(value)) return DEFAULT_HOUSE_3D[key];
  return round1(Math.min(max, Math.max(min, value)));
}

export function sanitizeHouseDimensions(raw: unknown): HouseDimensions {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const read = (key: keyof typeof HOUSE_3D_LIMITS) => {
    const n = typeof src[key] === "number" ? src[key] : Number(String(src[key] ?? "").replace(",", "."));
    return clampHouseValue(key, Number.isFinite(n) ? n : DEFAULT_HOUSE_3D[key]);
  };
  return {
    length: read("length"),
    width: read("width"),
    height: read("height"),
    roofHeight: read("roofHeight"),
    roofType: ROOF_TYPES.find((type) => type.id === src.roofType)?.id ?? DEFAULT_HOUSE_3D.roofType,
    roofColor: ROOF_COLORS.find((color) => color.id === src.roofColor)?.id ?? DEFAULT_HOUSE_3D.roofColor,
  };
}

export function loadHouseDimensions(storageKey: string = STORAGE_KEY): HouseDimensions {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { ...DEFAULT_HOUSE_3D };
    return sanitizeHouseDimensions(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_HOUSE_3D };
  }
}

export function saveHouseDimensions(dims: HouseDimensions, storageKey: string = STORAGE_KEY): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(sanitizeHouseDimensions(dims)));
  } catch {}
}

export function isDefaultHouseDimensions(dims: HouseDimensions): boolean {
  return (Object.keys(DEFAULT_HOUSE_3D) as (keyof HouseDimensions)[]).every((key) => dims[key] === DEFAULT_HOUSE_3D[key]);
}
