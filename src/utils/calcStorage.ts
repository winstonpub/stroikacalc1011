/* ============================================================================
 * ФАЙЛ: src/utils/calcStorage.ts — Сохранение параметров расчёта Грильято и Армстронга
 * ЗА ЧТО ОТВЕЧАЕТ: Запоминает введённые пользователем размеры помещения, ячейку, цвет, плиту, профиль и запас в памяти браузера, чтобы при повторном визите открывались те же самые данные.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Читает и записывает JSON в localStorage браузера под ключами "grilyato:last-input" и "armstrong:last-setup", а типы берёт из src/data/grilyato.ts.
 * КАК ИЗМЕНИТЬ: Чтобы поменять стартовые размеры помещения, ячейку, цвет или плиту, которые видит новый посетитель при первом входе, отредактируйте объекты DEFAULT_INPUT и DEFAULT_ARMSTRONG_SETUP ниже.
 * ========================================================================= */

import type { CalcInput } from "../data/grilyato";

/* БЛОК: Ключи хранения и стартовые параметры калькулятора Грильято (DEFAULT_INPUT)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт имена ячеек в памяти браузера и значения по умолчанию для первого открытия калькулятора потолков.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Значения прописаны прямо в этом блоке.
 * КАК ИЗМЕНИТЬ: Поменяйте length (длина, м), width (ширина, м), cellMm (50, 75 или 100), colorId ("black", "white" или "metal"), hangerLen (275, 500, 1000 или 1500) и sparePct (запас в %). */
const KEY = "grilyato:last-input";
const ARMSTRONG_KEY = "armstrong:last-setup";

export const DEFAULT_INPUT: CalcInput = {
  length: 2.4,
  width: 2.4,
  cellMm: 50,
  colorId: "black",
  hangerLen: 275,
  sparePct: 0,
};

/* БЛОК: Запись параметров расчёта Грильято в память браузера (saveCalcInput)
 * ЗА ЧТО ОТВЕЧАЕТ: Сохраняет текущие поля калькулятора Грильято при каждом изменении.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Получает объект input из компонента src/components/Calculator.tsx.
 * КАК ИЗМЕНИТЬ: Менять не требуется — работает автоматически, даже если браузер открыт в приватном режиме. */
export function saveCalcInput(input: CalcInput): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(input));
  } catch {}
}

/* БЛОК: Проверка и очистка прочитанных параметров помещения (sanitizeInput)
 * ЗА ЧТО ОТВЕЧАЕТ: Защищает калькулятор от повреждённых или устаревших значений в памяти браузера, подставляя безопасные значения по умолчанию.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Сверяет прочитанные поля со списком допустимых ячеек, цветов, подвесов и объектом DEFAULT_INPUT.
 * КАК ИЗМЕНИТЬ: Если вы добавите в src/data/grilyato.ts новый размер ячейки, новый цвет или новую длину подвеса, добавьте их также в массивы проверки [50, 75, 100], ["black", "white", "metal"] или [275, 500, 1000, 1500] здесь. */
function sanitizeInput(parsed: Partial<CalcInput>): CalcInput {
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fallback;
  return {
    length: num(parsed.length, DEFAULT_INPUT.length),
    width: num(parsed.width, DEFAULT_INPUT.width),
    cellMm: [50, 75, 100].includes(Number(parsed.cellMm)) ? Number(parsed.cellMm) : DEFAULT_INPUT.cellMm,
    colorId: ["black", "white", "metal"].includes(String(parsed.colorId))
      ? String(parsed.colorId)
      : DEFAULT_INPUT.colorId,
    hangerLen: [275, 500, 1000, 1500].includes(Number(parsed.hangerLen))
      ? Number(parsed.hangerLen)
      : DEFAULT_INPUT.hangerLen,
    sparePct:
      typeof parsed.sparePct === "number" && parsed.sparePct >= 0 && parsed.sparePct <= 50
        ? parsed.sparePct
        : DEFAULT_INPUT.sparePct,
  };
}

/* БЛОК: Чтение сохранённых параметров Грильято (loadCalcInput)
 * ЗА ЧТО ОТВЕЧАЕТ: Достаёт последний расчёт Грильято из localStorage или отдаёт стартовый набор DEFAULT_INPUT.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из localStorage по ключу KEY ("grilyato:last-input").
 * КАК ИЗМЕНИТЬ: Чтобы изменить начальные значения при чистом открытии, редактируйте DEFAULT_INPUT выше. */
export function loadCalcInput(): CalcInput {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_INPUT;
    return sanitizeInput(JSON.parse(raw) as Partial<CalcInput>);
  } catch {
    return DEFAULT_INPUT;
  }
}

/* БЛОК: Структура и стартовый набор расчёта Армстронг (ArmstrongSetup, DEFAULT_ARMSTRONG_SETUP)
 * ЗА ЧТО ОТВЕЧАЕТ: Описывает полный выбор пользователя в калькуляторе Армстронг (размеры комнаты + выбранная плита, профиль и пристенный угол) и задаёт вариант по умолчанию.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Идентификаторы tileId, profileId и angleId соответствуют id товаров из файла src/data/armstrong.ts.
 * КАК ИЗМЕНИТЬ: Чтобы при первом входе на страницу «Армстронг» по умолчанию выбиралась другая плита или профиль, замените tileId ("pharaon", "baikal", "white-aluminum" и др.), profileId ("premium" или "economy") или angleId ("steel" или "aluminum"). */
export interface ArmstrongSetup {
  input: CalcInput;
  tileId: string;
  profileId: string;
  angleId: string;
}

export const DEFAULT_ARMSTRONG_SETUP: ArmstrongSetup = {
  input: DEFAULT_INPUT,
  /* По умолчанию выбран «Комплект Pharaon 24шт.» (id pharaon в ARMSTRONG_TILES) */
  tileId: "pharaon",
  profileId: "premium",
  angleId: "steel",
};

/* БЛОК: Сохранение и загрузка расчёта Армстронг (saveArmstrongSetup, loadArmstrongSetup)
 * ЗА ЧТО ОТВЕЧАЕТ: Передаёт выбранные материалы со страницы калькулятора «Армстронг» в память браузера для повторного визита.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Читает и записывает данные в localStorage по ключу ARMSTRONG_KEY ("armstrong:last-setup").
 * КАК ИЗМЕНИТЬ: Менять не требуется — новые плиты и профили из src/data/armstrong.ts подхватываются по строковому id автоматически. */
export function saveArmstrongSetup(setup: ArmstrongSetup): void {
  try {
    localStorage.setItem(ARMSTRONG_KEY, JSON.stringify(setup));
  } catch {}
}

export function loadArmstrongSetup(): ArmstrongSetup {
  try {
    const raw = localStorage.getItem(ARMSTRONG_KEY);
    if (!raw) return DEFAULT_ARMSTRONG_SETUP;
    const parsed = JSON.parse(raw) as Partial<ArmstrongSetup>;
    const str = (v: unknown, fallback: string) =>
      typeof v === "string" && v.trim() ? v : fallback;
    return {
      input: sanitizeInput((parsed.input ?? {}) as Partial<CalcInput>),
      tileId: str(parsed.tileId, DEFAULT_ARMSTRONG_SETUP.tileId),
      profileId: str(parsed.profileId, DEFAULT_ARMSTRONG_SETUP.profileId),
      angleId: str(parsed.angleId, DEFAULT_ARMSTRONG_SETUP.angleId),
    };
  } catch {
    return DEFAULT_ARMSTRONG_SETUP;
  }
}
