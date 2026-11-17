/* ============================================================================
 * ФАЙЛ: src/components/Header.tsx — Общая шапка сайта и векторный логотип
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит закреплённую вверху экрана двухслойную шапку: 1) основную полосу с логотипом «Челябинск СТРОЙКА», кнопкой раскрывающегося списка разделов и адресом магазина; 2) жёлтую зацикленную бегущую строку.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Пункты меню «Калькуляторы», скорость и тексты бегущей строки читаются из useSiteSettings() (управляются на странице «Администрирование» /admin), а адрес и город магазина — из объекта STORE в src/data/grilyato.ts.
 * КАК ИЗМЕНИТЬ:
 *   — Бегущую строку и порядок/видимость кнопок в меню «Калькуляторы» меняйте прямо на странице /admin без правки кода.
 *   — Чтобы изменить сам логотип или надписи «Челябинск» / «СТРОЙКА», отредактируйте компонент LogoMark ниже.
 *   — Чтобы изменить адрес магазина в правой части верхней полосы, отредактируйте STORE в src/data/grilyato.ts.
 * ========================================================================= */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  MapPin,
  Calculator,
  SlidersHorizontal,
  Grid3X3,
  Layers3,
  House,
  Rows3,
  SearchX,
} from "lucide-react";
import { STORE } from "../data/grilyato";
import { useSiteSettings, type MenuItem } from "../data/siteSettings";
import { isAdminUnlocked, subscribeAdminSession } from "../utils/adminSession";
import { extractRoutePath, toHref } from "../utils/router";
import { cn } from "../utils/cn";

/* БЛОК: Векторные логотипы сайта «Челябинск СТРОЙКА» (LogoMark — верхний, FooterLogoMark — нижний)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует горизонтальный логотип с домиком-калькулятором в шапке (LogoMark)
 *   и вертикальный логотип в подвале (FooterLogoMark) без внешних файлов картинок.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Высота значка height и цвет надписи «Челябинск» cityColor передаются из Header.tsx и SiteFooter.tsx.
 * КАК ИЗМЕНИТЬ: Замените SVG-разметку внутри LogoMark (шапка) или FooterLogoMark (подвал), либо поменяйте размер и цвет в админке. */
function LogoIconPaths() {
  return (
    <>
      <path
        d="M243.1 54.9A20 20 0 0 1 268.9 54.9L426.07 187.61A28 28 0 0 1 436 209L436 440A28 28 0 0 1 408 468L104 468A28 28 0 0 1 76 440L76 209A28 28 0 0 1 85.93 187.61ZM116 172V100A8 8 0 0 1 124 92H152A8 8 0 0 1 160 100V172Z"
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
      <rect x="360" y="353" width="26" height="8" rx="4" fill="#2b2b2b" />
      <rect x="360" y="371" width="26" height="8" rx="4" fill="#2b2b2b" />
    </>
  );
}

