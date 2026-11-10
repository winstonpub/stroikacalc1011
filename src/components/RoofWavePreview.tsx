/* ============================================================================
 * ФАЙЛ: src/components/RoofWavePreview.tsx — Векторный чертёж поперечного сечения волны кровли
 * ЗА ЧТО ОТВЕЧАЕТ: Программно рисует технический SVG-чертёж фрагмента профиля шириной 300 мм в масштабе 1:1 по осям X и Y с размерными выносками высоты волны h, шага p и линейкой 100 мм.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Получает профиль RoofProfile и рассчитывает точки кривой через profileFragment() из файла src/data/roofProfiles.ts.
 * КАК ИЗМЕНИТЬ: Цвета фона чертежа (#192125), размерных стрелок (DIM_COLOR = "#ffcb05") и подписи меняются в константах и тегах <text> ниже; сами размеры волн — в src/data/roofProfiles.ts.
 * ========================================================================= */

import { useId } from "react";
import { motion } from "framer-motion";
import { profileFragment, type RoofProfile } from "../data/roofProfiles";

/* БЛОК: Константы холста и масштаба чертежа (WIDTH, HEIGHT, SPAN_MM, SCALE)
 * ЗА ЧТО ОТВЕЧАЕТ: Фиксирует одинаковый масштаб по ширине и высоте для всех четырёх видов кровли, чтобы высоту волн 8, 18, 25 и 38 мм можно было честно сравнивать глазами.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Задаётся константами ниже.
 * КАК ИЗМЕНИТЬ: Поменяйте DIM_COLOR для другого цвета размерных стрелок. */
const WIDTH = 420;
const HEIGHT = 280;
const SPAN_MM = 300;
const SCALE = 1.05;
const LEFT = 76;
const BASELINE = 166;
const DIM_COLOR = "#ffcb05";
const number = (value: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);
const coordinate = (value: number) => Number(value.toFixed(4));

/* БЛОК: Компонент SVG-чертежа волны профиля (RoofWavePreview)
 * ЗА ЧТО ОТВЕЧАЕТ: Строит сетку, анимированный контур профиля, стрелки размеров p и h, масштабную линейку 100 мм и справочные размеры полок/ступени.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из переданного объекта profile (src/data/roofProfiles.ts).
 * КАК ИЗМЕНИТЬ: Подписи на чертеже («ПОПЕРЕЧНОЕ СЕЧЕНИЕ», «h — высота · p — шаг между вершинами») редактируются в тегах <text>. */
