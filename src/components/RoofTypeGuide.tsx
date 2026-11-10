/* ============================================================================
 * ФАЙЛ: src/components/RoofTypeGuide.tsx — Справочник «Виды кровли» с полноэкранными схемами
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит на странице #/roof четыре карточки кровельных материалов (С20, С8, Металлочерепица Монтерей, Ондулин) с кликабельной миниатюрой волны (открывается на весь экран), таблицей характеристик и кнопкой «Рассчитать…».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Геометрия волны и примечания берутся из ROOF_PROFILES (src/data/roofProfiles.ts), чертёж рисует RoofWavePreview.tsx, а размеры листов, перехлёсты, толщины и гарантии хранятся в массиве ROOF_MATERIALS ниже.
 * КАК ИЗМЕНИТЬ: Отредактируйте описания, размеры, гарантию или области применения uses в массиве ROOF_MATERIALS ниже; для изменения самой волны профиля откройте src/data/roofProfiles.ts.
 * ========================================================================= */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Maximize2, X } from "lucide-react";
import { ROOF_PROFILES, type RoofProfile } from "../data/roofProfiles";
import { cn } from "../utils/cn";
import RoofWavePreview from "./RoofWavePreview";

const ease = [0.22, 1, 0.36, 1] as const;

/* БЛОК: Описание и паспортные характеристики четырёх кровельных материалов (ROOF_MATERIALS)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт тексты, габариты листа, перехлёсты, толщину, гарантию и области применения каждой карточки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Значения preset согласованы со стандартными пресетами в src/data/siteSettings.ts.
 * КАК ИЗМЕНИТЬ: Поменяйте любые строки в объектах массива ROOF_MATERIALS — карточки на странице «Кровля» обновятся сразу. */
export interface RoofMaterialInfo {
  id: RoofProfile["id"];
  kind: string;
  label: string;
  badge: string;
  featured?: boolean;
  lead: string;
  dimensions: string;
  usefulDimensions: string;
  overlap: string;
  thickness: string;
  warranty: string;
  preset: {
    sheetWidth: number;
    sheetLength: number;
    overlapWidth: number;
    overlapLength: number;
  };
  uses: string[];
}

export const ROOF_MATERIALS: RoofMaterialInfo[] = [
  {
    id: "c20",
    kind: "Профнастил кровельный",
    label: "Профнастил С20",
    badge: "Самый популярный",
    featured: true,
    lead: "Трапециевидный профиль с широкими впадинами и узкими гребнями. На схеме показан вариант МП-20: волна 18 мм с поперечным шагом 137,5 мм. Подбор для кровли выполняется по проекту.",
    dimensions: "1,15 × 2,00 м",
    usefulDimensions: "1,10 × 1,85 м",
    overlap: "50 × 150 мм",
    thickness: "0,45 – 0,7 мм",
    warranty: "до 25 лет",
    preset: { sheetWidth: 1.15, sheetLength: 2, overlapWidth: 50, overlapLength: 150 },
    uses: ["Кровля частных домов", "Навесы и веранды", "Гаражи и хозблоки", "Ангары и склады", "Заборы"],
  },
  {
    id: "c8",
    kind: "Профнастил универсальный",
    label: "Профнастил С8",
    badge: "Экономичный вариант",
    lead: "Низкий симметричный профиль: волна 8 мм, поперечный шаг 115 мм. Основное назначение — стены и ограждения; возможность применения на кровле нужно проверять по проекту и инструкции производителя.",
    dimensions: "1,20 × 2,00 м",
    usefulDimensions: "1,15 × 1,85 м",
    overlap: "50 × 150 мм",
    thickness: "0,4 – 0,55 мм",
    warranty: "до 20 лет",
    preset: { sheetWidth: 1.2, sheetLength: 2, overlapWidth: 50, overlapLength: 150 },
    uses: ["Крутые скаты крыш", "Беседки и навесы", "Хозпостройки", "Облицовка стен", "Ограждения"],
  },
  {
    id: "monterrey",
    kind: "Металлочерепица",
    label: "Металлочерепица Монтерей",
    badge: "Классический дизайн",
    lead: "Классический волнообразный профиль, имитирующий натуральную керамическую черепицу. Эстетичный внешний вид, долговечность и малый вес листа.",
    dimensions: "1,18 × 2,25 м",
    usefulDimensions: "1,10 × 2,15 м",
    overlap: "80 × 100 мм",
    thickness: "0,45 – 0,5 мм",
    warranty: "до 35 лет",
    preset: { sheetWidth: 1.18, sheetLength: 2.25, overlapWidth: 80, overlapLength: 100 },
    uses: ["Коттеджи и дома", "Таунхаусы", "Мансардные этажи", "Капитальный ремонт крыш", "Бани и гостевые дома"],
  },
  {
    id: "ondulin",
    kind: "Битумный лист",
    label: "Ондулин",
    badge: "Бесшумная кровля",
    lead: "Целлюлозно-битумный волнистый лист. Полностью поглощает шум дождя, не подвержен коррозии, легко режется обычной ножовкой и монтируется в одиночку.",
    dimensions: "0,76 × 1,95 м",
    usefulDimensions: "0,665 × 1,75 м",
    overlap: "95 × 200 мм",
    thickness: "3,0 мм",
    warranty: "15 лет от протечек",
    preset: { sheetWidth: 0.76, sheetLength: 1.95, overlapWidth: 95, overlapLength: 200 },
    uses: ["Дачные дома", "Бесшумные спальни", "Беседки и бани", "Ремонт поверх старой кровли", "Пристройки"],
  },
];

