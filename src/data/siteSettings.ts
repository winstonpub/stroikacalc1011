/* ============================================================================
 * ФАЙЛ: src/data/siteSettings.ts — Настройки шапки, подвала и готовых размеров листа
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит заводские настройки управляемых блоков сайта (бегущая строка, выпадающий список «Калькуляторы», колонки подвала сайта и кнопки готовых размеров кровельного листа), синхронизирует их с Google-таблицей и раздаёт всем страницам.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Заводские значения берутся из DEFAULT_SETTINGS ниже и контактов STORE из src/data/grilyato.ts; актуальные опубликованные настройки подтягиваются из Google-таблицы через src/data/settingsSync.ts и кэшируются в localStorage.
 * КАК ИЗМЕНИТЬ: Все эти блоки удобнее всего редактировать без кода прямо на странице «Администрирование» (#/admin). Если нужно поменять заводские значения «по умолчанию» (к которым возвращает кнопка «Сбросить к исходным»), отредактируйте объект DEFAULT_SETTINGS ниже.
 * ========================================================================= */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { STORE } from "./grilyato";
import { SIDING_COLORS } from "./siding";
import {
  SETTINGS_REFRESH_MS,
  fetchRemoteSettings,
  isPublishConfigured,
  publishRemoteSettings,
  type PublishResult,
} from "./settingsSync";

/* БЛОК: Ключи хранения и типы данных настраиваемых блоков (TickerItem, MenuItem, FooterLinkItem, FooterStoreItem, SheetPresetItem, SiteSettings)
 * ЗА ЧТО ОТВЕЧАЕТ: Описывает структуру каждого настраиваемого элемента: строки бегущей строки, пунктов меню, ссылок и контактов подвала, а также пресетов кровельного листа.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Используется страницей AdminPage.tsx, шапкой Header.tsx, подвалом SiteFooter.tsx и калькулятором RoofCalculator.tsx.
 * КАК ИЗМЕНИТЬ: Если захотите добавить новую иконку для контактов подвала, допишите её ключ в массив FOOTER_ICON_KEYS и подключите саму иконку в src/components/FooterIcon.tsx. */
const STORAGE_KEY = "site:blocks-settings";
const REVISION_KEY = "site:blocks-settings-revision";
const CHANGE_EVENT = "site:settings-changed";

export interface TickerItem {
  id: string;
  text: string;
  enabled: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  /** Показывать пункт в выпадающем списке «Калькуляторы» в шапке */
  enabled: boolean;
  /** Показывать карточку в блоке «Выберите Калькулятор» на главной (если не задано — показывается) */
  onHome?: boolean;
}

export const FOOTER_ICON_KEYS = ["pin", "clock", "phone", "mail", "truck", "store", "globe", "card"] as const;
export type FooterIconKey = (typeof FOOTER_ICON_KEYS)[number];

export interface FooterLinkItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
}

export interface FooterStoreItem {
  id: string;
  text: string;
  icon: FooterIconKey;
  enabled: boolean;
}

export interface SheetPresetItem {
  id: string;
  label: string;
  sheetWidth: number;
  sheetLength: number;
  overlapWidth: number;
  overlapLength: number;
  enabled: boolean;
}

/* БЛОК: Настройки блока «Калькулятор» на страницах «Грильято» и «Армстронг» (CalcOption, CalculatorSettings)
 * ЗА ЧТО ОТВЕЧАЕТ: Стартовые размеры помещения и запас, которые видит новый посетитель, а также список доступных ему вариантов
 *   (ячейки и цвета для Грильято; плиты, профили и углы для Армстронга; длины подвеса — для обоих).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Идентификаторы совпадают с данными из src/data/grilyato.ts и src/data/armstrong.ts.
 * КАК ИЗМЕНИТЬ: Всё редактируется без кода на странице «Администрирование» → «Настройка страниц» → нужный калькулятор. */
export interface CalcOption {
  id: string;
  enabled: boolean;
}

export interface CalculatorSettings {
  /** Стартовая длина помещения, м */
  length: number;
  /** Стартовая ширина помещения, м */
  width: number;
  /** Запас по умолчанию, % */
  sparePct: number;
  /** Доступные длины подвеса, мм (id = «275», «500», …) */
  hangers: CalcOption[];
  /** Грильято: размеры ячейки (id = «50», «75», «100») */
  cells?: CalcOption[];
  /** Грильято: цвета профилей (id = «black», «white», «metal») */
  colors?: CalcOption[];
  /** Армстронг: плиты, профили и углы */
  tiles?: CalcOption[];
  profiles?: CalcOption[];
  angles?: CalcOption[];
}

