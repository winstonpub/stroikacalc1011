/* ============================================================================
 * ФАЙЛ: src/data/roofProfiles.ts — Геометрия волны кровельных профилей (С20, С8, Монтерей, Ондулин)
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит точные миллиметровые размеры волны каждого кровельного материала и строит координаты точек поперечного сечения для векторных миниатюр в блоке «Виды кровли».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Размеры волны (высота heightMm, шаг pitchMm, полки crestMm/troughMm) взяты из технических каталогов производителей; используется компонентами RoofWavePreview.tsx и RoofTypeGuide.tsx.
 * КАК ИЗМЕНИТЬ: Поменяйте высоту волны, шаг, примечание note или ссылку на паспорт производителя sourceUrl в словаре ROOF_PROFILES ниже — схемы в карточках перерисуются сами.
 * ========================================================================= */

/* БЛОК: Справочник геометрии четырёх кровельных профилей (RoofProfile, ROOF_PROFILES)
 * ЗА ЧТО ОТВЕЧАЕТ: Описывает высоту волны, поперечный шаг, форму волны ("trapezoid", "monterrey", "sine"), пояснение и ссылку на техническую документацию для С20, С8, металлочерепицы Монтерей и Ондулина.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Технические каталоги «Металл Профиль» и инструкции Ондулин.
 * КАК ИЗМЕНИТЬ: Поля note и sourceUrl отображаются внизу каждой карточки в блоке «Виды кровли»; поля heightMm и pitchMm управляют как цифрами в таблице характеристик, так и самим чертежом волны. */
export interface ProfilePoint {
  x: number;
  y: number;
}

export interface RoofProfile {
  id: "c20" | "c8" | "monterrey" | "ondulin";
  name: string;
  variant: string;
  heightMm: number;
  pitchMm: number;
  shape: "trapezoid" | "monterrey" | "sine";
  crestMm?: number;
  troughMm?: number;
  stepHeightMm?: number;
  longitudinalPitchMm?: number;
  sourceUrl: string;
  sourceLabel: string;
  note: string;
}

const METAL_PROFILE_CATALOG =
  "https://www.pxc-spb.ru/images/metallocherepiza/supermonterei/katalog_production_13.pdf";

export const ROOF_PROFILES: Record<RoofProfile["id"], RoofProfile> = {
  c20: {
    id: "c20",
    name: "С20",
    variant: "Показан МП-20, вариант B/R",
    heightMm: 18,
    pitchMm: 137.5,
    shape: "trapezoid",
    crestMm: 35,
    troughMm: 67.5,
    sourceUrl: `${METAL_PROFILE_CATALOG}#page=8`,
    sourceLabel: "Сечение МП-20, каталог «Металл Профиль»",
    note: "На схеме вариант МП-20 с высотой 18 мм. У С20 других производителей высота и геометрия могут отличаться.",
  },
  c8: {
    id: "c8",
    name: "С8",
    variant: "С-8 × 1150, симметричный профиль",
    heightMm: 8,
    pitchMm: 115,
    shape: "trapezoid",
    crestMm: 52.5,
    troughMm: 52.5,
    sourceUrl: `${METAL_PROFILE_CATALOG}#page=8`,
    sourceLabel: "Сечение С-8, каталог «Металл Профиль»",
    note: "115 мм — полный поперечный шаг волны, а 52,5 мм — ширина полки. Применимость С8 для кровли проверяйте по проекту и инструкции производителя.",
  },
  monterrey: {
    id: "monterrey",
    name: "Монтерей",
    variant: "Классический Монтеррей, 25 + 14 мм",
    heightMm: 25,
    pitchMm: 183.3,
    shape: "monterrey",
    stepHeightMm: 14,
    longitudinalPitchMm: 350,
    sourceUrl: "https://www.metall-ps.ru/editor_images/metallprofil/mp-monterrey-sh.jpg",
    sourceLabel: "Размерный чертёж МП Монтеррей",
    note: "На поперечном сечении показана волна 25 мм. Ступень 14 мм расположена вдоль листа; полная глубина профиля с ней — 39 мм.",
  },
  ondulin: {
    id: "ondulin",
    name: "Ондулин",
    variant: "Ондулин DIY, лист 760 × 1950 мм",
    heightMm: 38,
    pitchMm: 95,
    shape: "sine",
    sourceUrl: "https://www.grandline.ru/uploads/files/Ondulin/montazh-smart.pdf",
    sourceLabel: "Инструкция производителя Ондулин SMART / DIY",
    note: "Показан Ондулин DIY: 8 волн на листе шириной 760 мм. Допуски производителя: высота ±6%, шаг ±2%.",
  },
};

/* БЛОК: Построение координат одной волны и отрезка 300 мм (profilePeriod, profileFragment)
 * ЗА ЧТО ОТВЕЧАЕТ: Вычисляет точки линии сечения (трапеции для С20/С8, асимметричной волны для Монтерея и синусоиды для Ондулина) и повторяет их на ширину 300 мм для честного визуального сравнения профилей в одном масштабе.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из параметров выбранного профиля RoofProfile.
 * КАК ИЗМЕНИТЬ: Математику построения менять не требуется — она автоматически подстраивается под любые числа из ROOF_PROFILES. */
const n = (value: number) => Number(value.toFixed(5));

export function profilePeriod(profile: RoofProfile): ProfilePoint[] {
  const { pitchMm: pitch, heightMm: height } = profile;
  if (profile.shape === "trapezoid") {
    const crest = profile.crestMm!;
    const trough = profile.troughMm!;
    const slope = (pitch - crest - trough) / 2;
    return [
      { x: 0, y: 0 },
      { x: trough / 2, y: 0 },
      { x: trough / 2 + slope, y: height },
      { x: trough / 2 + slope + crest, y: height },
      { x: pitch - trough / 2, y: 0 },
      { x: pitch, y: 0 },
    ];
  }

  return Array.from({ length: 97 }, (_, index) => {
    const t = index / 96;
    let y: number;
    if (profile.shape === "sine") {
      y = height * (1 - Math.cos(2 * Math.PI * t)) / 2;
    } else if (t <= 0.5) {
      y = height * ((1 - Math.cos(2 * Math.PI * t)) / 2) ** 2;
    } else {
      const u = (t - 0.5) / 0.5;
      y = height * (1 - u) ** 4 * (1 + 4 * u);
    }
    return { x: n(pitch * t), y: n(y) };
  });
}

export function profileFragment(profile: RoofProfile, spanMm = 300): ProfilePoint[] {
  const period = profilePeriod(profile);
  const points: ProfilePoint[] = [];
  for (let cycle = 0; cycle <= Math.ceil(spanMm / profile.pitchMm); cycle++) {
    for (const point of period) {
      const current = { x: n(cycle * profile.pitchMm + point.x), y: point.y };
      const previous = points[points.length - 1];
      if (current.x > spanMm) {
        if (previous && previous.x < spanMm) {
          const ratio = (spanMm - previous.x) / (current.x - previous.x);
          points.push({ x: spanMm, y: n(previous.y + ratio * (current.y - previous.y)) });
        }
        return points;
      }
      if (!previous || current.x > previous.x) points.push(current);
    }
  }
  return points;
}