function LogoWordmarkPaths() {
  return (
    <>
      <path fill="#ffffff" d="M0 0H235V197C235 265 267 289 330 289C375 289 420 276 465 250V0H700V700H465V470C411 492 347 507 281 507C99 507 0 406 0 214Z" transform="translate(0.649 0.000) scale(0.04)" />
      <path fill="#ffffff" d="M621.18 510.44L621.18 699.62L0 699.62L0 0L608.47 0L608.47 189.18L241.84 189.18L241.84 259.41L568.41 259.41L568.41 430.44L241.84 430.44L241.84 510.44Z" transform="translate(32.949 0.000) scale(0.04)" />
      <path fill="#ffffff" d="M733.97 0L733.97 699.73L490.77 699.73L490.77 195.29L348.88 195.29L346.77 267.58C344.79 333.66 340.28 394.67 333.38 448.78C326.48 503.31 314.64 550.94 298.01 590.39C281.11 630.55 257.01 658.03 226.15 679.73C195.15 701.43 154.71 712.56 106.24 712.56C91.59 712.56 75.67 711.57 59.18 709.6C42.55 707.48 24.66 704.24 6.06 699.59L0 698.04L0 498.24L21.28 502.75C56.78 510.36 81.16 502.47 95.82 477.81C107.65 457.8 115.82 430.18 120.33 395.66C124.84 360.3 127.8 320 129.07 275.89L138.23 0Z" transform="translate(62.089 0.000) scale(0.04)" />
      <path fill="#ffffff" d="M378.7 0L735 0L498.46 233.09L378.7 233.09C344.96 233.09 317.53 260.53 317.53 294.26C317.53 327.99 344.97 355.39 378.7 355.39L498.46 355.39L498.46 233.09L731.09 233.09L731.09 699.82L498.46 699.82L498.46 588.03L378.7 588.03C216.66 588.03 84.87 456.25 84.87 294.26C84.87 132.28 216.66 0 378.7 0ZM286 700L0 700L210 394L440 406Z" transform="translate(95.749 0.000) scale(0.04)" />
      <path fill="#ffffff" d="M0 0H230V280H395C596 280 700 351 700 489C700 627 596 700 395 700H0ZM230 455V525H375C425 525 455 516 455 490C455 464 425 455 375 455ZM0 0h645v205h-645Z" transform="translate(129.449 0.000) scale(0.04)" />
      <path fill="#ffffff" d="M0 0L230 0 230 350 470 0 700 0 700 700 470 700 470 350 230 700 0 700Z" transform="translate(161.749 0.000) scale(0.04)" />
      <path fill="#ffffff" d="M714.41 0V699.85H473.06V438.84H241.49V699.85H0V0H241.49V241.2H473.06V0Z" transform="translate(194.049 0.000) scale(0.04)" />
      <path fill="#ffffff" d="M628 89L464 253C438 227 405 214 365 214C283 214 218 275 218 350C218 425 283 486 365 486C405 486 438 473 464 447L628 611C560 680 468 720 365 720C159 720 -10 554 -10 350C-10 146 159 -20 365 -20C468 -20 560 20 628 89Z" transform="translate(226.909 0.000) scale(0.04)" />
      <path fill="#ffffff" d="M0 0L230 0 230 272 430 0 715 0 441 334 744 700 440 700 230 424 230 700 0 700Z" transform="translate(256.809 0.000) scale(0.04)" />
      <path fill="#e0a800" d="M628 89L464 253C438 227 405 214 365 214C283 214 218 275 218 350C218 425 283 486 365 486C405 486 438 473 464 447L628 611C560 680 468 720 365 720C159 720 -10 554 -10 350C-10 146 159 -20 365 -20C468 -20 560 20 628 89Z" transform="translate(0.000 44.000) scale(0.053)" />
      <path fill="#e0a800" d="M0 0L700 0 700 224 468 224 468 700 232 700 232 224 0 224Z" transform="translate(38.630 44.000) scale(0.053)" />
      <path fill="#e0a800" d="M356.3 0C518.34 0 650.13 132.28 650.13 294.26C650.13 456.25 518.34 588.03 356.3 588.03L236.54 588.03L236.54 699.82L3.91 699.82L3.91 233.09L236.54 233.09L236.54 355.39L356.3 355.39C390.03 355.39 417.47 327.99 417.47 294.26C417.47 260.53 390.04 233.09 356.3 233.09L236.54 233.09L0 0L356.3 0Z" transform="translate(80.440 44.000) scale(0.053)" />
      <path fill="#e0a800" d="M376.25 -26.25C583.68 -26.25 752.5 142.56 752.5 350C752.5 557.44 583.68 726.25 376.25 726.25C168.81 726.25 0 557.44 0 350C0 142.56 168.81 -26.25 376.25 -26.25ZM376.25 493.59C455.54 493.59 519.84 429.07 519.84 350C519.84 270.93 455.54 206.41 376.25 206.41C296.95 206.41 232.65 270.93 232.65 350C232.65 429.07 296.95 493.59 376.25 493.59Z" transform="translate(119.600 44.000) scale(0.053)" />
      <path fill="#e0a800" d="M0 0L230 0 230 350 470 0 700 0 700 700 470 700 470 350 230 700 0 700ZM140 -215H300C300 -160 400 -160 400 -215H560C560 -84 476 -35 350 -35C224 -35 140 -84 140 -215Z" transform="translate(164.219 44.000) scale(0.053)" />
      <path fill="#e0a800" d="M0 0L230 0 230 272 430 0 715 0 441 334 744 700 440 700 230 424 230 700 0 700Z" transform="translate(206.029 44.000) scale(0.053)" />
      <path fill="#e0a800" d="M349.89 -18.71C542.43 -18.71 698.66 137.98 698.66 330.74L698.66 699.71L468.48 699.71L468.48 330.74C468.48 266.03 414.83 213.28 349.89 213.28C284.97 213.28 232.21 266.03 232.21 330.74L232.21 467.8L465.78 467.8L237.17 699.71L0 699.71L0 330.74C0 137.98 157.14 -18.71 349.89 -18.71Z" transform="translate(250.171 44.000) scale(0.053)" />
    </>
  );
}

