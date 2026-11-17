/* ============================================================================
 * ФАЙЛ: src/components/admin/PageSettingsSection.tsx — Раздел «Настройка страниц» в админке
 * ЗА ЧТО ОТВЕЧАЕТ:
 *   1. Выводит в две аккуратные строки кнопки со всеми страницами сайта.
 *   2. При нажатии на любую кнопку страницы показывает ниже список ВСЕХ блоков этой страницы
 *      с подробным описанием и интерактивными полями для редактирования текстов, параметров,
 *      карточек, каталогов и настроек.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Массив страниц PAGES, текущие настройки settings из siteSettings.ts,
 *   справочники материалов Грильято, Армстронг, Кровли и Сайдинга.
 * КАК ИЗМЕНИТЬ: Чтобы добавить новый настраиваемый блок для какой-либо страницы, добавьте его
 *   в соответствующий рендер-блок функции renderPageBlocks() ниже.
 * ========================================================================= */

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  PackagePlus,
  Ruler,
} from "lucide-react";
import {
  CALC_SIZE_MAX,
  CALC_SIZE_MIN,
  CALC_SPARE_MAX,
  LOGO_FOOTER_HEIGHT_MAX,
  LOGO_FOOTER_HEIGHT_MIN,
  LOGO_HEIGHT_MAX,
  LOGO_HEIGHT_MIN,
  LOGO_OFFSET_MAX,
  NOT_FOUND_GAP_DEFAULT,
  NOT_FOUND_GAP_MAX,
  NOT_FOUND_GAP_MIN,
  SHEET_OVERLAP_MAX,
  SHEET_SIZE_MAX,
  SHEET_SIZE_MIN,
  type CalculatorSettings,
  type LogoAlign,
  type LogoPlacement,
  type SidingColorOption,
  type SidingColorPartKey,
  type SidingEdgeDefault,
  type SiteSettings,
} from "../../data/siteSettings";
import { CELL_SIZES, COLORS, HANGERS } from "../../data/grilyato";
import { ARMSTRONG_ANGLES, ARMSTRONG_PROFILES, ARMSTRONG_TILES } from "../../data/armstrong";
import { SIDING_COLORS, SIDING_TRIM_PARTS, getAvailableSidingColors } from "../../data/siding";
import { TickerEditor, FooterEditor, NumberField, SheetEditor } from "../../pages/AdminPage";
import { FooterLogoMark, LogoMark } from "../Header";
import { cn } from "../../utils/cn";
import { extractRoutePath, toHref } from "../../utils/router";
import AboutVisibilityToggle from "./AboutVisibilityToggle";


/* Подписи и теги для страниц, у которых есть карточка в блоке «Выберите Калькулятор» на главной.
 * Остальные страницы выводятся в этом же списке, но кнопка «Главная» у них недоступна — карточки на главной у них нет. */
const HOME_CARD_INFO: Record<string, { eyebrow: string; tags: string }> = {
  "/grilyato": { eyebrow: "Ячеистый потолок", tags: "50×50 · 75×75 · 100×100" },
  "/armstrong": { eyebrow: "Модульный потолок", tags: "600×600 · Т-24 · НГ" },
  "/roof": { eyebrow: "Листовая кровля", tags: "С20 · С8 · Монтерей · Ондулин" },
  "/siding": { eyebrow: "Обшивка фасада", tags: "ПВХ · 3000 × 203 мм · Учёт обрезков" },
};

const ease = [0.22, 1, 0.36, 1] as const;

export interface AdminPageItem {
  title: string;
  route: string;
  category: "Главная" | "Калькулятор" | "Спецификация" | "Системная";
  badge: string;
  description: string;
  icon: typeof Calculator;
  details: string[];
}

interface PageSettingsSectionProps {
  settings: SiteSettings;
  update: (next: SiteSettings) => void;
  pages: AdminPageItem[];
  open: boolean;
  onToggleOpen: () => void;
}

/* БЛОК: Карточка отдельного блока страницы с возможностью сворачивания и редактирования */
function BlockCard({
  num,
  badge,
  title,
  description,
  children,
  wrapTitle = false,
}: {
  num: number;
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  /** true — длинный заголовок переносится на вторую строку, а не обрезается многоточием */
  wrapTitle?: boolean;
}) {
  /* По умолчанию карточка блока свёрнута — видна только шапка с названием и кнопкой «Развернуть» */
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-line bg-white shadow-[0_1px_10px_rgba(20,25,27,0.03)] transition-all hover:border-pro/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-pro text-[12px] font-black text-graphite">
            {num}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-full border border-line bg-smoke px-2 py-px text-[10px] font-bold text-graphite/60">
                {badge}
              </span>
            </div>
            <h4 className={cn("mt-0.5 text-[16px] font-black leading-tight text-graphite", !wrapTitle && "truncate")}>{title}</h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-smoke px-2.5 text-[12px] font-bold text-graphite/70 transition-colors hover:bg-white hover:text-graphite"
        >
          <span>{isOpen ? "Свернуть" : "Развернуть"}</span>
          <ChevronDown
            size={14}
            strokeWidth={2.6}
            className={cn("transition-transform duration-300", isOpen && "rotate-180")}
          />
        </button>
      </div>

      {isOpen && (
        <div className="p-4 lg:p-5">
          <p className="mb-4 text-[12.5px] leading-snug text-graphite/60">{description}</p>
          {children}
        </div>
      )}
    </div>
  );
}

/* БЛОК: Список элементов сайдинга, для которых настраиваются цвета (SIDING_COLOR_PARTS)
 * ЗА ЧТО ОТВЕЧАЕТ: Перечисляет панель сайдинга и все доборные планки — для каждой заводится свой список цветов.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: Названия планок — из SIDING_TRIM_PARTS (src/data/siding.ts). */
const SIDING_COLOR_PARTS: { key: SidingColorPartKey; name: string }[] = [
  { key: "panel", name: "Сайдинг ПВХ" },
  ...SIDING_TRIM_PARTS.map((part) => ({ key: part.key as SidingColorPartKey, name: part.name })),
];

