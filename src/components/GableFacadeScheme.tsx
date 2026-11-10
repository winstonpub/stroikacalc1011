import { useId, type RefObject } from "react";
import {
  getSidingPanelColor,
  getTrimColor,
  getVisibleSidingRects,
  openingLetter,
  type SidingCalc,
  type SidingInput,
} from "../data/siding";
import { gableSpanAtHeight, type GableGeometry } from "../data/testFacade";

const fmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const MONO = "ui-monospace, monospace";

export default function GableFacadeScheme({ calc, input, geometry, seams, svgRef }: {
  calc: SidingCalc;
  input: SidingInput;
  geometry: GableGeometry;
  /** Позиции вертикальных стыков H-профиля в мм (см. src/data/testFacade.ts) */
  seams: number[];
  svgRef: RefObject<SVGSVGElement | null>;
}) {
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `gable-${baseId}`;
  const hatchId = `gable-h-hatch-${baseId}`;
  const { width, wallHeight, totalHeight, apexX, apexOffset, gableHeight, profile, breakHeight, breakInset } = geometry;
  /* Ломаная кровля рисуется одинаково и над фасадом, и отдельно — форма задаётся типом фронтона */
  const broken = geometry.shape === "broken";
  const scheme = getSidingPanelColor(input.colorId).scheme;
  const jTone = getTrimColor(input, "jProfile").scheme;
  const hTone = getTrimColor(input, "hProfile").scheme;
  const scale = Math.min(530 / width, 338 / totalHeight);
  const ox = 68 + (530 - width * scale) / 2;
  const bottom = 388;
  const x = (value: number) => ox + value * scale;
  const y = (value: number) => bottom - value * scale;
  /* Контур строится по ломаной кровли: 3 точки у треугольного фронтона, 5 у ломаного */
  const outline: [number, number][] = [
    [0, 0],
    [width, 0],
    ...[...profile].reverse().map((point) => [point.x, point.y] as [number, number]),
  ];
  const points = outline
    .filter((point, index) => index === 0 || point[0] !== outline[index - 1][0] || point[1] !== outline[index - 1][1])
    .map(([px, py]) => `${x(px)},${y(py)}`)
    .join(" ");
  const slopes = profile.map((point) => `${x(point.x)},${y(point.y)}`).join(" ");
  const breakPoints = broken ? [profile[1], profile[profile.length - 2]] : [];
  const breakY = wallHeight + breakHeight;
  const viewTop = Math.max(0, y(totalHeight) - 42);

  return (
    <svg ref={svgRef} viewBox={`0 ${viewTop} 680 ${470 - viewTop}`} className="mx-auto block h-auto w-full"
      xmlns="http://www.w3.org/2000/svg" role="img"
      data-seams={seams.join(",")}
      data-facade-mode={geometry.mode} data-gable-shape={geometry.shape}
      data-apex-x={apexX} data-apex-offset={apexOffset}
      data-gable-height={gableHeight} data-net-area={calc.netArea}
      data-break-height={breakHeight} data-break-inset={breakInset} data-profile-points={profile.length}
      aria-label={`${wallHeight > 0 ? (broken ? "Фасад с ломаным фронтоном" : "Фасад с фронтоном") : broken ? "Ломаный фронтон" : "Фронтон"}: основание ${fmt.format(width)} м, высота фронтона ${fmt.format(gableHeight)} м, смещение вершины ${fmt.format(apexOffset)} м${broken ? `, излом ${fmt.format(breakHeight)} м с отступом ${fmt.format(breakInset)} м` : ""}`}>
      <defs>
        <clipPath id={clipId}><polygon points={points} /></clipPath>
        <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={hTone.trimEdge} strokeWidth="1.6" />
        </pattern>
      </defs>
      <polygon points={points} fill={scheme.panel} stroke={scheme.outline} strokeWidth="1.5" />
      <g clipPath={`url(#${clipId})`}>
        {calc.pieces.map((piece) => {
          const reused = (calc.panelPlan[piece.panel - 1]?.items.length ?? 0) > 1;
          return (
            <g key={`${piece.panel}-${piece.pieceIndex}`} data-siding-piece={piece.label} data-row={piece.row}>
              <title>{`Панель ${piece.label}: ${piece.lenMm} мм, ряд ${piece.row + 1}`}</title>
              {getVisibleSidingRects(piece, calc.H, calc.openings).map((rect, index) => {
                const midY = (rect.y0 + rect.y1) / 2000;
                const span = gableSpanAtHeight(geometry, midY);
                const left = Math.max(rect.x0 / 1000, span[0]);
                const right = Math.min(rect.x1 / 1000, span[1]);
                const labelFits = (right - left) * scale > Math.max(26, piece.label.length * 5 + 4) &&
                  (rect.y1 - rect.y0) * scale / 1000 > 11;
                return (
                  <g key={index}>
                    <rect x={x(rect.x0 / 1000)} y={y(rect.y1 / 1000)}
                      width={(rect.x1 - rect.x0) * scale / 1000} height={(rect.y1 - rect.y0) * scale / 1000}
                      fill={reused ? scheme.tint : "transparent"} fillOpacity={reused ? 0.38 : 1}
                      stroke={scheme.panelLine} strokeWidth="0.65" />
                    {piece.x1 < calc.L && (
                      <line
                        x1={x(piece.x1 / 1000)}
                        y1={y(rect.y1 / 1000)}
                        x2={x(piece.x1 / 1000)}
                        y2={y(rect.y0 / 1000)}
                        stroke={scheme.seam}
                        strokeWidth="0.8"
                      />
                    )}
                    {labelFits && <text x={x((left + right) / 2)} y={y(midY) + 3} fontFamily={MONO}
                      textAnchor="middle" fontSize="8.5" fontWeight="700" fill={scheme.label}>{piece.label}</text>}
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* H-профиль: такая же полоса с диагональной штриховкой и двумя пунктирными краями (ширина 73 мм в масштабе чертежа), как на обычной стороне */}
        {seams.map((seamMm) => {
          const sx = x(seamMm / 1000);
          const hw = Math.max(2.5, (0.073 / 2) * scale);
          const topY = y(totalHeight);
          const bandH = bottom - topY;
          return (
            <g key={`seam-${seamMm}`} data-h-seam={seamMm}>
              <rect x={sx - hw} y={topY} width={hw * 2} height={bandH} fill={hTone.trim} />
              <rect x={sx - hw} y={topY} width={hw * 2} height={bandH} fill={`url(#${hatchId})`} fillOpacity="0.55" />
              <line x1={sx - hw} y1={topY} x2={sx - hw} y2={bottom} stroke={hTone.seam} strokeWidth="1.2" strokeDasharray="5 4" />
              <line x1={sx + hw} y1={topY} x2={sx + hw} y2={bottom} stroke={hTone.seam} strokeWidth="1.2" strokeDasharray="5 4" />
            </g>
          );
        })}
        {wallHeight > 0 && <line x1={x(0)} y1={y(wallHeight)} x2={x(width)} y2={y(wallHeight)}
          stroke={scheme.outline} strokeDasharray="5 4" strokeWidth="1" />}
        {calc.openings.map((opening, index) => {
          const px = x(opening.x);
          const py = y(opening.y + opening.height);
          const w = opening.width * scale;
          const h = opening.height * scale;
          const trim = getTrimColor(input, opening.trim === "jamb" ? "jamb" : "jProfile").scheme;
          return <g key={opening.id}>
            <path d={`M ${px - 3} ${py + h} V ${py - 3} H ${px + w + 3} V ${py + h}`} fill="none" stroke={trim.trimEdge} strokeWidth="5" />
            <rect x={px} y={py} width={w} height={h} fill="#fff" stroke="#1f4f8a" strokeWidth="1.1" />
            {opening.kind === "window" && <g stroke="#9db4cc" strokeWidth="0.8">
              <line x1={px + w / 2} y1={py} x2={px + w / 2} y2={py + h} />
              <line x1={px} y1={py + h / 2} x2={px + w} y2={py + h / 2} />
            </g>}
            {w > 18 && h > 18 && <text x={px + w / 2} y={py + h / 2 + 4} textAnchor="middle"
              fill="#20282b" fontFamily={MONO} fontSize="12" fontWeight="800">{openingLetter(index)}</text>}
          </g>;
        })}
      </g>
      <line x1={x(0)} y1={y(0)} x2={x(width)} y2={y(0)} stroke={scheme.trimEdge} strokeWidth="3" />
      {wallHeight > 0 && ([input.leftEdge, input.rightEdge] as const).map((edge, index) => {
        const tone = getTrimColor(input, edge === "j" ? "jProfile" : edge === "inner" ? "innerCorner" : "outerCorner").scheme;
        return <line key={index} x1={x(index === 0 ? 0 : width)} y1={y(0)}
          x2={x(index === 0 ? 0 : width)} y2={y(wallHeight)} stroke={tone.trimEdge} strokeWidth="3" />;
      })}
      {/* Скаты фронтона оформляются только J профилем — финишная планка по косым линиям не ставится */}
      <polyline points={slopes} fill="none" stroke={jTone.trimEdge} strokeWidth="4" strokeLinejoin="round" />

      {/* Изломы ломаного фронтона: уровень излома и точки перегиба скатов */}
      {broken && (
        <g>
          <line x1={x(0)} y1={y(breakY)} x2={x(width)} y2={y(breakY)}
            stroke="#c49500" strokeWidth="1" strokeDasharray="6 4" opacity="0.85" />
          {breakPoints.map((point, index) => (
            <g key={index}>
              <circle cx={x(point.x)} cy={y(point.y)} r="4.5" fill="#fff" stroke="#c49500" strokeWidth="2" />
              <circle cx={x(point.x)} cy={y(point.y)} r="1.6" fill="#c49500" />
            </g>
          ))}
        </g>
      )}

      <g stroke="#1f4f8a" strokeWidth="1" fill="none">
        <line x1={x(0)} y1={bottom + 22} x2={x(width)} y2={bottom + 22} />
        <line x1={x(0)} y1={bottom + 15} x2={x(0)} y2={bottom + 28} />
        <line x1={x(width)} y1={bottom + 15} x2={x(width)} y2={bottom + 28} />
        <line x1={ox - 20} y1={y(totalHeight)} x2={ox - 20} y2={bottom} />
        <line x1={ox - 26} y1={y(totalHeight)} x2={ox - 14} y2={y(totalHeight)} />
        <line x1={ox - 26} y1={bottom} x2={ox - 14} y2={bottom} />
        {wallHeight > 0 && <>
          <line x1={x(width) + 24} y1={y(totalHeight)} x2={x(width) + 24} y2={y(wallHeight)} />
          <line x1={x(width) + 18} y1={y(totalHeight)} x2={x(width) + 30} y2={y(totalHeight)} />
          <line x1={x(width) + 18} y1={y(wallHeight)} x2={x(width) + 30} y2={y(wallHeight)} />
          {/* Размер «Высота фасада» — под размером «Высота фронтона» */}
          <line x1={x(width) + 24} y1={y(wallHeight)} x2={x(width) + 24} y2={y(0)} />
          <line x1={x(width) + 18} y1={y(0)} x2={x(width) + 30} y2={y(0)} />
        </>}
        {broken && <>
          {/* Высота излома — отдельная размерная линия правее основной, чтобы подписи не наезжали друг на друга */}
          <line x1={x(width) + 52} y1={y(breakY)} x2={x(width) + 52} y2={y(wallHeight)} />
          <line x1={x(width) + 46} y1={y(breakY)} x2={x(width) + 58} y2={y(breakY)} />
          <line x1={x(width) + 46} y1={y(wallHeight)} x2={x(width) + 58} y2={y(wallHeight)} />
          <line x1={x(0)} y1={y(breakY) - 15} x2={x(breakInset)} y2={y(breakY) - 15} />
          <line x1={x(0)} y1={y(breakY) - 20} x2={x(0)} y2={y(breakY) - 10} />
          <line x1={x(breakInset)} y1={y(breakY) - 20} x2={x(breakInset)} y2={y(breakY) - 10} />
        </>}
      </g>
      <g fontFamily={MONO} fill="#1f4f8a" fontSize="11" fontWeight="700" textAnchor="middle">
        <text x={x(width / 2)} y={bottom + 39}>основание {fmt.format(width)} м</text>
        <text x={ox - 30} y={y(totalHeight / 2)} transform={`rotate(-90 ${ox - 30} ${y(totalHeight / 2)})`}>
          {wallHeight > 0 ? "общая высота" : "высота"} {fmt.format(totalHeight)} м
        </text>
        {wallHeight > 0 && <text x={x(width) + 38} y={y(wallHeight + gableHeight / 2)}
          transform={`rotate(-90 ${x(width) + 38} ${y(wallHeight + gableHeight / 2)})`}>высота фронтона {fmt.format(gableHeight)} м</text>}
        {wallHeight > 0 && <text x={x(width) + 38} y={y(wallHeight / 2)}
          transform={`rotate(-90 ${x(width) + 38} ${y(wallHeight / 2)})`}>высота фасада {fmt.format(wallHeight)} м</text>}
        {broken && <>
          <text x={x(width) + 66} y={y(wallHeight + breakHeight / 2)}
            transform={`rotate(-90 ${x(width) + 66} ${y(wallHeight + breakHeight / 2)})`}>излом {fmt.format(breakHeight)} м</text>
          <text x={x(breakInset / 2)} y={y(breakY) - 21} fontSize="9.5">отступ {fmt.format(breakInset)} м</text>
        </>}
      </g>
      <line x1={x(width / 2)} y1={y(wallHeight)} x2={x(width / 2)} y2={y(totalHeight) - 12} stroke="#98a2a8" strokeDasharray="4 4" />
      <line x1={x(apexX)} y1={y(totalHeight)} x2={x(apexX)} y2={y(wallHeight)} stroke="#c49500" strokeDasharray="3 3" />
      <circle cx={x(apexX)} cy={y(totalHeight)} r="5" fill="#ffcb05" stroke="#20282b" strokeWidth="1.5" />
      <text x={x(apexX)} y={y(totalHeight) - 15} textAnchor="middle" fill="#20282b" fontSize="11" fontWeight="700">
        {apexOffset === 0 ? "Вершина по центру" : `Смещение: ${apexOffset > 0 ? "+" : ""}${fmt.format(apexOffset)} м`}
      </text>
    </svg>
  );
}