/* БЛОК: Расстояние от логотипа до значка раскрывающегося списка (LOGO_CHEVRON_GAP)
 * ЗА ЧТО ОТВЕЧАЕТ: Держит значок списка на том же видимом расстоянии от букв логотипа, что и на сайте
 *   tehfishka (там измерено 16,3 px), при любой высоте логотипа из админки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: У картинки логотипа справа есть пустое поле — 32,8 из 174 единиц её высоты.
 *   Оно растёт вместе с логотипом, поэтому вычитается из нужного расстояния.
 * КАК ИЗМЕНИТЬ: Чтобы придвинуть или отодвинуть значок, поменяйте число LOGO_CHEVRON_GAP (в пикселях). */
const LOGO_CHEVRON_GAP = 16.3;
const LOGO_VIEW_HEIGHT = 174;
const LOGO_RIGHT_PADDING = 32.8;

export function LogoMark({
  height = 60,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={height}
      width={(height * 468) / 174}
      viewBox="0 0 468 174"
      className={className}
      role="img"
      aria-label="Челябинск Стройка"
    >
      <g transform="translate(32 32)">
        <g transform="translate(-19.76 -13.0) scale(0.26)">
          <LogoIconPaths />
        </g>
        <g transform="translate(116 26) scale(1)">
          <LogoWordmarkPaths />
        </g>
      </g>
    </svg>
  );
}

export function FooterLogoMark({
  height = 100,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={height}
      width={(height * 352) / 330}
      viewBox="0 0 352 330"
      className={className}
      role="img"
      aria-label="Челябинск Стройка"
    >
      <g transform="translate(32 32)">
        <g transform="translate(57.609 0) scale(0.336)">
          <LogoIconPaths />
        </g>
        <g transform="translate(0 172) scale(1)">
          <LogoWordmarkPaths />
        </g>
      </g>
    </svg>
  );
}

/* БЛОК: Расчёт количества повторов для бесшовной бегущей строки (useTickerLoop)
 * ЗА ЧТО ОТВЕЧАЕТ: Измеряет ширину текста и ширину экрана и дублирует бегущую строку столько раз, чтобы на широких мониторах никогда не возникало пустых промежутков при прокрутке.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из реальных пиксельных размеров DOM-элемента ленты и окна браузера.
 * КАК ИЗМЕНИТЬ: Служебный расчёт — редактировать не требуется. */
function useTickerLoop(itemsKey: string) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const first = track.firstElementChild as HTMLElement | null;
      const copyWidth = first?.offsetWidth ?? 0;
      const viewport = track.parentElement?.clientWidth ?? window.innerWidth;
      if (copyWidth <= 0 || viewport <= 0) return;
      setCopies(Math.max(2, Math.ceil((viewport * 2) / copyWidth) + 1));
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (track.parentElement) observer.observe(track.parentElement);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [itemsKey]);

  return { trackRef, copies };
}

/* БЛОК: Мигающая гирлянда по краю бегущей строки (TickerGarland)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует мигающие лампочки по верхнему и нижнему краям жёлтой бегущей строки без проводов.
 *   Лампочки мигают по очереди и имеют разные цвета; декор не перехватывает нажатия мыши.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Количество лампочек и палитра заданы здесь; включение и выключение — settings.ticker.garland в админке.
 * КАК ИЗМЕНИТЬ: GARLAND_BULBS — число лампочек, GARLAND_COLORS — цвета. */
const GARLAND_BULBS = 48;
const GARLAND_COLORS = ["#ff3b30", "#34c759", "#0a84ff", "#ffffff", "#ff9500", "#ff2d92"];