/* Калькулятор кровли: стартовые размеры ската, листа и перехлёстов */
export interface RoofCalcSettings {
  roofLength: number;
  roofWidth: number;
  sheetLength: number;
  sheetWidth: number;
  overlapWidth: number;
  overlapLength: number;
}

/* Калькулятор сайдинга: стартовый фасад для нового посетителя */
export type SidingEdgeDefault = "j" | "inner" | "outer";
/** Элементы сайдинга, для которых настраиваются цвета (панель + 6 доборных планок) */
export const SIDING_COLOR_PART_KEYS = [
  "panel",
  "hProfile",
  "finish",
  "jamb",
  "jProfile",
  "innerCorner",
  "outerCorner",
] as const;
export type SidingColorPartKey = (typeof SIDING_COLOR_PART_KEYS)[number];
/** Видимость одного цвета у конкретного элемента сайдинга */
export interface SidingColorOption {
  id: string;
  enabled: boolean;
}
export interface SidingCalcSettings {
  facadeLength: number;
  facadeHeight: number;
  sparePct: number;
  straightTop: boolean;
  leftEdge: SidingEdgeDefault;
  rightEdge: SidingEdgeDefault;
  singleColor: boolean;
  /** Цвета каждого элемента: видимость и порядок кружков (ключ — элемент, id совпадает с SIDING_COLORS) */
  colors?: Partial<Record<SidingColorPartKey, SidingColorOption[]>>;
}

/* БЛОК: Настройки логотипов (шапка, подвал, значок вкладки браузера) */
export type LogoAlign = "left" | "center" | "right";
export interface LogoPlacement {
  visible: boolean;
  height: number;
  align: LogoAlign;
  offsetX: number;
  offsetY: number;
  cityColor: string;
}
export interface FaviconSettings {
  background: string;
  color: string;
  radius: number;
}
export interface LogoSettings {
  header: LogoPlacement;
  footer: LogoPlacement;
  favicon: FaviconSettings;
}
export const LOGO_HEIGHT_MIN = 24;
export const LOGO_HEIGHT_MAX = 64;
export const LOGO_OFFSET_MAX = 60;

export const CALC_SIZE_MIN = 0.1;
export const CALC_SIZE_MAX = 100;
export const CALC_SPARE_MAX = 50;

export interface SiteSettings {
  ticker: {
    speed: number;
    items: TickerItem[];
    /** Мигающая гирлянда по краям бегущей строки в шапке */
    garland: boolean;
    /** Имитация падающего снега по всей шапке */
    snow: boolean;
  };
  menu: MenuItem[];
  footer: {
    calculatorsTitle: string;
    storeTitle: string;
    links: FooterLinkItem[];
    info: FooterStoreItem[];
  };
  sheets: SheetPresetItem[];
  /** Настройки блока «Калькулятор» на страницах «Грильято» и «Армстронг» */
  calculators: {
    grilyato: CalculatorSettings;
    armstrong: CalculatorSettings;
    roof: RoofCalcSettings;
    siding: SidingCalcSettings;
  };
  /** Логотипы в шапке и подвале */
  logo: LogoSettings;
  defaultsVersion?: number;
  knownSheetIds?: string[];
  knownMenuIds?: string[];
  knownFooterLinkIds?: string[];
}

/* БЛОК: Допустимые границы и заводские настройки сайта по умолчанию (DEFAULT_SETTINGS)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт исходный текст бегущей строки, список страниц в меню «Калькуляторы», колонки подвала и 4 стандартных материала кровли (С20, С8, Ондулин, Монтерей).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Адрес и часы работы магазина по умолчанию берутся из объекта STORE в файле src/data/grilyato.ts.
 * КАК ИЗМЕНИТЬ: Отредактируйте тексты, ссылки или размеры листов прямо в DEFAULT_SETTINGS — они применятся у новых посетителей (пока таблица пуста) и при нажатии «Сбросить к исходным» в админке. */
const LEGACY_MENU_IDS = ["m-grilyato", "m-armstrong", "m-roof", "m-test", "m-smeta-test", "m-admin"];

/** Кнопка «Администрирование» скрыта из выпадающего списка шапки. */
const HIDDEN_MENU_IDS = ["m-admin", "m-smeta-test"];
const HIDDEN_MENU_HREFS = ["#/admin", "#/smeta-test"];

export const TICKER_SPEED_MIN = 1;
export const TICKER_SPEED_MAX = 60;
export const DEFAULT_TICKER_SPEED = 28;

export const SHEET_SIZE_MIN = 0.1;
export const SHEET_SIZE_MAX = 20;
export const SHEET_OVERLAP_MAX = 1000;

