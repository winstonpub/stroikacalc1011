/* ============================================================================
 * ФАЙЛ: src/components/SidingHouse3D.tsx — Изометрический 3D вид дома для калькулятора сайдинга (страница «Тест»)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует дом в изометрии (стены, выбранная кровля, ряды панелей сайдинга, дверь, окна и размерные линии)
 *   по габаритам, которые пользователь задаёт во вкладке «Вид сверху». По умолчанию: длина 6 м, ширина 6 м, высота стен 3 м.
 *   Цвет стен совпадает с выбранным цветом сайдинга, крыша использует отдельный выбранный цвет;
 *   дверь и окна масштабируются вместе с домом.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Габариты — проп dims (src/data/house3D.ts), цвет — палитра SidingColor.scheme из src/data/siding.ts,
 *   высота ряда панели — SIDING_ELEMENTS.panel.height (203 мм).
 * КАК ИЗМЕНИТЬ: Стартовые размеры и пределы — в src/data/house3D.ts; пропорции двери/окон — в блоке «Проёмы» ниже.
 * ========================================================================= */

import { SIDING_ELEMENTS, type SidingColor } from "../data/siding";
import { DEFAULT_HOUSE_3D, HOUSE_3D, ROOF_COLORS, type HouseDimensions } from "../data/house3D";

export { HOUSE_3D };
export type { HouseDimensions };

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SCALE = 46;
const COS30 = Math.cos(Math.PI / 6);
const fmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

type Pt = [number, number];

