/* ============================================================================
 * ФАЙЛ: src/components/Header.tsx — Общая шапка сайта и векторный логотип
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит закреплённую вверху экрана трёхслойную шапку: 1) узкую верхнюю полосу с выпадающим меню «Калькуляторы», якорной ссылкой «О системе… / О кровле / О сайдинге» и адресом магазина; 2) основную полосу с логотипом «Челябинск СТРОЙКА» и городом; 3) жёлтую зацикленную бегущую строку.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Пункты меню «Калькуляторы», скорость и тексты бегущей строки читаются из useSiteSettings() (управляются на странице «Администрирование» #/admin), а адрес и город магазина — из объекта STORE в src/data/grilyato.ts.
 * КАК ИЗМЕНИТЬ:
 *   — Бегущую строку и порядок/видимость кнопок в меню «Калькуляторы» меняйте прямо на странице #/admin без правки кода.
 *   — Чтобы изменить сам логотип или надписи «Челябинск» / «СТРОЙКА», отредактируйте компонент LogoMark ниже.
 *   — Чтобы изменить адрес магазина в правой части верхней полосы, отредактируйте STORE в src/data/grilyato.ts.
 * ========================================================================= */

import { useEffect, useRef, useState } from "react";
import { MapPin, Truck, Store, Calculator, ChevronDown, SlidersHorizontal } from "lucide-react";
import { STORE } from "../data/grilyato";
import { useSiteSettings } from "../data/siteSettings";
import { isAdminUnlocked, subscribeAdminSession } from "../utils/adminSession";
import { cn } from "../utils/cn";

/* БЛОК: Векторный логотип сайта «Челябинск СТРОЙКА» (LogoMark)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует домик с окошками и две строки текста («Челябинск» и «СТРОЙКА») в шапке и в подвале сайта без внешних файлов картинок.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Высота значка height и цвет слова «Челябинск» cityColor передаются из Header.tsx и SiteFooter.tsx.
 * КАК ИЗМЕНИТЬ: Поменяйте текст внутри тегов <text> для смены названия или замените цвета fill="#FFBF2F" / "#C5861E" для другой палитры значка. */
