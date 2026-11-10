/* ============================================================================
 * ФАЙЛ: src/components/RoofCalculator.tsx — Интерактивный калькулятор раскладки листов кровли
 * ЗА ЧТО ОТВЕЧАЕТ: Рассчитывает точное количество листов профнастила, металлочерепицы или ондулина для ската кровли с учётом бокового и продольного перехлёста, повторного использования обрезков крайних листов, строит интерактивную SVG-схему укладки со стрелками переноса остатков, печатает её на 1 лист A4 и выводит таблицу результатов.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Кнопки «Готовый размер листа» загружаются из useSiteSettings() (редактируются на странице «Администрирование» #/admin), стартовые параметры заданы в DEFAULT_ROOF ниже, а печать схемы выполняет src/utils/printRoofLayout.ts.
 * КАК ИЗМЕНИТЬ:
 *   — Готовые виды кровельных листов (название, ширина, длина, перехлёсты) добавляйте и меняйте прямо на странице #/admin в блоке «Готовый размер листа».
 *   — Начальные размеры кровли при открытии страницы меняются в объекте DEFAULT_ROOF ниже.
 *   — Строки итоговой таблицы меняются в массиве resultRows внутри компонента RoofCalculator.
 * ========================================================================= */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  MoveHorizontal,
  MoveVertical,
  Ruler,
  RectangleHorizontal,
  LayoutGrid,
  Scissors,
  Layers,
  Lock,
  Printer,
} from "lucide-react";
import { fmt, fmt1 } from "../data/grilyato";
import { loadSettings, useSiteSettings, type SheetPresetItem } from "../data/siteSettings";
import { printRoofLayoutOverlay } from "../utils/printRoofLayout";
import { cn } from "../utils/cn";

/* БЛОК: Вспомогательные форматтеры чисел, склонение слов и стартовые размеры кровли (DEFAULT_ROOF)
 * ЗА ЧТО ОТВЕЧАЕТ: Переводит метры в миллиметры, склоняет слово «полоса» в подсказках и задаёт исходный скат 10 × 6 м при открытии калькулятора.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Тип пресета SheetPresetItem из src/data/siteSettings.ts.
 * КАК ИЗМЕНИТЬ: Поменяйте числа в объекте DEFAULT_ROOF, чтобы при первом входе стояли другие размеры кровли или листа. */
const ease = [0.22, 1, 0.36, 1] as const;
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const r2 = (v: number) => Math.round(v * 100) / 100;
const fmt2 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m2 = (v: number) => fmt2.format(r2(v));
const toMm = (m: number) => Math.round(r2(Math.max(0, m)) * 1000);

