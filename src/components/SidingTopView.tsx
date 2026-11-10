/* ============================================================================
 * ФАЙЛ: src/components/SidingTopView.tsx — «Вид сверху» дома для калькулятора сайдинга (страница «Тест»)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает план дома сверху (контур стен, свесы и конёк крыши, дверь и окна на стенах)
 *   и позволяет менять габариты: длину, ширину, высоту стен и подъём крыши. Тип и цвет кровли задаются в блоке «План фасада».
 *   Все изменения сразу применяются к «3D виду».
 *   Длину и ширину можно тянуть жёлтыми маркерами на плане, менять стрелками с клавиатуры или вводить числами в полях.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Размеры — props dims из src/data/house3D.ts, пределы — HOUSE_3D_LIMITS, цвет контура — SidingColor.scheme.
 * КАК ИЗМЕНИТЬ: Подписи полей — в массиве fields ниже; пропорции двери/окон на плане — в блоке «Проёмы на плане».
 * ========================================================================= */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Box, MoveHorizontal, MoveVertical, RotateCcw, Ruler, Triangle } from "lucide-react";
import {
  DEFAULT_HOUSE_3D,
  HOUSE_3D_LIMITS,
  ROOF_COLORS,
  clampHouseValue,
  isDefaultHouseDimensions,
  type HouseDimensions,
} from "../data/house3D";
import type { SidingColor } from "../data/siding";
import { cn } from "../utils/cn";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const fmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const fmt2 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