export default function RoofWavePreview({
  profile,
  className,
}: {
  profile: RoofProfile;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const points = profileFragment(profile, SPAN_MM);
  const path = points.map((point, index) =>
    `${index ? "L" : "M"} ${coordinate(LEFT + point.x * SCALE)} ${coordinate(BASELINE - point.y * SCALE)}`,
  ).join(" ");
  const end = LEFT + SPAN_MM * SCALE;
  const top = BASELINE - profile.heightMm * SCALE;
  const peak1 = LEFT + profile.pitchMm / 2 * SCALE;
  const peak2 = peak1 + profile.pitchMm * SCALE;
  const dimY = 100;
  const titleId = `${uid}-title`;
  const descriptionId = `${uid}-description`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
      data-profile={profile.id}
      data-height-mm={profile.heightMm}
      data-pitch-mm={profile.pitchMm}
      data-scale-x={SCALE}
      data-scale-y={SCALE}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id={titleId}>
        {`${profile.name}: высота волны ${number(profile.heightMm)} мм, поперечный шаг ${number(profile.pitchMm)} мм`}
      </title>
      <desc id={descriptionId}>
        {`${profile.variant}. Фрагмент 300 мм в едином масштабе, без увеличения высоты относительно ширины. ${profile.note} Радиусы гибки и толщина линии показаны условно.`}
      </desc>

      <defs>
        <pattern id={`${uid}-grid`} width="21" height="21" patternUnits="userSpaceOnUse">
          <path d="M 21 0 L 0 0 0 21" fill="none" stroke="#ffffff" strokeOpacity="0.055" strokeWidth="0.7" />
        </pattern>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffcb05" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffcb05" stopOpacity="0.015" />
        </linearGradient>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill="#192125" />
      <rect width={WIDTH} height={HEIGHT} fill={`url(#${uid}-grid)`} />
      <text x="20" y="65" fill="#d1d7d8" fontSize="9.5" fontWeight="700" letterSpacing="1.7">
        ПОПЕРЕЧНОЕ СЕЧЕНИЕ
      </text>
      <text x="398" y="65" textAnchor="end" fill="#8c999f" fontSize="10">мм</text>

      <g fill="none" stroke="#809096" strokeOpacity="0.5" strokeWidth="0.8" strokeDasharray="3 4">
        <path d={`M ${LEFT - 10} ${BASELINE} H ${end + 6}`} />
        <path d={`M ${LEFT - 10} ${top} H ${end + 6}`} />
      </g>

      <path d={`${path} L ${end} ${BASELINE} L ${LEFT} ${BASELINE} Z`} fill={`url(#${uid}-fill)`} />
      <motion.path
        d={path}
        fill="none"
        stroke="#f5f3e9"
        strokeWidth="2.3"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.05, ease: "easeOut" }}
        data-profile-outline
      />

      <g fill="none" stroke={DIM_COLOR} strokeWidth="0.9">
        <path d={`M ${peak1} ${top - 5} V ${dimY - 6} M ${peak2} ${top - 5} V ${dimY - 6}`} strokeOpacity="0.45" />
        <path d={`M ${peak1} ${dimY} H ${peak2}`} />
        <path d={`M ${peak1 + 5} ${dimY - 2.5} L ${peak1} ${dimY} ${peak1 + 5} ${dimY + 2.5}`} />
        <path d={`M ${peak2 - 5} ${dimY - 2.5} L ${peak2} ${dimY} ${peak2 - 5} ${dimY + 2.5}`} />
        <path d={`M 49 ${top} H ${LEFT - 7} M 49 ${BASELINE} H ${LEFT - 7}`} strokeOpacity="0.55" />
        <path d={`M 54 ${top} V ${BASELINE}`} />
        <path d={`M 51 ${top + 2} L 57 ${top - 2} M 51 ${BASELINE + 2} L 57 ${BASELINE - 2}`} />
      </g>
      <text
        x={(peak1 + peak2) / 2}
        y={dimY - 9}
        textAnchor="middle"
        fill={DIM_COLOR}
        fontSize="12"
        fontWeight="800"
        data-pitch-dimension
      >
        p = {number(profile.pitchMm)}
      </text>
      <text
        x="44"
        y={(top + BASELINE) / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fill={DIM_COLOR}
        fontSize="12"
        fontWeight="800"
        data-height-dimension
      >
        {number(profile.heightMm)}
      </text>
      <text x="48" y={BASELINE + 18} textAnchor="end" fill="#9ca9ad" fontSize="9">h</text>

      <text x="20" y="198" fill="#89999f" fontSize="9" letterSpacing="0.45">
        h — высота · p — шаг между вершинами
      </text>

      <g stroke="#809096" strokeWidth="1" fill="none">
        <path d={`M 22 222 H ${22 + 100 * SCALE} M 22 218 V 226 M ${22 + 100 * SCALE} 218 V 226`} />
      </g>
      <text x={22 + 50 * SCALE} y="242" textAnchor="middle" fill="#c0cacc" fontSize="10" fontWeight="600">
        100 мм
      </text>
      <g fill="#a8b6ba" fontSize="9.5">
        {profile.shape === "trapezoid" ? (
          <>
            <text x="168" y="220">Полка гребня: {number(profile.crestMm!)} мм</text>
            <text x="168" y="238">Полка впадины: {number(profile.troughMm!)} мм</text>
          </>
        ) : profile.shape === "monterrey" ? (
          <>
            <text x="168" y="220">Ступень: {profile.stepHeightMm} мм</text>
            <text x="168" y="238">Шаг вдоль листа: {profile.longitudinalPitchMm} мм</text>
          </>
        ) : (
          <>
            <text x="168" y="220">DIY · 8 волн на лист 760 мм</text>
            <text x="168" y="238">Допуски: h ±6%, p ±2%</text>
          </>
        )}
      </g>
      <text x="20" y="265" fill="#71858c" fontSize="8.5" letterSpacing="0.5">
        ФРАГМЕНТ 300 ММ · МАСШТАБ ПО X И Y ОДИНАКОВЫЙ
      </text>
    </svg>
  );
}