function plural(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

type SheetPreset = SheetPresetItem;

function presetNote(preset: SheetPreset) {
  const size = `${fmt2.format(preset.sheetWidth)} × ${fmt2.format(preset.sheetLength)} м`;
  const overlap = `${fmt.format(preset.overlapWidth)} / ${fmt.format(preset.overlapLength)} мм`;
  return { size, overlap };
}

export interface RoofInput {
  roofLength: number;
  roofWidth: number;
  overlapWidth: number;
  overlapLength: number;
  sheetLength: number;
  sheetWidth: number;
}

export const DEFAULT_ROOF: RoofInput = {
  roofLength: 10,
  roofWidth: 6,
  overlapWidth: 80,
  overlapLength: 150,
  sheetLength: 2,
  sheetWidth: 1.2,
};

/* БЛОК: Математический расчёт раскладки листов и экономии обрезков (calcRoof)
 * ЗА ЧТО ОТВЕЧАЕТ: Вычисляет полезную ширину и длину листа (габарит минус перехлёст), число столбцов и рядов, проверяет, сколько крайних узких полос помещается в один целый лист, и выбирает наиболее выгодный раскрой углового листа.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Введённые размеры кровли, листа и перехлёстов из состояния input.
 * КАК ИЗМЕНИТЬ: Формула универсальна для любых листовых материалов — менять её не нужно. */
function countSpan(span: number, sheet: number, useful: number) {
  if (span <= 0 || sheet <= 0) return 0;
  if (span <= sheet) return 1;
  return Math.ceil((span - sheet) / useful) + 1;
}

function coverSpan(count: number, sheet: number, useful: number) {
  if (count <= 0) return 0;
  return sheet + (count - 1) * useful;
}

export function calcRoof(input: RoofInput) {
  const roofLmm = toMm(input.roofLength);
  const roofWmm = toMm(input.roofWidth);
  const sheetWmm = toMm(input.sheetWidth);
  const sheetLmm = toMm(input.sheetLength);
  const overlapWmm = Math.max(0, Math.round(input.overlapWidth));
  const overlapLmm = Math.max(0, Math.round(input.overlapLength));

  const usefulWmm = Math.min(sheetWmm, Math.max(10, sheetWmm - overlapWmm));
  const usefulLmm = Math.min(sheetLmm, Math.max(10, sheetLmm - overlapLmm));

  const columns = countSpan(roofLmm, sheetWmm, usefulWmm);
  const rows = countSpan(roofWmm, sheetLmm, usefulLmm);

  const edgeWmm = columns > 0 ? roofLmm - (columns - 1) * usefulWmm : 0;
  const edgeLmm = rows > 0 ? roofWmm - (rows - 1) * usefulLmm : 0;

  const stripsPerSheet = edgeWmm > 0 ? Math.max(1, Math.floor(sheetWmm / edgeWmm)) : 1;
  const stripsPerSheetL = edgeLmm > 0 ? Math.max(1, Math.floor(sheetLmm / edgeLmm)) : 1;
  const hasSheets = columns > 0 && rows > 0;

  const mainBody = hasSheets ? (rows - 1) * (columns - 1) : 0;
  const totalCornerInWidth =
    mainBody + Math.ceil(rows / stripsPerSheet) +
    (columns > 1 ? Math.ceil((columns - 1) / stripsPerSheetL) : 0);
  const totalCornerInLength =
    mainBody + (rows > 1 ? Math.ceil((rows - 1) / stripsPerSheet) : 0) +
    Math.ceil(columns / stripsPerSheetL);
  const cornerInWidth = hasSheets ? totalCornerInWidth <= totalCornerInLength : true;

  const rightCount = hasSheets ? (cornerInWidth ? rows : rows - 1) : 0;
  const bottomCount = hasSheets ? (cornerInWidth ? columns - 1 : columns) : 0;
  const edgeSheets = rightCount > 0 ? Math.ceil(rightCount / stripsPerSheet) : 0;
  const lengthSheets = bottomCount > 0 ? Math.ceil(bottomCount / stripsPerSheetL) : 0;
  const sheets = hasSheets ? mainBody + edgeSheets + lengthSheets : 0;
  const savedW = hasSheets ? rightCount - edgeSheets : 0;
  const savedL = hasSheets ? bottomCount - lengthSheets : 0;

  const laidLmm = coverSpan(columns, sheetWmm, usefulWmm);
  const laidWmm = coverSpan(rows, sheetLmm, usefulLmm);

  const trimLmm = columns > 0 ? Math.max(0, sheetWmm - edgeWmm) : 0;
  const trimWmm = rows > 0 ? Math.max(0, sheetLmm - edgeLmm) : 0;

  const roofArea = r2((roofLmm * roofWmm) / 1e6);
  const sheetsArea = r2((sheets * sheetWmm * sheetLmm) / 1e6);
  const wasteArea = r2(Math.max(0, sheetsArea - roofArea));
  const wastePct = sheetsArea > 0 ? (wasteArea / sheetsArea) * 100 : 0;

  const seams = Math.max(0, columns - 1) * rows + Math.max(0, rows - 1) * columns;

  const m = (mmVal: number) => mmVal / 1000;
  return {
    roofLength: m(roofLmm),
    roofWidth: m(roofWmm),
    sheetWidth: m(sheetWmm),
    sheetLength: m(sheetLmm),
    overlapW: m(overlapWmm),
    overlapL: m(overlapLmm),
    usefulWidth: m(usefulWmm),
    usefulLength: m(usefulLmm),
    columns,
    rows,
    sheets,
    stripsPerSheet,
    stripsPerSheetL,
    cornerInWidth,
    rightCount,
    bottomCount,
    edgeSheets,
    lengthSheets,
    savedW,
    savedL,
    edgeWidth: m(edgeWmm),
    edgeLength: m(edgeLmm),
    laidLength: m(laidLmm),
    laidWidth: m(laidWmm),
    trimLength: m(trimLmm),
    trimWidth: m(trimWmm),
    roofArea,
    sheetsArea,
    wasteArea,
    wastePct,
    seams,
  };
}

export type RoofCalc = ReturnType<typeof calcRoof>;

/* БЛОК: Поле ввода размера или перехлёста с поддержкой блокировки пресетом (RoofField)
 * ЗА ЧТО ОТВЕЧАЕТ: Позволяет вводить числа в метрах или миллиметрах, а при выборе кнопки «Готовый размер листа» аккуратно блокирует поле от случайной правки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Значение value, подпись label, подсказка hint и флаг блокировки locked из RoofCalculator.
 * КАК ИЗМЕНИТЬ: Внешний вид поля настраивается в классах внутри <input>. */
function RoofField({
  label,
  value,
  unit,
  onChange,
  icon: Icon,
  hint,
  locked = false,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  icon: typeof Ruler;
  hint?: string;
  locked?: boolean;
}) {
  const [text, setText] = useState(String(value).replace(".", ","));
  useEffect(() => setText(String(value).replace(".", ",")), [value]);

  const commit = (raw: string) => {
    setText(raw);
    const parsed = parseFloat(raw.replace(",", "."));
    if (Number.isFinite(parsed) && parsed >= 0) onChange(parsed);
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label className="flex items-center gap-1.5 text-[13px] font-bold text-graphite/70">
          <Icon size={14} strokeWidth={2.4} className="text-graphite/40" />
          {label}
        </label>
        <div className="flex items-baseline gap-1">
          <input
            value={text}
            onChange={(e) => commit(e.target.value)}
            onBlur={() => setText(String(value).replace(".", ","))}
            inputMode="decimal"
            aria-label={label}
            readOnly={locked}
            title={locked ? "Размер зафиксирован выбранным профнастилом" : undefined}
            className={cn(
              "no-spin w-[110px] rounded-lg px-2 py-1 text-right text-[17px] font-extrabold tabular outline-none border transition-colors",
              locked
                ? "cursor-not-allowed border-line bg-smoke/70 text-graphite/55"
                : "border-transparent bg-smoke focus:border-pro",
            )}
          />
          <span className="text-[13px] font-semibold text-graphite/50">{unit}</span>
        </div>
      </div>
      {hint && <div className="mt-1 text-[11.5px] text-graphite/45">{hint}</div>}
    </div>
  );
}

/* БЛОК: Интерактивный блок «Схема укладки листов» с кнопкой «Печать» (RoofLayout)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует раскладку всех листов по рядам, жёлтые полосы перехлёстов, зелёные полосы повторно используемых обрезков со стрелками переноса, подсказку при наведении курсора на любой лист и кнопку печати схемы на 1 лист A4.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Результат расчёта calc из функции calcRoof() и модуль печати printRoofLayout (src/utils/printRoofLayout.ts).
 * КАК ИЗМЕНИТЬ: Цвета штриховок листов, перехлёстов и обрезков задаются в теге <defs> внутри SVG, а тексты легенды и кнопки «Печать» — в шапке этого блока. */
type PieceKind = "sheet" | "edge" | "strip" | "ledge" | "lstrip";

interface Piece {
  key: string;
  label: string;
  sheetNo: number;
  kind: PieceKind;
  groupSize: number;
  row: number;
  col: number;
  x: number;
  y: number;
  cw: number;
  ch: number;
  ew: number;
  eh: number;
  overY: number;
  wMm: number;
  hMm: number;
}

interface Band {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Offcut {
  key: string;
  sheetNo: number;
  kind: "strip" | "waste";
  horizontal?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  targetKey?: string;
  targetY?: number;
  targetX?: number;
}

const LETTERS = "абвгдежзиклмнопрстуфхцчшщэюя";
const pieceSuffix = (pos: number) => (pos < LETTERS.length ? LETTERS[pos] : `.${pos + 1}`);

function labelMode(w: number, h: number, text: string, size = 10.5): "h" | "v" | null {
  const textW = text.length * size * 0.62 + 4;
  if (w >= textW && h >= size + 4) return "h";
  if (h >= textW && w >= size + 3) return "v";
  return null;
}

export function RoofLayout({ calc }: { calc: RoofCalc }) {
  const [hover, setHover] = useState<Piece | null>(null);
  const [printError, setPrintError] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const VIEW_W = 660;
  const VIEW_H = 440;
  const M_LEFT = 58;
  const M_RIGHT = 14;
  const M_TOP = 16;
  const M_BOTTOM = 46;

  const sceneWm = Math.max(calc.roofLength + calc.trimLength, 0.1);
  const sceneHm = Math.max(calc.roofWidth + calc.trimWidth, 0.1);
  const availW = VIEW_W - M_LEFT - M_RIGHT;
  const availH = VIEW_H - M_TOP - M_BOTTOM;
  const scale = Math.min(availW / sceneWm, availH / sceneHm);

  const ox = M_LEFT + (availW - sceneWm * scale) / 2;
  const oy = M_TOP + (availH - sceneHm * scale) / 2;
  const W = calc.roofLength * scale;
  const H = calc.roofWidth * scale;
  const right = ox + W;
  const bottom = oy + H;
  const sceneBottom = oy + sceneHm * scale;

  const stepX = calc.usefulWidth * scale;
  const stepY = calc.usefulLength * scale;
  const sheetW = calc.sheetWidth * scale;
  const sheetH = calc.sheetLength * scale;
  const edgeW = calc.edgeWidth * scale;
  const edgeL = calc.edgeLength * scale;
  const k = calc.stripsPerSheet;
  const kL = calc.stripsPerSheetL;
  const cols = calc.columns;
  const rows = calc.rows;
  const rightCount = calc.rightCount;
  const bottomCount = calc.bottomCount;

  const sheetWMm = Math.round(calc.sheetWidth * 1000);
  const sheetLMm = Math.round(calc.sheetLength * 1000);
  const edgeWMm = Math.round(calc.edgeWidth * 1000);
  const edgeLMm = Math.round(calc.edgeLength * 1000);
  const trimLMm = Math.round(calc.trimLength * 1000);
  const trimWMm = Math.round(calc.trimWidth * 1000);

  const pieces: Piece[] = [];
  const offcuts: Offcut[] = [];
  let n = 0;
  let parentNo = 0;
  let lParentNo = 0;

  for (let row = 0; row < rows; row++) {
    const y = oy + row * stepY;
    const isLastRow = row === rows - 1;
    const ch = Math.max(0.5, Math.min(sheetH, bottom - y));
    const eh = isLastRow ? ch : Math.min(stepY, ch);
    const overY = isLastRow ? Math.max(0, y + sheetH - bottom) : 0;
    const hMm = isLastRow ? edgeLMm : sheetLMm;

    for (let col = 0; col < cols; col++) {
      const x = ox + col * stepX;
      const isLastCol = col === cols - 1;
      const cw = Math.max(0.5, Math.min(sheetW, right - x));
      const ew = isLastCol ? cw : Math.min(stepX, cw);

      const isRight = isLastCol && row < rightCount;
      const isBottom = isLastRow && col < bottomCount;

      if (isRight) {
        const group = Math.floor(row / k);
        const pos = row % k;
        const groupSize = Math.min(k, rightCount - group * k);

        if (pos === 0) {
          n += 1;
          parentNo = n;
          for (let s = 1; s < groupSize; s++) {
            const targetRow = row + s;
            const targetY = oy + targetRow * stepY;
            const targetCh = Math.max(0.5, Math.min(sheetH, bottom - targetY));
            const targetEh = targetRow === rows - 1 ? targetCh : Math.min(stepY, targetCh);
            offcuts.push({
              key: `o-${row}-${s}`,
              sheetNo: parentNo,
              kind: "strip",
              x: right + (s - 1) * edgeW,
              y,
              w: edgeW,
              h: ch,
              label: `${parentNo}${pieceSuffix(s - 1)}`,
              targetKey: `p-${targetRow}-${col}`,
              targetY: targetY + targetEh / 2,
            });
          }
          const wasteW = sheetW - groupSize * edgeW;
          if (wasteW > 0.4) {
            offcuts.push({
              key: `w-${row}-${col}`,
              sheetNo: parentNo,
              kind: "waste",
              x: right + (groupSize - 1) * edgeW,
              y,
              w: wasteW,
              h: ch,
            });
          }
          if (isLastRow && overY > 0.4) {
            if (sheetW - edgeW > 0.4) {
              offcuts.push({
                key: `c-${row}-${col}`,
                sheetNo: parentNo,
                kind: "waste",
                x: right,
                y: bottom,
                w: sheetW - edgeW,
                h: overY,
              });
            }
            offcuts.push({
              key: `cb-${row}-${col}`,
              sheetNo: parentNo,
              kind: "waste",
              x,
              y: bottom,
              w: edgeW,
              h: overY,
            });
          }
        }

        pieces.push({
          key: `p-${row}-${col}`,
          label: pos === 0 ? String(parentNo) : `${parentNo}${pieceSuffix(pos - 1)}`,
          sheetNo: parentNo,
          kind: pos === 0 ? "edge" : "strip",
          groupSize,
          row,
          col,
          x,
          y,
          cw,
          ch,
          ew,
          eh,
          overY,
          wMm: edgeWMm,
          hMm,
        });
        continue;
      }

      if (isBottom) {
        const lGroup = Math.floor(col / kL);
        const lPos = col % kL;
        const lGroupSize = Math.min(kL, bottomCount - lGroup * kL);

        if (lPos === 0) {
          n += 1;
          lParentNo = n;
          for (let s = 1; s < lGroupSize; s++) {
            const targetCol = col + s;
            offcuts.push({
              key: `lo-${row}-${col}-${s}`,
              sheetNo: lParentNo,
              kind: "strip",
              horizontal: true,
              x,
              y: bottom + (s - 1) * edgeL,
              w: sheetW,
              h: edgeL,
              label: `${lParentNo}${pieceSuffix(s - 1)}`,
              targetKey: `p-${row}-${targetCol}`,
              targetX: ox + targetCol * stepX + Math.min(stepX, sheetW) / 2,
            });
          }
          const remH = sheetH - lGroupSize * edgeL;
          if (remH > 0.4) {
            offcuts.push({
              key: `lr-${row}-${col}`,
              sheetNo: lParentNo,
              kind: "waste",
              x,
              y: bottom + (lGroupSize - 1) * edgeL,
              w: sheetW,
              h: remH,
            });
          }
        }

        pieces.push({
          key: `p-${row}-${col}`,
          label: lPos === 0 ? String(lParentNo) : `${lParentNo}${pieceSuffix(lPos - 1)}`,
          sheetNo: lParentNo,
          kind: lPos === 0 ? "ledge" : "lstrip",
          groupSize: lGroupSize,
          row,
          col,
          x,
          y,
          cw,
          ch,
          ew,
          eh,
          overY: 0,
          wMm: sheetWMm,
          hMm: edgeLMm,
        });
        continue;
      }

      n += 1;
      pieces.push({
        key: `p-${row}-${col}`,
        label: String(n),
        sheetNo: n,
        kind: "sheet",
        groupSize: 1,
        row,
        col,
        x,
        y,
        cw,
        ch,
        ew,
        eh,
        overY: 0,
        wMm: sheetWMm,
        hMm,
      });
    }
  }

  const rowGroups = new Map<number, Piece[]>();
  for (const p of pieces) {
    const list = rowGroups.get(p.row) ?? [];
    list.push(p);
    rowGroups.set(p.row, list);
  }
  const pieceByKey = new Map(pieces.map((p) => [p.key, p]));

  const bands: Band[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const x = ox + (col + 1) * stepX;
      const y = oy + row * stepY;
      const w = Math.min(ox + col * stepX + sheetW, right) - x;
      if (w > 0.4) bands.push({ key: `bx-${row}-${col}`, x, y, w, h: Math.max(0.5, Math.min(sheetH, bottom - y)) });
    }
  }
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols; col++) {
      const x = ox + col * stepX;
      const y = oy + (row + 1) * stepY;
      const h = Math.min(oy + row * stepY + sheetH, bottom) - y;
      if (h > 0.4) bands.push({ key: `by-${row}-${col}`, x, y, w: Math.max(0.5, Math.min(sheetW, right - x)), h });
    }
  }

  const overlapXMm = Math.round(calc.overlapW * 1000);
  const overlapYMm = Math.round(calc.overlapL * 1000);
  const firstBand = bands[0];
  const showOverlapLabel = Boolean(firstBand && firstBand.w > 15 && firstBand.h > 26);
  const dense = pieces.length > 360;
  const hasWaste = offcuts.some((o) => o.kind === "waste") || pieces.some((p) => p.overY > 0.4);
  const showArrowsW = calc.savedW > 0 && stepY >= 14 && edgeW >= 8;
  const showArrowsL = calc.savedL > 0 && stepX >= 14 && edgeL >= 8;

  /* БЛОК: Печать схемы | ЗА ЧТО ОТВЕЧАЕТ: Открывает системное окно печати сразу на странице — так же, как кнопка «Печать» на страницах «Грильято», «Армстронг» и «Сайдинг», без новой вкладки | ОТКУДА ДАННЫЕ: Расчёт calc и текущая SVG-схема */
  const handlePrint = () => {
    const printed = printRoofLayoutOverlay(calc, svgRef.current, hasWaste);
    setPrintError(!printed);
  };

  const groupActive = (sheetNo: number) =>
    hover !== null && hover.kind !== "sheet" && hover.groupSize > 1 && hover.sheetNo === sheetNo;
  const pieceActive = (p: Piece) =>
    hover !== null && (hover.key === p.key || (p.kind !== "sheet" && groupActive(p.sheetNo)));

  const hoverText = (() => {
    if (!hover) {
      return calc.savedW + calc.savedL > 0
        ? "Наведите на лист или полосу — увидите размер и из какого листа она вырезана"
        : "Наведите на лист — увидите его фактический размер и подрезку";
    }
    const size = `${fmt.format(hover.wMm)} × ${fmt.format(hover.hMm)} мм на кровле`;
    const parts: (string | null)[] = [];
    if (hover.kind === "strip") {
      parts.push(`Полоса ${hover.label} — из остатка листа ${hover.sheetNo} (подрезка по ширине)`, size);
    } else if (hover.kind === "edge" && hover.groupSize > 1) {
      const extra = hover.groupSize - 1;
      parts.push(
        `Лист ${hover.sheetNo} → полоса ${hover.label}`,
        size,
        `из остатка ещё ${extra} ${plural(extra, "полоса", "полосы", "полос")} (по ширине)`,
        trimLMm > 0 ? `подрезка по ширине ${fmt.format(trimLMm)} мм — в дело` : null,
      );
    } else if (hover.kind === "edge") {
      parts.push(`Лист ${hover.label}`, size, trimLMm > 0 ? `подрезка по ширине ${fmt.format(trimLMm)} мм` : null);
    } else if (hover.kind === "lstrip") {
      parts.push(`Полоса ${hover.label} — из остатка листа ${hover.sheetNo} (подрезка по длине)`, size);
    } else if (hover.kind === "ledge" && hover.groupSize > 1) {
      const extra = hover.groupSize - 1;
      parts.push(
        `Лист ${hover.sheetNo} → полоса ${hover.label}`,
        size,
        `из остатка ещё ${extra} ${plural(extra, "полоса", "полосы", "полос")} (по длине)`,
        trimWMm > 0 ? `подрезка по длине ${fmt.format(trimWMm)} мм — в дело` : null,
      );
    } else if (hover.kind === "ledge") {
      parts.push(`Лист ${hover.label}`, size, trimWMm > 0 ? `подрезка по длине ${fmt.format(trimWMm)} мм` : null);
    } else {
      parts.push(`Лист ${hover.label}`, size);
    }
    return parts.filter(Boolean).join(" · ");
  })();

  const dimY = sceneBottom + 16;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-2.5 lg:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[13px] font-extrabold">
            <LayoutGrid size={15} strokeWidth={2.3} className="text-graphite/50" />
            Схема укладки листов
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-bold text-graphite/75 transition-colors hover:border-graphite/50 hover:bg-smoke"
          >
            <Printer size={13} strokeWidth={2.5} />
            Печать
          </button>
          {printError && (
            <span role="alert" className="text-[11px] font-semibold text-red-600">
              Не удалось подготовить лист печати
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] font-semibold text-graphite/55">
          <span className="flex items-center gap-1.5">
            <svg width="20" height="9" aria-hidden="true">
              <rect x="0.6" y="0.6" width="18.8" height="7.8" fill="#FFCB05" fillOpacity="0.28" stroke="#A98700" strokeWidth="1.1" strokeDasharray="4 2.5" />
            </svg>
            перехлёст {fmt.format(overlapXMm)}ш {fmt.format(overlapYMm)}д мм
          </span>
          {calc.savedW + calc.savedL > 0 && (
            <span className="flex items-center gap-1.5">
              <svg width="20" height="9" aria-hidden="true">
                <rect x="0.6" y="0.6" width="18.8" height="7.8" fill="#e2f3e8" stroke="#2f8f5b" strokeWidth="1.1" strokeDasharray="4 2.5" />
              </svg>
              остаток листа в дело
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <svg width="20" height="9" aria-hidden="true">
              <rect x="0.6" y="0.6" width="18.8" height="7.8" fill="#fff" stroke="#98a2a8" strokeWidth="1.1" strokeDasharray="3 2.5" />
            </svg>
            {hasWaste ? "отход подрезки" : "без отходов"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm border border-[#68798a] bg-[#eaf0f6]" /> лист
          </span>
        </div>
      </div>

      <div className="overflow-x-auto thin-scroll p-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="mx-auto block h-auto w-full min-w-[540px]"
          role="img"
          aria-label={`Схема укладки: ${cols} листов в ряду, ${rows} рядов, всего ${fmt.format(calc.sheets)} листов`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="roof-sheet" width="9" height="9" patternUnits="userSpaceOnUse">
              <rect width="9" height="9" fill="#eaf0f6" />
              <path d="M0 9 L9 0" stroke="#c2cfdb" strokeWidth="1" />
              <path d="M0 0 L9 9" stroke="#dce4ec" strokeWidth="0.8" />
            </pattern>
            <pattern id="roof-strip" width="9" height="9" patternUnits="userSpaceOnUse">
              <rect width="9" height="9" fill="#e2f3e8" />
              <path d="M0 9 L9 0" stroke="#a9d8b9" strokeWidth="1" />
            </pattern>
            <pattern id="roof-overlap" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#FFCB05" fillOpacity="0.26" />
              <path d="M0 6 L6 0" stroke="#c9a400" strokeWidth="1" strokeOpacity="0.5" />
            </pattern>
            <pattern id="roof-trim" width="5" height="5" patternUnits="userSpaceOnUse">
              <rect width="5" height="5" fill="#fff" />
              <path d="M0 5 L5 0" stroke="#c9d0d4" strokeWidth="0.9" />
            </pattern>
            <marker id="roof-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 1 L9 5 L0 9 Z" fill="#2f8f5b" />
            </marker>
            <clipPath id="roof-clip">
              <rect x={ox} y={oy} width={W} height={H} />
            </clipPath>
          </defs>

          <rect x={ox} y={oy} width={W} height={H} fill="#f6f7f6" />

          {pieces.map((p) =>
            p.overY > 0.4 ? (
              <rect
                key={`under-${p.key}`}
                x={p.x}
                y={bottom}
                width={p.cw}
                height={p.overY}
                fill="url(#roof-trim)"
                stroke="#98a2a8"
                strokeWidth="1"
                strokeDasharray="3 2.5"
              />
            ) : null,
          )}
          {offcuts.map((o) => {
            const active = groupActive(o.sheetNo);
            const strip = o.kind === "strip";
            return (
              <rect
                key={o.key}
                x={o.x}
                y={o.y}
                width={Math.max(o.w, 0.5)}
                height={Math.max(o.h, 0.5)}
                fill={strip ? (active ? "#cdebd8" : "url(#roof-strip)") : "url(#roof-trim)"}
                stroke={strip ? "#2f8f5b" : "#98a2a8"}
                strokeWidth={active ? 1.8 : 1}
                strokeDasharray={strip ? "4 2.5" : "3 2.5"}
                className="transition-all duration-150"
              />
            );
          })}

          <g clipPath="url(#roof-clip)">
            {[...rowGroups.entries()].map(([row, list]) => (
              <motion.g
                key={`row-${row}`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: Math.min(row * 0.08, 0.55), ease }}
              >
                {list.map((p) => {
                  const active = pieceActive(p);
                  const strip = p.kind === "strip" || p.kind === "lstrip";
                  return (
                    <rect
                      key={`sheet-${p.key}`}
                      x={p.x}
                      y={p.y}
                      width={p.cw}
                      height={p.ch}
                      fill={strip ? (active ? "#cdebd8" : "url(#roof-strip)") : active ? "#d7e4f3" : "url(#roof-sheet)"}
                      stroke={active ? "#20282B" : strip ? "#2f8f5b" : "#6d7e8e"}
                      strokeWidth={active ? 2.2 : 1.1}
                      className="transition-all duration-150"
                    />
                  );
                })}
              </motion.g>
            ))}

            <motion.g
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: 0.32, ease }}
            >
              {bands.map((b) => (
                <rect
                  key={b.key}
                  x={b.x}
                  y={b.y}
                  width={Math.max(b.w, 0.4)}
                  height={Math.max(b.h, 0.4)}
                  fill="url(#roof-overlap)"
                  stroke="#A98700"
                  strokeWidth="1.1"
                  strokeDasharray="5 3"
                  pointerEvents="none"
                />
              ))}
              {showOverlapLabel && firstBand && (
                <text
                  x={firstBand.x + firstBand.w / 2}
                  y={firstBand.y + firstBand.h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9.5"
                  fontWeight="800"
                  fontFamily={MONO}
                  fill="#6b5800"
                  transform={`rotate(-90 ${firstBand.x + firstBand.w / 2} ${firstBand.y + firstBand.h / 2})`}
                  pointerEvents="none"
                >
                  {fmt.format(overlapXMm)}
                </text>
              )}
            </motion.g>

            {!dense && (
              <g pointerEvents="none">
                {pieces.map((p) => {
                  const mode = labelMode(p.ew, p.eh, p.label);
                  if (!mode) return null;
                  const cx = p.x + p.ew / 2;
                  const cy = p.y + p.eh / 2;
                  return (
                    <text
                      key={`num-${p.key}`}
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10.5"
                      fontWeight="700"
                      fontFamily={MONO}
                      fill={p.kind === "strip" || p.kind === "lstrip" ? "#1f6b43" : "#3c4753"}
                      transform={mode === "v" ? `rotate(-90 ${cx} ${cy})` : undefined}
                    >
                      {p.label}
                    </text>
                  );
                })}
              </g>
            )}
          </g>

          <rect x={ox} y={oy} width={W} height={H} fill="none" stroke="#20282B" strokeWidth="2.2" />

          <g pointerEvents="none">
            {offcuts.map((o) => {
              if (o.kind !== "strip" || !o.label) return null;
              const isH = o.horizontal;
              const cx = o.x + o.w / 2;
              const cy = o.y + o.h / 2;
              const mode = dense ? null : labelMode(o.w, o.h, o.label, 9.5);
              return (
                <g key={`ol-${o.key}`}>
                  {mode && (
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="9.5"
                      fontWeight="800"
                      fontFamily={MONO}
                      fill="#1f6b43"
                      transform={mode === "v" ? `rotate(-90 ${cx} ${cy})` : undefined}
                    >
                      {o.label}
                    </text>
                  )}
                  {showArrowsW && !isH && o.targetY != null && (
                    <path
                      d={`M ${cx} ${cy} Q ${cx} ${o.targetY} ${right + 3} ${o.targetY}`}
                      fill="none"
                      stroke="#2f8f5b"
                      strokeWidth="1.2"
                      strokeDasharray="3 2.5"
                      markerEnd="url(#roof-arrow)"
                    />
                  )}
                  {showArrowsL && isH && o.targetX != null && (
                    <path
                      d={`M ${cx} ${cy} Q ${o.targetX} ${cy} ${o.targetX} ${bottom + 3}`}
                      fill="none"
                      stroke="#2f8f5b"
                      strokeWidth="1.2"
                      strokeDasharray="3 2.5"
                      markerEnd="url(#roof-arrow)"
                    />
                  )}
                </g>
              );
            })}
          </g>

          <g stroke="#5b6166" strokeWidth="1.2">
            <line x1={ox} y1={dimY} x2={right} y2={dimY} />
            <line x1={ox} y1={bottom + 3} x2={ox} y2={dimY + 6} />
            <line x1={right} y1={bottom + 3} x2={right} y2={dimY + 6} />
            <line x1={ox - 20} y1={oy} x2={ox - 20} y2={bottom} />
            <line x1={ox - 26} y1={oy} x2={ox - 14} y2={oy} />
            <line x1={ox - 26} y1={bottom} x2={ox - 14} y2={bottom} />
          </g>
          <text x={ox + W / 2} y={dimY + 16} textAnchor="middle" fontSize="12.5" fontWeight="700" fontFamily={MONO} fill="#1f4f8a">
            длина кровли {m2(calc.roofLength)} м
          </text>
          <text
            x={ox - 28}
            y={oy + H / 2}
            textAnchor="middle"
            fontSize="12.5"
            fontWeight="700"
            fontFamily={MONO}
            fill="#1f4f8a"
            transform={`rotate(-90 ${ox - 28} ${oy + H / 2})`}
          >
            ширина {m2(calc.roofWidth)} м
          </text>

          {pieces.map((p) => (
            <rect
              key={`hit-${p.key}`}
              x={p.x}
              y={p.y}
              width={p.cw}
              height={p.ch}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover((prev) => (prev?.key === p.key ? null : prev))}
            />
          ))}
          {offcuts.map((o) => {
            const target = o.targetKey ? pieceByKey.get(o.targetKey) : undefined;
            if (!target) return null;
            return (
              <rect
                key={`hit-${o.key}`}
                x={o.x}
                y={o.y}
                width={Math.max(o.w, 0.5)}
                height={Math.max(o.h, 0.5)}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHover(target)}
                onMouseLeave={() => setHover((prev) => (prev?.key === target.key ? null : prev))}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-line bg-smoke px-4 py-2.5 text-[12px] font-semibold lg:px-5">
        <span className="flex items-center gap-2 text-graphite/70">
          <Scissors size={13} strokeWidth={2.4} className="text-graphite/45" />
          {hoverText}
        </span>
        <span className="tabular text-graphite/50">
          {fmt.format(cols)} в ряду · {fmt.format(rows)} рядов · полос перехлёста: {fmt.format(calc.seams)}
        </span>
      </div>
    </div>
  );
}

/* БЛОК: Главный компонент калькулятора кровли (RoofCalculator)
 * ЗА ЧТО ОТВЕЧАЕТ: Объединяет левую панель параметров (размеры кровли, перехлёсты, размеры листа и кнопки готовых видов кровли) с правой колонкой (карточки сводки, схема RoofLayout и таблица «Результат расчёта»).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Список готовых размеров листа берётся из useSiteSettings().sheets (админка #/admin), а также слушает событие "roof:select-material" от карточек в блоке «Виды кровли».
 * КАК ИЗМЕНИТЬ: Состав строк таблицы «Результат расчёта» меняется в массиве resultRows, а сводные плашки сверху — в массиве params. */
export function RoofCalculator({
  title = "Расчёт листов для кровли",
  eyebrow = "Калькулятор · Кровля",
  background = "smoke",
}: {
  title?: string;
  eyebrow?: string;
  background?: "white" | "smoke";
}) {
  /* Стартовые размеры ската, листа и перехлёстов берутся из админки («Настройка страниц» → «Кровля») */
  const [input, setInput] = useState<RoofInput>(() => {
    try {
      return { ...DEFAULT_ROOF, ...loadSettings().calculators.roof };
    } catch {
      return DEFAULT_ROOF;
    }
  });
  const [presetId, setPresetId] = useState<string | null>(null);
  const calc = useMemo(() => calcRoof(input), [input]);

  const sheetPresets = useSiteSettings().sheets.filter((preset) => preset.enabled);

  const set = <K extends keyof RoofInput>(key: K, value: RoofInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (preset: SheetPreset) => {
    if (presetId === preset.id) {
      setPresetId(null);
      return;
    }
    setPresetId(preset.id);
    setInput((prev) => ({
      ...prev,
      sheetWidth: preset.sheetWidth,
      sheetLength: preset.sheetLength,
      overlapWidth: preset.overlapWidth,
      overlapLength: preset.overlapLength,
    }));
  };

  useEffect(() => {
    const onSelectMaterial = (e: Event) => {
      const p = (e as CustomEvent<SheetPreset["id"] | Partial<SheetPreset>>).detail;
      if (!p) return;
      if (typeof p === "string") {
        const found = sheetPresets.find((item) => item.id === p);
        if (found) applyPreset(found);
      } else if (typeof p === "object") {
        setPresetId(null);
        setInput((prev) => ({
          ...prev,
          sheetWidth: typeof p.sheetWidth === "number" ? p.sheetWidth : prev.sheetWidth,
          sheetLength: typeof p.sheetLength === "number" ? p.sheetLength : prev.sheetLength,
          overlapWidth: typeof p.overlapWidth === "number" ? p.overlapWidth : prev.overlapWidth,
          overlapLength: typeof p.overlapLength === "number" ? p.overlapLength : prev.overlapLength,
        }));
      }
    };
    window.addEventListener("roof:select-material", onSelectMaterial);
    return () => window.removeEventListener("roof:select-material", onSelectMaterial);
  }, [sheetPresets]);

  const mm = (v: number) => `${fmt.format(Math.round(v * 1000))} мм`;
  const activePreset = sheetPresets.find((p) => p.id === presetId) ?? null;

  const params = [
    { k: "Кровля", v: `${m2(calc.roofLength)} × ${m2(calc.roofWidth)} м` },
    { k: "Площадь", v: `${fmt1(calc.roofArea)} м²` },
    { k: "Лист", v: `${m2(calc.sheetLength)} × ${m2(calc.sheetWidth)} м` },
    { k: "Перехлёст", v: `${mm(calc.overlapW).replace(" мм", "")}ш ${mm(calc.overlapL).replace(" мм", "")}д мм` },
  ];

  const resultRows: { k: string; v: string; accent?: boolean }[] = [
    { k: "Листов в одном ряду", v: `${fmt.format(calc.columns)} шт` },
    { k: "Рядов по длине кровли", v: `${fmt.format(calc.rows)} шт` },
    { k: "Полезная ширина листа", v: mm(calc.usefulWidth) },
    { k: "Полезная длина листа", v: mm(calc.usefulLength) },
    {
      k: "Сэкономлено за счёт подрезки по ширине",
      v: calc.savedW > 0 ? `${fmt.format(calc.savedW)} шт` : "—",
      accent: calc.savedW > 0,
    },
    {
      k: "Сэкономлено за счёт подрезки по длине",
      v: calc.savedL > 0 ? `${fmt.format(calc.savedL)} шт` : "—",
      accent: calc.savedL > 0,
    },
    { k: "Площадь кровли", v: `${fmt1(calc.roofArea)} м²` },
    { k: "Площадь закупаемых листов", v: `${fmt1(calc.sheetsArea)} м²` },
    { k: "Расход в перехлёсты и подрезку", v: `${fmt1(calc.wasteArea)} м² (${fmt1(calc.wastePct)} %)` },
  ];

  return (
    <section
      id="calc"
      className={cn(
        "scroll-mt-[130px] py-12 lg:py-16",
        background === "white" ? "bg-white" : "bg-smoke",
      )}
    >
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
        {/* БЛОК: Заголовок секции калькулятора кровли | ЗА ЧТО ОТВЕЧАЕТ: Выводит надзаголовок и заголовок раздела | ОТКУДА ДАННЫЕ: Пропсы eyebrow и title (задаются в src/pages/RoofPage.tsx) | КАК ИЗМЕНИТЬ: Поменяйте title в src/pages/RoofPage.tsx */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease }}
          className="mb-8"
        >
          <div className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-graphite/45">
            {eyebrow}
          </div>
          <h2 className="text-[32px] font-black leading-[1.02] tracking-[-0.01em] lg:text-[46px]">
            {title}
          </h2>
        </motion.div>

        <div className="grid items-start gap-5 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)]">
          {/* БЛОК: Левая колонка — ввод габаритов ската, перехлёстов и кнопки «Готовый размер листа» | ЗА ЧТО ОТВЕЧАЕТ: Все поля управления расчётом | ОТКУДА ДАННЫЕ: Состояние input и массив sheetPresets из настроек админки | КАК ИЗМЕНИТЬ: Кнопки готовых размеров редактируются на странице «Администрирование» (#/admin) */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="space-y-6 rounded-3xl border border-line bg-white p-5 shadow-[0_2px_20px_rgba(20,25,27,0.05)] lg:p-6"
          >
            <div className="space-y-5">
              <RoofField
                label="Длина кровли"
                unit="м"
                value={input.roofLength}
                onChange={(v) => set("roofLength", v)}
                icon={MoveHorizontal}
              />
              <RoofField
                label="Ширина кровли"
                unit="м"
                value={input.roofWidth}
                onChange={(v) => set("roofWidth", v)}
                icon={MoveVertical}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-smoke px-3.5 py-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-graphite/45">Площадь</div>
                  <div className="text-[19px] font-black tabular">{fmt1(calc.roofArea)} м²</div>
                </div>
                <div className="rounded-xl bg-smoke px-3.5 py-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-graphite/45">Листов</div>
                  <div className="text-[19px] font-black tabular">{fmt.format(calc.sheets)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <RoofField
                label="Перехлёст по ширине"
                unit="мм"
                value={input.overlapWidth}
                onChange={(v) => set("overlapWidth", v)}
                icon={RectangleHorizontal}
                hint="Боковое перекрытие соседних листов"
                locked={Boolean(activePreset)}
              />
              <RoofField
                label="Перехлёст по длине"
                unit="мм"
                value={input.overlapLength}
                onChange={(v) => set("overlapLength", v)}
                icon={MoveVertical}
                hint="Перекрытие листов следующего ряда"
                locked={Boolean(activePreset)}
              />
            </div>

            <div className="space-y-5">
              <RoofField
                label="Длина листа"
                unit="м"
                value={input.sheetLength}
                onChange={(v) => set("sheetLength", v)}
                icon={Ruler}
                locked={Boolean(activePreset)}
              />
              <RoofField
                label="Ширина листа"
                unit="м"
                value={input.sheetWidth}
                onChange={(v) => set("sheetWidth", v)}
                icon={RectangleHorizontal}
                locked={Boolean(activePreset)}
              />
            </div>

            <div>
              <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-graphite/70">
                <Layers size={14} strokeWidth={2.4} className="text-graphite/40" />
                Готовый размер листа
              </div>
              {sheetPresets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-graphite/25 px-3 py-3 text-[11.5px] leading-relaxed text-graphite/45">
                  Готовые размеры не заданы — введите ширину, длину листа и перехлёсты вручную.
                </div>
              ) : (
                <div className="grid grid-cols-2 auto-rows-fr gap-2">
                  {sheetPresets.map((preset) => {
                    const active = presetId === preset.id;
                    const note = presetNote(preset);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        aria-pressed={active}
                        title={
                          active
                            ? "Нажмите ещё раз, чтобы ввести свои размеры"
                            : `Зафиксировать ${note.size}, перехлёст ${note.overlap}`
                        }
                        className={cn(
                          "flex flex-col rounded-xl border px-3 py-2.5 text-left transition-all",
                          active
                            ? "border-graphite bg-graphite text-white shadow-[0_4px_14px_rgba(20,25,27,0.25)]"
                            : "border-line bg-white hover:border-graphite/40",
                        )}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-[12.5px] font-extrabold leading-tight">{preset.label}</span>
                          {active && <Lock size={12} strokeWidth={2.6} className="mt-0.5 shrink-0 text-pro" />}
                        </span>
                        <span
                          className={cn(
                            "mt-auto block pt-1.5 text-[11.5px] font-semibold tabular",
                            active ? "text-white/65" : "text-graphite/50",
                          )}
                        >
                          {note.size}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-[10.5px] font-semibold tabular",
                            active ? "text-white/45" : "text-graphite/40",
                          )}
                        >
                          перехлёст {note.overlap}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="mt-2 text-[11.5px] leading-relaxed text-graphite/45">
                {activePreset
                  ? `Зафиксировано: ${activePreset.label}, ${presetNote(activePreset).size}, перехлёст ${presetNote(activePreset).overlap}. Нажмите кнопку ещё раз, чтобы ввести свои.`
                  : "Выберите материал кровли — размеры листа и перехлёсты подставятся и зафиксируются."}
              </div>
            </div>
          </motion.div>

          {/* БЛОК: Правая колонка — сводные карточки, схема укладки и таблица «Результат расчёта» | ЗА ЧТО ОТВЕЧАЕТ: Визуализирует раскладку и итоговое число листов | ОТКУДА ДАННЫЕ: Массивы params, resultRows и компонент RoofLayout | КАК ИЗМЕНИТЬ: Поменяйте строки в массивах params и resultRows выше */}
          <div className="min-w-0 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.06, ease }}
              className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
            >
              {params.map((p) => (
                <div key={p.k} className="bg-white px-4 py-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-graphite/45">{p.k}</div>
                  <div className="mt-0.5 text-[15px] font-extrabold tabular">{p.v}</div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
            >
              <RoofLayout calc={calc} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.14, ease }}
              className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_20px_rgba(20,25,27,0.04)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 lg:px-5">
                <div className="text-[15px] font-extrabold">Результат расчёта</div>
                <div className="text-[12px] font-semibold text-graphite/50">
                  количество листов с учётом перехлёстов и остатков
                </div>
              </div>
              <div className="overflow-x-auto thin-scroll">
                <table className="w-full min-w-[440px] text-[13.5px]">
                  <thead>
                    <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-graphite/45">
                      <th className="px-4 py-2.5 font-bold lg:px-5">Параметр</th>
                      <th className="px-3 py-2.5 text-right font-bold">Значение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultRows.map((r, i) => (
                      <tr key={r.k} className={cn("border-b border-line/70", i % 2 === 1 && "bg-smoke/60")}>
                        <td className="px-4 py-3 font-semibold text-graphite/85 lg:px-5">{r.k}</td>
                        <td className={cn("px-3 py-3 text-right font-extrabold tabular", r.accent && "text-emerald-700")}>
                          {r.v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-graphite text-white">
                      <td className="px-4 py-4 text-[12px] font-extrabold uppercase tracking-widest lg:px-5">
                        Итого листов
                      </td>
                      <td className="px-3 py-4 text-right text-[34px] font-black leading-none tabular text-pro">
                        {fmt.format(calc.sheets)} <span className="text-[18px]">шт</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RoofCalculator;