/* БЛОК: Заводские списки цветов для каждого элемента сайдинга (defaultSidingColors)
 * ЗА ЧТО ОТВЕЧАЕТ: Создаёт стартовый список оттенков (все показаны) для панели и каждой доборной планки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: Палитра SIDING_COLORS из src/data/siding.ts.
 * КАК ИЗМЕНИТЬ: Заводские значения цветов и порядок меняются в SIDING_COLORS (src/data/siding.ts). */
function defaultSidingColors(): Record<SidingColorPartKey, SidingColorOption[]> {
  return Object.fromEntries(
    SIDING_COLOR_PART_KEYS.map((key) => [
      key,
      SIDING_COLORS.map((color) => ({ id: color.id, enabled: true })),
    ]),
  ) as Record<SidingColorPartKey, SidingColorOption[]>;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  ticker: {
    speed: DEFAULT_TICKER_SPEED,
    garland: true,
    snow: true,
    items: [
      { id: "t1", text: "Лемана Про Челябинск — Подвесные потолки", enabled: true },
      { id: "t2", text: "Точная смета за 1 минуту", enabled: true },
      { id: "t3", text: "Доставка от 3х дней", enabled: true },
    ],
  },
  menu: [
    { id: "m-grilyato", label: "Грильято", href: "#/grilyato", enabled: true },
    { id: "m-armstrong", label: "Армстронг", href: "#/armstrong", enabled: true },
    { id: "m-roof", label: "Кровля", href: "#/roof", enabled: true },
    { id: "m-siding", label: "Сайдинг", href: "#/siding", enabled: true },
    { id: "m-test", label: "Тест", href: "#/test", enabled: true },
  ],
  footer: {
    calculatorsTitle: "Калькуляторы",
    storeTitle: "Магазин",
    links: [
      { id: "f-grilyato", label: "Грильято", href: "#/grilyato", enabled: true },
      { id: "f-armstrong", label: "Армстронг", href: "#/armstrong", enabled: true },
      { id: "f-roof", label: "Кровля", href: "#/roof", enabled: true },
      { id: "f-siding", label: "Сайдинг", href: "#/siding", enabled: true },
    ],
    info: [
      { id: "f-address", text: STORE.fullAddress, icon: "pin", enabled: true },
      { id: "f-hours", text: STORE.hours, icon: "clock", enabled: true },
    ],
  },
  sheets: [
    {
      id: "c20",
      label: "Профнастил С20",
      sheetWidth: 1.15,
      sheetLength: 2,
      overlapWidth: 50,
      overlapLength: 150,
      enabled: true,
    },
    {
      id: "c8",
      label: "Профнастил С8",
      sheetWidth: 1.2,
      sheetLength: 2,
      overlapWidth: 50,
      overlapLength: 150,
      enabled: true,
    },
    {
      id: "ondulin",
      label: "Ондулин",
      sheetWidth: 0.76,
      sheetLength: 1.95,
      overlapWidth: 95,
      overlapLength: 200,
      enabled: true,
    },
    {
      id: "monterrey",
      label: "Металлочерепица Монтерей",
      sheetWidth: 1.18,
      sheetLength: 2.25,
      overlapWidth: 80,
      overlapLength: 100,
      enabled: true,
    },
  ],
  knownSheetIds: ["c20", "c8", "ondulin", "monterrey"],
  calculators: {
    grilyato: {
      length: 2.4,
      width: 2.4,
      sparePct: 0,
      hangers: [
        { id: "275", enabled: true },
        { id: "500", enabled: true },
        { id: "1000", enabled: true },
        { id: "1500", enabled: true },
      ],
      cells: [
        { id: "50", enabled: true },
        { id: "75", enabled: true },
        { id: "100", enabled: true },
      ],
      colors: [
        { id: "black", enabled: true },
        { id: "white", enabled: true },
        { id: "metal", enabled: true },
      ],
    },
    armstrong: {
      length: 2.4,
      width: 2.4,
      sparePct: 0,
      hangers: [
        { id: "275", enabled: true },
        { id: "500", enabled: true },
        { id: "1000", enabled: true },
        { id: "1500", enabled: true },
      ],
      tiles: [
        { id: "pharaon", enabled: true },
        { id: "baikal", enabled: true },
        { id: "white-galvanized-steel", enabled: true },
        { id: "white-steel", enabled: true },
        { id: "perforated-white", enabled: true },
        { id: "white-aluminum", enabled: true },
        { id: "so-dae-10", enabled: true },
        { id: "so-dae-7", enabled: true },
      ],
      profiles: [
        { id: "premium", enabled: true },
        { id: "economy", enabled: true },
      ],
      angles: [
        { id: "steel", enabled: true },
        { id: "aluminum", enabled: true },
      ],
    },
    roof: { roofLength: 10, roofWidth: 6, sheetLength: 2, sheetWidth: 1.2, overlapWidth: 50, overlapLength: 50 },
    siding: {
      facadeLength: 8,
      facadeHeight: 3,
      sparePct: 0,
      straightTop: true,
      leftEdge: "outer",
      rightEdge: "outer",
      singleColor: false,
      colors: defaultSidingColors(),
    },
  },
  logo: {
    header: { visible: true, height: 56, align: "left", offsetX: 0, offsetY: 0, cityColor: "#FFFFFF" },
    footer: { visible: true, height: 56, align: "left", offsetX: 0, offsetY: 0, cityColor: "#FFFFFF" },
    favicon: { background: "#20282B", color: "#FFBF2F", radius: 7 },
  },
  defaultsVersion: 2,
};

