/* ============================================================================
 * ФАЙЛ: src/components/PlanPreview.tsx — План потолка Грильято (вид сверху)
 * ЗА ЧТО ОТВЕЧАЕТ: Строит интерактивный чертёж потолка сверху в масштабе помещения: сетку ячеек, модули 600×600, несущие направляющие 2,4 / 1,2 / 0,6 м, точки подвесов и периметральный угол с увеличением на весь экран.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Размеры помещения, ячейка и цвет (input), число решёток (blocks) и шаг несущих направляющих (railStep) передаются из src/components/Calculator.tsx (когда включён проп showPlan={true}).
 * КАК ИЗМЕНИТЬ: Цвета направляющих на схеме задаются константами MAIN_COLOR, G12_COLOR, G06_COLOR, а палитры заливки потолка по цвету — в словаре PLAN_STYLE ниже.
 * ========================================================================= */

import { useEffect, useId, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { fmt1, type CalcInput } from "../data/grilyato";

/* БЛОК: Цветовая палитра плана потолка и условных линий направляющих (PLAN_STYLE, MAIN_COLOR, G12_COLOR, G06_COLOR)
 * ЗА ЧТО ОТВЕЧАЕТ: Определяет цвета фона потолка для чёрного, белого и металлика, а также жёлтый, голубой и розовый цвета направляющих на чертеже.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Ключ цвета colorId ("black" | "white" | "metal") из калькулятора.
 * КАК ИЗМЕНИТЬ: Замените HEX-коды цветов в PLAN_STYLE или в константах MAIN_COLOR / G12_COLOR / G06_COLOR. */
const PLAN_STYLE: Record<string, { fill: string; cell: string; mod: string; wall: string }> = {
  black: { fill: "#212326", cell: "#3f4145", mod: "#585b61", wall: "#101214" },
  white: { fill: "#fbfbfa", cell: "#ddddd8", mod: "#c2c2bb", wall: "#7a7d75" },
  metal: { fill: "#d4d8dc", cell: "#b6bbc1", mod: "#9ba2a9", wall: "#707880" },
};

const MAIN_COLOR = "#FFCB05";
const G12_COLOR = "#38BDF8";
const G06_COLOR = "#F472B6";

const VW = 640, VH = 400, PAD = 66;

/* БЛОК: Легенда условных обозначений под планом потолка (Legend)
 * ЗА ЧТО ОТВЕЧАЕТ: Расшифровывает цветные линии направляющих, точки подвесов и контур пристенного угла под схемой и в полноэкранном окне.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Шаг несущих railStep и флаг ячейки 100×100 (is100).
 * КАК ИЗМЕНИТЬ: Поменяйте пояснительные тексты внутри элементов <span>. */
function Legend({ railStep, is100 }: { railStep: number; is100: boolean }) {
  const railLabel = `несущая 2,4 м (шаг ${fmt1(railStep).replace(".", ",")} м)`;
  return (
    <>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-[3px] rounded-full" style={{ background: MAIN_COLOR }} /> {railLabel}
      </span>
      {is100 && (
        <span className="flex items-center gap-1.5">
          <span className="w-[3px] h-3 rounded-full" style={{ background: G12_COLOR }} /> несущая 1,2 м верт. (шаг 0,6 м)
        </span>
      )}
      {is100 && (
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-[3px] rounded-full" style={{ background: G06_COLOR }} /> несущая 0,6 м гориз. (отступ 0,6 м, шаг 1,2 м)
        </span>
      )}
      {!is100 && (
        <span className="flex items-center gap-1.5">
          <span className="w-[3px] h-3 rounded-full" style={{ background: G06_COLOR }} /> несущая 0,6 м верт. (отступ 0,6 м, шаг 0,6 м)
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-graphite ring-2 ring-pro" /> евро подвес (шаг 1,0 м)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 border-2 border-graphite/50" /> угол PL19×24
      </span>
    </>
  );
}

/* БЛОК: Компонент «План потолка · вид сверху» с полноэкранным режимом (PlanPreview)
 * ЗА ЧТО ОТВЕЧАЕТ: Масштабирует прямоугольник комнаты под холст 640×400, раскладывает направляющие и подвесы по шагу системы и открывает увеличенный план при нажатии.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Пропсы input, blocks и railStep из калькулятора.
 * КАК ИЗМЕНИТЬ: Включается на странице Грильято передачей showPlan={true} в компонент <Calculator /> в файле src/pages/GrilyatoPage.tsx. */
export default function PlanPreview({
  input,
  blocks,
  railStep = 1.2,
}: {
  input: CalcInput;
  blocks: number;
  railStep?: number;
}) {
  const { length: L, width: W, cellMm: cell, colorId } = input;
  const st = PLAN_STYLE[colorId] ?? PLAN_STYLE.black;
  const pxPerM = Math.min((VW - PAD * 2) / Math.max(L, 0.1), (VH - PAD * 2) / Math.max(W, 0.1));
  const wPx = L * pxPerM, hPx = W * pxPerM;
  const ox = (VW - wPx) / 2, oy = (VH - hPx) / 2;

  const cellPx = (cell / 1000) * pxPerM;
  const modPx = 0.6 * pxPerM;
  const railPx = railStep * pxPerM;
  const hangPx = 1.0 * pxPerM;
  const step06Px = 0.6 * pxPerM;

  const is100 = cell === 100;

  const rows = Math.max(0, Math.ceil(W / railStep));
  const mainYs: number[] = Array.from({ length: rows }, (_, i) =>
    oy + Math.min((i + 0.5) * railPx, hPx - 0.3 * pxPerM),
  );

  const v12Count = is100 ? Math.max(0, Math.ceil(L / 0.6)) : 0;
  const v12Xs: number[] = Array.from(
    { length: v12Count },
    (_, j) => ox + Math.min((j + 0.5) * step06Px, wPx - 0.2 * pxPerM),
  );

  const h06Ys: number[] = (() => {
    if (!is100) return [];
    const list = mainYs
      .map((y) => y + step06Px)
      .filter((y) => y > oy + 0.15 * pxPerM && y < oy + hPx - 0.15 * pxPerM);
    return list.filter((y, i) => i === 0 || Math.abs(y - list[i - 1]) > 1);
  })();

  const v06Count = !is100 ? Math.max(0, Math.floor((L - 0.15) / 0.6)) : 0;
  const v06Xs: number[] = Array.from(
    { length: v06Count },
    (_, j) => ox + (0.6 + j * 0.6) * pxPerM,
  );

  const uid = useId().replace(/:/g, "");
  const idCells = `${uid}-cells`;
  const idMods = `${uid}-mods`;

  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomed]);

  const plan = (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full h-auto block select-none"
      role="img"
      aria-label={`План потолка ${fmt1(L)} × ${fmt1(W)} м, вид сверху`}
    >
      <defs>
        <pattern id={idCells} width={cellPx} height={cellPx} patternUnits="userSpaceOnUse">
          <path d={`M ${cellPx} 0 H 0 V ${cellPx}`} fill="none" stroke={st.cell} strokeWidth="0.9" />
        </pattern>
        <pattern id={idMods} width={modPx} height={modPx} patternUnits="userSpaceOnUse">
          <path d={`M ${modPx} 0 H 0 V ${modPx}`} fill="none" stroke={st.mod} strokeWidth="1.6" />
        </pattern>
      </defs>

      <g stroke="#9a9d99" strokeWidth="1.4">
        <line x1={ox} y1={oy - 26} x2={ox + wPx} y2={oy - 26} />
        <line x1={ox} y1={oy - 32} x2={ox} y2={oy - 20} />
        <line x1={ox + wPx} y1={oy - 32} x2={ox + wPx} y2={oy - 20} />
        <line x1={ox - 26} y1={oy} x2={ox - 26} y2={oy + hPx} />
        <line x1={ox - 32} y1={oy} x2={ox - 20} y2={oy} />
        <line x1={ox - 32} y1={oy + hPx} x2={ox - 20} y2={oy + hPx} />
      </g>
      <text x={ox + wPx / 2} y={oy - 34} textAnchor="middle" fontSize="15" fontWeight="800" fill="#20282b">
        {fmt1(L)} м
      </text>
      <text
        x={ox - 34} y={oy + hPx / 2} textAnchor="middle" fontSize="15" fontWeight="800" fill="#20282b"
        transform={`rotate(-90 ${ox - 34} ${oy + hPx / 2})`}
      >
        {fmt1(W)} м
      </text>

      <rect x={ox + 5} y={oy + 7} width={wPx} height={hPx} fill="rgba(20,25,27,0.12)" />
      <rect x={ox} y={oy} width={wPx} height={hPx} fill={st.fill} />
      <rect x={ox} y={oy} width={wPx} height={hPx} fill={`url(#${idCells})`} />
      <rect x={ox} y={oy} width={wPx} height={hPx} fill={`url(#${idMods})`} />

      {v12Xs.map((x, j) => (
        <line key={`v12-${j}`} x1={x} y1={oy} x2={x} y2={oy + hPx} stroke={G12_COLOR} strokeWidth="2" />
      ))}

      {v06Xs.map((x, j) => (
        <line key={`v06-${j}`} x1={x} y1={oy} x2={x} y2={oy + hPx} stroke={G06_COLOR} strokeWidth="1.8" />
      ))}

      {h06Ys.map((y, j) => (
        <line key={`h06-${j}`} x1={ox} y1={y} x2={ox + wPx} y2={y} stroke={G06_COLOR} strokeWidth="1.8" />
      ))}

      {mainYs.map((y, i) => (
        <g key={i}>
          <line x1={ox} y1={y} x2={ox + wPx} y2={y} stroke={MAIN_COLOR} strokeWidth="2.4" />
          {Array.from({ length: Math.ceil(L) }).map((_, j) => {
            const hx = ox + Math.min((j + 0.5) * hangPx, wPx - 0.25 * pxPerM);
            return <circle key={j} cx={hx} cy={y} r="3.4" fill="#20282b" stroke={MAIN_COLOR} strokeWidth="2" />;
          })}
        </g>
      ))}

      <rect x={ox} y={oy} width={wPx} height={hPx} fill="none" stroke={st.wall} strokeWidth="6" />
    </svg>
  );

  return (
    <>
      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
          <span className="text-[12.5px] font-extrabold tracking-wide uppercase text-graphite/60">
            План потолка · вид сверху
          </span>
          <span className="text-[12px] font-semibold text-graphite/50 tabular">
            {fmt1(L)} × {fmt1(W)} м · решётка 600×600: <b className="text-graphite">{fmt1(blocks)} шт</b>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setZoomed(true)}
          title="Открыть план на весь экран"
          aria-label="Открыть план потолка на весь экран"
          className="group relative block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-pro"
        >
          {plan}
          <span className="pointer-events-none absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-graphite/60 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            <Maximize2 size={15} strokeWidth={2.2} />
          </span>
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/90 px-2 py-1 text-[10.5px] font-semibold text-graphite/55 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            нажмите, чтобы увеличить
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-3 border-t border-line text-[12px] font-semibold text-graphite/60">
          <Legend railStep={railStep} is100={is100} />
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-graphite/95 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="План потолка на весь экран"
          onClick={() => setZoomed(false)}
        >
          <div className="flex items-start justify-between gap-4 text-white">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-pro">План потолка · вид сверху</div>
              <div className="mt-1 text-[15px] font-bold">
                {fmt1(L)} × {fmt1(W)} м · решётка 600×600: {fmt1(blocks)} шт
              </div>
            </div>
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Закрыть"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>

          <div
            className="mt-3 flex-1 min-h-0 rounded-2xl bg-white p-3 sm:p-5 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-full w-full flex items-center justify-center">
              <div className="w-full max-w-[1400px]">{plan}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] font-semibold text-white/70">
            <Legend railStep={railStep} is100={is100} />
          </div>
        </div>
      )}
    </>
  );
}
