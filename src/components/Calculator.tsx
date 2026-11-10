/* ============================================================================
 * ФАЙЛ: src/components/Calculator.tsx — Универсальный калькулятор потолков Грильято и Армстронг
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит интерактивный расчёт потолка на страницах #/grilyato (mode="grilyato") и #/armstrong (mode="armstrong"): ввод длины и ширины помещения, выбор ячейки и цвета (для Грильято) или плиты, Т-профиля и угла с галереей фото (для Армстронга), выбор подвеса, ползунок запаса %, статус онлайн-проверки цен, карточку «Итого материалы», таблицу сметы, переход на печать и выгрузку CSV.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Товары и формулы Грильято — из src/data/grilyato.ts, товары и формулы Армстронга — из src/data/armstrong.ts, онлайн-цены — из Google-таблицы через usePrices() (src/data/prices.ts), сохранённый ввод — из src/utils/calcStorage.ts.
 * КАК ИЗМЕНИТЬ:
 *   — Чтобы поменять товары, артикулы и формулы расчёта — редактируйте src/data/grilyato.ts и src/data/armstrong.ts.
 *   — Чтобы поменять цены — обновите их в Google-таблице цен.
 *   — Чтобы поменять заголовки, подписи полей или вид таблицы сметы — редактируйте соответствующие блоки ниже.
 * ========================================================================= */

import { PriceStatusBar } from "./PriceStatusBar";
import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValueEvent, useSpring } from "framer-motion";
import {
  Download, Info, MoveVertical, Palette,
  PackagePlus, Ruler, SquarePen, FileSpreadsheet,
  TriangleAlert, Printer, LayoutGrid, CornerDownRight,
  ChevronLeft, ChevronRight, Maximize2, X,
} from "lucide-react";
import {
  CELL_SIZES, COLORS, HANGERS,
  calcGrilyato, fmt, fmt1, fmtMoney, fmtPrice, type CalcInput,
} from "../data/grilyato";
import { usePrices, type PriceSheetSource } from "../data/prices";
import {
  ARMSTRONG_ANGLES, ARMSTRONG_PROFILES, ARMSTRONG_TILES,
  DEFAULT_ARMSTRONG_ANGLE, DEFAULT_ARMSTRONG_PROFILE, DEFAULT_ARMSTRONG_TILE,
  calcArmstrong, getArmstrongAngle, getArmstrongProfile, getArmstrongTile,
} from "../data/armstrong";
import ArticleCell from "./ArticleCell";
import CellSchemePreview from "./CellSchemePreview";
import PlanPreview from "./PlanPreview";
import { printSpecificationOverlay } from "../utils/pagePrint";
import {
  ARMSTRONG_SPEC_TITLE, GRILYATO_SPEC_TITLE, SpecPrintPortal,
  armstrongSpecParams, grilyatoSpecParams,
} from "./SpecSheet";
import { loadArmstrongSetup, loadCalcInput, saveArmstrongSetup, saveCalcInput } from "../utils/calcStorage";
import { useSiteSettings, type CalcOption } from "../data/siteSettings";
import { cn } from "../utils/cn";

/* БЛОК: Поле ввода длины и ширины помещения (DimensionField)
 * ЗА ЧТО ОТВЕЧАЕТ: Позволяет вводить дробные метры как через запятую, так и через точку и мгновенно передаёт положительное число в расчёт.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Текущее значение value и подпись label из родительского компонента Calculator.
 * КАК ИЗМЕНИТЬ: Ширина поля ввода задаётся классом w-[120px]. */
function DimensionField(props: {
  label: string; value: number; unit: string; onChange: (v: number) => void;
}) {
  const { label, value, unit, onChange } = props;
  const [text, setText] = useState(String(value).replace(".", ","));
  useEffect(() => setText(String(value).replace(".", ",")), [value]);

  const commit = (raw: string) => {
    setText(raw);
    const v = parseFloat(raw.replace(",", "."));
    if (Number.isFinite(v) && v > 0) onChange(v);
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label className="text-[13px] font-bold text-graphite/70 flex items-center gap-1.5">
          <Ruler size={14} strokeWidth={2.4} className="text-graphite/40" />
          {label}
        </label>
        <div className="flex items-baseline gap-1">
          <input
            value={text}
            onChange={(e) => commit(e.target.value)}
            onBlur={() => setText(String(value).replace(".", ","))}
            inputMode="decimal"
            aria-label={label}
            className="no-spin w-[120px] text-right text-[17px] font-extrabold bg-smoke rounded-lg px-2 py-1 outline-none border border-transparent focus:border-pro transition-colors tabular"
          />
          <span className="text-[13px] font-semibold text-graphite/50">{unit}</span>
        </div>
      </div>
    </div>
  );
}

/* БЛОК: Миниатюра фото комплектующего Армстронга с листанием и открытием на весь экран (PartImage)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает квадратное фото выбранной плиты, профиля или угла со стрелками перелистывания (если фото несколько) и полноэкранной галереей по клику.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Массив путей к изображениям images из объектов в src/data/armstrong.ts (файлы лежат в public/images/armstrong/).
 * КАК ИЗМЕНИТЬ: Чтобы добавить новые ракурсы плиты, допишите пути к файлам в массив gallery нужной плиты в src/data/armstrong.ts. */