/* БЛОК: Проверка, очистка и совместимость настроек со старыми версиями (sanitize)
 * ЗА ЧТО ОТВЕЧАЕТ: Приводит любые прочитанные из таблицы или браузера настройки к правильной структуре, ограничивает числа допустимыми пределами и аккуратно добавляет новые разделы сайта к ранее сохранённым настройкам (не возвращая то, что администратор удалил вручную).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Сравнивает загруженный объект raw с заводским шаблоном DEFAULT_SETTINGS.
 * КАК ИЗМЕНИТЬ: Трогать не нужно — новые пункты из DEFAULT_SETTINGS подхватываются автоматически благодаря массивам knownSheetIds, knownMenuIds и knownFooterLinkIds. */
const clampSpeed = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_TICKER_SPEED;
  return Math.min(TICKER_SPEED_MAX, Math.max(TICKER_SPEED_MIN, Math.round(n)));
};

const str = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value : fallback;

const num = (value: unknown, fallback: number, min: number, max: number, digits = 2): number => {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return fallback;
  const bounded = Math.min(max, Math.max(min, n));
  const factor = 10 ** digits;
  return Math.round(bounded * factor) / factor;
};

function sanitize(raw: Partial<SiteSettings> | null): SiteSettings {
  if (!raw || typeof raw !== "object") return structuredCloneSafe(DEFAULT_SETTINGS);

  const tickerItems = Array.isArray(raw.ticker?.items) ? raw.ticker!.items : [];
  const menuItems = Array.isArray(raw.menu) ? raw.menu : [];
  const sheetItems = Array.isArray(raw.sheets) ? raw.sheets : [];

  const ticker = tickerItems
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id: str(item.id, `t-${index}-${Date.now()}`),
      text: str(item.text, ""),
      enabled: item.enabled !== false,
    }))
    .filter((item) => item.text.trim().length > 0);

  const menu = menuItems
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id: str(item.id, `m-${index}`),
      label: str(item.label, ""),
      href: str(item.href, "#/"),
      enabled: item.enabled !== false,
      onHome: item.onHome !== false,
    }))
    .filter((item) => item.label.trim().length > 0)
    .filter(
      (item) =>
        !HIDDEN_MENU_IDS.includes(item.id) &&
        !HIDDEN_MENU_HREFS.includes(item.href.trim()),
    );

  const sheets = sheetItems
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id: str(item.id, `s-${index}`),
      label: str(item.label, ""),
      sheetWidth: num(item.sheetWidth, 1, SHEET_SIZE_MIN, SHEET_SIZE_MAX),
      sheetLength: num(item.sheetLength, 1, SHEET_SIZE_MIN, SHEET_SIZE_MAX),
      overlapWidth: num(item.overlapWidth, 0, 0, SHEET_OVERLAP_MAX, 0),
      overlapLength: num(item.overlapLength, 0, 0, SHEET_OVERLAP_MAX, 0),
      enabled: item.enabled !== false,
    }))
    .filter((item) => item.label.trim().length > 0);

  const footerLinkItems = Array.isArray(raw.footer?.links) ? raw.footer!.links : null;
  const footerInfoItems = Array.isArray(raw.footer?.info) ? raw.footer!.info : null;

  const footerLinks = (footerLinkItems ?? [])
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id: str(item.id, `f-${index}`),
      label: str(item.label, "").slice(0, 60),
      href: str(item.href, "#/").slice(0, 400),
      enabled: item.enabled !== false,
    }))
    .filter((item) => item.label.length > 0);

  const footerInfo = (footerInfoItems ?? [])
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id: str(item.id, `fi-${index}`),
      text: str(item.text, "").slice(0, 160),
      icon: (FOOTER_ICON_KEYS as readonly string[]).includes(item.icon)
        ? (item.icon as FooterIconKey)
        : "pin",
      enabled: item.enabled !== false,
    }))
    .filter((item) => item.text.length > 0);

  const base = structuredCloneSafe(DEFAULT_SETTINGS);
  const defaultIds = base.sheets.map((item) => item.id);

  /* Настройки калькуляторов: берём сохранённые значения, а любые отсутствующие поля
     и новые варианты (например, добавленная позже плита) подставляем из заводских. */
  const mergeOptions = (saved: unknown, defaults: CalcOption[]): CalcOption[] => {
    const list = Array.isArray(saved) ? saved : [];
    const defaultIds = new Set(defaults.map((option) => option.id));
    const seen = new Set<string>();
    const ordered: CalcOption[] = [];
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const id = String((item as Record<string, unknown>).id ?? "");
      if (!defaultIds.has(id) || seen.has(id)) continue;
      seen.add(id);
      ordered.push({ id, enabled: (item as Record<string, unknown>).enabled !== false });
    }
    // Новые варианты, которых ещё нет в сохранённом порядке, добавляются в конец.
    for (const option of defaults) {
      if (!seen.has(option.id)) ordered.push({ ...option });
    }
    return ordered;
  };

  const mergeCalculator = (saved: unknown, defaults: CalculatorSettings): CalculatorSettings => {
    const src = saved && typeof saved === "object" ? (saved as Record<string, unknown>) : {};
    const result: CalculatorSettings = {
      length: num(src.length, defaults.length, CALC_SIZE_MIN, CALC_SIZE_MAX),
      width: num(src.width, defaults.width, CALC_SIZE_MIN, CALC_SIZE_MAX),
      sparePct: num(src.sparePct, defaults.sparePct, 0, CALC_SPARE_MAX, 0),
      hangers: mergeOptions(src.hangers, defaults.hangers),
    };
    if (defaults.cells) result.cells = mergeOptions(src.cells, defaults.cells);
    if (defaults.colors) result.colors = mergeOptions(src.colors, defaults.colors);
    if (defaults.tiles) result.tiles = mergeOptions(src.tiles, defaults.tiles);
    if (defaults.profiles) result.profiles = mergeOptions(src.profiles, defaults.profiles);
    if (defaults.angles) result.angles = mergeOptions(src.angles, defaults.angles);
    return result;
  };

  const rawCalc = (key: string): Record<string, unknown> => {
    const v = raw.calculators && typeof raw.calculators === "object" ? (raw.calculators as Record<string, unknown>)[key] : null;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  };
  const edge = (v: unknown, fallback: SidingEdgeDefault): SidingEdgeDefault =>
    v === "j" || v === "inner" || v === "outer" ? v : fallback;
  const color = (v: unknown, fallback: string) =>
    typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
  const hasV2Defaults = typeof raw.defaultsVersion === "number" && raw.defaultsVersion >= 2;
  const rr = rawCalc("roof");
  const br = base.calculators.roof;
  const roofSettings: RoofCalcSettings = {
    roofLength: hasV2Defaults ? num(rr.roofLength, br.roofLength, CALC_SIZE_MIN, CALC_SIZE_MAX) : br.roofLength,
    roofWidth: hasV2Defaults ? num(rr.roofWidth, br.roofWidth, CALC_SIZE_MIN, CALC_SIZE_MAX) : br.roofWidth,
    sheetLength: hasV2Defaults ? num(rr.sheetLength, br.sheetLength, SHEET_SIZE_MIN, SHEET_SIZE_MAX) : br.sheetLength,
    sheetWidth: hasV2Defaults ? num(rr.sheetWidth, br.sheetWidth, SHEET_SIZE_MIN, SHEET_SIZE_MAX) : br.sheetWidth,
    overlapWidth: hasV2Defaults ? num(rr.overlapWidth, br.overlapWidth, 0, SHEET_OVERLAP_MAX, 0) : br.overlapWidth,
    overlapLength: hasV2Defaults ? num(rr.overlapLength, br.overlapLength, 0, SHEET_OVERLAP_MAX, 0) : br.overlapLength,
  };
  const sr = rawCalc("siding");
  const bs = base.calculators.siding;
  /* Цвета сайдинга: для каждого элемента сохраняем порядок и видимость из таблицы,
     а новые оттенки аккуратно добавляем из заводского списка. */
  const mergeSidingColors = (saved: unknown): Record<SidingColorPartKey, SidingColorOption[]> => {
    const base = defaultSidingColors();
    const src = saved && typeof saved === "object" ? (saved as Record<string, unknown>) : {};
    const result = {} as Record<SidingColorPartKey, SidingColorOption[]>;

    for (const key of SIDING_COLOR_PART_KEYS) {
      const defaults = base[key];
      const defaultIds = defaults.map((item) => item.id);
      const list = Array.isArray(src[key]) ? src[key] : [];
      const savedItems = list.filter(
        (item): item is { id: unknown; enabled?: unknown } => Boolean(item) && typeof item === "object",
      );
      const savedMap = new Map(savedItems.map((item) => [String(item.id), item.enabled !== false] as const));
      const savedIds = savedItems
        .map((item) => String(item.id))
        .filter((id) => defaultIds.includes(id))
        .filter((id, index, all) => all.indexOf(id) === index);
      const present = new Set(savedIds);
      result[key] = [
        ...savedIds,
        ...defaultIds.filter((id) => !present.has(id)),
      ].map((id) => ({ id, enabled: savedMap.has(id) ? savedMap.get(id)! : true }));
    }

    return result;
  };
  const sidingSettings: SidingCalcSettings = {
    facadeLength: hasV2Defaults ? num(sr.facadeLength, bs.facadeLength, CALC_SIZE_MIN, CALC_SIZE_MAX) : bs.facadeLength,
    facadeHeight: hasV2Defaults ? num(sr.facadeHeight, bs.facadeHeight, CALC_SIZE_MIN, CALC_SIZE_MAX) : bs.facadeHeight,
    sparePct: hasV2Defaults ? num(sr.sparePct, bs.sparePct, 0, CALC_SPARE_MAX, 0) : bs.sparePct,
    straightTop: typeof sr.straightTop === "boolean" ? sr.straightTop : bs.straightTop,
    leftEdge: edge(sr.leftEdge, bs.leftEdge),
    rightEdge: edge(sr.rightEdge, bs.rightEdge),
    singleColor: typeof sr.singleColor === "boolean" ? sr.singleColor : bs.singleColor,
    colors: mergeSidingColors(sr.colors),
  };
  const rawLogo = raw.logo && typeof raw.logo === "object" ? (raw.logo as unknown as Record<string, unknown>) : {};
  const placement = (v: unknown, d: LogoPlacement): LogoPlacement => {
    const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
    if (!hasV2Defaults) {
      return {
        visible: typeof o.visible === "boolean" ? o.visible : d.visible,
        height: d.height,
        align: o.align === "left" || o.align === "center" || o.align === "right" ? o.align : d.align,
        offsetX: d.offsetX,
        offsetY: d.offsetY,
        cityColor: d.cityColor,
      };
    }
    return {
      visible: typeof o.visible === "boolean" ? o.visible : d.visible,
      height: num(o.height, d.height, LOGO_HEIGHT_MIN, LOGO_HEIGHT_MAX, 0),
      align: o.align === "left" || o.align === "center" || o.align === "right" ? o.align : d.align,
      offsetX: num(o.offsetX, d.offsetX, -LOGO_OFFSET_MAX, LOGO_OFFSET_MAX, 0),
      offsetY: num(o.offsetY, d.offsetY, -LOGO_OFFSET_MAX, LOGO_OFFSET_MAX, 0),
      cityColor: color(o.cityColor, d.cityColor),
    };
  };
  const logoSettings: LogoSettings = {
    header: placement(rawLogo.header, base.logo.header),
    footer: placement(rawLogo.footer, base.logo.footer),
    favicon: base.logo.favicon,
  };

  const rawCalculators =
    raw.calculators && typeof raw.calculators === "object"
      ? (raw.calculators as Record<string, unknown>)
      : {};

  const known = Array.isArray(raw.knownSheetIds)
    ? raw.knownSheetIds.filter((id): id is string => typeof id === "string")
    : sheets.length
      ? ["c20", "c8"]
      : [];
  const present = new Set(sheets.map((item) => item.id));
  const added = base.sheets.filter((item) => !known.includes(item.id) && !present.has(item.id));
  const mergedSheets = (sheets.length ? [...sheets, ...added] : base.sheets).map((item) => {
    if (item.id === "monterrey" && item.overlapLength === 1000) {
      return { ...item, overlapLength: 100 };
    }
    return item;
  });

  const renamedMenu = menu.map((item) =>
    item.id === "m-roof" && item.label === "Раскладка Кровля" ? { ...item, label: "Кровля" } : item,
  );
  const knownMenu = Array.isArray(raw.knownMenuIds)
    ? raw.knownMenuIds.filter((id): id is string => typeof id === "string")
    : renamedMenu.length
      ? LEGACY_MENU_IDS
      : [];

  const presentMenuIds = new Set(renamedMenu.map((item) => item.id));
  let mergedMenu = renamedMenu.length ? renamedMenu : base.menu;
  for (const item of base.menu) {
    if (knownMenu.includes(item.id) || presentMenuIds.has(item.id)) continue;
    const baseIndex = base.menu.findIndex((defaultItem) => defaultItem.id === item.id);
    const nextPresent = base.menu.slice(baseIndex + 1).find((defaultItem) => presentMenuIds.has(defaultItem.id));
    const found = nextPresent ? mergedMenu.findIndex((menuItem) => menuItem.id === nextPresent.id) : -1;
    const at = found === -1 ? mergedMenu.length : found;
    mergedMenu = [...mergedMenu.slice(0, at), item, ...mergedMenu.slice(at)];
    presentMenuIds.add(item.id);
  }

  const knownFooterLinks = Array.isArray(raw.knownFooterLinkIds)
    ? raw.knownFooterLinkIds.filter((id): id is string => typeof id === "string")
    : footerLinkItems
      ? ["f-grilyato", "f-armstrong"]
      : [];
  const presentFooterIds = new Set(footerLinks.map((item) => item.id));
  const mergedFooterLinks = footerLinkItems
    ? [
        ...footerLinks,
        ...base.footer.links.filter(
          (item) => !knownFooterLinks.includes(item.id) && !presentFooterIds.has(item.id),
        ),
      ]
    : base.footer.links;

  return {
    ticker: {
      speed: clampSpeed(raw.ticker?.speed),
      items: ticker.length ? ticker : base.ticker.items,
      garland: raw.ticker?.garland !== false,
      snow: raw.ticker?.snow !== false,
    },
    menu: mergedMenu,
    footer: {
      calculatorsTitle: str(raw.footer?.calculatorsTitle, base.footer.calculatorsTitle).slice(0, 60),
      storeTitle: str(raw.footer?.storeTitle, base.footer.storeTitle).slice(0, 60),
      links: mergedFooterLinks,
      info: footerInfoItems ? footerInfo : base.footer.info,
    },
    sheets: mergedSheets,
    calculators: {
      grilyato: hasV2Defaults
        ? mergeCalculator(rawCalculators.grilyato, base.calculators.grilyato)
        : {
            ...mergeCalculator(rawCalculators.grilyato, base.calculators.grilyato),
            length: base.calculators.grilyato.length,
            width: base.calculators.grilyato.width,
            sparePct: base.calculators.grilyato.sparePct,
          },
      armstrong: hasV2Defaults
        ? mergeCalculator(rawCalculators.armstrong, base.calculators.armstrong)
        : {
            ...mergeCalculator(rawCalculators.armstrong, base.calculators.armstrong),
            length: base.calculators.armstrong.length,
            width: base.calculators.armstrong.width,
            sparePct: base.calculators.armstrong.sparePct,
          },
      roof: roofSettings,
      siding: sidingSettings,
    },
    logo: logoSettings,
    defaultsVersion: 2,
    knownSheetIds: Array.from(new Set([...known, ...defaultIds])),
    knownMenuIds: Array.from(new Set([...knownMenu, ...base.menu.map((item) => item.id)])),
    knownFooterLinkIds: Array.from(new Set([...knownFooterLinks, ...base.footer.links.map((item) => item.id)])),
  };
}