function TickerGarland({ flip = false }: { flip?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 h-[14px]",
        flip ? "bottom-[-7px] rotate-180" : "top-[-7px]",
      )}
    >
      {Array.from({ length: GARLAND_BULBS }, (_, i) => {
        const color = GARLAND_COLORS[i % GARLAND_COLORS.length];
        return (
          <span
            key={i}
            className="garland-bulb absolute h-[6px] w-[6px] -translate-x-1/2 rounded-full"
            style={{
              left: `${((i + 0.5) / GARLAND_BULBS) * 100}%`,
              top: 7,
              background: color,
              boxShadow: `0 0 6px 1px ${color}`,
              animationDelay: `${-((i * 0.37) % 1.8)}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/* БЛОК: Декоративный снег в шапке (HeaderSnow)
 * ЗА ЧТО ОТВЕЧАЕТ: Создаёт снежинки разного размера и скорости, которые падают через все полосы шапки.
 *   Позиции вычисляются детерминированно, поэтому снег не перерисовывается случайно при каждом рендере.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Видимость задаёт settings.ticker.snow в админке; анимации находятся в src/index.css.
 * КАК ИЗМЕНИТЬ: SNOWFLAKE_COUNT — количество снежинок, формулы left/size/duration — их распределение и скорость. */
const SNOWFLAKE_COUNT = 42;

function HeaderSnow() {
  return (
    <div className="header-snow" aria-hidden="true">
      {Array.from({ length: SNOWFLAKE_COUNT }, (_, index) => {
        const size = 2 + ((index * 7) % 5);
        const duration = 7 + (index % 7) * 0.9;
        return (
          <span
            key={index}
            className="snow-flake"
            style={{
              left: `${(index * 37 + 11) % 100}%`,
              width: size,
              height: size,
              opacity: 0.45 + (index % 4) * 0.14,
              animationDuration: `${duration}s`,
              animationDelay: `${-((index * 1.37) % 11)}s`,
              "--snow-drift": `${((index % 5) - 2) * 12}px`,
            } as React.CSSProperties}
          >
            <span
              className="snow-flake-core h-full w-full"
              style={{
                animationDuration: `${2.4 + (index % 4) * 0.4}s`,
                animationDelay: `${-((index * 0.53) % 3)}s`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}

/* БЛОК: Логотип-ссылка и отдельная кнопка раскрывающегося списка разделов (BrandLogoMenu)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит в шапке самостоятельную ссылку-логотип (ведёт только на главную #/)
 *   и рядом с ней отдельную жёлтую круглую кнопку-шеврон, раскрывающую список калькуляторов (без главной).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Список menuItems из настроек шапки (src/data/siteSettings.ts), текущий маршрут route — из Header.
 * КАК ИЗМЕНИТЬ: Подзаголовки и иконки разделов настраиваются в словаре BRAND_MENU_META ниже. */
const BRAND_MENU_META: Record<string, { subtitle: string; icon: ReactNode }> = {
  "/grilyato": { subtitle: "Ячеистый потолок", icon: <Grid3X3 size={16} strokeWidth={2.2} /> },
  "/armstrong": { subtitle: "Модульный потолок", icon: <Layers3 size={16} strokeWidth={2.2} /> },
  "/roof": { subtitle: "Листовая кровля", icon: <House size={16} strokeWidth={2.2} /> },
  "/siding": { subtitle: "Обшивка фасада", icon: <Rows3 size={16} strokeWidth={2.2} /> },
  "/test": { subtitle: "Обшивка фасада", icon: <Rows3 size={16} strokeWidth={2.2} /> },
  "/404": { subtitle: "Страница не найдена", icon: <SearchX size={16} strokeWidth={2.2} /> },
};

function BrandLogoMenu({
  route,
  menuItems,
  logo,
  adminUnlocked,
}: {
  route: string;
  menuItems: MenuItem[];
  logo: { height: number; align: "left" | "center" | "right"; offsetX: number; offsetY: number };
  adminUnlocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const pages = [
    ...menuItems
      .filter((item) => extractRoutePath(item.href) !== "/")
      .map((item) => {
        const path = extractRoutePath(item.href);
        const meta = BRAND_MENU_META[path];
        return {
          id: item.id,
          label: item.label,
          href: toHref(item.href),
          subtitle: meta?.subtitle ?? "Калькулятор",
          icon: meta?.icon ?? <Calculator size={16} strokeWidth={2.2} />,
        };
      }),
    ...(adminUnlocked
      ? [
          {
            id: "admin",
            label: "Администрирование",
            href: toHref("/admin"),
            subtitle: "Панель управления",
            icon: <SlidersHorizontal size={16} strokeWidth={2.2} />,
          },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    const path = extractRoutePath(href);
    return path !== "/" && route === path;
  };

  /* Отступ значка списка: нужное видимое расстояние минус пустое поле справа внутри картинки логотипа */
  const logoHeight = Math.min(logo.height, 88);
  const chevronMargin = LOGO_CHEVRON_GAP - (LOGO_RIGHT_PADDING * logoHeight) / LOGO_VIEW_HEIGHT;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const activeIndex = Math.max(
      0,
      pages.findIndex((p) => isActive(p.href)),
    );
    itemRefs.current[activeIndex]?.focus();
  }, [open]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const items = itemRefs.current.filter(Boolean) as HTMLAnchorElement[];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative flex items-center shrink-0", logo.align === "right" && "order-3")}
      style={{ transform: `translate(${logo.offsetX}px, ${logo.offsetY}px)` }}
    >
      <a
        href={toHref("/")}
        aria-label="Челябинск Стройка — на главную"
        className="group flex items-center shrink-0 rounded-[10px] py-0.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c400]"
      >
        <LogoMark height={logoHeight} className="transition-transform group-hover:scale-[1.03]" />
      </a>

      {pages.length > 0 && (
        <button
          ref={triggerRef}
          type="button"
          aria-label="Разделы сайта"
          title="Разделы сайта"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{ marginLeft: chevronMargin }}
          className={cn(
            "relative z-10 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[#f5c400] text-[#20282b] cursor-pointer transition-all duration-150 hover:bg-pro-soft hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-graphite",
            open && "ring-2 ring-white/85",
          )}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 10 6"
            width="10"
            height="6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("transition-transform duration-200", open && "rotate-180")}
          >
            <path d="M1 1l4 4 4-4" />
          </svg>
        </button>
      )}

      {open && pages.length > 0 && (
        <div
          role="menu"
          aria-label="Разделы"
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute top-[calc(100%+10px)] z-50 w-[280px] overflow-hidden rounded-2xl border border-[#e4e2da] bg-white p-1.5 text-graphite shadow-[0_18px_40px_-12px_rgba(29,31,27,0.28)]",
            logo.align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#9a9a90]">
            Разделы
          </div>
          {pages.map((p, i) => {
            const active = isActive(p.href);
            return (
              <a
                key={p.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                role="menuitem"
                aria-current={active ? "page" : undefined}
                href={p.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#F5C400]",
                  active ? "bg-[#FFF8D6]" : "hover:bg-[#f4f3ee]",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-[#F5C400] text-[#1d1f1b]" : "bg-[#1d1f1b] text-white",
                  )}
                >
                  {p.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#1d1f1b]">{p.label}</span>
                  <span className="block truncate text-xs text-[#7b7c73]">{p.subtitle}</span>
                </span>
                {active && <span className="h-2 w-2 shrink-0 rounded-full bg-[#F5C400]" aria-hidden="true" />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* БЛОК: Главный компонент шапки сайта (Header)
 * ЗА ЧТО ОТВЕЧАЕТ: Управляет открытием/закрытием выпадающего списка «Калькуляторы» (по клику, клавише Esc и клику вне меню), подсвечивает текущую страницу и отрисовывает все три яруса шапки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Текущий маршрут route передаётся из src/App.tsx, настройки шапки — из useSiteSettings() (src/data/siteSettings.ts), адрес и город — из STORE (src/data/grilyato.ts).
 * КАК ИЗМЕНИТЬ: Подписи быстрых якорных ссылок («О системе Грильято», «О системе Армстронг», «О кровле», «О сайдинге») редактируются прямо в блоке <nav> ниже. */
export default function Header({ route = "/" }: { route?: string }) {
  const [adminUnlocked, setAdminUnlocked] = useState(isAdminUnlocked);

  /* БЛОК: Слежение за входом в панель «Администрирование»
   * ЗА ЧТО ОТВЕЧАЕТ: Добавляет пункт «Администрирование» в раскрывающийся список у логотипа после входа и скрывает после «Заблокировать».
   * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: Признак сессии из src/utils/adminSession.ts. */
  useEffect(() => {
    setAdminUnlocked(isAdminUnlocked());
    return subscribeAdminSession(() => setAdminUnlocked(isAdminUnlocked()));
  }, [route]);

  const settings = useSiteSettings();
  const logo = settings.logo.header;
  const tickerItems = settings.ticker.items.filter((item) => item.enabled);
  const menuItems = settings.menu.filter((item) => item.enabled);

  const { trackRef, copies } = useTickerLoop(
    tickerItems.map((item) => `${item.id}:${item.text}`).join("|"),
  );

  return (
    <header className="sticky top-0 z-50">
      {/* Декоративный снег поверх шапки; pointer-events:none в CSS не мешает меню и кнопкам */}
      {settings.ticker.snow && <HeaderSnow />}

      {/* БЛОК: Центральная графитовая полоса с логотипом, кнопкой списка разделов и городом | ЗА ЧТО ОТВЕЧАЕТ: Кнопка с логотипом и раскрывающимся списком разделов слева и значок геолокации с городом справа | ОТКУДА ДАННЫЕ: Компонент BrandLogoMenu выше, menuItems из настроек и STORE.city из src/data/grilyato.ts | КАК ИЗМЕНИТЬ: Размер и положение логотипа меняются в админке */}
      <div className="relative z-20 bg-graphite text-white shadow-[0_8px_30px_rgba(20,25,27,0.25)]">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 h-[68px] flex items-center gap-3 lg:gap-5">
          {/* Положение, размер и цвет логотипа задаются в админке: «Настройка страниц» → «Главная страница» → «Логотип сайта» */}
          {logo.align !== "left" && <div className="flex-1" />}
          {logo.visible && (
            <BrandLogoMenu
              route={route}
              menuItems={menuItems}
              logo={logo}
              adminUnlocked={adminUnlocked}
            />
          )}

          <div className={cn("flex-1", logo.align === "right" && "order-2")} />

          <button className={cn("hidden sm:flex items-center gap-1 text-[13.5px] font-semibold text-white/85 hover:text-pro transition-colors", logo.align === "right" && "order-1")}>
            <MapPin size={16} strokeWidth={2.3} className="text-pro" />
            {STORE.address}
          </button>

        </div>
      </div>

      {/* БЛОК: Жёлтая бегущая строка под шапкой | ЗА ЧТО ОТВЕЧАЕТ: Бесконечно прокручивает рекламные/информационные фразы | ОТКУДА ДАННЫЕ: Массив settings.ticker.items и скорость settings.ticker.speed из админки (#/admin) | КАК ИЗМЕНИТЬ: Добавляйте, скрывайте и переставляйте фразы на странице «Администрирование» (#/admin) */}
      {tickerItems.length > 0 && (
        <div className="relative">
        {settings.ticker.garland && <TickerGarland />}
        <div className="bg-pro text-graphite overflow-hidden border-b border-graphite/10">
          <div
            ref={trackRef}
            className="animate-ticker flex w-max items-center"
            style={
              {
                "--ticker-shift": `${-100 / copies}%`,
                "--ticker-duration": `${settings.ticker.speed * copies}s`,
              } as React.CSSProperties
            }
          >
            {Array.from({ length: copies }).map((_, copy) => (
              <div key={copy} className="flex items-center shrink-0" aria-hidden={copy !== 0}>
                {tickerItems.map((item, i) => (
                  <span
                    key={item.id}
                    className="flex items-center gap-3 px-6 py-2 text-[13px] font-bold tracking-wide whitespace-nowrap"
                  >
                    {i === 0 ? (
                      <Calculator size={14} strokeWidth={2.6} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-graphite/70" />
                    )}
                    {item.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        {settings.ticker.garland && <TickerGarland flip />}
        </div>
      )}
    </header>
  );
}