/* БЛОК: Сворачиваемая карточка цветов одного элемента сайдинга (SidingColorPartCard)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает заголовок элемента со счётчиком видимых цветов и по кнопке «Развернуть»
 *   открывает список всех его оттенков: кружок, название, стрелки порядка и кнопка видимости.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: Список options из настроек админки, палитра — SIDING_COLORS, наличие в каталоге — getAvailableSidingColors.
 * КАК ИЗМЕНИТЬ: По умолчанию все карточки свёрнуты — состояние хранится в useState этого компонента. */
function SidingColorPartCard({
  title,
  options,
  availableIds,
  onMove,
  onToggle,
}: {
  title: string;
  options: SidingColorOption[];
  availableIds: string[];
  onMove: (index: number, delta: number) => void;
  onToggle: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const catalogIds = options.filter((option) => availableIds.includes(option.id));
  const shown = catalogIds.filter((option) => option.enabled).length;

  return (
    <div className="rounded-xl border border-line bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-smoke/60"
      >
        <span className="truncate text-[12.5px] font-extrabold text-graphite">{title}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-smoke px-2 py-0.5 text-[11px] font-bold tabular text-graphite/60">
            {shown} из {catalogIds.length}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={2.6}
            className={cn("shrink-0 transition-transform duration-300", isOpen && "rotate-180")}
          />
        </span>
      </button>

      {isOpen && (
        <div className="space-y-1.5 border-t border-line p-2.5">
          {catalogIds.map((option, index) => {
            const color = SIDING_COLORS.find((c) => c.id === option.id);
            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors",
                  option.enabled ? "border-line bg-white" : "border-line bg-smoke/70 opacity-70",
                )}
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-graphite/15"
                  style={{ background: color?.hex ?? "#cccccc" }}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[12.5px] font-bold",
                    !option.enabled && "text-graphite/45 line-through",
                  )}
                >
                  {color?.name ?? option.id}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onMove(index, -1)}
                    disabled={index === 0}
                    aria-label="Поднять цвет выше"
                    title="Поднять выше"
                    className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-graphite/60 transition-colors hover:border-graphite/50 hover:bg-smoke disabled:opacity-35"
                  >
                    <ChevronUp size={14} strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(index, 1)}
                    disabled={index === catalogIds.length - 1}
                    aria-label="Опустить цвет ниже"
                    title="Опустить ниже"
                    className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-graphite/60 transition-colors hover:border-graphite/50 hover:bg-smoke disabled:opacity-35"
                  >
                    <ChevronDown size={14} strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(option.id)}
                    aria-pressed={option.enabled}
                    aria-label={option.enabled ? "Скрыть цвет" : "Показать цвет"}
                    title={option.enabled ? "Показывается в калькуляторе — нажмите, чтобы скрыть" : "Скрыт — нажмите, чтобы показать"}
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-lg border transition-colors",
                      option.enabled
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "border-line bg-white text-graphite/40 hover:bg-smoke",
                    )}
                  >
                    {option.enabled ? <Eye size={14} strokeWidth={2.4} /> : <EyeOff size={14} strokeWidth={2.4} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* БЛОК: Основной компонент раздела «Настройка страниц» */
export default function PageSettingsSection({
  settings,
  update,
  pages,
  open,
  onToggleOpen,
}: PageSettingsSectionProps) {
  const [selectedRoute, setSelectedRoute] = useState<string>("/");
  const [savedBannerMsg] = useState("");

  const activePage = pages.find((p) => p.route === selectedRoute) ?? pages[0];

  /* Делим страницы ровно на две аккуратные строки */
  const row1 = pages.slice(0, 4);
  const row2 = pages.slice(4);

  return (
    <section id="page-settings" className="scroll-mt-[130px] border-b border-[#d8e2ec] bg-[#f0f4f8] py-8 lg:py-10">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
        {/* Шапка раздела */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease }}
          className={cn("flex flex-wrap items-center justify-between gap-3", open && "mb-5")}
        >
          <div>
            <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-[#bfd0e0] bg-white/85 px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#1c4870]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2a68a5]" aria-hidden="true" />
              Настройка страниц
            </div>
            <h2 className="text-[22px] font-black leading-[1.05] tracking-[-0.01em] lg:text-[28px]">
              Блоки и наполнение страниц сайта
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {savedBannerMsg && (
              <span className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700">
                <Check size={14} strokeWidth={2.6} />
                {savedBannerMsg}
              </span>
            )}
            <button
              type="button"
              onClick={onToggleOpen}
              aria-expanded={open}
              className={cn(
                "group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-bold transition-all duration-300",
                open
                  ? "border-line bg-white text-graphite/75 hover:border-graphite/50 hover:text-graphite"
                  : "border-pro/60 bg-pro/10 text-graphite hover:border-pro",
              )}
            >
              <span>{open ? "Свернуть" : "Развернуть"}</span>
              <span className="rounded-md bg-smoke px-1.5 py-0.5 text-[11px] font-extrabold tabular text-graphite/60">
                {pages.length} стр.
              </span>
              <ChevronDown
                size={14}
                strokeWidth={2.6}
                className={cn("shrink-0 transition-transform duration-300", open ? "rotate-180" : "-rotate-90")}
              />
            </button>
          </div>
        </motion.div>

        {open && (
          <div className="space-y-6">
            {/* БЛОК: Кнопки всех страниц сайта, расположенные ровно в две строки */}
            <div className="rounded-2xl border border-line bg-white p-3.5 shadow-[0_1px_10px_rgba(20,25,27,0.03)]">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-graphite/50">
                  Выберите страницу для настройки её блоков:
                </span>
                <span className="text-[11px] font-semibold text-graphite/40">
                  Активна: <b className="text-graphite">{activePage.title}</b>
                </span>
              </div>

              {/* Две строки кнопок */}
              <div className="space-y-2">
                {/* Строка 1: Главная, Грильято, Армстронг, Кровля */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {row1.map((p) => {
                    const Icon = p.icon;
                    const isActive = selectedRoute === p.route;
                    return (
                      <button
                        key={p.route}
                        type="button"
                        onClick={() => setSelectedRoute(p.route)}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all",
                          isActive
                            ? "border-graphite bg-graphite text-white shadow-md ring-2 ring-pro"
                            : "border-line bg-smoke/60 text-graphite hover:border-graphite/40 hover:bg-white",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className={cn(
                              "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                              isActive ? "bg-pro text-graphite" : "bg-white text-graphite",
                            )}
                          >
                            <Icon size={14} strokeWidth={2.4} />
                          </div>
                          <span className="truncate text-[12.5px] font-black">{p.title}</span>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular",
                            isActive ? "bg-white/20 text-white" : "bg-white text-graphite/60",
                          )}
                        >
                          {p.route}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Строка 2: Сайдинг, Тест, Спецификация Тест, Администрирование */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {row2.map((p) => {
                    const Icon = p.icon;
                    const isActive = selectedRoute === p.route;
                    return (
                      <button
                        key={p.route}
                        type="button"
                        onClick={() => setSelectedRoute(p.route)}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all",
                          isActive
                            ? "border-graphite bg-graphite text-white shadow-md ring-2 ring-pro"
                            : "border-line bg-smoke/60 text-graphite hover:border-graphite/40 hover:bg-white",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className={cn(
                              "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                              isActive ? "bg-pro text-graphite" : "bg-white text-graphite",
                            )}
                          >
                            <Icon size={14} strokeWidth={2.4} />
                          </div>
                          <span className="truncate text-[12.5px] font-black">{p.title}</span>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular",
                            isActive ? "bg-white/20 text-white" : "bg-white text-graphite/60",
                          )}
                        >
                          {p.route}
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* БЛОК: Список всех блоков выбранной страницы с редакторами */}
            <div className="space-y-4">
              {/* flex-wrap: на телефоне кнопка «Открыть страницу» переносится под заголовок и не растягивает страницу вширь */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-[14px] font-black text-graphite">
                  <activePage.icon size={18} strokeWidth={2.4} className="shrink-0 text-pro" />
                  <span>Блоки страницы «{activePage.title}»</span>
                  <span className="rounded-lg bg-smoke px-2 py-0.5 text-[11px] font-bold text-graphite/60">
                    {activePage.route}
                  </span>
                </div>
                <a
                  href={toHref(activePage.route)}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex h-[46px] max-w-full items-center gap-2 rounded-2xl bg-pro px-6 text-[14px] font-extrabold text-graphite transition-all hover:gap-3 hover:bg-pro-soft"
                >
                  <span className="truncate">Открыть страницу в новой вкладке</span>
                  <ArrowRight size={16} strokeWidth={2.6} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>

              {/* Отображение блоков конкретной страницы */}
              {renderPageBlocks(selectedRoute, settings, update, pages)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


/* БЛОК: Редактор логотипов (LogoEditor) | ЗА ЧТО ОТВЕЧАЕТ: Логотип в шапке и логотип в подвале —
 * видимость, высота (до 64 px), выравнивание, сдвиг по осям, цвет надписи «Челябинск». Справа живой предпросмотр. */
function LogoEditor({ settings, update }: { settings: SiteSettings; update: (next: SiteSettings) => void }) {
  const logo = settings.logo;
  const setPlace = (where: "header" | "footer", changes: Partial<LogoPlacement>) =>
    update({ ...settings, logo: { ...logo, [where]: { ...logo[where], ...changes } } });

  const range = (label: string, value: number, min: number, max: number, unit: string, onChange: (v: number) => void) => (
    <label className="block">
      <span className="flex items-center justify-between text-[12px] font-bold text-graphite/70">
        {label}
        <span className="tabular text-graphite">{value} {unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="pro-range mt-1 w-full"
        style={{ "--fill": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
      />
    </label>
  );

  const placementEditor = (where: "header" | "footer", title: string, previewBg: string) => {
    const place = logo[where];
    const aligns: { id: LogoAlign; label: string }[] = [
      { id: "left", label: "Слева" },
      { id: "center", label: "По центру" },
      { id: "right", label: "Справа" },
    ];
    const isFooter = where === "footer";
    const minH = isFooter ? LOGO_FOOTER_HEIGHT_MIN : LOGO_HEIGHT_MIN;
    const maxH = isFooter ? LOGO_FOOTER_HEIGHT_MAX : LOGO_HEIGHT_MAX;
    const LogoComponent = isFooter ? FooterLogoMark : LogoMark;
    return (
      <div className="space-y-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-black">{title}</span>
          <button
            type="button"
            onClick={() => setPlace(where, { visible: !place.visible })}
            aria-pressed={place.visible}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-bold transition-colors",
              place.visible ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line bg-white text-graphite/50 hover:bg-smoke",
            )}
          >
            {place.visible ? <Eye size={14} strokeWidth={2.4} /> : <EyeOff size={14} strokeWidth={2.4} />}
            {place.visible ? "Показан" : "Скрыт"}
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-[12px] font-bold text-graphite/70">Положение</div>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-smoke p-1">
                {aligns.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setPlace(where, { align: a.id })}
                    aria-pressed={place.align === a.id}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-[11.5px] font-extrabold transition-all",
                      place.align === a.id ? "bg-graphite text-white shadow-sm" : "text-graphite/55 hover:bg-white hover:text-graphite",
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            {range("Высота", Math.min(Math.max(place.height, minH), maxH), minH, maxH, "px", (v) => setPlace(where, { height: v }))}
            {range("Сдвиг по горизонтали", place.offsetX, -LOGO_OFFSET_MAX, LOGO_OFFSET_MAX, "px", (v) => setPlace(where, { offsetX: v }))}
            {range("Сдвиг по вертикали", place.offsetY, -LOGO_OFFSET_MAX, LOGO_OFFSET_MAX, "px", (v) => setPlace(where, { offsetY: v }))}
          </div>
          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-graphite/45">Предпросмотр</div>
            <div
              className={cn(
                "flex items-center overflow-hidden rounded-xl px-4",
                isFooter ? "h-[210px]" : "h-[140px]",
                place.align === "center" && "justify-center",
                place.align === "right" && "justify-end",
              )}
              style={{ background: previewBg }}
            >
              {place.visible ? (
                <span style={{ transform: `translate(${place.offsetX}px, ${place.offsetY}px)` }}>
                  <LogoComponent height={Math.min(Math.max(place.height, minH), maxH)} />
                </span>
              ) : (
                <span className="text-[12px] font-semibold text-white/50">Логотип скрыт</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {placementEditor("header", "Логотип в шапке сайта", "#20282B")}
      {placementEditor("footer", "Логотип в подвале сайта", "#14191B")}
    </div>
  );
}

/* БЛОК: Настройка страницы «404» — расстояние между логотипом и текстом (NotFoundGapEditor)
 * ЗА ЧТО ОТВЕЧАЕТ: Ползунок, поле с точным числом и готовые варианты для расстояния между анимированным
 *   логотипом «404» и текстом «Страница не найдена» с кнопкой «На главную». Справа — схема страницы,
 *   на которой расстояние меняется сразу.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: settings.notFound.logoGap и границы NOT_FOUND_GAP_MIN / NOT_FOUND_GAP_MAX
 *   из src/data/siteSettings.ts.
 * КАК ИЗМЕНИТЬ: Готовые варианты — в массиве NOT_FOUND_GAP_PRESETS ниже (название и число пикселей). */
const NOT_FOUND_GAP_PRESETS: { label: string; value: number }[] = [
  { label: "Вплотную", value: 24 },
  { label: "Компактно", value: 48 },
  { label: "Стандарт", value: NOT_FOUND_GAP_DEFAULT },
  { label: "Свободно", value: 110 },
];

/* Схема справа нарисована в половину настоящего размера страницы */
const NOT_FOUND_PREVIEW_SCALE = 0.5;

function NotFoundGapEditor({ settings, update }: { settings: SiteSettings; update: (next: SiteSettings) => void }) {
  const gap = settings.notFound.logoGap;
  const setGap = (value: number) => {
    if (!Number.isFinite(value)) return;
    const bounded = Math.min(NOT_FOUND_GAP_MAX, Math.max(NOT_FOUND_GAP_MIN, Math.round(value)));
    update({ ...settings, notFound: { ...settings.notFound, logoGap: bounded } });
  };
  const fill = ((gap - NOT_FOUND_GAP_MIN) / (NOT_FOUND_GAP_MAX - NOT_FOUND_GAP_MIN)) * 100;
  const previewGap = gap * NOT_FOUND_PREVIEW_SCALE;

  return (
    <BlockCard
      num={1}
      badge="Оформление"
      title="Расстояние между логотипом и текстом"
      wrapTitle
      description="Насколько далеко от анимированного логотипа «404» стоит текст «Страница не найдена» с кнопкой «На главную». Расстояние считается от нижнего края цифр «404» до заголовка."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <label className="block min-w-0 flex-1" htmlFor="nf-gap-range">
              <span className="flex items-center justify-between text-[12px] font-bold text-graphite/70">
                Расстояние
                <span className="tabular text-graphite">{gap} px</span>
              </span>
              <input
                id="nf-gap-range"
                data-testid="nf-gap-range"
                type="range"
                min={NOT_FOUND_GAP_MIN}
                max={NOT_FOUND_GAP_MAX}
                step={1}
                value={gap}
                onChange={(e) => setGap(Number(e.target.value))}
                className="pro-range mt-1 w-full"
                style={{ "--fill": `${fill}%` } as React.CSSProperties}
              />
              <span className="flex justify-between text-[10.5px] font-semibold tabular text-graphite/40">
                <span>{NOT_FOUND_GAP_MIN}</span>
                <span>{NOT_FOUND_GAP_MAX} px</span>
              </span>
            </label>
            <div className="w-[104px] shrink-0">
              <NumberField
                label="Точно"
                unit="px"
                icon={Ruler}
                step="1"
                value={gap}
                onChange={setGap}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11.5px] font-extrabold uppercase tracking-wider text-graphite/50">
              Готовые варианты
            </div>
            <div className="flex flex-wrap gap-1.5">
              {NOT_FOUND_GAP_PRESETS.map((preset) => {
                const active = preset.value === gap;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setGap(preset.value)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-bold transition-colors",
                      active
                        ? "border-pro bg-pro text-graphite"
                        : "border-line bg-smoke text-graphite/70 hover:bg-white hover:text-graphite",
                    )}
                  >
                    {preset.label}
                    <span className={cn("tabular text-[11px]", active ? "text-graphite/70" : "text-graphite/40")}>
                      {preset.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
            <a
              href={toHref("/404")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-graphite underline-offset-2 hover:underline"
            >
              Открыть страницу «404»
              <ArrowRight size={13} strokeWidth={2.6} />
            </a>
            <span className="text-[11px] leading-snug text-graphite/45">
              На самой странице расстояние изменится после нажатия «Сохранить и опубликовать».
            </span>
          </div>
        </div>

        {/* БЛОК: Схема страницы «404» | ЗА ЧТО ОТВЕЧАЕТ: Показывает логотип, заголовок и кнопку в половину
            настоящего размера; жёлтая отметка между ними — настраиваемое расстояние. */}
        <div
          className="flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[#20282B] px-4 py-6"
          aria-hidden="true"
        >
          <svg viewBox="76 44 360 424" className="w-[60px]">
            <path
              d="M243.1 54.9A20 20 0 0 1 268.9 54.9L426.07 187.61A28 28 0 0 1 436 209L436 440A28 28 0 0 1 408 468L104 468A28 28 0 0 1 76 440L76 209A28 28 0 0 1 85.93 187.61Z"
              fill="#f5c400"
            />
            <rect x="112" y="212" width="288" height="64" rx="14" fill="#2b2b2b" />
            <rect x="112" y="300" width="54" height="54" rx="12" fill="#ecf6fa" />
            <rect x="190" y="300" width="54" height="54" rx="12" fill="#ecf6fa" />
            <rect x="268" y="300" width="54" height="54" rx="12" fill="#ecf6fa" />
            <rect x="112" y="378" width="54" height="54" rx="12" fill="#ecf6fa" />
            <rect x="190" y="378" width="54" height="54" rx="12" fill="#ecf6fa" />
            <rect x="268" y="378" width="54" height="54" rx="12" fill="#ecf6fa" />
            <rect x="346" y="300" width="54" height="132" rx="12" fill="#e0a800" />
          </svg>
          <div className="mt-2 text-[21px] font-black leading-none tracking-[0.04em] text-white">404</div>

          <div
            data-testid="nf-gap-preview"
            className="relative flex w-full items-center justify-center"
            style={{ height: previewGap }}
          >
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#f5c400]/70" />
            {previewGap >= 18 && (
              <span className="relative rounded bg-[#f5c400] px-1.5 py-px text-[10px] font-extrabold tabular leading-tight text-[#20282B]">
                {gap} px
              </span>
            )}
          </div>

          <div className="text-center text-[23px] font-black leading-[0.98] tracking-[-0.02em] text-white">
            Страница
            <br />
            <span className="text-[#f5c400]">не найдена</span>
          </div>
          <div className="mt-3 inline-flex h-[26px] items-center rounded-lg bg-[#f5c400] px-3.5 text-[9px] font-extrabold text-[#20282B]">
            На главную
          </div>
        </div>
      </div>
    </BlockCard>
  );
}

/* ============================================================================
 * РЕНДЕР ВСЕХ БЛОКОВ ДЛЯ КАЖДОЙ КОНКРЕТНОЙ СТРАНИЦЫ
 * ========================================================================= */
function renderPageBlocks(
  route: string,
  settings: SiteSettings,
  update: (next: SiteSettings) => void,
  pages: AdminPageItem[],
) {
  if (route === "/") {
    /* «Главная» — карточка в блоке «Выберите Калькулятор» (флаг onHome); «Выпадающий» — пункт в списке «Калькуляторы» в шапке (флаг enabled) */
    const toggleHome = (href: string) => {
      update({
        ...settings,
        menu: settings.menu.map((item) =>
          extractRoutePath(item.href) === href ? { ...item, onHome: item.onHome === false } : item,
        ),
      });
    };
    const toggleMenu = (href: string) => {
      update({
        ...settings,
        menu: settings.menu.map((item) =>
          extractRoutePath(item.href) === href ? { ...item, enabled: !item.enabled } : item,
        ),
      });
    };

    const toggleClass = (on: boolean) =>
      cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-bold transition-colors",
        on ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line bg-white text-graphite/50 hover:bg-smoke",
      );

    return (
      <div className="grid gap-3.5 xl:grid-cols-1">
        <BlockCard
          num={1}
          badge="Шапка сайта"
          title="Бегущая строка"
          description="Скорость, текст, порядок и видимость строк бегущей строки в шапке сайта."
        >
          <TickerEditor settings={settings} update={update} bare />
        </BlockCard>

        <BlockCard
          num={2}
          badge="Витрина"
          title="Выберите Калькулятор"
          description="Карточки калькуляторов на главной странице. «Главная» — показывать карточку в этом блоке, «Выпадающий» — показывать пункт в списке «Калькуляторы» в шапке сайта."
        >
          <div className="space-y-2">
            {pages
              .filter((page) => page.route !== "/")
              .map((page) => {
                const info = HOME_CARD_INFO[page.route];
                const isSitemapLocked = page.route === "/admin" || page.badge === "Карта сайта";
                const hasHomeCard = Boolean(info) && !isSitemapLocked;
                const menuItem = settings.menu.find((item) => extractRoutePath(item.href) === page.route);
                const canToggleMenu = Boolean(menuItem) && !isSitemapLocked;
                const onHome = hasHomeCard && menuItem?.onHome !== false;
                const inMenu = canToggleMenu && menuItem?.enabled !== false;
                const hidden = !onHome && !inMenu;
                return (
                  <div
                    key={page.route}
                    aria-disabled={isSitemapLocked || undefined}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
                      hidden ? "border-line bg-smoke/70" : "border-line bg-white",
                      isSitemapLocked && "cursor-not-allowed select-none opacity-65",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-pro">
                        {info?.eyebrow ?? page.badge}
                      </div>
                      <div className={cn("truncate text-[14px] font-black", hidden && "text-graphite/45 line-through")}>
                        {page.title}
                      </div>
                      <div className="text-[11px] font-semibold text-graphite/50">
                        {info?.tags ?? page.route}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => hasHomeCard && toggleHome(page.route)}
                        disabled={!hasHomeCard}
                        aria-pressed={hasHomeCard ? onHome : undefined}
                        title={
                          isSitemapLocked
                            ? "Карту сайта нельзя отобразить на главной странице"
                            : !hasHomeCard
                              ? "У этой страницы нет карточки в блоке «Выберите Калькулятор»"
                              : onHome
                                ? "Скрыть карточку с главной страницы"
                                : "Показать карточку на главной странице"
                        }
                        className={cn(toggleClass(onHome), !hasHomeCard && "cursor-not-allowed opacity-35")}
                      >
                        {onHome ? <Eye size={14} strokeWidth={2.4} /> : <EyeOff size={14} strokeWidth={2.4} />}
                        Главная
                      </button>
                      <button
                        type="button"
                        onClick={() => canToggleMenu && toggleMenu(page.route)}
                        disabled={!canToggleMenu}
                        aria-pressed={canToggleMenu ? inMenu : undefined}
                        title={
                          isSitemapLocked || !canToggleMenu
                            ? "Карту сайта нельзя отобразить в выпадающем списке шапки"
                            : inMenu
                              ? "Убрать из выпадающего списка шапки"
                              : "Показать в выпадающем списке шапки"
                        }
                        className={cn(toggleClass(inMenu), !canToggleMenu && "cursor-not-allowed opacity-35")}
                      >
                        {inMenu ? <Eye size={14} strokeWidth={2.4} /> : <EyeOff size={14} strokeWidth={2.4} />}
                        Выпадающий
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </BlockCard>

        <BlockCard
          num={3}
          badge="Подвал"
          title="Нижний блок с логотипом"
          description="Заголовки колонок, ссылки каталога и контактная информация магазина."
        >
          <FooterEditor settings={settings} update={update} bare />
        </BlockCard>

        <BlockCard
          num={4}
          badge="Логотип"
          title="Логотип сайта"
          description="Логотип в шапке и в подвале (видимость, положение, размер, сдвиг, цвет надписи)."
        >
          <LogoEditor settings={settings} update={update} />
        </BlockCard>
      </div>
    );
  }

  if (route === "/grilyato" || route === "/armstrong") {
    const isArmstrong = route === "/armstrong";
    const key = isArmstrong ? "armstrong" : "grilyato";
    const calc = settings.calculators[key];

    const patch = (changes: Partial<CalculatorSettings>) =>
      update({
        ...settings,
        calculators: { ...settings.calculators, [key]: { ...calc, ...changes } },
      });

    const toggleOption = (field: "cells" | "colors" | "hangers" | "tiles" | "profiles" | "angles", id: string) => {
      const list = calc[field];
      if (!list) return;
      patch({
        [field]: list.map((option) => (option.id === id ? { ...option, enabled: !option.enabled } : option)),
      } as Partial<CalculatorSettings>);
    };

    /* Порядок вариантов: стрелки меняют местами соседние элементы, порядок сохраняется в настройках
       и применяется к кнопкам калькулятора (плиты, профили, углы и подвесы Армстронга). */
    const moveOption = (
      field: "cells" | "colors" | "hangers" | "tiles" | "profiles" | "angles",
      index: number,
      delta: number,
    ) => {
      const list = [...(calc[field] ?? [])];
      const target = index + delta;
      if (target < 0 || target >= list.length) return;
      [list[index], list[target]] = [list[target], list[index]];
      patch({ [field]: list } as Partial<CalculatorSettings>);
    };

    const groups: { field: "cells" | "colors" | "hangers" | "tiles" | "profiles" | "angles"; title: string; hint: string; labels: Record<string, string> }[] = isArmstrong
      ? [
          {
            field: "tiles",
            title: "Плиты 600×600",
            hint: "Какие плиты доступны посетителю в калькуляторе",
            labels: Object.fromEntries(ARMSTRONG_TILES.map((t) => [t.id, t.label])),
          },
          {
            field: "profiles",
            title: "Т-профили каркаса",
            hint: "Исполнения каркаса Т-24",
            labels: Object.fromEntries(ARMSTRONG_PROFILES.map((t) => [t.id, t.label])),
          },
          {
            field: "angles",
            title: "Пристенные углы",
            hint: "Уголок по периметру помещения",
            labels: Object.fromEntries(ARMSTRONG_ANGLES.map((t) => [t.id, t.label])),
          },
          {
            field: "hangers",
            title: "Длина подвеса, мм",
            hint: "Высота запотолочного пространства",
            labels: Object.fromEntries(HANGERS.map((h) => [String(h.len), `${h.len} мм`])),
          },
        ]
      : [
          {
            field: "cells",
            title: "Размер ячейки, мм",
            hint: "Доступные типоразмеры решётки",
            labels: Object.fromEntries(CELL_SIZES.map((c) => [String(c.mm), c.label])),
          },
          {
            field: "colors",
            title: "Цвет профилей",
            hint: "Доступные цвета решётки",
            labels: Object.fromEntries(
              COLORS.map((c) => [
                c.id,
                c.name.toLowerCase() === c.ral.toLowerCase() ? c.name : `${c.name} · ${c.ral}`,
              ]),
            ),
          },
          {
            field: "hangers",
            title: "Длина подвеса, мм",
            hint: "Высота запотолочного пространства",
            labels: Object.fromEntries(HANGERS.map((h) => [String(h.len), `${h.len} мм`])),
          },
        ];

    return (
      <div className="grid gap-3.5 xl:grid-cols-1">
        <AboutVisibilityToggle
          title={isArmstrong ? "Блок «О системе Армстронг»" : "Блок «О грильято»"}
          value={settings.aboutVisible[key]}
          onChange={(next) => update({ ...settings, aboutVisible: { ...settings.aboutVisible, [key]: next } })}
        />
        <BlockCard
          num={1}
          badge="Калькулятор"
          title={isArmstrong ? "Калькулятор потолка Армстронг" : "Калькулятор потолка Грильято"}
          description="Стартовые размеры помещения и запас, которые видит новый посетитель, и список доступных ему вариантов. Выключенный вариант пропадает из калькулятора на странице."
        >
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[11.5px] font-extrabold uppercase tracking-wider text-graphite/50">
                Стартовые значения для нового посетителя
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <NumberField
                  label="Длина помещения"
                  unit="м"
                  icon={Ruler}
                  value={calc.length}
                  onChange={(v) => patch({ length: Math.min(CALC_SIZE_MAX, Math.max(CALC_SIZE_MIN, v)) })}
                />
                <NumberField
                  label="Ширина помещения"
                  unit="м"
                  icon={Ruler}
                  value={calc.width}
                  onChange={(v) => patch({ width: Math.min(CALC_SIZE_MAX, Math.max(CALC_SIZE_MIN, v)) })}
                />
                <NumberField
                  label="Запас"
                  unit="%"
                  icon={PackagePlus}
                  step="1"
                  value={calc.sparePct}
                  onChange={(v) => patch({ sparePct: Math.min(CALC_SPARE_MAX, Math.max(0, Math.round(v))) })}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-graphite/45">
                Эти значения подставляются при первом заходе. Если посетитель уже считал потолок, калькулятор откроется с его данными.
              </p>
            </div>

            {groups.map((group) => {
              const list = calc[group.field] ?? [];
              const shown = list.filter((option) => option.enabled).length;
              return (
                <div key={group.field}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[12.5px] font-bold text-graphite/70">{group.title}</span>
                    <span className="rounded-md bg-smoke px-2 py-0.5 text-[11px] font-bold tabular text-graphite/60">
                      {shown} из {list.length}
                    </span>
                  </div>
                  {isArmstrong ? (
                    <div className="space-y-1.5">
                      {list.map((option, index) => {
                        const label = group.labels[option.id] ?? option.id;
                        return (
                          <div
                            key={option.id}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors",
                              option.enabled ? "border-line bg-white" : "border-line bg-smoke/70 opacity-70",
                            )}
                          >
                            <span className="w-6 shrink-0 text-center text-[11px] font-black tabular text-graphite/40">
                              {index + 1}
                            </span>
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate text-[12.5px] font-bold",
                                !option.enabled && "text-graphite/45 line-through",
                              )}
                            >
                              {label}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveOption(group.field, index, -1)}
                                disabled={index === 0}
                                aria-label={`Поднять «${label}» выше`}
                                title="Поднять выше"
                                className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-graphite/60 transition-colors hover:border-graphite/50 hover:bg-smoke disabled:opacity-35"
                              >
                                <ChevronUp size={14} strokeWidth={2.4} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveOption(group.field, index, 1)}
                                disabled={index === list.length - 1}
                                aria-label={`Опустить «${label}» ниже`}
                                title="Опустить ниже"
                                className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-graphite/60 transition-colors hover:border-graphite/50 hover:bg-smoke disabled:opacity-35"
                              >
                                <ChevronDown size={14} strokeWidth={2.4} />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleOption(group.field, option.id)}
                                aria-pressed={option.enabled}
                                aria-label={option.enabled ? `Скрыть «${label}»` : `Показать «${label}»`}
                                title={option.enabled ? "Показывается в калькуляторе — нажмите, чтобы скрыть" : "Скрыто — нажмите, чтобы показать"}
                                className={cn(
                                  "grid h-7 w-7 place-items-center rounded-lg border transition-colors",
                                  option.enabled
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                    : "border-line bg-white text-graphite/40 hover:bg-smoke",
                                )}
                              >
                                {option.enabled ? <Eye size={14} strokeWidth={2.4} /> : <EyeOff size={14} strokeWidth={2.4} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {list.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleOption(group.field, option.id)}
                          aria-pressed={option.enabled}
                          title={option.enabled ? "Скрыть вариант в калькуляторе" : "Показать вариант в калькуляторе"}
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-bold transition-colors",
                            option.enabled
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-line bg-white text-graphite/45 line-through hover:bg-smoke",
                          )}
                        >
                          {option.enabled ? <Eye size={13} strokeWidth={2.4} /> : <EyeOff size={13} strokeWidth={2.4} />}
                          {group.labels[option.id] ?? option.id}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-graphite/45">
                    {isArmstrong ? `${group.hint}. Стрелки ↑ ↓ меняют порядок кнопок в калькуляторе.` : group.hint}
                  </p>
                  {shown === 0 && (
                    <p className="mt-1 text-[11px] font-semibold text-amber-700">
                      Все варианты скрыты — на странице останется полный список, иначе калькулятор не сможет считать.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </BlockCard>
      </div>
    );
  }

  if (route === "/roof") {
    const roof = settings.calculators.roof;
    const patch = (changes: Partial<typeof roof>) =>
      update({ ...settings, calculators: { ...settings.calculators, roof: { ...roof, ...changes } } });
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
    return (
      <div className="grid gap-3.5 xl:grid-cols-1">
        <AboutVisibilityToggle
          title="Блок «О кровле»"
          value={settings.aboutVisible.roof}
          onChange={(next) => update({ ...settings, aboutVisible: { ...settings.aboutVisible, roof: next } })}
        />
        <BlockCard
          num={1}
          badge="Калькулятор"
          title="Калькулятор кровли"
          description="Стартовые размеры кровли, листа и перехлёстов для нового посетителя и кнопки «Готовый размер листа» в калькуляторе."
        >
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-[11.5px] font-extrabold uppercase tracking-wider text-graphite/50">
                Стартовые значения для нового посетителя
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField label="Длина кровли" unit="м" icon={Ruler} value={roof.roofLength} onChange={(v) => patch({ roofLength: clamp(v, CALC_SIZE_MIN, CALC_SIZE_MAX) })} />
                <NumberField label="Длина листа" unit="м" icon={Ruler} value={roof.sheetLength} onChange={(v) => patch({ sheetLength: clamp(v, SHEET_SIZE_MIN, SHEET_SIZE_MAX) })} />
                <NumberField label="Перехлёст по длине" unit="мм" icon={Ruler} step="1" value={roof.overlapLength} onChange={(v) => patch({ overlapLength: clamp(Math.round(v), 0, SHEET_OVERLAP_MAX) })} />
                <NumberField label="Ширина кровли" unit="м" icon={Ruler} value={roof.roofWidth} onChange={(v) => patch({ roofWidth: clamp(v, CALC_SIZE_MIN, CALC_SIZE_MAX) })} />
                <NumberField label="Ширина листа" unit="м" icon={Ruler} value={roof.sheetWidth} onChange={(v) => patch({ sheetWidth: clamp(v, SHEET_SIZE_MIN, SHEET_SIZE_MAX) })} />
                <NumberField label="Перехлёст по ширине" unit="мм" icon={Ruler} step="1" value={roof.overlapWidth} onChange={(v) => patch({ overlapWidth: clamp(Math.round(v), 0, SHEET_OVERLAP_MAX) })} />
              </div>
              <p className="mt-1.5 text-[11px] text-graphite/45">Подставляются при открытии страницы «Кровля».</p>
            </div>
            <div className="border-t border-line pt-4">
              <div className="mb-2 text-[11.5px] font-extrabold uppercase tracking-wider text-graphite/50">Готовый размер листа</div>
              <SheetEditor settings={settings} update={update} bare />
            </div>
          </div>
        </BlockCard>
      </div>
    );
  }

  if (route === "/siding") {
    const sd = settings.calculators.siding;
    const patch = (changes: Partial<typeof sd>) =>
      update({ ...settings, calculators: { ...settings.calculators, siding: { ...sd, ...changes } } });
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
    /* Цвета каждого элемента сайдинга: свой список видимости и порядка */
    const sidingColors = sd.colors ?? {};
    const moveSidingColor = (part: SidingColorPartKey, index: number, delta: number) => {
      const list = [...(sidingColors[part] ?? [])];
      const target = index + delta;
      if (target < 0 || target >= list.length) return;
      [list[index], list[target]] = [list[target], list[index]];
      patch({ colors: { ...sidingColors, [part]: list } });
    };
    const toggleSidingColor = (part: SidingColorPartKey, id: string) =>
      patch({
        colors: {
          ...sidingColors,
          [part]: (sidingColors[part] ?? []).map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
        },
      });
    const edges: { id: SidingEdgeDefault; label: string }[] = [
      { id: "j", label: "J профиль" },
      { id: "inner", label: "Внутр. угол" },
      { id: "outer", label: "Наруж. угол" },
    ];
    const edgePicker = (title: string, value: SidingEdgeDefault, onChange: (v: SidingEdgeDefault) => void) => (
      <div>
        <div className="mb-1 text-[12px] font-bold text-graphite/70">{title}</div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-smoke p-1">
          {edges.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onChange(e.id)}
              aria-pressed={value === e.id}
              className={cn(
                "rounded-lg px-2 py-1.5 text-[11.5px] font-extrabold transition-all",
                value === e.id ? "bg-graphite text-white shadow-sm" : "text-graphite/55 hover:bg-white hover:text-graphite",
              )}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>
    );
    const toggle = (label: string, on: boolean, onClick: () => void) => (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-bold transition-colors",
          on ? "border-graphite bg-smoke" : "border-line bg-white hover:border-graphite/40",
        )}
      >
        {label}
        <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-graphite" : "bg-line")}>
          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
        </span>
      </button>
    );
    return (
      <div className="grid gap-3.5 xl:grid-cols-1">
        <AboutVisibilityToggle
          title="Блок «О сайдинге»"
          value={settings.aboutVisible.siding}
          onChange={(next) => update({ ...settings, aboutVisible: { ...settings.aboutVisible, siding: next } })}
        />
        <BlockCard
          num={1}
          badge="Калькулятор"
          title="Калькулятор сайдинга"
          description="Стартовый фасад, который видит новый посетитель: размеры, запас, верхняя финишная планка, профили краёв и режим «Один цвет». Если посетитель уже считал фасад, откроется его расчёт."
        >
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <NumberField label="Длина фасада" unit="м" icon={Ruler} value={sd.facadeLength} onChange={(v) => patch({ facadeLength: clamp(v, CALC_SIZE_MIN, CALC_SIZE_MAX) })} />
              <NumberField label="Высота фасада" unit="м" icon={Ruler} value={sd.facadeHeight} onChange={(v) => patch({ facadeHeight: clamp(v, CALC_SIZE_MIN, CALC_SIZE_MAX) })} />
              <NumberField label="Запас" unit="%" icon={PackagePlus} step="1" value={sd.sparePct} onChange={(v) => patch({ sparePct: clamp(Math.round(v), 0, CALC_SPARE_MAX) })} />
            </div>
            <div className="grid gap-3">
              {edgePicker("Левая сторона фасада", sd.leftEdge, (v) => patch({ leftEdge: v }))}
              {edgePicker("Правая сторона фасада", sd.rightEdge, (v) => patch({ rightEdge: v }))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {toggle("Завершение сайдинга финишной планкой", sd.straightTop, () => patch({ straightTop: !sd.straightTop }))}
              {toggle("Режим «Один цвет» включён", sd.singleColor, () => patch({ singleColor: !sd.singleColor }))}
            </div>

            {/* БЛОК: Цвета сайдинга — сворачиваемые списки по каждому элементу | ЗА ЧТО ОТВЕЧАЕТ: Управляет оттенками в калькуляторе «Сайдинг» отдельно для панели и каждой доборной планки: какие кружки показывать и в каком порядке | ОТКУДА ДАННЫЕ: settings.calculators.siding.colors, палитра — SIDING_COLORS из src/data/siding.ts */}
            <div className="border-t border-line pt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-graphite/50">
                  Цвета сайдинга: видимость и порядок
                </span>
                <span className="rounded-md bg-smoke px-2 py-0.5 text-[11px] font-bold tabular text-graphite/60">
                  {SIDING_COLOR_PARTS.length} элементов
                </span>
              </div>

              <div className="space-y-1.5">
                {SIDING_COLOR_PARTS.map((part) => (
                  <SidingColorPartCard
                    key={part.key}
                    title={part.name}
                    options={sidingColors[part.key] ?? []}
                    availableIds={getAvailableSidingColors(part.key).map((c) => c.id)}
                    onMove={(index, delta) => moveSidingColor(part.key, index, delta)}
                    onToggle={(id) => toggleSidingColor(part.key, id)}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-graphite/45">
                Раскройте элемент, чтобы скрыть лишние оттенки или поменять порядок кружков. Цвета, которых нет
                в каталоге для этого элемента, в калькуляторе не показываются.
              </p>
            </div>
          </div>
        </BlockCard>
      </div>
    );
  }

  if (route === "/404") {
    return (
      <div className="space-y-3.5">
        <NotFoundGapEditor settings={settings} update={update} />
        <p className="px-1 text-[11.5px] leading-snug text-graphite/45">
          Рисунок, заголовок и кнопка страницы «404» меняются в файле src/pages/NotFoundPage.tsx.
        </p>
      </div>
    );
  }

  if (route === "/test") {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-[13.5px] font-semibold text-graphite/50">
        Страница «Тест» сейчас показывает заглушку «Тестовая страница» и не содержит настраиваемых блоков.
        Чтобы вернуть на неё содержимое (например, калькулятор фасада), отредактируйте файл src/pages/TestPage.tsx.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-[13.5px] font-semibold text-graphite/50">
      Для этой страницы пока нет настраиваемых блоков.
    </div>
  );
}