export function LogoMark({
  height = 56,
  cityColor = "#FFFFFF",
  className,
}: {
  height?: number;
  cityColor?: string;
  className?: string;
}) {
  return (
    <svg
      height={height}
      width={(height * 130) / 84}
      viewBox="0 0 130 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Челябинск Стройка"
    >
      <g transform="translate(65,0) scale(1.8) translate(-36,0)">
        <path d="M41.1247 5.17859L36.9501 11.19L40.7269 14.9211V20.7547H32.6301L31.2715 26.9992H48V11.9766L41.1247 5.17859Z" fill="#C5861E" />
        <path d="M31.2715 20.7534V26.9979L32.6304 20.7534H31.2715Z" fill="#855D12" />
        <path d="M35.9991 10.2466L41.1246 5.17859L36.9485 11.1853L35.9991 10.2466Z" fill="#855D12" />
        <path d="M36.0009 0.109989L24 11.976V26.9984H31.2733V20.7539V14.9202L36.0009 10.2457L41.1263 5.17796L36.0009 0.109989Z" fill="#FFBF2F" />
        <rect x="31.27" y="14.92" width="9.46" height="5.84" fill="#C5861E" />
        <rect x="33.6" y="15.9" width="12.7" height="3.7" rx="0.7" fill="#20282B" />
        <rect x="40.6" y="17.1" width="1.2" height="1.3" rx="0.2" fill="#FFBF2F" />
        <rect x="42.3" y="17.1" width="1.2" height="1.3" rx="0.2" fill="#FFBF2F" />
        <rect x="44" y="17.1" width="1.4" height="1.3" rx="0.2" fill="#FFBF2F" />
        <rect x="33.6" y="21.1" width="3.3" height="2.2" rx="0.5" fill="#20282B" />
        <rect x="38.3" y="21.1" width="3.3" height="2.2" rx="0.5" fill="#20282B" />
        <rect x="43" y="21.1" width="3.3" height="2.2" rx="0.5" fill="#20282B" />
        <rect x="35" y="24.2" width="2.6" height="1.9" rx="0.5" fill="#20282B" />
        <rect x="38.9" y="24.2" width="2.6" height="1.9" rx="0.5" fill="#20282B" />
        <rect x="43" y="24.2" width="3.3" height="1.9" rx="0.5" fill="#FFBF2F" />
      </g>
      <text
        x="65"
        y="68"
        textAnchor="middle"
        fontFamily="'Montserrat', sans-serif"
        fontSize="12"
        fontWeight="800"
        letterSpacing="1.5"
        fill={cityColor}
      >
        Челябинск
      </text>
      <text
        x="65"
        y="81"
        textAnchor="middle"
        fontFamily="'Montserrat', sans-serif"
        fontSize="10.5"
        fontWeight="800"
        letterSpacing="2"
        fill="#FFBF2F"
      >
        СТРОЙКА
      </text>
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

/* БЛОК: Главный компонент шапки сайта (Header)
 * ЗА ЧТО ОТВЕЧАЕТ: Управляет открытием/закрытием выпадающего списка «Калькуляторы» (по клику, клавише Esc и клику вне меню), подсвечивает текущую страницу и отрисовывает все три яруса шапки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Текущий маршрут route передаётся из src/App.tsx, настройки шапки — из useSiteSettings() (src/data/siteSettings.ts), адрес и город — из STORE (src/data/grilyato.ts).
 * КАК ИЗМЕНИТЬ: Подписи быстрых якорных ссылок («О системе Грильято», «О системе Армстронг», «О кровле», «О сайдинге») редактируются прямо в блоке <nav> ниже. */
export default function Header({ route = "/" }: { route?: string }) {
  const [open, setOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(isAdminUnlocked);
  const menuRef = useRef<HTMLDivElement>(null);
  const onGrilyato = route.startsWith("/grilyato");
  const onArmstrong = route.startsWith("/armstrong");
  const onRoof = route.startsWith("/roof");
  const onSiding = route.startsWith("/siding");

  /* БЛОК: Слежение за входом в панель «Администрирование»
   * ЗА ЧТО ОТВЕЧАЕТ: Показывает кнопку «Администрирование» сразу после входа в панель и скрывает её после «Заблокировать».
   * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: Признак сессии из src/utils/adminSession.ts (ключ sessionStorage "admin:unlocked"). */
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

  const isCurrent = (href: string) => {
    const path = href.replace(/^#/, "").split("#")[0];
    return path !== "/" && route.startsWith(path);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      {/* Декоративный снег поверх шапки; pointer-events:none в CSS не мешает меню и кнопкам */}
      {settings.ticker.snow && <HeaderSnow />}

      {/* БЛОК: Верхняя узкая навигационная полоса | ЗА ЧТО ОТВЕЧАЕТ: Выпадающий список «Калькуляторы», якорная ссылка на описание открытой системы и адрес магазина справа | ОТКУДА ДАННЫЕ: menuItems из настроек админки и STORE.address из src/data/grilyato.ts | КАК ИЗМЕНИТЬ: Список кнопок меню — в #/admin, тексты якорных ссылок и «Доставка и подъём» — прямо здесь */}
      <div className="hidden md:block bg-ink text-white/70">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 h-9 flex items-center justify-between text-[12.5px]">
          <nav className="flex items-center gap-5">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex items-center gap-1.5 text-white/70 hover:text-pro transition-colors"
              >
                Калькуляторы
                <ChevronDown size={14} strokeWidth={2.5}
                  className={`opacity-60 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
              </button>

              {open && (
                <div className="absolute left-0 top-full pt-2 z-50">
                  <div className="w-64 rounded-2xl bg-white text-graphite shadow-[0_16px_40px_rgba(20,25,27,0.25)] border border-line py-1.5">
                    {menuItems.map((item) => {
                      const current = isCurrent(item.href);
                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center justify-between gap-2 w-full text-left px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
                            current ? "bg-pro/25 text-graphite" : "text-graphite/70 hover:bg-pro/20"
                          }`}
                        >
                          {item.label}
                          {current && <span className="w-1.5 h-1.5 rounded-full bg-graphite shrink-0" />}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {onGrilyato && (
              <a href="#/grilyato#features" className="hover:text-pro transition-colors">О системе Грильято</a>
            )}
            {onArmstrong && (
              <a href="#/armstrong#features" className="hover:text-pro transition-colors">О системе Армстронг</a>
            )}
            {onRoof && (
              <a href="#/roof#features" className="hover:text-pro transition-colors">О кровле</a>
            )}
            {onSiding && (
              <a href="#/siding#features" className="hover:text-pro transition-colors">О сайдинге</a>
            )}

            {/* БЛОК: Кнопка «Администрирование» для вошедшего администратора | ЗА ЧТО ОТВЕЧАЕТ: Быстрый переход в панель управления; появляется только после ввода пароля на странице #/admin и стоит после всех остальных ссылок строки | ОТКУДА ДАННЫЕ: Признак сессии из src/utils/adminSession.ts | КАК ИЗМЕНИТЬ: Цвет кнопки задают классы bg-pro text-graphite (цвет бегущей строки) */}
            {adminUnlocked && (
              <a
                href="#/admin"
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-pro px-2.5 text-[12.5px] font-extrabold text-graphite transition-colors hover:bg-pro-soft"
              >
                <SlidersHorizontal size={13} strokeWidth={2.5} />
                Администрирование
              </a>
            )}
          </nav>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Store size={13} strokeWidth={2.2} className="text-pro" /> {STORE.address}
            </span>
            <span className="flex items-center gap-1.5">
              <Truck size={13} strokeWidth={2.2} className="text-pro" /> Доставка и подъём
            </span>
          </div>
        </div>
      </div>

      {/* БЛОК: Центральная графитовая полоса с логотипом и городом | ЗА ЧТО ОТВЕЧАЕТ: Ссылка с логотипом на главную страницу слева и значок геолокации с городом справа | ОТКУДА ДАННЫЕ: Компонент LogoMark выше и STORE.city из src/data/grilyato.ts | КАК ИЗМЕНИТЬ: Размер логотипа меняется в height={54}, город — в STORE.city */}
      <div className="bg-graphite text-white shadow-[0_8px_30px_rgba(20,25,27,0.25)]">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 h-[68px] flex items-center gap-3 lg:gap-5">
          {/* Положение, размер и цвет логотипа задаются в админке: «Настройка страниц» → «Главная страница» → «Логотип сайта» */}
          {logo.align !== "left" && <div className="flex-1" />}
          {logo.visible && (
            <a
              href="#/"
              className={cn("flex items-center shrink-0 group", logo.align === "right" && "order-3")}
              aria-label="Челябинск Стройка — на главную"
              style={{ transform: `translate(${logo.offsetX}px, ${logo.offsetY}px)` }}
            >
              <LogoMark
                height={Math.min(logo.height, 64)}
                cityColor={logo.cityColor}
                className="transition-transform group-hover:scale-105"
              />
            </a>
          )}

          <div className={cn("flex-1", logo.align === "right" && "order-2")} />

          <button className={cn("hidden sm:flex items-center gap-1 text-[13.5px] font-semibold text-white/85 hover:text-pro transition-colors", logo.align === "right" && "order-1")}>
            <MapPin size={16} strokeWidth={2.3} className="text-pro" />
            {STORE.city}
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