/* БЛОК: Поле ввода размера с запятой или точкой (DimensionInput) */
function DimensionInput({
  id,
  label,
  value,
  limitKey,
  icon: Icon,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  limitKey: keyof typeof HOUSE_3D_LIMITS;
  icon: typeof Ruler;
  onChange: (v: number) => void;
}) {
  const { min, max } = HOUSE_3D_LIMITS[limitKey];
  const [text, setText] = useState(fmt.format(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(fmt.format(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const n = parseFloat(raw.replace(",", "."));
    if (Number.isFinite(n)) onChange(clampHouseValue(limitKey, n));
    else onChange(value);
  };

  return (
    <label htmlFor={id} className="block rounded-xl border border-line bg-white p-2.5 transition-colors focus-within:border-pro hover:border-graphite/40">
      <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-graphite/50">
        <Icon size={12} strokeWidth={2.4} />
        {label}
      </span>
      <span className="mt-1 flex items-baseline gap-1">
        <input
          id={id}
          value={text}
          inputMode="decimal"
          aria-label={`${label}, метры`}
          title={`от ${fmt.format(min)} до ${fmt.format(max)} м`}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseFloat(e.target.value.replace(",", "."));
            if (Number.isFinite(n) && n >= min && n <= max) onChange(clampHouseValue(limitKey, n));
          }}
          onBlur={() => {
            setFocused(false);
            commit(text);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="no-spin w-full rounded-lg bg-smoke px-2 py-1 text-right text-[16px] font-extrabold tabular outline-none border border-transparent transition-colors focus:border-pro"
        />
        <span className="shrink-0 text-[11.5px] font-semibold text-graphite/45">м</span>
      </span>
    </label>
  );
}

/* БЛОК: Компонент «Вид сверху» (SidingTopView) */
export default function SidingTopView({
  dims,
  color,
  onChange,
  onReset,
  onShow3D,
}: {
  dims: HouseDimensions;
  color: SidingColor;
  onChange: (next: HouseDimensions) => void;
  onReset: () => void;
  onShow3D: () => void;
}) {
  const { length: L, width: W, height: H, roofHeight: R } = dims;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ axis: "length" | "width"; startX: number; startY: number; start: number; scale: number } | null>(null);
  const [dragging, setDragging] = useState<"length" | "width" | null>(null);
  /* Во время перетаскивания левый/верхний край плана закреплён, чтобы маркер шёл точно за курсором */
  const [dragAnchor, setDragAnchor] = useState<{ x0: number; y0: number } | null>(null);

  /* Стабильная система координат плана: дом масштабируется внутри фиксированной рамки */
  const VB_W = 720;
  const VB_H = 470;
  const scale = Math.min(440 / L, 280 / W);
  const pw = L * scale;
  const ph = W * scale;
  const x0 = dragAnchor?.x0 ?? (VB_W - pw) / 2;
  const y0 = dragAnchor?.y0 ?? 225 - ph / 2;
  const x1 = x0 + pw;
  const y1 = y0 + ph;
  const ridgeY = y0 + ph / 2;

  const setDim = (key: keyof typeof HOUSE_3D_LIMITS, v: number) => onChange({ ...dims, [key]: clampHouseValue(key, v) });
  const stopDrag = () => {
    dragRef.current = null;
    setDragging(null);
    setDragAnchor(null);
  };

  const beginDrag = (axis: "length" | "width") => (e: React.PointerEvent<SVGGElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rendered = svgRef.current?.getBoundingClientRect().width ?? VB_W;
    dragRef.current = { axis, startX: e.clientX, startY: e.clientY, start: dims[axis], scale: (scale * rendered) / VB_W };
    setDragAnchor({ x0, y0 });
    setDragging(axis);
  };
  const moveDrag = (e: React.PointerEvent<SVGGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const delta = d.axis === "length" ? (e.clientX - d.startX) / d.scale : (e.clientY - d.startY) / d.scale;
    setDim(d.axis, d.start + delta);
  };
  const endDrag = (e: React.PointerEvent<SVGGElement>) => {
    if (!dragRef.current) return;
    stopDrag();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };
  const keyDrag = (axis: "length" | "width") => (e: React.KeyboardEvent<SVGGElement>) => {
    const { min, max, step } = HOUSE_3D_LIMITS[axis];
    const big = e.shiftKey ? 10 : 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = dims[axis] + step * big;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = dims[axis] - step * big;
    if (e.key === "Home") next = min;
    if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    setDim(axis, next);
  };

  /* Проёмы на плане: те же пропорции, что и в 3D виде */
  const doorW = Math.min(0.9, L * 0.22);
  const doorX0 = x0 + L * 0.15 * scale;
  const doorX1 = doorX0 + doorW * scale;
  const frontWinW = Math.min(1.4, L * 0.24);
  const fwX0 = x0 + L * 0.5667 * scale;
  const fwX1 = fwX0 + frontWinW * scale;
  const sideWinW = Math.min(1.4, W * 0.24);
  const sideStarts = W >= 4 ? [W * 0.1667, W * 0.6] : [(W - sideWinW) / 2];

  const fields: { key: keyof typeof HOUSE_3D_LIMITS; label: string; icon: typeof Ruler }[] = [
    { key: "length", label: "Длина", icon: MoveHorizontal },
    { key: "width", label: "Ширина", icon: MoveVertical },
    { key: "height", label: "Высота стен", icon: Ruler },
    { key: "roofHeight", label: "Подъём крыши", icon: Triangle },
  ];
  const roofColor = ROOF_COLORS.find((item) => item.id === dims.roofColor) ?? ROOF_COLORS[3];
  const hipInset = Math.min(pw * 0.26, ph * 0.5);

  const handle = (axis: "length" | "width", cx: number, cy: number) => {
    const active = dragging === axis;
    const Icon = axis === "length" ? MoveHorizontal : MoveVertical;
    const { min, max } = HOUSE_3D_LIMITS[axis];
    return (
      <g
        role="slider"
        tabIndex={0}
        aria-label={axis === "length" ? "Длина дома, метры" : "Ширина дома, метры"}
        aria-orientation={axis === "length" ? "horizontal" : "vertical"}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={dims[axis]}
        aria-valuetext={`${fmt.format(dims[axis])} м`}
        onPointerDown={beginDrag(axis)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={stopDrag}
        onKeyDown={keyDrag(axis)}
        className={cn("group cursor-ew-resize touch-none focus:outline-none", axis === "width" && "cursor-ns-resize")}
        style={{ cursor: axis === "length" ? "ew-resize" : "ns-resize" }}
      >
        <title>{axis === "length" ? "Потяните, чтобы изменить длину" : "Потяните, чтобы изменить ширину"}</title>
        <circle cx={cx} cy={cy} r="20" fill="transparent" />
        <circle cx={cx} cy={cy} r="16" fill="#FFCB05" className={cn("transition-opacity", active ? "opacity-40" : "opacity-0 group-hover:opacity-30 group-focus:opacity-30")} />
        <circle cx={cx} cy={cy} r="11" fill={active ? "#FFCB05" : "#20282b"} stroke="#fff" strokeWidth="2" className="transition-colors group-hover:fill-pro group-focus:fill-pro" />
        <Icon x={cx - 7} y={cy - 7} width={14} height={14} strokeWidth={2.6} className={cn("pointer-events-none transition-colors", active ? "text-graphite" : "text-pro group-hover:text-graphite group-focus:text-graphite")} />
      </g>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* План сверху */}
      <div className="min-w-0">
        <div className="overflow-hidden rounded-xl border border-line bg-smoke/50">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="block h-auto w-full select-none"
            role="img"
            aria-label={`Вид сверху: длина ${fmt.format(L)} м, ширина ${fmt.format(W)} м`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="top-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" fill="none" stroke="#20282b" strokeOpacity="0.06" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={VB_W} height={VB_H} fill="url(#top-grid)" />

            {/* Свесы крыши */}
            <rect x={x0 - 12} y={y0 - 12} width={pw + 24} height={ph + 24} fill="none" stroke="#98a2a8" strokeWidth="1.2" strokeDasharray="5 3" />
            {/* Контур и скаты повторяют выбранную форму крыши в 3D. */}
            {dims.roofType === "shed" ? (
              <rect data-roof-type="shed" x={x0} y={y0} width={pw} height={ph} fill={roofColor.hex} />
            ) : dims.roofType === "hip" ? (
              <g data-roof-type="hip">
                <polygon points={`${x0},${y0} ${x1},${y0} ${x1 - hipInset},${ridgeY} ${x0 + hipInset},${ridgeY}`} fill={roofColor.shade} />
                <polygon points={`${x0},${y1} ${x1},${y1} ${x1 - hipInset},${ridgeY} ${x0 + hipInset},${ridgeY}`} fill={roofColor.hex} />
                <polygon points={`${x0},${y0} ${x0 + hipInset},${ridgeY} ${x0},${y1}`} fill={roofColor.shade} fillOpacity="0.83" />
                <polygon points={`${x1},${y0} ${x1 - hipInset},${ridgeY} ${x1},${y1}`} fill={roofColor.hex} fillOpacity="0.88" />
              </g>
            ) : (
              <g data-roof-type="gable">
                <rect x={x0} y={y0} width={pw} height={ph / 2} fill={roofColor.shade} />
                <rect x={x0} y={ridgeY} width={pw} height={ph / 2} fill={roofColor.hex} />
              </g>
            )}
            {/* Контур стен */}
            <rect x={x0} y={y0} width={pw} height={ph} fill="none" stroke={color.scheme.outline} strokeWidth="2.2" />
            {/* Односкатная крыша не имеет конька. */}
            {dims.roofType !== "shed" && <line x1={dims.roofType === "hip" ? x0 + hipInset : x0 - 12} y1={ridgeY} x2={dims.roofType === "hip" ? x1 - hipInset : x1 + 12} y2={ridgeY} stroke={roofColor.edge} strokeWidth="2.4" />}
            <text x={x1 - 6} y={ridgeY - 7} textAnchor="end" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={roofColor.id === "white" ? "#333b3e" : "#ffffff"}>
              {dims.roofType === "shed" ? "скат" : "конёк"} · подъём {fmt.format(R)} м
            </text>

            {/* Дверь и окна на стенах */}
            <line x1={doorX0} y1={y1} x2={doorX1} y2={y1} stroke="#7a5a43" strokeWidth="5" strokeLinecap="round" />
            <line x1={fwX0} y1={y1} x2={fwX1} y2={y1} stroke="#7d93a6" strokeWidth="5" strokeLinecap="round" />
            {sideStarts.map((sy, i) => (
              <line key={`sw-${i}`} x1={x1} y1={y0 + sy * scale} x2={x1} y2={y0 + (sy + sideWinW) * scale} stroke="#7d93a6" strokeWidth="5" strokeLinecap="round" />
            ))}
            <text x={x0 + 8} y={y1 - 8} fontFamily={MONO} fontSize="10.5" fontWeight="700" fill="#20282b" fillOpacity="0.6">
              сторона 1 · фасад
            </text>

            {/* Размерные линии */}
            <g stroke="#1f4f8a" strokeWidth="1.2" fill="none">
              <line x1={x0} y1={y0 - 34} x2={x1} y2={y0 - 34} />
              <line x1={x0} y1={y0 - 40} x2={x0} y2={y0 - 14} />
              <line x1={x1} y1={y0 - 40} x2={x1} y2={y0 - 14} />
              <line x1={x0 - 40} y1={y0} x2={x0 - 40} y2={y1} />
              <line x1={x0 - 46} y1={y0} x2={x0 - 14} y2={y0} />
              <line x1={x0 - 46} y1={y1} x2={x0 - 14} y2={y1} />
            </g>
            <g fontFamily={MONO} fontSize="13" fontWeight="700" fill="#1f4f8a" textAnchor="middle">
              <text x={(x0 + x1) / 2} y={y0 - 44}>длина {fmt.format(L)} м</text>
              <text x={x0 - 52} y={(y0 + y1) / 2} transform={`rotate(-90 ${x0 - 52} ${(y0 + y1) / 2})`}>ширина {fmt.format(W)} м</text>
            </g>

            {handle("length", x1 + 18, (y0 + y1) / 2)}
            {handle("width", (x0 + x1) / 2, y1 + 18)}
          </svg>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-graphite/55">
          <MoveHorizontal size={13} strokeWidth={2.4} className="shrink-0 text-graphite/40" />
          Потяните жёлтые маркеры или введите размеры справа — «3D вид» обновится сразу.
        </p>
      </div>

      {/* Редактор размеров */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-graphite/50">Размеры дома</div>
        <div className="grid grid-cols-2 gap-2">
          {fields.map((f) => (
            <DimensionInput
              key={f.key}
              id={`house-dim-${f.key}`}
              label={f.label}
              icon={f.icon}
              limitKey={f.key}
              value={dims[f.key]}
              onChange={(v) => setDim(f.key, v)}
            />
          ))}
        </div>
        <motion.div
          key={`${L}-${W}-${H}-${R}-${dims.roofType}-${dims.roofColor}`}
          initial={{ opacity: 0.4, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl bg-smoke px-3 py-2 text-[12px] font-semibold text-graphite/70"
        >
          Застройка <b className="tabular text-graphite">{fmt2.format(L * W)} м²</b> · стены <b className="tabular text-graphite">{fmt.format(H)} м</b> · конёк{" "}
          <b className="tabular text-graphite">{fmt.format(H + R)} м</b>
        </motion.div>
        <button
          type="button"
          onClick={onShow3D}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-graphite px-4 text-[13px] font-extrabold text-white transition-all hover:bg-pro hover:text-graphite"
        >
          <Box size={15} strokeWidth={2.5} />
          Показать в 3D
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={isDefaultHouseDimensions(dims)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[12px] font-bold text-graphite/70 transition-colors hover:border-graphite/50 disabled:opacity-40"
        >
          <RotateCcw size={13} strokeWidth={2.4} />
          Сбросить к {fmt.format(DEFAULT_HOUSE_3D.length)} × {fmt.format(DEFAULT_HOUSE_3D.width)} × {fmt.format(DEFAULT_HOUSE_3D.height)} м
        </button>
        <p className="text-[11px] leading-snug text-graphite/45">
          Размеры сохраняются в этом браузере и не влияют на расчёт фасада и спецификацию.
        </p>
      </div>
    </div>
  );
}