/* БЛОК: Локальное сохранение и чтение настроек в браузере (loadSettings, saveSettings, resetSettings)
 * ЗА ЧТО ОТВЕЧАЕТ: Сохраняет копию настроек в localStorage для мгновенного открытия сайта без ожидания сети и оповещает шапку и подвал о любых изменениях через событие CHANGE_EVENT.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из localStorage по ключам STORAGE_KEY и REVISION_KEY.
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
function structuredCloneSafe(value: SiteSettings): SiteSettings {
  return JSON.parse(JSON.stringify(value)) as SiteSettings;
}

export function loadSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredCloneSafe(DEFAULT_SETTINGS);
    return sanitize(JSON.parse(raw) as Partial<SiteSettings>);
  } catch {
    return structuredCloneSafe(DEFAULT_SETTINGS);
  }
}

export function getLocalRevision(): number {
  try {
    const value = Number(localStorage.getItem(REVISION_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function setLocalRevision(revision: number): void {
  try {
    localStorage.setItem(REVISION_KEY, String(revision));
  } catch {}
}

export function saveSettings(settings: SiteSettings, revision?: number): SiteSettings {
  const safe = sanitize(settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch {}
  if (typeof revision === "number") setLocalRevision(revision);
  window.dispatchEvent(new CustomEvent<SiteSettings>(CHANGE_EVENT, { detail: safe }));
  return safe;
}

export function resetSettings(): SiteSettings {
  const base = structuredCloneSafe(DEFAULT_SETTINGS);
  saveSettings(base);
  return base;
}

/* БЛОК: Фоновая синхронизация с Google-таблицей и подписка компонентов (syncSettingsFromSheet, publishSettings, useSettingsSync, useSiteSettings)
 * ЗА ЧТО ОТВЕЧАЕТ: Запускает проверку Google-таблицы каждые 30 секунд, применяет более новую версию настроек у всех открывших сайт и предоставляет хуки useSiteSettings() (для шапки, подвала и кровли) и useSettingsSync() (для админки).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Вызывает функции fetchRemoteSettings() и publishRemoteSettings() из файла src/data/settingsSync.ts.
 * КАК ИЗМЕНИТЬ: Менять не требуется — любой компонент, вызвавший useSiteSettings(), автоматически получает свежие настройки сразу после их публикации. */