/* БЛОК: Карточка одного вида кровли с полноэкранным просмотром схемы (RoofMaterialCard)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит кликабельную схему волны (по клику открывает модальное окно на весь экран с закрытием по Esc или клику вне схемы), таблицу параметров, ссылку на чертёж производителя и кнопку выбора материала в калькулятор.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Объект item из ROOF_MATERIALS и геометрический профиль из ROOF_PROFILES[item.id].
 * КАК ИЗМЕНИТЬ: Состав таблицы характеристик настраивается в массиве rows внутри этой функции. */
function RoofMaterialCard({
  item,
  index,
}: {
  item: RoofMaterialInfo;
  index: number;
}) {
  const profile = ROOF_PROFILES[item.id];
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomed]);

  const dimension = (value: number) =>
    `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value)} мм`;
  const pick = () => {
    window.dispatchEvent(
      new CustomEvent("roof:select-material", {
        detail: item.id,
      })
    );
    document.getElementById("calc")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const rows: [string, string][] = [
    ["Высота волны h", dimension(profile.heightMm)],
    ["Поперечный шаг p", dimension(profile.pitchMm)],
    ...(profile.stepHeightMm && profile.longitudinalPitchMm
      ? [["Ступень / шаг вдоль", `${profile.stepHeightMm} / ${profile.longitudinalPitchMm} мм`] as [string, string]]
      : []),
    ["Габарит листа", item.dimensions],
    ["Полезный размер", item.usefulDimensions],
    ["Перехлёст (Ш × Д)", item.overlap],
    ["Толщина", item.thickness],
    ["Гарантия", item.warranty],
  ];

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay: index * 0.08, ease }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border bg-white/[0.04] transition-all duration-300 hover:-translate-y-1",
        item.featured
          ? "border-pro/60 shadow-[0_24px_60px_rgba(255,203,5,0.08)]"
          : "border-white/10 hover:border-pro/50"
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          title="Открыть схему на весь экран"
          aria-label={`Открыть схему на весь экран: ${item.label}`}
          className="group/preview relative block w-full cursor-zoom-in overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pro"
        >
          <RoofWavePreview
            profile={profile}
            className="block aspect-[3/2] w-full transition-transform duration-300 group-hover/preview:scale-[1.03]"
          />
          <span className="pointer-events-none absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-graphite/85 text-white/80 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover/preview:opacity-100 group-focus-visible/preview:opacity-100">
            <Maximize2 size={15} strokeWidth={2.3} aria-hidden="true" />
          </span>
        </button>
        <span
          className={cn(
            "pointer-events-none absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide",
            item.featured ? "bg-pro text-graphite" : "border border-white/15 bg-graphite/80 text-white backdrop-blur"
          )}
        >
          {item.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h4 className="text-[24px] font-black leading-tight tracking-[-0.02em]">{item.label}</h4>
        <div className="mt-1.5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-pro">{item.kind}</div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-white/60">{item.lead}</p>

        <dl className="mt-5 divide-y divide-white/10 border-y border-white/10 text-[13px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 py-2.5">
              <dt className="text-white/55">{k}</dt>
              <dd className="text-right font-bold tabular">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 text-[11.5px] leading-relaxed text-white/45">
          <p>{profile.note}</p>
          <a
            href={profile.sourceUrl}
            target="_blank"
            rel="noreferrer"
            title={profile.sourceLabel}
            aria-label={`Источник геометрии: ${item.label}`}
            className="mt-2 inline-flex items-center gap-1.5 text-pro/80 underline-offset-4 transition-colors hover:text-pro hover:underline"
          >
            Техническая схема
            <ExternalLink size={11} strokeWidth={2.3} aria-hidden="true" />
          </a>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/45">Области применения</div>
          <div className="flex flex-wrap gap-1.5">
            {item.uses.map((use) => (
              <span
                key={use}
                className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11.5px] font-semibold text-white/80"
              >
                {use}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={pick}
          className="mt-auto inline-flex items-center gap-2 pt-6 text-[13.5px] font-extrabold text-pro transition-all hover:gap-3"
        >
          Рассчитать «{item.label}»
          <ArrowRight size={15} strokeWidth={2.6} />
        </button>
      </div>

      {zoomed &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-graphite/95 p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Схема на весь экран: ${item.label}`}
            onClick={() => setZoomed(false)}
          >
            <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4 text-white">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-extrabold sm:text-[18px]">{item.label}</div>
                <div className="mt-0.5 text-[12px] font-semibold text-white/50">{item.kind}</div>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => setZoomed(false)}
                aria-label="Закрыть полноэкранную схему"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pro"
              >
                <X size={20} strokeWidth={2.2} />
              </button>
            </div>

            <div
              className="mx-auto mt-3 flex min-h-0 w-full max-w-[1100px] flex-1 items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <RoofWavePreview
                profile={profile}
                className="h-auto max-h-full w-full rounded-xl shadow-2xl animate-scheme-in"
              />
            </div>

            <div className="mx-auto mt-3 w-full max-w-[1100px] text-center text-[12px] font-medium text-white/45">
              Нажмите Esc или вне схемы, чтобы закрыть
            </div>
          </div>,
          document.body,
        )}
    </motion.article>
  );
}

/* БЛОК: Секция «Виды кровли / Подробно о каждом материале» (RoofTypeGuide)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит заголовок, пояснение про единый масштаб 300 мм и сетку из 4 карточек материалов.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из массива ROOF_MATERIALS выше.
 * КАК ИЗМЕНИТЬ: Заголовок, вступительный текст и примечание под карточками меняются прямо здесь. */
export default function RoofTypeGuide() {
  return (
    <div id="types" className="mt-16 scroll-mt-[130px] lg:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease }}
        className="mb-8"
      >
        <div className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-pro">
          Виды кровли
        </div>
        <h3 className="text-[30px] font-black leading-[1.05] tracking-[-0.01em] lg:text-[42px]">
          Подробно о каждом материале
        </h3>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/55">
          Фрагменты 300 мм показаны в одном масштабе по ширине и высоте. Сравните высоту волны h
          и поперечный шаг p — расстояние между соседними гребнями, а не ширину листа.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROOF_MATERIALS.map((mat, i) => (
          <RoofMaterialCard key={mat.id} item={mat} index={i} />
        ))}
      </div>
    </div>
  );
}
