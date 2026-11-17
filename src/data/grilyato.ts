/* ============================================================================
 * ФАЙЛ: src/data/grilyato.ts — Товары, артикулы, формулы расчёта Грильято и контакты магазина
 * ЗА ЧТО ОТВЕЧАЕТ: Содержит все варианты ячеек, цветов и подвесов потолка Грильято, матрицу артикулов, точную функцию расчёта сметы calcGrilyato(), форматтеры чисел и адрес магазина STORE.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Параметры помещения (CalcInput) приходят из калькулятора src/components/Calculator.tsx, а актуальные цены и ссылки на товары (PriceMap) — из Google-таблицы через src/data/prices.ts.
 * КАК ИЗМЕНИТЬ:
 *   — Чтобы поменять артикул любого профиля, угла или подвеса — исправьте его в массивах HANGERS, CONNECTOR, ANGLE_ART или таблице ART ниже.
 *   — Чтобы поменять адрес магазина в шапке и заводском подвале — отредактируйте объект STORE в самом низу файла.
 * ========================================================================= */

import type { PriceMap } from "./prices";

/* БЛОК: Типоразмеры ячейки потолка Грильято (CELL_SIZES)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт кнопки выбора ячейки (50×50, 75×75, 100×100), множитель расхода профилей «мама»/«папа» (momFactor) и подсказку под схемой в калькуляторе.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Значения и коэффициенты взяты из расчётной таблицы Лемана Про Челябинск.
 * КАК ИЗМЕНИТЬ: Текст подсказки под чертежом ячейки меняется в поле note, а расход профилей на кассету — в поле momFactor. */
export type CellKey = "50х50" | "75х75" | "100х100";
export type ColorName = "Черный" | "Белый" | "Металлик";

export interface CellSize {
  mm: number;
  key: CellKey;
  label: string;
  momFactor: number;
  note: string;
}

export const CELL_SIZES: CellSize[] = [
  { mm: 50, key: "50х50", label: "50×50", momFactor: 11, note: "11 «мам» и 11 «пап» на блок 590×590" },
  { mm: 75, key: "75х75", label: "75×75", momFactor: 7, note: "7 «мам» и 7 «пап» на блок 590×590" },
  { mm: 100, key: "100х100", label: "100×100", momFactor: 5, note: "5 «мам» и 5 «пап» на блок 590×590" },
];

/* БЛОК: Цвета профилей Грильято (COLORS)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит кружки выбора цвета в калькуляторе («Черный», «Белый», «Металлик») с подписями RAL.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Прописано прямо здесь.
 * КАК ИЗМЕНИТЬ: Поле hex меняет цвет кружка на кнопке, ral — мелкую подпись под названием цвета. Поле name должно совпадать с ключами в таблице артикулов ART ниже. */
export interface GrilyatoColor {
  id: "black" | "white" | "metal";
  name: ColorName;
  ral: string;
  hex: string;
}

export const COLORS: GrilyatoColor[] = [
  { id: "black", name: "Черный", ral: "RAL 9005", hex: "#1b1b1c" },
  { id: "white", name: "Белый", ral: "RAL 9003", hex: "#f2f2ef" },
  { id: "metal", name: "Металлик", ral: "металлик", hex: "#c9cdd2" },
];

/* БЛОК: Варианты длины подвеса, соединитель и пристенные углы (HANGERS, CONNECTOR, ANGLE_ART)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт кнопки выбора длины подвеса (275, 500, 1000, 1500 мм — используются и в Грильято, и в Армстронге), а также артикулы соединителя и углов PL19×24 по цветам.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Артикулы соответствуют строкам в Google-таблице цен (src/data/prices.ts).
 * КАК ИЗМЕНИТЬ: При смене поставщика или артикула просто замените строку с цифрами art на новый номер и добавьте его в Google-таблицу цен. */
export interface HangerOption {
  len: number;
  art: string;
  name: string;
}

export const HANGERS: HangerOption[] = [
  { len: 275, art: "12903338", name: "Евро подвес L-275" },
  { len: 500, art: "82936530", name: "Евро подвес L-500" },
  { len: 1000, art: "82936531", name: "Евро подвес L-1000" },
  { len: 1500, art: "82936532", name: "Евро подвес L-1500" },
];

const CONNECTOR = { art: "82151813", name: "Профиль соединительный H50 b10 (мет.)" };