/* Изометрическая проекция: x — длина (вправо-вниз), y — ширина (влево-вниз), z — высота (вверх) */
const project = (x: number, y: number, z: number): Pt => [
  (x - y) * COS30 * SCALE,
  (x + y) * 0.5 * SCALE - z * SCALE,
];
const pts = (list: Pt[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/* БЛОК: Компонент изометрического дома (SidingHouse3D) */
export default function SidingHouse3D({ color, dims = DEFAULT_HOUSE_3D }: { color: SidingColor; dims?: HouseDimensions }) {
  const { length: L, width: W, height: H, roofHeight: R } = dims;
  const top = H + R;
  const s = color.scheme;
  const roof = ROOF_COLORS.find((item) => item.id === dims.roofColor) ?? ROOF_COLORS[3];
  const hipInset = Math.min(W / 2, L * 0.36);
  const row = SIDING_ELEMENTS.panel.height / 1000;
  const off = Math.max(0.4, Math.min(0.8, Math.min(L, W) * 0.13));

  /* Габаритная рамка чертежа с учётом размерных линий */
  const bounds = [
    project(0, 0, top), project(L, 0, top), project(0, W, 0), project(L, W, 0),
    project(L, 0, 0), project(0, W + off + 0.4, 0), project(L + off + 0.4, 0, 0), project(-off - 0.4, W, H),
  ];
  const minX = Math.min(...bounds.map((p) => p[0])) - 40;
  const maxX = Math.max(...bounds.map((p) => p[0])) + 40;
  const minY = Math.min(...bounds.map((p) => p[1])) - 30;
  const maxY = Math.max(...bounds.map((p) => p[1])) + 40;

  /* Ряды панелей на стенах и фронтоне */
  const rows: number[] = [];
  for (let z = row; z < (dims.roofType === "gable" ? top : H) - 0.01; z += row) rows.push(z);

  /* Проёмы на передней стене (y = W) и боковой стене (x = L): proportions сохраняются при любых размерах дома */
  const winZ0 = H * 0.3;
  const winZ1 = Math.min(H * 0.78, winZ0 + 1.4);
  const doorW = Math.min(0.9, L * 0.22);
  const door = { x0: L * 0.15, x1: L * 0.15 + doorW, z0: 0, z1: Math.min(2.1, H * 0.7) };
  const frontWinW = Math.min(1.4, L * 0.24);
  const frontWindow = { x0: L * 0.5667, x1: L * 0.5667 + frontWinW, z0: winZ0, z1: winZ1 };
  const sideWinW = Math.min(1.4, W * 0.24);
  const sideStarts = W >= 4 ? [W * 0.1667, W * 0.6] : [(W - sideWinW) / 2];
  const sideWindows = sideStarts.map((y0) => ({ y0, y1: y0 + sideWinW, z0: winZ0, z1: winZ1 }));
  const frontRect = (o: { x0: number; x1: number; z0: number; z1: number }) =>
    [project(o.x0, W, o.z0), project(o.x1, W, o.z0), project(o.x1, W, o.z1), project(o.x0, W, o.z1)];
  const sideRect = (o: { y0: number; y1: number; z0: number; z1: number }) =>
    [project(L, o.y0, o.z0), project(L, o.y1, o.z0), project(L, o.y1, o.z1), project(L, o.y0, o.z1)];

  /* Размерные линии */
  const dimL = [project(0, W + off, 0), project(L, W + off, 0)];
  const dimW = [project(L + off, 0, 0), project(L + off, W, 0)];
  const dimH = [project(-off, W, 0), project(-off, W, H)];
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const mL = mid(dimL[0], dimL[1]);
  const mW = mid(dimW[0], dimW[1]);
  const mH = mid(dimH[0], dimH[1]);

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      className="mx-auto block h-auto w-full max-w-[760px]"
      role="img"
      aria-label={`Изометрический вид дома: длина ${fmt.format(L)} м, ширина ${fmt.format(W)} м, высота ${fmt.format(H)} м, кровля ${dims.roofType}, цвет ${roof.label}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Тень под домом */}
      <polygon
        points={pts([project(-0.3, -0.3, 0), project(L + 0.3, -0.3, 0), project(L + 0.3, W + 0.3, 0), project(-0.3, W + 0.3, 0)])}
        fill="#20282b"
        fillOpacity="0.07"
      />

      {/* Дальний скат: вальмовая крыша имеет укороченный конёк. */}
      {dims.roofType !== "shed" && (
        <polygon data-roof-plane="far"
          points={pts([project(0, 0, H), project(L, 0, H), project(dims.roofType === "hip" ? L - hipInset : L, W / 2, top), project(dims.roofType === "hip" ? hipInset : 0, W / 2, top)])}
          fill={roof.shade} stroke={roof.edge} strokeWidth="1.2" strokeLinejoin="round"
        />
      )}

      {/* Передняя стена (длина) */}
      <polygon
        points={pts([project(0, W, 0), project(L, W, 0), project(L, W, H), project(0, W, H)])}
        fill={s.panel}
        stroke={s.outline}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {rows.filter((z) => z < H).map((z) => {
        const a = project(0, W, z);
        const b = project(L, W, z);
        return <line key={`f-${z}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={s.panelLine} strokeWidth="0.8" />;
      })}

      {/* Боковая стена: фронтон только у двухскатной, трапеция у односкатной. */}
      <polygon
        points={pts(dims.roofType === "gable"
          ? [project(L, W, 0), project(L, 0, 0), project(L, 0, H), project(L, W / 2, top), project(L, W, H)]
          : dims.roofType === "shed"
            ? [project(L, W, 0), project(L, 0, 0), project(L, 0, top), project(L, W, H)]
            : [project(L, W, 0), project(L, 0, 0), project(L, 0, H), project(L, W, H)])}
        fill={s.panel}
        stroke={s.outline}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <polygon
        points={pts(dims.roofType === "gable"
          ? [project(L, W, 0), project(L, 0, 0), project(L, W / 2, top), project(L, W, H)]
          : dims.roofType === "shed"
            ? [project(L, W, 0), project(L, 0, 0), project(L, 0, top), project(L, W, H)]
            : [project(L, W, 0), project(L, 0, 0), project(L, 0, H), project(L, W, H)])}
        fill="#20282b"
        fillOpacity="0.1"
      />
      {rows.map((z) => {
        const inset = z <= H || R <= 0 ? 0 : ((z - H) / R) * (W / 2);
        const a = project(L, inset, z);
        const b = project(L, W - inset, z);
        return <line key={`s-${z}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={s.panelLine} strokeWidth="0.8" />;
      })}

      {/* Угловые планки */}
      {[[project(L, W, 0), project(L, W, H)], [project(0, W, 0), project(0, W, H)], [project(L, 0, 0), project(L, 0, H)]].map(([a, b], i) => (
        <line key={`c-${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={s.trimEdge} strokeWidth="3.2" strokeLinecap="round" />
      ))}

      {/* Дверь и окна */}
      <polygon points={pts(frontRect(door))} fill="#7a5a43" stroke="#4d3826" strokeWidth="1.2" />
      {[frontRect(frontWindow), ...sideWindows.map(sideRect)].map((rect, i) => (
        <g key={`w-${i}`}>
          <polygon points={pts(rect)} fill="#cfe3f1" stroke="#ffffff" strokeWidth="3" />
          <polygon points={pts(rect)} fill="none" stroke="#7d93a6" strokeWidth="1" />
        </g>
      ))}

      {/* Форма кровли выбирается отдельно: один скат, два ската или четыре вальмы. */}
      {dims.roofType === "shed" ? (
        <polygon data-roof-plane="single"
          points={pts([project(-0.15, W + 0.25, H - 0.12), project(L + 0.15, W + 0.25, H - 0.12), project(L + 0.15, -0.25, top), project(-0.15, -0.25, top)])}
          fill={roof.hex} stroke={roof.edge} strokeWidth="1.5" strokeLinejoin="round"
        />
      ) : (
        <>
          <polygon data-roof-plane="near"
            points={pts([project(-0.15, W + 0.25, H - 0.12), project(L + 0.15, W + 0.25, H - 0.12), project(dims.roofType === "hip" ? L - hipInset : L + 0.15, W / 2, top), project(dims.roofType === "hip" ? hipInset : -0.15, W / 2, top)])}
            fill={roof.hex} stroke={roof.edge} strokeWidth="1.3" strokeLinejoin="round"
          />
          {dims.roofType === "hip" && (
            <polygon data-roof-plane="hip"
              points={pts([project(L + 0.15, W + 0.25, H - 0.12), project(L + 0.15, -0.25, H - 0.12), project(L - hipInset, W / 2, top)])}
              fill={roof.shade} stroke={roof.edge} strokeWidth="1.3" strokeLinejoin="round"
            />
          )}
          <line x1={project(dims.roofType === "hip" ? hipInset : -0.15, W / 2, top)[0]}
            y1={project(dims.roofType === "hip" ? hipInset : -0.15, W / 2, top)[1]}
            x2={project(dims.roofType === "hip" ? L - hipInset : L + 0.15, W / 2, top)[0]}
            y2={project(dims.roofType === "hip" ? L - hipInset : L + 0.15, W / 2, top)[1]}
            stroke={roof.edge} strokeWidth="2.4" strokeLinecap="round" />
          {dims.roofType === "gable" && (
            <polyline points={pts([project(L + 0.15, -0.25, H - 0.12), project(L + 0.15, W / 2, top), project(L + 0.15, W + 0.25, H - 0.12)])}
              fill="none" stroke={roof.edge} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </>
      )}

      {/* Размерные линии и подписи */}
      <g stroke="#1f4f8a" strokeWidth="1.2" fill="none">
        <line x1={dimL[0][0]} y1={dimL[0][1]} x2={dimL[1][0]} y2={dimL[1][1]} />
        <line x1={dimW[0][0]} y1={dimW[0][1]} x2={dimW[1][0]} y2={dimW[1][1]} />
        <line x1={dimH[0][0]} y1={dimH[0][1]} x2={dimH[1][0]} y2={dimH[1][1]} />
        {[...dimL, ...dimW, ...dimH].map((p, i) => (
          <circle key={`d-${i}`} cx={p[0]} cy={p[1]} r="2.4" fill="#1f4f8a" stroke="none" />
        ))}
      </g>
      <g fontFamily={MONO} fontSize="13" fontWeight="700" fill="#1f4f8a" textAnchor="middle">
        <text x={mL[0] - 10} y={mL[1] + 22} transform={`rotate(30 ${mL[0] - 10} ${mL[1] + 22})`}>
          длина {fmt.format(L)} м
        </text>
        <text x={mW[0] + 10} y={mW[1] + 22} transform={`rotate(-30 ${mW[0] + 10} ${mW[1] + 22})`}>
          ширина {fmt.format(W)} м
        </text>
        <text x={mH[0] - 12} y={mH[1]} transform={`rotate(-90 ${mH[0] - 12} ${mH[1]})`}>
          высота {fmt.format(H)} м
        </text>
      </g>
    </svg>
  );
}