export type SettingsSyncStatus = "loading" | "live" | "offline" | "empty";

export interface SettingsSyncState {
  status: SettingsSyncStatus;
  checkedAt: Date | null;
  revision: number;
  updatedAt: string;
  updatedBy: string;
  checking: boolean;
  publishing: boolean;
  error: string;
  canPublish: boolean;
}

let syncState: SettingsSyncState = {
  status: "loading",
  checkedAt: null,
  revision: getLocalRevisionSafe(),
  updatedAt: "",
  updatedBy: "",
  checking: false,
  publishing: false,
  error: "",
  canPublish: false,
};

function getLocalRevisionSafe(): number {
  try {
    return getLocalRevision();
  } catch {
    return 0;
  }
}

const syncListeners = new Set<() => void>();

function emitSync(patch: Partial<SettingsSyncState>): void {
  syncState = { ...syncState, ...patch };
  syncListeners.forEach((listener) => listener());
}

function subscribeSync(listener: () => void): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

function getSyncSnapshot(): SettingsSyncState {
  return syncState;
}

let checking: Promise<void> | null = null;

export async function syncSettingsFromSheet(): Promise<void> {
  if (checking) return checking;

  checking = (async () => {
    emitSync({ checking: true, canPublish: isPublishConfigured() });
    try {
      const remote = await fetchRemoteSettings();
      if (!remote) {
        emitSync({
          status: "empty",
          checking: false,
          checkedAt: new Date(),
          error: "",
        });
        return;
      }

      if (remote.revision > getLocalRevision()) {
        saveSettings(remote.settings as SiteSettings, remote.revision);
      }

      emitSync({
        status: "live",
        checking: false,
        checkedAt: new Date(),
        revision: remote.revision,
        updatedAt: remote.updatedAt,
        updatedBy: remote.updatedBy,
        error: "",
      });
    } catch (error) {
      emitSync({
        status: "offline",
        checking: false,
        error: error instanceof Error ? error.message : "Таблица недоступна",
      });
    } finally {
      checking = null;
    }
  })();

  return checking;
}