const ANGLE_ART: Record<ColorName, string> = {
  Черный: "82936536",
  Белый: "82936537",
  Металлик: "82936535",
};

/* БЛОК: Матрица артикулов профилей и направляющих Грильято по ячейке и цвету (ART)
 * ЗА ЧТО ОТВЕЧАЕТ: Подбирает точный артикул профиля «мама» (mom), «папа» (dad) и несущих направляющих 2,4 м (g24), 1,2 м (g12 — нужна только для 100×100) и 0,6 м (g06).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Справочник артикулов магазина Лемана Про Челябинск.
 * КАК ИЗМЕНИТЬ: Найдите нужную группу (mom / dad / g24 / g12 / g06), размер ячейки и цвет, и впишите новый артикул в кавычках. */
const ART: {
  mom: Record<CellKey, Record<ColorName, string>>;
  dad: Record<CellKey, Record<ColorName, string>>;
  g24: Record<CellKey, Record<ColorName, string>>;
  g12: Partial<Record<CellKey, Record<ColorName, string>>>;
  g06: Record<CellKey, Record<ColorName, string>>;
} = {
  mom: {
    "50х50": { Белый: "82151718", Металлик: "82151722", Черный: "82151726" },
    "75х75": { Белый: "82151742", Металлик: "82151746", Черный: "82151750" },
    "100х100": { Белый: "82151769", Металлик: "82151774", Черный: "82151779" },
  },
  dad: {
    "50х50": { Белый: "82151719", Металлик: "82151723", Черный: "82151727" },
    "75х75": { Белый: "82151743", Металлик: "82151747", Черный: "82151751" },
    "100х100": { Белый: "82151770", Металлик: "82151775", Черный: "82151780" },
  },
  g24: {
    "50х50": { Белый: "82151720", Металлик: "82151724", Черный: "82151728" },
    "75х75": { Белый: "82151744", Металлик: "82151748", Черный: "82151752" },
    "100х100": { Белый: "82151772", Металлик: "82151777", Черный: "82151782" },
  },
  g12: {
    "100х100": { Белый: "82151771", Металлик: "82151776", Черный: "82151781" },
  },
  g06: {
    "50х50": { Белый: "82151717", Металлик: "82151721", Черный: "82151725" },
    "75х75": { Белый: "82151741", Металлик: "82151745", Черный: "82151749" },
    "100х100": { Белый: "82151768", Металлик: "82151773", Черный: "82151778" },
  },
};

/* БЛОК: Типы входных параметров и результата расчёта сметы (CalcInput, SpecRow, CalcResult)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт единый формат сметы для потолочных калькуляторов (Грильято и Армстронг) и страниц печати спецификаций.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Используется в Calculator.tsx и SpecSheet.tsx.
 * КАК ИЗМЕНИТЬ: Менять не требуется, если вы не добавляете новые столбцы в таблицу сметы. */
export interface CalcInput {
  length: number;
  width: number;
  cellMm: number;
  colorId: string;
  hangerLen: number;
  sparePct: number;
}

export interface SpecRow {
  key: string;
  art: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  sum: number;
  url?: string;
  missing: boolean;
}

export interface CalcResult {
  area: number;
  perimeter: number;
  reshetka: number;
  rows: SpecRow[];
  total: number;
  perM2: number;
  positions: number;
  color: GrilyatoColor;
  cell: CellSize;
  hanger: HangerOption;
  needs12: boolean;
}

const ceil = Math.ceil;
const ceil1 = (v: number) => ceil(v * 10) / 10;

const money = (v: number) => Math.round(v * 100) / 100;

/* БЛОК: Главная функция расчёта потолка Грильято (calcGrilyato)
 * ЗА ЧТО ОТВЕЧАЕТ: Считает площадь, периметр, количество кассет 600×600, штучное количество всех профилей, направляющих, соединителей, подвесов и углов с учётом запаса, умножает их на цены и выдаёт итоговую сумму и цену за 1 м².
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Ввод помещения input из калькулятора и словарь цен prices из Google-таблицы (src/data/prices.ts).
 * КАК ИЗМЕНИТЬ:
 *   — Нормы расхода на 1 м² заданы в переменных g24Factor, g06Factor, hangFactor и множителе 2.78.
 *   — Названия строк в таблице спецификации формируются в массиве rows (вызовы mk(...)). */