function PartImage({ images, caption, label }: { images: string[]; caption: string; label: string }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const total = Math.max(images.length, 1);
  const safeIndex = ((index % total) + total) % total;
  const src = images[safeIndex] ?? images[0];

  useEffect(() => {
    setIndex(0);
    setZoomed(false);
  }, [images.join("|")]);

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoomed, total]);

  const showArrows = total > 1;

  return (
    <>
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-stretch gap-2 p-2">
          <button
            type="button"
            onClick={() => setZoomed(true)}
            title="Открыть на весь экран"
            aria-label={`Открыть фото на весь экран: ${label}`}
            className="group relative block w-[132px] shrink-0 cursor-zoom-in overflow-hidden rounded-lg bg-smoke focus:outline-none focus-visible:ring-2 focus-visible:ring-pro"
          >
            <img
              key={src}
              src={src}
              alt={`${caption}: ${label} — фото ${safeIndex + 1} из ${total}`}
              loading="lazy"
              className="block aspect-square w-full object-cover animate-scheme-in transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <span className="pointer-events-none absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md bg-white/90 text-graphite/60 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              <Maximize2 size={12} strokeWidth={2.2} />
            </span>
          </button>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-graphite/45">{caption}</div>
              <div className="mt-0.5 truncate text-[12.5px] font-extrabold text-graphite" title={label}>
                {label}
              </div>
            </div>
            {showArrows && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Предыдущее фото"
                  className="grid h-7 w-8 place-items-center rounded-md border border-line text-graphite/70 transition-colors hover:border-graphite/50 hover:bg-smoke"
                >
                  <ChevronLeft size={14} strokeWidth={2.4} />
                </button>
                <span className="text-[11.5px] font-bold tabular-nums text-graphite/55" aria-live="polite">
                  {safeIndex + 1} / {total}
                </span>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Следующее фото"
                  className="grid h-7 w-8 place-items-center rounded-md border border-line text-graphite/70 transition-colors hover:border-graphite/50 hover:bg-smoke"
                >
                  <ChevronRight size={14} strokeWidth={2.4} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-graphite/95 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Фото на весь экран: ${label}`}
          onClick={() => setZoomed(false)}
        >
          <div className="flex items-center justify-between gap-4 text-white">
            <div className="text-[13px] font-bold">
              {label} <span className="text-white/50 tabular-nums">· {safeIndex + 1} / {total}</span>
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
            className="mt-3 flex min-h-0 flex-1 items-center justify-center gap-2 sm:gap-4"
          >
            {showArrows && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Предыдущее фото"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/15 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft size={22} strokeWidth={2.2} />
              </button>
            )}
            <img
              key={src}
              src={src}
              alt={`${caption}: ${label} — фото ${safeIndex + 1} из ${total}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            />
            {showArrows && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Следующее фото"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/15 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronRight size={22} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* БЛОК: Главный компонент потолочного калькулятора (Calculator)
 * ЗА ЧТО ОТВЕЧАЕТ: Связывает левую панель настроек с расчётом calcGrilyato / calcArmstrong, плавной анимацией итоговой суммы, сохранением в память браузера, скачиванием CSV и таблицей спецификации.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Проп mode ("grilyato" | "armstrong"), цены из usePrices(priceSheet), сохранённые настройки из calcStorage.ts и события выбора из карточек ниже по странице.
 * КАК ИЗМЕНИТЬ: Заголовок «Соберите свой потолок», подписи полей и структура карточек меняются в JSX-разметке ниже. */
export default function Calculator({
  showPlan = true,
  showTableTotal = true,
  printHref,
  mode = "grilyato",
  priceSheet,
  background = "smoke",
}: {
  showPlan?: boolean;
  showTableTotal?: boolean;
  printHref?: string;
  mode?: "grilyato" | "armstrong";
  priceSheet?: PriceSheetSource;
  background?: "smoke" | "white";
} = {}) {
  const armstrong = mode === "armstrong";
  const { prices, status, updatedAt, refreshing, refresh, changed, checkedCount } = usePrices(priceSheet);

  /* БЛОК: Настройки калькулятора из админки | ЗА ЧТО ОТВЕЧАЕТ: Стартовые размеры и запас для нового посетителя,
     а также какие варианты ячеек, цветов, плит, профилей, углов и подвесов ему показывать.
     ОТКУДА ДАННЫЕ: «Администрирование» → «Настройка страниц» → нужный калькулятор (settings.calculators). */
  const siteSettings = useSiteSettings();
  const calcSettings = armstrong ? siteSettings.calculators.armstrong : siteSettings.calculators.grilyato;
  const allow = (options: CalcOption[] | undefined, id: string | number) => {
    if (!options?.length) return true;
    const found = options.find((option) => option.id === String(id));
    return found ? found.enabled : true;
  };
  const keepSome = <T,>(all: T[], shown: T[]) => (shown.length ? shown : all);
  /* Порядок кнопок задаётся порядком в настройках админки («Настройка страниц» → калькулятор) */
  const inSettingsOrder = <T,>(items: readonly T[], options: CalcOption[] | undefined, idOf: (item: T) => string): T[] => {
    if (!options?.length) return [...items];
    const rank = new Map(options.map((option, index) => [option.id, index] as const));
    return [...items].sort(
      (a, b) => (rank.get(idOf(a)) ?? Number.MAX_SAFE_INTEGER) - (rank.get(idOf(b)) ?? Number.MAX_SAFE_INTEGER),
    );
  };

  const cellOptions = keepSome(CELL_SIZES, CELL_SIZES.filter((c) => allow(calcSettings.cells, c.mm)));
  const colorOptions = keepSome(COLORS, COLORS.filter((c) => allow(calcSettings.colors, c.id)));
  const hangerOptions = keepSome(
    HANGERS,
    inSettingsOrder(HANGERS.filter((h) => allow(calcSettings.hangers, h.len)), calcSettings.hangers, (h) => String(h.len)),
  );
  const tileOptions = keepSome(
    ARMSTRONG_TILES as unknown as typeof ARMSTRONG_TILES[number][],
    inSettingsOrder(ARMSTRONG_TILES.filter((t) => allow(calcSettings.tiles, t.id)), calcSettings.tiles, (t) => t.id),
  );
  const profileOptions = keepSome(
    ARMSTRONG_PROFILES as unknown as typeof ARMSTRONG_PROFILES[number][],
    inSettingsOrder(ARMSTRONG_PROFILES.filter((t) => allow(calcSettings.profiles, t.id)), calcSettings.profiles, (t) => t.id),
  );
  const angleOptions = keepSome(
    ARMSTRONG_ANGLES as unknown as typeof ARMSTRONG_ANGLES[number][],
    inSettingsOrder(ARMSTRONG_ANGLES.filter((t) => allow(calcSettings.angles, t.id)), calcSettings.angles, (t) => t.id),
  );

  const [input, setInput] = useState<CalcInput>(() =>
    mode === "armstrong" ? loadArmstrongSetup().input : loadCalcInput());
  const [tileId, setTileId] = useState(() =>
    mode === "armstrong" ? loadArmstrongSetup().tileId : DEFAULT_ARMSTRONG_TILE.id);
  const [profileId, setProfileId] = useState(() =>
    mode === "armstrong" ? loadArmstrongSetup().profileId : DEFAULT_ARMSTRONG_PROFILE.id);
  const [angleId, setAngleId] = useState(() =>
    mode === "armstrong" ? loadArmstrongSetup().angleId : DEFAULT_ARMSTRONG_ANGLE.id);
  const selectedTile = getArmstrongTile(tileId);
  const selectedProfile = getArmstrongProfile(profileId);
  const selectedAngle = getArmstrongAngle(angleId);
  const res = useMemo(
    () => (armstrong
      ? calcArmstrong(input, prices, tileId, profileId, angleId)
      : calcGrilyato(input, prices)),
    [armstrong, input, prices, tileId, profileId, angleId],
  );
  const missingCount = res.rows.filter((r) => r.missing).length;
  const decimal = (v: number) => String(v).replace(".", ",");

  const spring = useSpring(res.total, { stiffness: 90, damping: 20, mass: 0.6 });
  const [totalShown, setTotalShown] = useState(res.total);
  useEffect(() => { spring.set(res.total); }, [res.total, spring]);
  useMotionValueEvent(spring, "change", (v) => setTotalShown(Math.round(v)));

  const set = <K extends keyof CalcInput>(k: K, v: CalcInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  /* Новому посетителю показываем стартовые размеры и запас, заданные в админке */
  const storageKey = armstrong ? "armstrong:last-setup" : "grilyato:last-input";
  useEffect(() => {
    let saved = false;
    try {
      saved = Boolean(localStorage.getItem(storageKey));
    } catch {}
    if (saved) return;
    setInput((p) => ({
      ...p,
      length: calcSettings.length,
      width: calcSettings.width,
      sparePct: calcSettings.sparePct,
    }));
  }, [storageKey, calcSettings.length, calcSettings.width, calcSettings.sparePct]);

  /* Если администратор скрыл выбранный вариант, переключаемся на первый доступный */
  useEffect(() => {
    if (!cellOptions.some((c) => c.mm === input.cellMm)) set("cellMm", cellOptions[0].mm);
    if (!colorOptions.some((c) => c.id === input.colorId)) set("colorId", colorOptions[0].id);
    if (!hangerOptions.some((h) => h.len === input.hangerLen)) set("hangerLen", hangerOptions[0].len);
    if (armstrong) {
      if (!tileOptions.some((t) => t.id === tileId)) setTileId(tileOptions[0].id);
      if (!profileOptions.some((t) => t.id === profileId)) setProfileId(profileOptions[0].id);
      if (!angleOptions.some((t) => t.id === angleId)) setAngleId(angleOptions[0].id);
    }
  });

  useEffect(() => {
    if (armstrong) saveArmstrongSetup({ input, tileId, profileId, angleId });
    else saveCalcInput(input);
  }, [input, armstrong, tileId, profileId, angleId]);

  const persistSetup = () => {
    if (armstrong) saveArmstrongSetup({ input, tileId, profileId, angleId });
    else saveCalcInput(input);
  };

  useEffect(() => {
    const onSelect = (e: Event) => {
      const mm = (e as CustomEvent<number>).detail;
      if (CELL_SIZES.some((c) => c.mm === mm)) setInput((p) => ({ ...p, cellMm: mm }));
    };
    window.addEventListener("grilyato:select-cell", onSelect);
    return () => window.removeEventListener("grilyato:select-cell", onSelect);
  }, []);

  useEffect(() => {
    const onSelectTile = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (ARMSTRONG_TILES.some((tile) => tile.id === id)) setTileId(id);
    };
    window.addEventListener("armstrong:select-tile", onSelectTile);
    return () => window.removeEventListener("armstrong:select-tile", onSelectTile);
  }, []);

  useEffect(() => {
    const onSelectProfile = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (ARMSTRONG_PROFILES.some((profile) => profile.id === id)) setProfileId(id);
    };
    const onSelectAngle = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (ARMSTRONG_ANGLES.some((angle) => angle.id === id)) setAngleId(id);
    };

    window.addEventListener("armstrong:select-profile", onSelectProfile);
    window.addEventListener("armstrong:select-angle", onSelectAngle);
    return () => {
      window.removeEventListener("armstrong:select-profile", onSelectProfile);
      window.removeEventListener("armstrong:select-angle", onSelectAngle);
    };
  }, []);

  const csvText = useMemo(() => {
    const head = [
      armstrong ? "Спецификация материалов Армстронг" : `Лемана Про Челябинск — Смета на потолок Грильято`,
      `Помещение;${fmt1(input.length)} x ${fmt1(input.width)} м;S = ${fmt1(res.area)} м2;P = ${fmt1(res.perimeter)} м`,
      armstrong
        ? `Плита;${selectedTile.label};Профиль;${selectedProfile.label};Угол;${selectedAngle.label};Подвес;${res.hanger.name};Запас;${input.sparePct}%`
        : `Ячейка;${res.cell.key} мм;Цвет;${res.color.name};Подвес;${res.hanger.name};Запас;${input.sparePct}%`,
      ``,
      `Артикул;Наименование;Кол-во;Ед.;Цена;Сумма`,
      ...res.rows.map((r) => `${r.art};${r.name};${r.qty};${r.unit};${armstrong && r.missing ? "нет цены;нет цены" : `${decimal(r.price)};${decimal(r.sum)}`}`),
      `;;;;ИТОГО;${decimal(res.total)}`,
    ];
    return "\uFEFF" + head.join("\r\n");
  }, [res, input, armstrong, selectedTile]);

  const downloadCsv = () => {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = armstrong
      ? `smeta-armstrong-${fmt1(input.length)}x${fmt1(input.width)}m.csv`
      : `smeta-grilyato-${fmt1(input.length)}x${fmt1(input.width)}m-${input.cellMm}mm.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* Печать: тот же лист «Спецификация материалов», что и на отдельной странице сметы (см. SpecSheet.tsx) */
  const specParams = armstrong
    ? armstrongSpecParams(input, res, tileId, profileId, angleId)
    : grilyatoSpecParams(input, res);

  const handlePrint = () => {
    persistSetup();
    printSpecificationOverlay();
  };

  return (
    <section
      id="calc"
      className={cn(
        "relative py-14 lg:py-20 scroll-mt-[130px]",
        background === "white" ? "bg-white" : "bg-smoke",
      )}
    >
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
        {/* БЛОК: Заголовок секции калькулятора | ЗА ЧТО ОТВЕЧАЕТ: Выводит надзаголовок системы и заголовок «Соберите свой потолок» | ОТКУДА ДАННЫЕ: Флаг armstrong | КАК ИЗМЕНИТЬ: Поменяйте текст внутри <h2> или правую подсказку */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-end justify-between gap-4 mb-8"
        >
          <div>
            <div className="text-[12.5px] font-extrabold tracking-[0.18em] uppercase text-graphite/45 mb-2">
              {armstrong ? "Калькулятор · Армстронг" : "Калькулятор · Grigliato"}
            </div>
            <h2 className="text-[32px] lg:text-[46px] font-black leading-[1.02] tracking-[-0.01em]">
              Соберите свой потолок
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-graphite/55">
            <Info size={15} strokeWidth={2.3} className="text-graphite/40" />
            Пересчёт мгновенный — меняйте параметры
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] gap-5 items-start">
          {/* БЛОК: Левая панель параметров помещения и выбора материалов | ЗА ЧТО ОТВЕЧАЕТ: Ввод длины/ширины, карточки площади/периметра, переключатели комплектующих, подвеса и ползунок запаса | ОТКУДА ДАННЫЕ: Справочники src/data/grilyato.ts и src/data/armstrong.ts | КАК ИЗМЕНИТЬ: Состав вариантов меняется в файлах src/data/, подписи полей — здесь */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl bg-white border border-line p-5 lg:p-6 shadow-[0_2px_20px_rgba(20,25,27,0.05)] space-y-7"
          >
            <div className="space-y-5">
              <DimensionField label="Длина помещения" unit="м"
                value={input.length} onChange={(v) => set("length", v)} />
              <DimensionField label="Ширина помещения" unit="м"
                value={input.width} onChange={(v) => set("width", v)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-smoke px-3.5 py-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-graphite/45">Площадь</div>
                  <div className="text-[19px] font-black tabular">{fmt1(res.area)} м²</div>
                </div>
                <div className="rounded-xl bg-smoke px-3.5 py-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-graphite/45">Периметр</div>
                  <div className="text-[19px] font-black tabular">{fmt1(res.perimeter)} м</div>
                </div>
              </div>
            </div>

            {armstrong ? (
              <div className="space-y-5">
                {/* БЛОК: Выбор потолочной плиты Армстронг | ЗА ЧТО ОТВЕЧАЕТ: Кнопки 8 видов плит и миниатюра фото | ОТКУДА ДАННЫЕ: ARMSTRONG_TILES из src/data/armstrong.ts | КАК ИЗМЕНИТЬ: Добавляйте или правьте плиты в src/data/armstrong.ts */}
                <div>
                  <div className="text-[12.5px] font-bold text-graphite/60 mb-2 flex items-center gap-1.5">
                    <LayoutGrid size={14} strokeWidth={2.2} className="text-graphite/40" aria-hidden="true" />
                    Плита
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {tileOptions.map((tile) => (
                      <button
                        key={tile.id}
                        type="button"
                        onClick={() => setTileId(tile.id)}
                        title={tile.label}
                        aria-pressed={tileId === tile.id}
                        className={cn(
                          "group rounded-xl border px-1.5 py-2 text-center text-[12px] font-extrabold tabular transition-all",
                          tileId === tile.id
                            ? "border-graphite bg-graphite text-white shadow-[0_4px_14px_rgba(20,25,27,0.25)]"
                            : "border-line bg-white hover:border-graphite/40"
                        )}
                      >
                        {tile.label}
                      </button>
                    ))}
                  </div>
                  <PartImage
                    images={selectedTile.gallery ?? [selectedTile.image]}
                    caption="Плита"
                    label={selectedTile.label}
                  />
                  {!selectedTile.art && (
                    <p className="mt-2 text-[12px] text-graphite/60" role="status">
                      Для выбранной плиты ещё не указан артикул. Её стоимость не включена в итог.
                    </p>
                  )}
                </div>

                {/* БЛОК: Выбор Т-профиля Армстронг («Премиум» / «Эконом») | ЗА ЧТО ОТВЕЧАЕТ: Переключатель серии направляющих и фото | ОТКУДА ДАННЫЕ: ARMSTRONG_PROFILES из src/data/armstrong.ts | КАК ИЗМЕНИТЬ: В src/data/armstrong.ts */}
                <div>
                  <div className="text-[12.5px] font-bold text-graphite/60 mb-2 flex items-center gap-1.5">
                    <Ruler size={14} strokeWidth={2.2} className="text-graphite/40" aria-hidden="true" />
                    Профиль
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {profileOptions.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => setProfileId(profile.id)}
                        aria-pressed={profileId === profile.id}
                        className={cn(
                          "rounded-xl border px-1.5 py-2 text-center text-[12px] font-extrabold transition-all",
                          profileId === profile.id
                            ? "border-graphite bg-graphite text-white shadow-[0_4px_14px_rgba(20,25,27,0.25)]"
                            : "border-line bg-white hover:border-graphite/40"
                        )}
                      >
                        {profile.label}
                      </button>
                    ))}
                  </div>
                  <PartImage images={[selectedProfile.image]} caption="Профиль" label={selectedProfile.label} />
                  {!selectedProfile.arts.main37 && (
                    <p className="mt-2 text-[12px] text-graphite/60" role="status">
                      Для профиля «{selectedProfile.label}» нет артикулов в таблице — его позиции не включены в итог.
                    </p>
                  )}
                </div>

                {/* БЛОК: Выбор пристенного угла Армстронг («Сталь» / «Алюминий») | ЗА ЧТО ОТВЕЧАЕТ: Переключатель периметрального уголка и фото | ОТКУДА ДАННЫЕ: ARMSTRONG_ANGLES из src/data/armstrong.ts | КАК ИЗМЕНИТЬ: В src/data/armstrong.ts */}
                <div>
                  <div className="text-[12.5px] font-bold text-graphite/60 mb-2 flex items-center gap-1.5">
                    <CornerDownRight size={14} strokeWidth={2.2} className="text-graphite/40" aria-hidden="true" />
                    Угол
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {angleOptions.map((angle) => (
                      <button
                        key={angle.id}
                        type="button"
                        onClick={() => setAngleId(angle.id)}
                        aria-pressed={angleId === angle.id}
                        className={cn(
                          "rounded-xl border px-1.5 py-2 text-center text-[12px] font-extrabold transition-all",
                          angleId === angle.id
                            ? "border-graphite bg-graphite text-white shadow-[0_4px_14px_rgba(20,25,27,0.25)]"
                            : "border-line bg-white hover:border-graphite/40"
                        )}
                      >
                        {angle.label}
                      </button>
                    ))}
                  </div>
                  <PartImage images={[selectedAngle.image]} caption="Угол" label={selectedAngle.label} />
                  {!selectedAngle.art && (
                    <p className="mt-2 text-[12px] text-graphite/60" role="status">
                      Для угла «{selectedAngle.label}» нет артикула в таблице — позиция не включена в итог.
                    </p>
                  )}
                </div>

                <div className="text-[12px] text-graphite/50 font-medium">
                  Расчёт по формулам таблицы «Армстронг». Плита 600×600, шаг профилей 600 мм.
                </div>
              </div>
            ) : (
            <>
            {/* БЛОК: Выбор размера ячейки Грильято и превью чертежа | ЗА ЧТО ОТВЕЧАЕТ: Кнопки 50×50, 75×75, 100×100 и кликабельная схема кассеты | ОТКУДА ДАННЫЕ: CELL_SIZES из src/data/grilyato.ts и CellSchemePreview.tsx | КАК ИЗМЕНИТЬ: В src/data/grilyato.ts и src/components/CellScheme.tsx */}
            <div>
              <div className="text-[13px] font-bold text-graphite/70 mb-2.5 flex items-center gap-1.5">
                <SquarePen size={14} strokeWidth={2.4} className="text-graphite/40" />
                Размер ячейки, мм
              </div>
              <div className="grid grid-cols-3 gap-2">
                {cellOptions.map((c) => {
                  const active = input.cellMm === c.mm;
                  return (
                    <button
                      key={c.mm}
                      onClick={() => set("cellMm", c.mm)}
                      title={c.note}
                      className={cn(
                        "group rounded-xl border px-1.5 py-2 text-center transition-all",
                        active
                          ? "border-graphite bg-graphite text-white shadow-[0_4px_14px_rgba(20,25,27,0.25)]"
                          : "border-line bg-white hover:border-graphite/40"
                      )}
                    >
                      <svg viewBox="0 0 36 20" className="w-full h-5 mb-1" aria-hidden>
                        <defs>
                          <pattern id={`cp-${c.mm}`} width={c.mm / 8 + 3} height="20" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="20"
                              stroke={active ? "#FFCB05" : "#a9aca7"} strokeWidth="1.4" />
                          </pattern>
                        </defs>
                        <rect width="36" height="20" fill={`url(#cp-${c.mm})`} />
                      </svg>
                      <span className="block text-[12px] font-extrabold tabular leading-none">{c.mm}×{c.mm}</span>
                    </button>
                  );
                })}
              </div>

              <CellSchemePreview
                mm={input.cellMm}
                colorId={input.colorId}
                label={`${res.cell.label} мм`}
              />

              <div className="mt-2 text-[12px] text-graphite/50 font-medium">
                {res.cell.note}
              </div>
            </div>

            {/* БЛОК: Выбор цвета профилей Грильято | ЗА ЧТО ОТВЕЧАЕТ: Кнопки «Черный», «Белый», «Металлик» с кодами RAL | ОТКУДА ДАННЫЕ: COLORS из src/data/grilyato.ts | КАК ИЗМЕНИТЬ: В массиве COLORS в src/data/grilyato.ts */}
            <div>
              <div className="text-[13px] font-bold text-graphite/70 mb-2.5 flex items-center gap-1.5">
                <Palette size={14} strokeWidth={2.4} className="text-graphite/40" />
                Цвет профилей
              </div>
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map((c) => {
                  const active = input.colorId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => set("colorId", c.id)}
                      className={cn(
                        "rounded-xl border py-2.5 flex flex-col items-center gap-1.5 transition-all",
                        active ? "border-graphite bg-smoke" : "border-line hover:border-graphite/40"
                      )}
                    >
                      <span
                        className={cn(
                          "w-7 h-7 rounded-full border border-graphite/15 transition-transform",
                          active && "scale-110 ring-[3px] ring-pro"
                        )}
                        style={{ background: c.hex }}
                      />
                      <span className="text-[11px] font-bold leading-none">{c.name}</span>
                      <span className="text-[9.5px] text-graphite/45 leading-none">{c.ral}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            </>
            )}

            {/* БЛОК: Выбор длины подвеса | ЗА ЧТО ОТВЕЧАЕТ: 4 кнопки длины подвеса (275, 500, 1000, 1500 мм) | ОТКУДА ДАННЫЕ: HANGERS из src/data/grilyato.ts | КАК ИЗМЕНИТЬ: Отредактируйте массив HANGERS в src/data/grilyato.ts */}
            <div>
              <div className="text-[13px] font-bold text-graphite/70 mb-2.5 flex items-center gap-1.5">
                <MoveVertical size={14} strokeWidth={2.4} className="text-graphite/40" />
                Длина подвеса (запотолочное пространство)
              </div>
              <div className="grid grid-cols-4 gap-2">
                {hangerOptions.map((h) => {
                  const active = input.hangerLen === h.len;
                  return (
                    <button
                      key={h.len}
                      onClick={() => set("hangerLen", h.len)}
                      className={cn(
                        "rounded-xl border py-2 text-center transition-all",
                        active
                          ? "border-graphite bg-graphite text-white"
                          : "border-line bg-white hover:border-graphite/40"
                      )}
                    >
                      <span className="block text-[13px] font-extrabold tabular">{h.len}</span>
                      <span className={cn("block text-[10px] font-semibold", active ? "text-white/60" : "text-graphite/45")}>мм</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* БЛОК: Ползунок и поле ввода запаса (%) | ЗА ЧТО ОТВЕЧАЕТ: Добавляет процент запаса ко всем позициям расчёта (ползунок 0–20%, ручной ввод до 50%) | ОТКУДА ДАННЫЕ: Поле input.sparePct | КАК ИЗМЕНИТЬ: Диапазон ползунка меняется в max={20} и формуле (input.sparePct / 20) * 100 */}
            <div>
              <div className="text-[13px] font-bold text-graphite/70 mb-2 flex items-center gap-1.5">
                <PackagePlus size={14} strokeWidth={2.4} className="text-graphite/40" />
                Запас
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={0} max={20} step={1} value={input.sparePct}
                  onChange={(e) => set("sparePct", parseInt(e.target.value, 10))}
                  className="pro-range flex-1"
                  style={{ "--fill": `${(input.sparePct / 20) * 100}%` } as React.CSSProperties}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    value={String(input.sparePct)}
                    onChange={(e) => {
                      const v = parseInt(e.target.value.replace(/\D/g, ""), 10);
                      if (!Number.isNaN(v)) set("sparePct", Math.min(50, Math.max(0, v)));
                    }}
                    inputMode="numeric"
                    className="no-spin w-[64px] text-center text-[15px] font-extrabold bg-smoke rounded-lg px-2 py-1.5 outline-none border border-transparent focus:border-pro transition-colors tabular"
                  />
                  <span className="text-[13px] font-bold text-graphite/50">%</span>
                </div>
              </div>
              <div className="mt-2 text-[12px] text-graphite/50 font-medium">
                Добавляется к количеству всего рассчитываемого товара
              </div>
            </div>
          </motion.div>

          {/* БЛОК: Правая колонка с итоговой карточкой и таблицей спецификации | ЗА ЧТО ОТВЕЧАЕТ: Показывает общую сумму сметы, цену за 1 м² и полный перечень товаров с артикулами и ценами | ОТКУДА ДАННЫЕ: Результат res из calcGrilyato / calcArmstrong | КАК ИЗМЕНИТЬ: Подписи показателей меняются внутри соответствующих карточек ниже */}
          <div className="space-y-5 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={cn("grid gap-5 items-stretch", showPlan && "xl:grid-cols-[minmax(0,1fr)_320px]")}
            >
              {showPlan && (
                <PlanPreview
                  input={input}
                  blocks={res.reshetka}
                  railStep={res.rows.some((r) => r.key === "g12") ? 1.2 : 0.6}
                />
              )}

              {/* БЛОК: Тёмная карточка «Итого материалы» | ЗА ЧТО ОТВЕЧАЕТ: Крупная анимированная сумма в рублях, цена за м², число позиций и выбранная конфигурация | ОТКУДА ДАННЫЕ: totalShown и поля объекта res | КАК ИЗМЕНИТЬ: Поменяйте подписи строк внутри блока */}
              <div className="rounded-2xl bg-graphite text-white p-5 flex flex-col justify-between shadow-[0_16px_40px_rgba(20,25,27,0.35)] relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-pro/15 blur-2xl" />
                <div className={cn("relative", !showPlan && "md:flex md:items-center md:justify-between md:gap-10")}>
                  <div className="shrink-0">
                    <div className="text-[11.5px] font-extrabold tracking-[0.16em] uppercase text-white/50">
                      Итого материалы
                    </div>
                    <div className="mt-1.5 text-[40px] leading-none font-black text-pro tabular">
                      {fmt.format(totalShown)} <span className="text-[24px]">₽</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "mt-3 space-y-1.5 text-[13px] font-semibold text-white/65",
                      !showPlan && "md:mt-0 md:grid md:flex-1 md:max-w-[460px] md:grid-cols-2 md:gap-x-10 md:gap-y-1.5 md:space-y-0"
                    )}
                  >
                    <div className="flex justify-between gap-3">
                      <span>Цена за м²</span>
                      <span className="text-white tabular">{fmtMoney(res.perM2)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Позиций в смете</span>
                      <span className="text-white tabular">{res.positions}</span>
                    </div>
                    {armstrong ? (
                      <div className="flex justify-between gap-3">
                        <span>{selectedTile.packQty ? "Комплектов" : "Плит 600×600"}</span>
                        <span className="text-white tabular">{fmt1(res.reshetka)} шт</span>
                      </div>
                    ) : (
                      <div className="flex justify-between gap-3">
                        <span>Решётка 600×600</span>
                        <span className="text-white tabular">{fmt1(res.reshetka)} шт</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      {armstrong ? (
                        <>
                          <span>Плита</span>
                          <span className="min-w-0 text-right text-white">{selectedTile.label}</span>
                        </>
                      ) : (
                        <>
                          <span>Ячейка / цвет</span>
                          <span className="text-white">{res.cell.label} · {res.color.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* БЛОК: Карточка «Спецификация материалов» с кнопкой «Печать», статусом цен и таблицей | ЗА ЧТО ОТВЕЧАЕТ: Выводит статус проверки Google-таблицы цен и все строки комплектующих с копированием артикулов | ОТКУДА ДАННЫЕ: res.rows, PriceStatusBar и компонент ArticleCell | КАК ИЗМЕНИТЬ: Цены меняются в Google-таблице, артикулы — в src/data/grilyato.ts и src/data/armstrong.ts */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-line bg-white overflow-hidden shadow-[0_2px_20px_rgba(20,25,27,0.04)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-5 py-3.5 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet size={18} strokeWidth={2.3} className="text-graphite/50" />
                  <span className="text-[15px] font-extrabold">Спецификация материалов</span>
                    {false && null}
                </div>
                <div className="flex items-center gap-2">
                  {printHref ? (
                    <a
                      href={printHref}
                      onClick={persistSetup}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line text-[12.5px] font-bold text-graphite/75 hover:border-graphite/50 transition-colors"
                    >
                      <Printer size={14} strokeWidth={2.4} />
                      Печать
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line text-[12.5px] font-bold text-graphite/75 hover:border-graphite/50 transition-colors"
                    >
                      <Printer size={14} strokeWidth={2.4} />
                      Печать
                    </button>
                  )}
                </div>
              </div>

              <PriceStatusBar
                status={status} updatedAt={updatedAt} refreshing={refreshing}
                changed={changed} onRefresh={refresh}
                autoCheck={Boolean(priceSheet)} checkedCount={checkedCount}
              />
              {missingCount > 0 && (
                <div className="flex items-center gap-2 px-4 lg:px-5 py-2 bg-red-50 border-b border-red-100 text-[12.5px] font-semibold text-red-800">
                  <TriangleAlert size={14} strokeWidth={2.5} />
                  {armstrong
                    ? `Для ${missingCount} поз. нет цены. Их стоимость не включена в итог.`
                    : `Для ${missingCount} поз. нет цены в таблице — добавьте артикул в столбец A листа цен.`}
                </div>
              )}

              <div className="overflow-x-auto thin-scroll">
                <table className="w-full min-w-[720px] text-[13.5px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-graphite/45 border-b border-line">
                      <th className="font-bold px-4 lg:px-5 py-2.5">Артикул</th>
                      <th className="font-bold px-3 py-2.5">Наименование</th>
                      <th className="font-bold px-3 py-2.5 text-right">Кол-во</th>
                      <th className="font-bold px-3 py-2.5 text-right">Цена, ₽</th>
                      <th className="font-bold px-4 lg:px-5 py-2.5 text-right">Сумма, ₽</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.rows.map((r, i) => (
                      <tr
                        key={r.key}
                        className={cn(
                          "border-b border-line/70 transition-colors hover:bg-pro/10",
                          i % 2 === 1 && "bg-smoke/60"
                        )}
                      >
                        <td className="px-4 lg:px-5 py-3 font-bold tabular whitespace-nowrap">
                          <ArticleCell art={r.art} url={r.url} />
                        </td>
                        <td className="px-3 py-3 font-semibold text-graphite/90">{r.name}</td>
                        <td className="px-3 py-3 text-right tabular font-bold">
                          {fmt.format(r.qty)} <span className="text-graphite/40 font-semibold">{r.unit}</span>
                        </td>
                        <td className="px-3 py-3 text-right tabular text-graphite/70">
                          {r.missing ? <span className="text-red-600 font-bold">нет цены</span> : fmtPrice(r.price)}
                        </td>
                        <td className="px-4 lg:px-5 py-3 text-right tabular font-extrabold">
                          {armstrong && r.missing ? <span className="text-red-600">нет цены</span> : fmtPrice(r.sum)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {showTableTotal && (
                    <tfoot>
                      <tr className="bg-graphite text-white">
                        <td className="px-4 lg:px-5 py-3.5" colSpan={3}>
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-extrabold text-[12px] uppercase tracking-widest">
                              Итого по смете
                            </span>
                            {res.area > 0 && (
                              <span className="mr-5 whitespace-nowrap tabular text-white/60 text-[12.5px] font-bold">
                                {`${fmt.format(Math.round(res.perM2))}\u00A0₽/м²`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td colSpan={2} className="px-4 lg:px-5 py-3.5 text-right text-[40px] leading-none font-black text-pro tabular whitespace-nowrap">
                          {fmt.format(totalShown)} <span className="text-[24px]">₽</span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* БЛОК: Нижняя закреплённая панель итогов для мобильных телефонов | ЗА ЧТО ОТВЕЧАЕТ: Держит на виду итоговую сумму и кнопку скачивания CSV на узких экранах (скрыта на ПК классом lg:hidden) | ОТКУДА ДАННЫЕ: totalShown и функция downloadCsv | КАК ИЗМЕНИТЬ: Поменяйте текст «Итого» или уберите кнопку CSV при необходимости */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-graphite text-white border-t border-white/10 shadow-[0_-8px_30px_rgba(20,25,27,0.35)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/45 leading-none">Итого</div>
            <div className="text-[20px] font-black text-pro tabular leading-tight">{fmt.format(totalShown)} ₽</div>
          </div>
          <button
            onClick={downloadCsv}
            className="ml-auto h-10 px-3.5 rounded-xl border border-white/20 text-[12.5px] font-bold flex items-center gap-1.5"
          >
            <Download size={15} strokeWidth={2.5} /> CSV
          </button>
        </div>
      </div>

      {/* БЛОК: Скрытый печатный лист «Спецификация материалов» | ЗА ЧТО ОТВЕЧАЕТ: Не виден на экране; при нажатии «Печать» выводится на лист A4 в том же формате, что и на странице спецификации | ОТКУДА ДАННЫЕ: Текущий расчёт res и массив specParams | КАК ИЗМЕНИТЬ: Формат листа — в src/components/SpecSheet.tsx и src/index.css */}
      <SpecPrintPortal
        title={armstrong ? ARMSTRONG_SPEC_TITLE : GRILYATO_SPEC_TITLE}
        params={specParams}
        res={res}
        armstrong={armstrong}
      />
    </section>
  );
}