export async function publishSettings(settings: SiteSettings): Promise<PublishResult> {
  const revision = Math.max(Date.now(), syncState.revision + 1, getLocalRevision() + 1);
  const safe = saveSettings(settings, revision);

  emitSync({ publishing: true, error: "", canPublish: isPublishConfigured() });
  const result = await publishRemoteSettings(safe, revision);

  if (result.ok) {
    emitSync({
      publishing: false,
      status: "live",
      revision,
      updatedAt: new Date().toLocaleString("ru-RU"),
      updatedBy: "Администрирование",
      checkedAt: new Date(),
      error: "",
    });
  } else {
    emitSync({ publishing: false, error: result.error ?? "Не удалось опубликовать настройки" });
  }

  return result;
}

export async function publishDefaultSettings(): Promise<{ settings: SiteSettings; result: PublishResult }> {
  const base = structuredCloneSafe(DEFAULT_SETTINGS);
  const result = await publishSettings(base);
  return { settings: base, result };
}

let autoSyncStarted = false;

export function ensureAutoSync(): void {
  if (autoSyncStarted || typeof window === "undefined") return;
  autoSyncStarted = true;

  const run = () => void syncSettingsFromSheet();

  run();
  window.setInterval(run, SETTINGS_REFRESH_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") run();
  });
  window.addEventListener("online", run);
  window.addEventListener("focus", run);
}

export function useSettingsSync() {
  const state = useSyncExternalStore(subscribeSync, getSyncSnapshot, getSyncSnapshot);

  useEffect(() => {
    ensureAutoSync();
  }, []);

  const check = useCallback(() => syncSettingsFromSheet(), []);

  return { ...state, check };
}

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(loadSettings);

  useEffect(() => {
    ensureAutoSync();

    const onChange = () => setSettings(loadSettings());
    onChange();
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return settings;
}