export function calcGrilyato(input: CalcInput, prices: PriceMap): CalcResult {
  const color = COLORS.find((c) => c.id === input.colorId) ?? COLORS[0];
  const cell = CELL_SIZES.find((c) => c.mm === input.cellMm) ?? CELL_SIZES[2];
  const hanger = HANGERS.find((h) => h.len === input.hangerLen) ?? HANGERS[1];
  const f = 1 + Math.min(50, Math.max(0, input.sparePct)) / 100;

  const area = input.length * input.width;
  const perimeter = 2 * input.length + 2 * input.width;

  const reshetka = ceil1(area * 2.78 * f);

  const is100 = cell.mm === 100;
  const g24Factor = is100 ? 0.35 : 0.7;
  const g06Factor = is100 ? 1.39 : 2.78;
  const hangFactor = is100 ? 0.93 : 1.85;

  const momQty = ceil(area * 2.78 * cell.momFactor * f);
  const g24Qty = ceil(area * g24Factor * f);
  const g12Qty = is100 ? ceil(area * 1.39 * f) : 0;
  const g06Qty = ceil(area * g06Factor * f);
  const connQty = ceil(area * g24Factor * f);
  const hangQty = ceil(area * hangFactor * f);
  const angleQty = ceil((perimeter / 3) * f);

  const N = color.name;
  const sizeTxt = `${cell.key}мм. цвет ${N}`;
  const mk = (key: string, art: string, name: string, qty: number, unit: string): SpecRow => {
    const entry = prices[art];
    const p = entry?.price ?? 0;
    return { key, art, name, qty, unit, price: p, sum: money(qty * p), url: entry?.url, missing: !entry };
  };

  const rows: SpecRow[] = [
    mk("mom", ART.mom[cell.key][N], `Grigliato «мама» ${sizeTxt}`, momQty, "шт"),
    mk("dad", ART.dad[cell.key][N], `Grigliato «папа» ${sizeTxt}`, momQty, "шт"),
    mk("g24", ART.g24[cell.key][N], `Grigliato Несущая направляющая 2,4 м ${sizeTxt}`, g24Qty, "шт"),
  ];
  if (g12Qty > 0) {
    rows.push(
      mk("g12", ART.g12[cell.key]![N], `Grigliato Несущая направляющая 1,2 м ${sizeTxt}`, g12Qty, "шт"),
    );
  }
  rows.push(
    mk("g06", ART.g06[cell.key][N], `Grigliato Несущая направляющая 0,6 м ${sizeTxt}`, g06Qty, "шт"),
    mk("conn", CONNECTOR.art, CONNECTOR.name, connQty, "шт"),
    mk("hang", hanger.art, hanger.name, hangQty, "шт"),
    mk("angle", ANGLE_ART[N], `Угол PL19х24 ${N}`, angleQty, "шт"),
  );

  const total = money(rows.reduce((acc, r) => acc + r.sum, 0));

  return {
    area,
    perimeter,
    reshetka,
    rows,
    total,
    perM2: area > 0 ? total / area : 0,
    positions: rows.length,
    color,
    cell,
    hanger,
    needs12: is100,
  };
}

/* БЛОК: Форматирование чисел и цен + контакты магазина (fmt, fmtMoney, fmtPrice, fmt1, STORE)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит красивые числа с пробелами между тысячами и хранит город, адрес и часы работы магазина в Челябинске.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Объект STORE используется в верхней полосе шапки (src/components/Header.tsx) и в заводских настройках подвала (src/data/siteSettings.ts).
 * КАК ИЗМЕНИТЬ: Поменяйте строки city, address, fullAddress или hours в объекте STORE, чтобы обновить адрес и режим работы в шапке сайта. */
export const fmt = new Intl.NumberFormat("ru-RU");
export const fmtMoney = (v: number) => `${fmt.format(Math.round(v))} ₽`;
export const fmtPrice = (v: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(v);
export const fmt1 = (v: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(v);

export const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/16SWWagWF6RLSaoCezFa2J09J1n-RPQ4QDG3b8SpubZg/edit?usp=drivesdk";

export const STORE = {
  city: "Челябинск",
  address: "Копейское шоссе, 64",
  fullAddress: "Челябинск, Копейское шоссе, 64",
  hours: "ежедневно 08:00–22:00",
};
