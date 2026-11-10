/* ============================================================================
 * ФАЙЛ: src/pages/AdminPage.tsx — Панель «Администрирование» (#/admin)
 * ЗА ЧТО ОТВЕЧАЕТ: Защищённая страница управления сайтом: экран входа по аккаунту Supabase,
 *   сворачиваемый раздел «Настройка страниц» и панель синхронизации с Google-таблицей
 *   в «Общих параметрах сайта».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Вход и права проверяются по базе данных Supabase
 *   (src/integrations/supabase/adminAuth.ts, таблица admins); настройки читаются и публикуются
 *   через loadSettings(), publishSettings(), publishDefaultSettings() и useSettingsSync()
 *   из src/data/siteSettings.ts; параметры подключения к таблице — из src/data/settingsSync.ts.
 * КАК ИЗМЕНИТЬ:
 *   — Доступ выдаётся не паролем из кода, а аккаунтом в базе Supabase: создайте пользователя
 *     в Authentication → Users и добавьте его почту в таблицу admins (инструкция — SUPABASE.md).
 *   — Данные для подключения к базе вписываются в src/integrations/supabase/config.ts.
 *   — Чтобы добавить карточку новой страницы в «Карту страниц», допишите объект в массив PAGES.
 * ========================================================================= */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  ChevronDown,
  ChevronUp,
  Check,
  Cloud,
  CloudOff,
  CloudUpload,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Gauge,
  KeyRound,
  Link2,
  Loader2,
  RefreshCw,
  Grid3X3,
  Home,
  Layers,
  Layers3,
  ListOrdered,
  Lock,
  LogOut,
  Plus,
  RectangleHorizontal,
  RotateCcw,
  Ruler,
  Save,
  ShieldCheck,
  Sliders,
  Trash2,
  Type,
  Users,
  Warehouse,
} from "lucide-react";
import SiteFooter from "../components/SiteFooter";
import {
  DEFAULT_SETTINGS,
  FOOTER_ICON_KEYS,
  SHEET_OVERLAP_MAX,
  SHEET_SIZE_MAX,
  SHEET_SIZE_MIN,
  TICKER_SPEED_MAX,
  TICKER_SPEED_MIN,
  loadSettings,
  publishDefaultSettings,
  publishSettings,
  useSettingsSync,
  type FooterLinkItem,
  type FooterStoreItem,
  type SheetPresetItem,
  type SiteSettings,
  type TickerItem,
} from "../data/siteSettings";
import { FOOTER_ICON_TITLES, FooterIcon } from "../components/FooterIcon";
import { SETTINGS_SHEET, getApiConfig, setApiConfig } from "../data/settingsSync";
import PageSettingsSection from "../components/admin/PageSettingsSection";
import {
  getAdminSessionInfo,
  isAdminUnlocked,
  lockAdmin,
  subscribeAdminSession,
} from "../utils/adminSession";
import { signInAdmin } from "../integrations/supabase/adminAuth";
import { describeSupabaseConfig } from "../integrations/supabase/config";
import { cn } from "../utils/cn";

/* БЛОК: Общие настройки анимации страницы (ease)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт плавность появления блоков админки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Прописано прямо здесь.
 * КАК ИЗМЕНИТЬ: Не требуется. Пароль входа больше не хранится в коде — он проверяется
 *   по базе данных Supabase (src/integrations/supabase/adminAuth.ts). */
const ease = [0.22, 1, 0.36, 1] as const;

const fmtNum = (value: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);

/* БЛОК: Сворачивание и разворачивание крупных разделов админки (useCollapsedSections, CollapseButton, Collapsible)
 * ЗА ЧТО ОТВЕЧАЕТ: Позволяет сворачивать разделы «Карта страниц», «Настройка страниц» и «Карта блоков» кнопкой справа от заголовка. По умолчанию все разделы свёрнуты; выбранное состояние запоминается между визитами.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Хранит состояние развёрнутых секций в localStorage под ключом "admin:expanded-sections".
 * КАК ИЗМЕНИТЬ: Подписи кнопки «Свернуть» / «Развернуть» и скорость анимации (duration: 0.5) меняются в CollapseButton и Collapsible ниже. */
const EXPANDED_KEY = "admin:expanded-sections";

function useCollapsedSections() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(EXPANDED_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(EXPANDED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const isOpen = (id: string) => Boolean(expanded[id]);

  return { isOpen, toggle };
}

/* БЛОК: Справочник всех страниц сайта для раздела «Карта страниц» (PAGES)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит карточки всех существующих страниц сайта с описанием, прямым адресом route, кнопкой копирования URL и кнопкой перехода.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Список задан в массиве PAGES ниже (маршруты совпадают с src/App.tsx).
 * КАК ИЗМЕНИТЬ: При добавлении на сайт новой страницы добавьте сюда новый объект с её названием, route и кратким описанием. */
interface PageItem {
  title: string;
  route: string;
  category: "Главная" | "Калькулятор" | "Спецификация" | "Системная";
  badge: string;
  description: string;
  icon: typeof Calculator;
  details: string[];
}

const PAGES: PageItem[] = [
  {
    title: "Главная страница",
    route: "#/",
    category: "Главная",
    badge: "Витрина",
    description:
      "Стартовая страница сайта с каталогом доступных строительных калькуляторов и описанием систем.",
    icon: Home,
    details: ["Обзор калькуляторов", "Навигация по сайту", "Быстрый переход"],
  },
  {
    title: "Калькулятор · Грильято",
    route: "#/grilyato",
    category: "Калькулятор",
    badge: "Потолок",
    description:
      "Расчёт подвесного потолка Грильято с выбором ячейки (50×50, 75×75, 100×100), цвета, подвеса и запаса.",
    icon: Grid3X3,
    details: ["Автопроверка цен из Google Таблицы", "Полноэкранные чертежи кассет", "Копирование артикулов"],
  },
  {
    title: "Калькулятор · Армстронг",
    route: "#/armstrong",
    category: "Калькулятор",
    badge: "Потолок",
    description:
      "Расчёт модульного потолка Армстронг: 8 видов плит, Т-профили Премиум/Эконом, уголки и каталог системы.",
    icon: Layers3,
    details: ["Формулы округления плит", "Компактные миниатюры фото", "Карточки плит, профилей и углов"],
  },
  {
    title: "Кровля",
    route: "#/roof",
    category: "Калькулятор",
    badge: "Кровля",
    description:
      "Полноценная страница калькулятора кровли в стиле «Грильято»: hero-блок, калькулятор, описание системы и 4 вида кровли.",
    icon: Warehouse,
    details: ["Hero-блок и статистика", "Калькулятор со схемой", "Виды кровли: С20, С8, черепица, ондулин"],
  },
  {
    title: "Сайдинг",
    route: "#/siding",
    category: "Калькулятор",
    badge: "Фасад",
    description:
      "Страница обшивки фасада ПВХ сайдингом в стиле «Кровля»: hero-блок, калькулятор фасада, система и элементы.",
    icon: Layers,
    details: ["Hero-блок и статистика", "План фасада с проёмами", "8 элементов системы"],
  },
  {
    title: "Тест",
    route: "#/test",
    category: "Системная",
    badge: "Тестовая",
    description:
      "Тестовая страница временно показывает заглушку и готовится к публикации.",
    icon: Layers,
    details: ["Временная заглушка", "Калькулятор доступен на странице «Сайдинг»"],
  },
  {
    title: "Администрирование",
    route: "#/admin",
    category: "Системная",
    badge: "Карта сайта",
    description:
      "Панель со списком всех страниц сайта и настройками блоков: бегущая строка и меню в шапке.",
    icon: Sliders,
    details: ["Доступ по паролю", "Карта страниц", "Настройка страниц"],
  },
];

/* БЛОК: Экран защиты паролем при входе в админку (PasswordGate)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывается до тех пор, пока пользователь не введёт верный пароль ADMIN_PASSWORD; при ошибке выводит плашку «Доступ запрещен».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Сравнивает введённую строку с константой ADMIN_PASSWORD в начале файла.
 * КАК ИЗМЕНИТЬ: Сам пароль меняется в ADMIN_PASSWORD, а тексты заголовка и кнопки «Войти» — в разметке этого блока. */
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const db = describeSupabaseConfig();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const result = await signInAdmin(email, password);
    if (result.ok) {
      onUnlock();
      return;
    }
    setBusy(false);
    setError(result.error ?? "Не удалось войти");
  };

  return (
    <>
      <section className="relative overflow-hidden bg-graphite py-16 text-white lg:py-24">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative mx-auto flex max-w-[1400px] justify-center px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease }}
            className="w-full max-w-[460px] rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur lg:p-8"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-pro text-graphite">
              <Lock size={22} strokeWidth={2.4} />
            </div>
            <h1 className="mt-5 text-[28px] font-black leading-tight tracking-[-0.01em] lg:text-[34px]">
              Администрирование
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-white/60">
              Вход по аккаунту базы данных Supabase. Панель открывается только тем, чья почта
              добавлена в список администраторов.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="admin-email"
                  className="block text-[12.5px] font-bold uppercase tracking-wider text-white/45"
                >
                  Электронная почта
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  autoFocus
                  autoComplete="username"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  aria-label="Электронная почта"
                  aria-invalid={Boolean(error)}
                  placeholder="you@example.com"
                  className={cn(
                    "w-full rounded-xl border bg-white/[0.06] px-4 py-3 text-[15px] font-semibold text-white outline-none transition-colors placeholder:text-white/30",
                    error ? "border-red-400/70" : "border-white/15 focus:border-pro",
                  )}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="admin-password"
                  className="block text-[12.5px] font-bold uppercase tracking-wider text-white/45"
                >
                  Пароль
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={visible ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    aria-label="Пароль"
                    aria-invalid={Boolean(error)}
                    placeholder="Введите пароль"
                    className={cn(
                      "w-full rounded-xl border bg-white/[0.06] px-4 py-3 pr-11 text-[15px] font-semibold text-white outline-none transition-colors placeholder:text-white/30",
                      error ? "border-red-400/70" : "border-white/15 focus:border-pro",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {visible ? <EyeOff size={16} strokeWidth={2.3} /> : <Eye size={16} strokeWidth={2.3} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-pro px-5 text-[14px] font-extrabold text-graphite transition-all hover:gap-3 hover:bg-pro-soft disabled:cursor-wait disabled:opacity-70"
              >
                {busy ? (
                  <>
                    <Loader2 size={16} strokeWidth={2.6} className="animate-spin" />
                    Проверяем доступ…
                  </>
                ) : (
                  <>
                    Войти
                    <ArrowRight size={16} strokeWidth={2.6} />
                  </>
                )}
              </button>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-[14px] font-bold leading-relaxed text-red-200"
                >
                  <ShieldCheck size={16} strokeWidth={2.4} className="mt-0.5 shrink-0" />
                  <span>
                    <span className="block">Доступ запрещён</span>
                    <span className="mt-0.5 block font-medium text-red-200/80">{error}</span>
                  </span>
                </div>
              )}
            </form>

            <div
              className={cn(
                "mt-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[12.5px] font-medium leading-relaxed",
                db.configured
                  ? "border-white/10 bg-white/[0.03] text-white/55"
                  : "border-pro/30 bg-pro/10 text-pro",
              )}
            >
              <Cloud size={15} strokeWidth={2.3} className="mt-0.5 shrink-0" />
              <span>
                <span className="block font-bold">{db.label}</span>
                <span className="mt-0.5 block opacity-80">{db.detail}</span>
              </span>
            </div>

            <a
              href="#/"
              className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-bold text-white/55 transition-colors hover:text-pro"
            >
              Вернуться на главную
              <ExternalLink size={13} strokeWidth={2.4} />
            </a>
          </motion.div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

/* БЛОК: Редактор «Бегущая строка» в шапке сайта (TickerEditor)
 * ЗА ЧТО ОТВЕЧАЕТ: Позволяет менять скорость движения жёлтой бегущей строки (1–60 секунд на круг), редактировать текст фраз, менять их порядок, временно скрывать, удалять и добавлять новые с живым предпросмотром.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Раздел settings.ticker из объекта настроек SiteSettings.
 * КАК ИЗМЕНИТЬ: Заводские строки бегущей строки лежат в DEFAULT_SETTINGS.ticker в файле src/data/siteSettings.ts. */
export function TickerEditor({
  settings,
  update,
  bare = false,
}: {
  settings: SiteSettings;
  update: (next: SiteSettings) => void;
  /** Без собственной рамки и заголовка — для встраивания в карточку «Настройки страниц» */
  bare?: boolean;
}) {
  const items = settings.ticker.items;

  const setItems = (next: TickerItem[]) =>
    update({ ...settings, ticker: { ...settings.ticker, items: next } });

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const preview = items.filter((item) => item.enabled);

  return (
    <div className={bare ? "" : "rounded-xl border border-line bg-white p-3 shadow-[0_1px_8px_rgba(20,25,27,0.03)]"}>
      {!bare && (<>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pro text-graphite">
            <Type size={16} strokeWidth={2.3} />
          </div>
          <div>
            <span className="inline-block rounded-full border border-line bg-smoke px-2 py-px text-[10px] font-bold text-graphite/60">
              Блок · Шапка сайта
            </span>
            <h3 className="mt-0.5 text-[15px] font-black leading-tight">Бегущая строка</h3>
          </div>
        </div>
        <span className="rounded-md bg-smoke px-2 py-0.5 text-[11px] font-bold text-graphite/70">
          {preview.length} из {items.length} строк
        </span>
      </div>

      <p className="mt-2 text-[12px] leading-snug text-graphite/55">
        Строка крутится по кругу без пауз. Порядок задаётся стрелками, лишние строки можно скрыть.
      </p>
      </>)}

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-1.5 text-[13px] font-bold text-graphite/70">
            <Gauge size={14} strokeWidth={2.4} className="text-graphite/40" />
            Скорость прокрутки (сек на полный круг)
          </label>
          <div className="flex items-baseline gap-1">
            <input
              value={String(settings.ticker.speed)}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/\D/g, ""), 10);
                if (!Number.isNaN(value)) {
                  update({
                    ...settings,
                    ticker: {
                      ...settings.ticker,
                      speed: Math.min(TICKER_SPEED_MAX, Math.max(TICKER_SPEED_MIN, value)),
                    },
                  });
                }
              }}
              inputMode="numeric"
              aria-label="Скорость прокрутки, секунд на круг"
              className="no-spin w-[70px] rounded-lg bg-smoke px-2 py-1 text-right text-[16px] font-extrabold tabular outline-none border border-transparent transition-colors focus:border-pro"
            />
            <span className="text-[13px] font-semibold text-graphite/50">сек</span>
          </div>
        </div>
        <input
          type="range"
          min={TICKER_SPEED_MIN}
          max={TICKER_SPEED_MAX}
          step={1}
          value={settings.ticker.speed}
          onChange={(e) =>
            update({
              ...settings,
              ticker: { ...settings.ticker, speed: parseInt(e.target.value, 10) },
            })
          }
          aria-label="Скорость бегущей строки"
          className="pro-range mt-3 w-full"
          style={
            {
              "--fill": `${((settings.ticker.speed - TICKER_SPEED_MIN) / (TICKER_SPEED_MAX - TICKER_SPEED_MIN)) * 100}%`,
            } as React.CSSProperties
          }
        />
        <div className="mt-1.5 flex justify-between text-[11.5px] font-semibold text-graphite/45">
          <span>{TICKER_SPEED_MIN} сек — быстро</span>
          <span>медленно — {TICKER_SPEED_MAX} сек</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold text-graphite/70">
          <ListOrdered size={14} strokeWidth={2.4} className="text-graphite/40" />
          Текст и порядок строк
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors sm:flex-nowrap",
                item.enabled ? "border-line bg-white" : "border-line bg-smoke/70",
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-smoke text-[12px] font-extrabold tabular text-graphite/60">
                {index + 1}
              </span>

              <input
                value={item.text}
                onChange={(e) =>
                  setItems(items.map((it) => (it.id === item.id ? { ...it, text: e.target.value } : it)))
                }
                aria-label={`Текст строки ${index + 1}`}
                className={cn(
                  "min-w-0 flex-1 rounded-md border border-transparent bg-smoke px-2.5 py-1.5 text-[12.5px] font-semibold outline-none transition-colors focus:border-pro",
                  !item.enabled && "text-graphite/45 line-through",
                )}
              />

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Поднять строку выше"
                  title="Поднять выше"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-graphite/60 transition-colors hover:border-graphite/50 hover:bg-smoke disabled:opacity-35"
                >
                  <ChevronUp size={15} strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Опустить строку ниже"
                  title="Опустить ниже"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-graphite/60 transition-colors hover:border-graphite/50 hover:bg-smoke disabled:opacity-35"
                >
                  <ChevronDown size={15} strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setItems(items.map((it) => (it.id === item.id ? { ...it, enabled: !it.enabled } : it)))
                  }
                  aria-pressed={item.enabled}
                  aria-label={item.enabled ? "Скрыть строку" : "Показать строку"}
                  title={item.enabled ? "Показывается — нажмите, чтобы скрыть" : "Скрыта — нажмите, чтобы показать"}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg border transition-colors",
                    item.enabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "border-line text-graphite/40 hover:bg-smoke",
                  )}
                >
                  {item.enabled ? <Eye size={15} strokeWidth={2.4} /> : <EyeOff size={15} strokeWidth={2.4} />}
                </button>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((it) => it.id !== item.id))}
                  disabled={items.length <= 1}
                  aria-label="Удалить строку"
                  title="Удалить строку"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-graphite/50 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-35"
                >
                  <Trash2 size={15} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setItems([
              ...items,
              { id: `t-${Date.now()}`, text: "Новая строка бегущей строки", enabled: true },
            ])
          }
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-graphite/30 px-3 py-1.5 text-[12px] font-extrabold text-graphite/70 transition-colors hover:border-pro hover:bg-pro/10 hover:text-graphite"
        >
          <Plus size={15} strokeWidth={2.6} />
          Добавить строку
        </button>
      </div>

      {/* БЛОК: Переключатель гирлянды на бегущей строке | ЗА ЧТО ОТВЕЧАЕТ: Включает или выключает мигающую гирлянду по краям жёлтой строки в шапке | ОТКУДА ДАННЫЕ: settings.ticker.garland | КАК ИЗМЕНИТЬ: Сама гирлянда рисуется в TickerGarland (src/components/Header.tsx) */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-smoke/50 px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold text-graphite/80">Гирлянда на бегущей строке</div>
          <div className="text-[11.5px] text-graphite/50">Мигающие лампочки по верхнему и нижнему краю строки</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.ticker.garland}
          aria-label="Показывать гирлянду на бегущей строке"
          onClick={() => update({ ...settings, ticker: { ...settings.ticker, garland: !settings.ticker.garland } })}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
            settings.ticker.garland ? "bg-graphite" : "bg-line",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
              settings.ticker.garland ? "left-[18px]" : "left-0.5",
            )}
          />
        </button>
      </div>

      {/* БЛОК: Переключатель снега в шапке | ЗА ЧТО ОТВЕЧАЕТ: Включает или скрывает декоративный падающий снег поверх всех полос шапки | ОТКУДА ДАННЫЕ: settings.ticker.snow | КАК ИЗМЕНИТЬ: Снежинки рисуются в HeaderSnow (src/components/Header.tsx) */}
      <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-line bg-smoke/50 px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold text-graphite/80">Снег в шапке сайта</div>
          <div className="text-[11.5px] text-graphite/50">Падающие снежинки поверх шапки и бегущей строки</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.ticker.snow}
          aria-label="Показывать снег в шапке сайта"
          onClick={() => update({ ...settings, ticker: { ...settings.ticker, snow: !settings.ticker.snow } })}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
            settings.ticker.snow ? "bg-graphite" : "bg-line",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
              settings.ticker.snow ? "left-[18px]" : "left-0.5",
            )}
          />
        </button>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-graphite/45">
          Предпросмотр
        </div>
        <div className="overflow-hidden rounded-xl border border-graphite/10 bg-pro">
          <div className="flex items-center overflow-x-auto thin-scroll">
            {preview.length === 0 ? (
              <span className="px-4 py-2 text-[12.5px] font-bold text-graphite/55">
                Все строки скрыты — бегущая строка не показывается
              </span>
            ) : (
              preview.map((item, i) => (
                <span
                  key={item.id}
                  className="flex items-center gap-3 whitespace-nowrap px-5 py-2 text-[13px] font-bold tracking-wide text-graphite"
                >
                  {i === 0 ? (
                    <Calculator size={14} strokeWidth={2.6} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-graphite/70" />
                  )}
                  {item.text}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* БЛОК: Редактор подвала сайта «Нижний блок с логотипом» (FooterRow, FooterField, FooterEditor)
 * ЗА ЧТО ОТВЕЧАЕТ: Даёт возможность переименовывать заголовки колонок («Калькуляторы» и «Магазин»), редактировать и добавлять ссылки первой колонки, редактировать и добавлять текстовые строки со значками во второй колонке и сразу видеть живой макет подвала.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Раздел settings.footer из SiteSettings и набор пиктограмм из src/components/FooterIcon.tsx.
 * КАК ИЗМЕНИТЬ: Заводские значения колонок подвала находятся в DEFAULT_SETTINGS.footer в src/data/siteSettings.ts. */
function FooterRow({
  index,
  total,
  enabled,
  moveLabels,
  onMove,
  onToggle,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  enabled: boolean;
  moveLabels: [string, string];
  onMove: (delta: number) => void;
  onToggle: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2 transition-colors",
        enabled ? "border-line bg-smoke/40" : "border-line bg-smoke/70 opacity-70",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-[12px] font-extrabold tabular text-graphite/60">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">{children}</div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={moveLabels[0]}
            title={moveLabels[0]}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-graphite/60 transition-colors hover:border-graphite/50 hover:bg-smoke disabled:opacity-35"
          >
            <ChevronUp size={15} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={moveLabels[1]}
            title={moveLabels[1]}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-graphite/60 transition-colors hover:border-graphite/50 hover:bg-smoke disabled:opacity-35"
          >
            <ChevronDown size={15} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={enabled}
            aria-label={enabled ? "Скрыть позицию" : "Показать позицию"}
            title={enabled ? "Показывается — нажмите, чтобы скрыть" : "Скрыта — нажмите, чтобы показать"}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg border transition-colors",
              enabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-line bg-white text-graphite/40 hover:bg-smoke",
            )}
          >
            {enabled ? <Eye size={15} strokeWidth={2.4} /> : <EyeOff size={15} strokeWidth={2.4} />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Удалить позицию"
            title="Удалить позицию"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-graphite/50 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={15} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FooterField({
  value,
  onChange,
  ariaLabel,
  placeholder,
  maxLength = 60,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      placeholder={placeholder}
      maxLength={maxLength}
      spellCheck={false}
      className={cn(
        "w-full rounded-lg border border-transparent bg-white px-3 py-1.5 text-[13px] font-semibold outline-none transition-colors placeholder:text-graphite/35 focus:border-pro",
        className,
      )}
    />
  );
}

export function FooterEditor({
  settings,
  update,
  bare = false,
}: {
  settings: SiteSettings;
  update: (next: SiteSettings) => void;
  /** Без собственной рамки и заголовка — для встраивания в карточку «Настройки страниц» */
  bare?: boolean;
}) {
  const footer = settings.footer;

  const patchFooter = (changes: Partial<SiteSettings["footer"]>) =>
    update({ ...settings, footer: { ...footer, ...changes } });

  const setTitle = (key: "calculatorsTitle" | "storeTitle", value: string) =>
    patchFooter({ [key]: value } as Partial<SiteSettings["footer"]>);

  const links = footer.links;
  const info = footer.info;

  const patchLink = (id: string, changes: Partial<FooterLinkItem>) =>
    patchFooter({ links: links.map((item) => (item.id === id ? { ...item, ...changes } : item)) });

  const patchInfo = (id: string, changes: Partial<FooterStoreItem>) =>
    patchFooter({ info: info.map((item) => (item.id === id ? { ...item, ...changes } : item)) });

  const moveBy = <T,>(list: T[], index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return null;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  };

  const visibleLinks = links.filter((item) => item.enabled);
  const visibleInfo = info.filter((item) => item.enabled);

  const titles: { key: "calculatorsTitle" | "storeTitle"; label: string; hint: string }[] = [
    {
      key: "calculatorsTitle",
      label: "Заголовок колонки со ссылками",
      hint: "Исходное значение: «Калькуляторы»",
    },
    {
      key: "storeTitle",
      label: "Заголовок колонки с информацией о магазине",
      hint: "Исходное значение: «Магазин»",
    },
  ];

  return (
    <div className={bare ? "" : "rounded-xl border border-line bg-white p-3 shadow-[0_1px_8px_rgba(20,25,27,0.03)]"}>
      {!bare && (<>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pro text-graphite">
            <RectangleHorizontal size={16} strokeWidth={2.3} />
          </div>
          <div>
            <span className="inline-block rounded-full border border-line bg-smoke px-2 py-px text-[10px] font-bold text-graphite/60">
              Блок · Подвал сайта
            </span>
            <h3 className="mt-0.5 text-[15px] font-black leading-tight">Нижний блок с логотипом</h3>
          </div>
        </div>
        <span className="rounded-md bg-smoke px-2 py-0.5 text-[11px] font-bold text-graphite/70">
          {visibleLinks.length} из {links.length} ссылок · {visibleInfo.length} из {info.length} строк
        </span>
      </div>

      <p className="mt-2 text-[12px] leading-snug text-graphite/55">
        Заголовки колонок, ссылки и текст. Строки можно править, переставлять, скрывать и добавлять.
      </p>
      </>)}

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {titles.map((field) => (
          <label key={field.key} className="block">
            <span className="text-[12px] font-bold text-graphite/65">{field.label}</span>
            <input
              value={footer[field.key]}
              onChange={(event) => setTitle(field.key, event.target.value)}
              maxLength={60}
              aria-label={field.label}
              className="mt-1 w-full rounded-lg border border-transparent bg-smoke px-3 py-1.5 text-[13px] font-semibold outline-none transition-colors focus:border-pro"
            />
            <span className="mt-1 block text-[11px] font-medium text-graphite/40">{field.hint}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div>
          <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-graphite/70">
            <Link2 size={14} strokeWidth={2.4} className="text-graphite/40" />
            Ссылки колонки «{footer.calculatorsTitle.trim() || "Калькуляторы"}»
          </div>

          <div className="space-y-2">
            {links.map((item, index) => (
              <FooterRow
                key={item.id}
                index={index}
                total={links.length}
                enabled={item.enabled}
                moveLabels={["Поднять ссылку выше", "Опустить ссылку ниже"]}
                onMove={(delta) => {
                  const next = moveBy(links, index, delta);
                  if (next) patchFooter({ links: next });
                }}
                onToggle={() => patchLink(item.id, { enabled: !item.enabled })}
                onRemove={() => patchFooter({ links: links.filter((it) => it.id !== item.id) })}
              >
                <div className="space-y-1.5">
                  <FooterField
                    value={item.label}
                    onChange={(value) => patchLink(item.id, { label: value })}
                    ariaLabel={`Название ссылки ${index + 1}`}
                    placeholder="Название ссылки"
                    className={cn(!item.enabled && "text-graphite/45 line-through")}
                  />
                  <FooterField
                    value={item.href}
                    onChange={(value) => patchLink(item.id, { href: value })}
                    ariaLabel={`Адрес ссылки ${index + 1}`}
                    placeholder="#/grilyato или https://…"
                    maxLength={400}
                    className="text-[12px] font-semibold text-graphite/65"
                  />
                  <div className="flex items-center gap-1.5 px-0.5 text-[10.5px] font-semibold text-graphite/40">
                    {/^https?:\/\//i.test(item.href.trim()) ? (
                      <>
                        <ExternalLink size={10} strokeWidth={2.4} />
                        внешний сайт — откроется в новой вкладке
                      </>
                    ) : (
                      <>страница сайта — адрес вида #/grilyato или #/armstrong#calc</>
                    )}
                  </div>
                </div>
              </FooterRow>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              patchFooter({
                links: [
                  ...links,
                  { id: `f-${Date.now()}`, label: "Новая ссылка", href: "#/", enabled: true },
                ],
              })
            }
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-graphite/30 px-4 py-2.5 text-[13px] font-extrabold text-graphite/70 transition-colors hover:border-pro hover:bg-pro/10 hover:text-graphite"
          >
            <Plus size={15} strokeWidth={2.6} />
            Добавить ссылку
          </button>
        </div>

        <div>
          <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-graphite/70">
            <Type size={14} strokeWidth={2.4} className="text-graphite/40" />
            Текст колонки «{footer.storeTitle.trim() || "Магазин"}»
          </div>

          <div className="space-y-2">
            {info.map((item, index) => (
              <FooterRow
                key={item.id}
                index={index}
                total={info.length}
                enabled={item.enabled}
                moveLabels={["Поднять строку выше", "Опустить строку ниже"]}
                onMove={(delta) => {
                  const next = moveBy(info, index, delta);
                  if (next) patchFooter({ info: next });
                }}
                onToggle={() => patchInfo(item.id, { enabled: !item.enabled })}
                onRemove={() => patchFooter({ info: info.filter((it) => it.id !== item.id) })}
              >
                <div className="space-y-1.5">
                  <FooterField
                    value={item.text}
                    onChange={(value) => patchInfo(item.id, { text: value })}
                    ariaLabel={`Текст строки ${index + 1}`}
                    placeholder="Например: Копейское шоссе, 64"
                    maxLength={160}
                    className={cn(!item.enabled && "text-graphite/45 line-through")}
                  />
                  <div className="flex flex-wrap items-center gap-1">
                    {FOOTER_ICON_KEYS.map((key) => {
                      const active = item.icon === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => patchInfo(item.id, { icon: key })}
                          aria-pressed={active}
                          aria-label={`Значок: ${FOOTER_ICON_TITLES[key]}`}
                          title={FOOTER_ICON_TITLES[key]}
                          className={cn(
                            "grid h-7 w-7 place-items-center rounded-lg border transition-colors",
                            active
                              ? "border-graphite bg-graphite text-pro"
                              : "border-line bg-white text-graphite/45 hover:bg-smoke hover:text-graphite",
                          )}
                        >
                          <FooterIcon name={key} size={13} strokeWidth={2.4} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FooterRow>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              patchFooter({
                info: [
                  ...info,
                  { id: `fi-${Date.now()}`, text: "Новая строка", icon: "phone", enabled: true },
                ],
              })
            }
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-graphite/30 px-4 py-2.5 text-[13px] font-extrabold text-graphite/70 transition-colors hover:border-pro hover:bg-pro/10 hover:text-graphite"
          >
            <Plus size={15} strokeWidth={2.6} />
            Добавить строку
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl bg-ink p-4 text-white">
        <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/35">
          Так блок видят посетители
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-white/45">
              {footer.calculatorsTitle.trim() || "Без заголовка"}
            </div>
            {visibleLinks.length === 0 ? (
              <div className="mt-2 text-[12.5px] font-semibold text-white/35">Ссылки скрыты</div>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {visibleLinks.map((item) => (
                  <li key={item.id}>
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-white/75">
                      {item.label}
                      <ArrowUpRight size={11} strokeWidth={2.4} className="text-pro/70" />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-white/45">
              {footer.storeTitle.trim() || "Без заголовка"}
            </div>
            {visibleInfo.length === 0 ? (
              <div className="mt-2 text-[12.5px] font-semibold text-white/35">Строки скрыты</div>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {visibleInfo.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-[13px] text-white/75">
                    <FooterIcon name={item.icon} size={13} className="mt-0.5 shrink-0 text-pro" />
                    {item.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* БЛОК: Редактор «Готовый размер листа» для калькулятора кровли (NumberField, SheetEditor)
 * ЗА ЧТО ОТВЕЧАЕТ: Позволяет редактировать и добавлять новые кнопки кровельных материалов (название, ширина и длина листа в м, перехлёсты по ширине и длине в мм) для калькулятора на странице «Кровля».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Массив settings.sheets из SiteSettings.
 * КАК ИЗМЕНИТЬ: Заводской список листов (С20, С8, Ондулин, Монтерей) лежит в DEFAULT_SETTINGS.sheets в src/data/siteSettings.ts. */
export function NumberField({
  label,
  unit,
  value,
  onChange,
  icon: Icon,
  step = "any",
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  icon: typeof Ruler;
  step?: string;
}) {
  const [text, setText] = useState(String(value).replace(".", ","));
  useEffect(() => setText(String(value).replace(".", ",")), [value]);

  const commit = (raw: string) => {
    setText(raw);
    const parsed = parseFloat(raw.replace(",", "."));
    if (Number.isFinite(parsed) && parsed >= 0) onChange(parsed);
  };

  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-graphite/45">
        <Icon size={11} strokeWidth={2.4} />
        {label}
      </span>
      <span className="mt-1 flex items-baseline gap-1">
        <input
          value={text}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setText(String(value).replace(".", ","))}
          inputMode="decimal"
          step={step}
          aria-label={`${label}, ${unit}`}
          className="no-spin w-full rounded-lg bg-smoke px-2 py-1.5 text-right text-[14px] font-extrabold tabular outline-none border border-transparent transition-colors focus:border-pro"
        />
        <span className="shrink-0 text-[11.5px] font-semibold text-graphite/45">{unit}</span>
      </span>
    </label>
  );
}

export function SheetEditor({
  settings,
  update,
  bare = false,
}: {
  settings: SiteSettings;
  update: (next: SiteSettings) => void;
  /** Без собственной рамки и заголовка — для встраивания в карточку «Настройки страниц» */
  bare?: boolean;
}) {
  const items = settings.sheets;
  const setItems = (next: SheetPresetItem[]) => update({ ...settings, sheets: next });

  const patch = (id: string, changes: Partial<SheetPresetItem>) =>
    setItems(items.map((it) => (it.id === id ? { ...it, ...changes } : it)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const clampSize = (v: number) => Math.min(SHEET_SIZE_MAX, Math.max(SHEET_SIZE_MIN, v));
  const clampOverlap = (v: number) => Math.min(SHEET_OVERLAP_MAX, Math.max(0, Math.round(v)));
  const visible = items.filter((item) => item.enabled);

  return (
    <div className={bare ? "" : "rounded-xl border border-line bg-white p-3 shadow-[0_1px_8px_rgba(20,25,27,0.03)]"}>
      {!bare && (<>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pro text-graphite">
            <Layers size={16} strokeWidth={2.3} />
          </div>
          <div>
            <span className="inline-block rounded-full border border-line bg-smoke px-2 py-px text-[10px] font-bold text-graphite/60">
              Блок · Калькулятор кровли
            </span>
            <h3 className="mt-0.5 text-[15px] font-black leading-tight">Готовый размер листа</h3>
          </div>
        </div>
        <span className="rounded-md bg-smoke px-2 py-0.5 text-[11px] font-bold text-graphite/70">
          {visible.length} из {items.length} размеров
        </span>
      </div>

      <p className="mt-2 text-[12px] leading-snug text-graphite/55">
        Кнопки готового размера: ширина, длина и перехлёсты листа. Можно править и добавлять виды.
      </p>
      </>)}

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "rounded-lg border p-2.5 transition-colors",
              item.enabled ? "border-line bg-smoke/40" : "border-line bg-smoke/70 opacity-70",
            )}
          >
            <div className="flex items-start gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-[12px] font-extrabold tabular text-graphite/60">
                {index + 1}
              </span>

              <input
                value={item.label}
                onChange={(e) => patch(item.id, { label: e.target.value })}
                aria-label={`Название размера ${index + 1}`}
                placeholder="Например: Профнастил НС35"
                className={cn(
                  "min-w-0 flex-1 rounded-lg border border-transparent bg-white px-3 py-1.5 text-[13.5px] font-extrabold outline-none transition-colors focus:border-pro",
                  !item.enabled && "text-graphite/45 line-through",
                )}
              />

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Поднять размер выше"
                  title="Поднять выше"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-graphite/60 transition-colors hover:border-graphite/50 hover:bg-smoke disabled:opacity-35"
                >
                  <ChevronUp size={15} strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Опустить размер ниже"
                  title="Опустить ниже"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-graphite/60 transition-colors hover:border-graphite/50 hover:bg-smoke disabled:opacity-35"
                >
                  <ChevronDown size={15} strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => patch(item.id, { enabled: !item.enabled })}
                  aria-pressed={item.enabled}
                  aria-label={item.enabled ? "Скрыть размер" : "Показать размер"}
                  title={item.enabled ? "Показывается — нажмите, чтобы скрыть" : "Скрыт — нажмите, чтобы показать"}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg border transition-colors",
                    item.enabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "border-line bg-white text-graphite/40 hover:bg-smoke",
                  )}
                >
                  {item.enabled ? <Eye size={15} strokeWidth={2.4} /> : <EyeOff size={15} strokeWidth={2.4} />}
                </button>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((it) => it.id !== item.id))}
                  disabled={items.length <= 1}
                  aria-label="Удалить размер"
                  title="Удалить размер"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-graphite/50 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-35"
                >
                  <Trash2 size={15} strokeWidth={2.4} />
                </button>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <NumberField
                label="Ширина" unit="м" value={item.sheetWidth} icon={RectangleHorizontal}
                onChange={(v) => patch(item.id, { sheetWidth: clampSize(v) })}
              />
              <NumberField
                label="Длина" unit="м" value={item.sheetLength} icon={Ruler}
                onChange={(v) => patch(item.id, { sheetLength: clampSize(v) })}
              />
              <NumberField
                label="Перехлёст Ш" unit="мм" value={item.overlapWidth} icon={RectangleHorizontal}
                step="1" onChange={(v) => patch(item.id, { overlapWidth: clampOverlap(v) })}
              />
              <NumberField
                label="Перехлёст Д" unit="мм" value={item.overlapLength} icon={Ruler}
                step="1" onChange={(v) => patch(item.id, { overlapLength: clampOverlap(v) })}
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 border-t border-line/70 pt-1.5 text-[10.5px] font-semibold text-graphite/50">
              <span className="tabular">
                лист {item.sheetWidth.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ×{" "}
                {item.sheetLength.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} м
              </span>
              <span className="tabular">
                перехлёст {fmtNum(item.overlapWidth)} / {fmtNum(item.overlapLength)} мм
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          setItems([
            ...items,
            {
              id: `s-${Date.now()}`,
              label: "Новый размер",
              sheetWidth: 1,
              sheetLength: 2,
              overlapWidth: 50,
              overlapLength: 150,
              enabled: true,
            },
          ])
        }
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-graphite/30 px-3 py-1.5 text-[12px] font-extrabold text-graphite/70 transition-colors hover:border-pro hover:bg-pro/10 hover:text-graphite"
      >
        <Plus size={15} strokeWidth={2.6} />
        Добавить вид листа
      </button>

      <div className="mt-4">
        <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-graphite/45">
          Предпросмотр кнопок на странице «Кровля»
        </div>
        <div className="rounded-2xl border border-line bg-smoke/60 p-3">
          {visible.length === 0 ? (
            <span className="block px-1 py-2 text-[12.5px] font-semibold text-graphite/45">
              Все размеры скрыты — блок «Готовый размер листа» предложит ввод вручную
            </span>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((item) => (
                <span
                  key={item.id}
                  className="rounded-xl border border-line bg-white px-3 py-2.5 text-left"
                >
                  <span className="block truncate text-[12.5px] font-extrabold text-graphite">{item.label}</span>
                  <span className="mt-0.5 block text-[11.5px] font-semibold tabular text-graphite/65">
                    {item.sheetWidth.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ×{" "}
                    {item.sheetLength.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} м
                  </span>
                  <span className="mt-0.5 block text-[10.5px] font-semibold tabular text-graphite/45">
                    перехлёст {fmtNum(item.overlapWidth)} / {fmtNum(item.overlapLength)} мм
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* БЛОК: Панель связи с Google-таблицей «Общие настройки для всех пользователей» (SyncPanel)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает статус подключения к таблице (версию, время публикации, ошибки) и раскрывает форму ввода адреса веб-приложения Google Apps Script («…/exec») и пароля записи.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Состояние sync из useSettingsSync() и настройки подключения из getApiConfig() / SETTINGS_SHEET (src/data/settingsSync.ts).
 * КАК ИЗМЕНИТЬ: Ссылка на саму таблицу задана в SETTINGS_SHEET в файле src/data/settingsSync.ts. */
function SyncPanel({
  sync,
  publishState,
}: {
  sync: ReturnType<typeof useSettingsSync>;
  publishState: { busy: boolean; message: string; error: string };
}) {
  const [config, setConfig] = useState(getApiConfig);
  const [draftUrl, setDraftUrl] = useState(config.url);
  const [draftToken, setDraftToken] = useState(config.token);
  /* Панель «Подключение к таблице» по умолчанию свёрнута, как и остальные раскрывающиеся блоки админки */
  const [open, setOpen] = useState(false);
  const [savedConfig, setSavedConfig] = useState(false);

  const saveConnection = () => {
    const next = setApiConfig({ url: draftUrl, token: draftToken });
    setConfig(next);
    setSavedConfig(true);
    window.setTimeout(() => setSavedConfig(false), 2500);
    void sync.check();
  };

  const statusView = (() => {
    if (sync.checking && sync.status === "loading")
      return { text: "Проверяем таблицу…", tone: "text-graphite/60", icon: Loader2, spin: true };
    if (sync.status === "live")
      return { text: "Таблица подключена — настройки видят все", tone: "text-emerald-700", icon: Cloud, spin: false };
    if (sync.status === "empty")
      return { text: "Таблица пока пуста — сохраните настройки", tone: "text-amber-700", icon: CloudUpload, spin: false };
    if (sync.status === "offline")
      return { text: "Нет связи с таблицей — показаны сохранённые настройки", tone: "text-red-600", icon: CloudOff, spin: false };
    return { text: "Проверяем таблицу…", tone: "text-graphite/60", icon: Loader2, spin: true };
  })();

  const StatusIcon = statusView.icon;

  return (
    <div className="rounded-xl border border-line bg-white p-3 shadow-[0_1px_8px_rgba(20,25,27,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pro text-graphite">
            <Users size={16} strokeWidth={2.3} />
          </div>
          <div>
            <span className="inline-block rounded-full border border-line bg-smoke px-2 py-px text-[10px] font-bold text-graphite/60">
              Блок · Google-таблица
            </span>
            <h3 className="mt-0.5 text-[15px] font-black leading-tight">Общие настройки для всех пользователей</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void sync.check()}
          disabled={sync.checking}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-[12.5px] font-bold text-graphite/75 transition-colors hover:border-graphite/50 disabled:opacity-60"
        >
          <RefreshCw size={14} strokeWidth={2.4} className={cn(sync.checking && "animate-spin")} />
          Проверить
        </button>
      </div>

      <p className="mt-2 text-[12px] leading-snug text-graphite/55">
        Настройки хранятся в Google-таблице. После «Сохранить и опубликовать» они появляются у всех посетителей.
      </p>

      <div className="mt-3 space-y-2 rounded-xl border border-line bg-smoke/60 p-3">
        <div className={cn("flex items-center gap-2 text-[13.5px] font-extrabold", statusView.tone)}>
          <StatusIcon size={16} strokeWidth={2.5} className={cn(statusView.spin && "animate-spin")} />
          {statusView.text}
        </div>

        <div className="grid gap-1.5 text-[12.5px] font-semibold text-graphite/60 md:grid-cols-2">
          <div>
            Версия в таблице:{" "}
            <span className="tabular text-graphite/80">{sync.revision ? sync.revision : "—"}</span>
          </div>
          <div>
            Последняя публикация:{" "}
            <span className="text-graphite/80">{sync.updatedAt || "—"}</span>
          </div>
          <div>
            Проверено:{" "}
            <span className="text-graphite/80">
              {sync.checkedAt ? sync.checkedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
            </span>
          </div>
          <div>
            Запись настроена:{" "}
            <span className={cn("font-extrabold", config.url ? "text-emerald-700" : "text-amber-700")}>
              {config.url ? "да" : "нет"}
            </span>
          </div>
        </div>

        {(sync.error || publishState.error) && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-semibold text-red-700">
            <AlertTriangle size={14} strokeWidth={2.4} className="mt-0.5 shrink-0" />
            <span>{publishState.error || sync.error}</span>
          </div>
        )}

        {publishState.message && !publishState.error && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] font-bold text-emerald-700">
            <Check size={14} strokeWidth={2.6} />
            {publishState.message}
          </div>
        )}

        {publishState.busy && (
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] font-bold text-graphite/70">
            <Loader2 size={14} strokeWidth={2.4} className="animate-spin" />
            Публикуем настройки в таблицу…
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-graphite/70 transition-colors hover:text-graphite"
      >
        {open ? <ChevronUp size={14} strokeWidth={2.6} /> : <ChevronDown size={14} strokeWidth={2.6} />}
        Подключение к таблице
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-2xl border border-line p-4">
          <div>
            <label className="flex items-center gap-1.5 text-[12.5px] font-bold text-graphite/70">
              <Link2 size={14} strokeWidth={2.4} className="text-graphite/40" />
              Адрес веб-приложения Google Apps Script (оканчивается на /exec)
            </label>
            <input
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              spellCheck={false}
              className="mt-1.5 w-full rounded-lg border border-transparent bg-smoke px-3 py-2 text-[13px] font-semibold outline-none transition-colors focus:border-pro"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[12.5px] font-bold text-graphite/70">
              <KeyRound size={14} strokeWidth={2.4} className="text-graphite/40" />
              Пароль записи (значение TOKEN в коде Apps Script)
            </label>
            <input
              value={draftToken}
              onChange={(e) => setDraftToken(e.target.value)}
              type="password"
              placeholder="Пароль записи из Apps Script"
              className="mt-1.5 w-full rounded-lg border border-transparent bg-smoke px-3 py-2 text-[13px] font-semibold outline-none transition-colors focus:border-pro"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveConnection}
              className="inline-flex items-center gap-1.5 rounded-xl bg-graphite px-4 py-2.5 text-[12.5px] font-extrabold text-white transition-all hover:bg-pro hover:text-graphite"
            >
              {savedConfig ? <Check size={14} strokeWidth={2.6} /> : <Save size={14} strokeWidth={2.5} />}
              {savedConfig ? "Подключение сохранено" : "Сохранить подключение"}
            </button>

            <a
              href={SETTINGS_SHEET.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-[12.5px] font-bold text-graphite/75 transition-colors hover:border-graphite/50"
            >
              <FileSpreadsheet size={14} strokeWidth={2.4} />
              Открыть таблицу настроек
              <ExternalLink size={12} strokeWidth={2.4} />
            </a>
          </div>

          <p className="text-[12px] leading-relaxed text-graphite/55">
            Код веб-приложения лежит в файле <span className="font-bold">scripts/settings-sheet-api.gs</span>.
            В таблице откройте «Расширения» → «Apps Script», вставьте код, опубликуйте его как веб-приложение
            с доступом «У всех» и вставьте сюда полученный адрес. Саму таблицу откройте на чтение по ссылке,
            чтобы настройки читались у всех посетителей.
          </p>
        </div>
      )}
    </div>
  );
}

/* БЛОК: Главный компонент страницы «Администрирование» (AdminPage)
 * ЗА ЧТО ОТВЕЧАЕТ: Проверяет разблокировку паролем, предупреждает при уходе с несохранёнными правками, собирает верхнюю шапку статистики, сворачиваемые разделы «Карта страниц», «Карта блоков» и «Глобальные настройки», а также закреплённую снизу панель «Сохранить и опубликовать» / «Сбросить к исходным».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: loadSettings(), publishSettings(), publishDefaultSettings(), useSettingsSync() и массив PAGES.
 * КАК ИЗМЕНИТЬ: Все тексты разделов и кнопок сохранения редактируются в соответствующих JSX-блоках ниже. */
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(isAdminUnlocked);
  const [session, setSession] = useState(() => getAdminSessionInfo());

  const [settings, setSettings] = useState<SiteSettings>(loadSettings);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");
  const [publishState, setPublishState] = useState({ busy: false, message: "", error: "" });

  const sync = useSettingsSync();
  const sections = useCollapsedSections();

  /* БЛОК: Слежение за входом в панель (unlocked, session)
   * ЗА ЧТО ОТВЕЧАЕТ: Открывает панель после успешного входа через Supabase, показывает почту и роль
   *   вошедшего администратора и закрывает панель после выхода из аккаунта.
   * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: src/utils/adminSession.ts (данные из базы Supabase).
   * КАК ИЗМЕНИТЬ: Не требуется. */
  useEffect(() => {
    setUnlocked(isAdminUnlocked());
    setSession(getAdminSessionInfo());
    return subscribeAdminSession(() => {
      setUnlocked(isAdminUnlocked());
      setSession(getAdminSessionInfo());
    });
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  useEffect(() => {
    if (dirty || publishState.busy) return;
    setSettings(loadSettings());
  }, [sync.revision, dirty, publishState.busy]);

  const counts = useMemo(
    () => ({
      total: PAGES.length,
      calcs: PAGES.filter((p) => p.category === "Калькулятор").length,
      smetas: PAGES.filter((p) => p.category === "Спецификация").length,
    }),
    [],
  );

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const update = (next: SiteSettings) => {
    setSettings(next);
    setDirty(true);
  };

  const publish = async (next: SiteSettings, title: string) => {
    setPublishState({ busy: true, message: "", error: "" });

    const result = await publishSettings(next);

    setSettings(loadSettings());
    setDirty(false);
    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    setSavedAt(time);
    window.setTimeout(() => setSavedAt(""), 5000);

    if (result.ok) {
      setPublishState({
        busy: false,
        message: `${title} в ${time}: настройки видят все пользователи сайта`,
        error: "",
      });
      window.setTimeout(() => setPublishState((s) => ({ ...s, message: "" })), 8000);
    } else {
      setPublishState({
        busy: false,
        message: "",
        error:
          `${result.error ?? "Не удалось записать настройки в таблицу"}. ` +
          "Изменения применены только в этом браузере — заполните «Подключение к таблице».",
      });
    }
  };

  const apply = () => void publish(settings, "Опубликовано");

  const reset = () =>
    void (async () => {
      setPublishState({ busy: true, message: "", error: "" });
      const { settings: base, result } = await publishDefaultSettings();
      setSettings(base);
      setDirty(false);
      const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      setSavedAt(time);
      window.setTimeout(() => setSavedAt(""), 5000);
      setPublishState({
        busy: false,
        message: result.ok ? `Заводские настройки опубликованы в ${time}` : "",
        error: result.ok
          ? ""
          : `${result.error ?? "Таблица недоступна"}. Сброс применён только в этом браузере.`,
      });
    })();

  const lock = () => {
    lockAdmin();
    setUnlocked(false);
  };

  const isDefault = JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS);

  const pageSettingsOpen = sections.isOpen("page-settings");

  return (
    <>
      {/* БЛОК: Верхняя шапка страницы «Администрирование» со счётчиками и кнопкой «Заблокировать» | ЗА ЧТО ОТВЕЧАЕТ: Приветственный экран админки и выход из сессии | ОТКУДА ДАННЫЕ: Объект counts (считается из массива PAGES) | КАК ИЗМЕНИТЬ: Поменяйте текст внутри <h1> и <p> */}
      <section className="relative overflow-hidden bg-graphite text-white">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative mx-auto max-w-[1400px] px-4 pb-14 pt-16 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="flex flex-col items-start gap-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[13px] font-semibold text-white/85 backdrop-blur">
                  <ShieldCheck size={14} className="text-pro" />
                  Панель управления проектом
                </div>
                {session && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-pro/30 bg-pro/10 px-4 py-1.5 text-[13px] font-semibold text-pro">
                    <Users size={14} strokeWidth={2.4} />
                    {session.email}
                    <span className="rounded-full bg-pro/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-graphite">
                      {session.role}
                    </span>
                  </div>
                )}
              </div>

              {session?.warning && (
                <div className="flex max-w-2xl items-start gap-2 rounded-xl border border-pro/30 bg-pro/10 px-4 py-3 text-[12.5px] font-medium leading-relaxed text-pro">
                  <AlertTriangle size={15} strokeWidth={2.3} className="mt-0.5 shrink-0" />
                  {session.warning}
                </div>
              )}
            </motion.div>

            <button
              type="button"
              onClick={lock}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3.5 py-2 text-[12.5px] font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={14} strokeWidth={2.4} />
              Заблокировать
            </button>
          </div>

          {/* БЛОК: Быстрый переход на любую страницу сайта | ЗА ЧТО ОТВЕЧАЕТ: Отдельная строка кнопок сразу под шапкой «Панель управления проектом» — один клик открывает нужную страницу. Это самостоятельный блок, с разделом «Карта страниц» он не связан | ОТКУДА ДАННЫЕ: Массив PAGES в начале этого файла | КАК ИЗМЕНИТЬ: Добавьте или удалите объект в PAGES — кнопка появится или исчезнет автоматически */}
          <div className="mt-5 max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease }}
              className="text-[40px] font-black leading-[1.02] tracking-[-0.02em] sm:text-[56px] lg:text-[72px]"
            >
              Администрирование
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.16, ease }}
              className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/70 lg:text-[18px]"
            >
              Карта всех страниц сайта и настройка блоков: бегущая строка и порядок кнопок
              в выпадающем списке шапки.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.28, ease }}
            className="mt-10 grid max-w-3xl grid-cols-3 gap-3"
          >
            {[
              { label: "Всего страниц", value: counts.total },
              { label: "Калькуляторов", value: counts.calcs },
              { label: "Спецификаций", value: counts.smetas },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <div className="text-[28px] font-black leading-none tabular text-pro lg:text-[34px]">
                  {stat.value}
                </div>
                <div className="mt-1 text-[12px] font-medium text-white/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* БЛОК: Быстрые переходы к разделам админки | ЗА ЧТО ОТВЕЧАЕТ: Кнопка под счётчиками прокручивает экран к разделу «Настройка страниц» | ОТКУДА ДАННЫЕ: Якоря страницы в этом же файле */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.36, ease }}
            className="mt-5 flex flex-wrap gap-3"
          >
            <a
              href="#/admin#page-settings"
              className="group inline-flex h-[46px] items-center gap-2 rounded-2xl bg-pro px-6 text-[14px] font-extrabold text-graphite transition-all hover:gap-3 hover:bg-pro-soft"
            >
              Настройка страниц
              <ArrowRight size={16} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* БЛОК: Секция «Настройка страниц» с кнопками всех страниц в 2 строки и редактором всех блоков страницы | ЗА ЧТО ОТВЕЧАЕТ: Позволяет выбрать любую страницу сайта и сразу редактировать все её блоки | ОТКУДА ДАННЫЕ: Компонент PageSettingsSection */}
      <PageSettingsSection
        settings={settings}
        update={update}
        pages={PAGES}
        open={pageSettingsOpen}
        onToggleOpen={() => sections.toggle("page-settings")}
      />

      {/* БЛОК: Секция «Общие параметры сайта / Глобальные настройки» с панелью Google-таблицы и плашкой публикации | ЗА ЧТО ОТВЕЧАЕТ: Отдельный раздел на шалфейно-изумрудном фоне с панелью «Блок · Google-таблица» и плашкой сохранения/сброса настроек под ней | ОТКУДА ДАННЫЕ: Хук useSettingsSync() и параметры подключения из src/data/settingsSync.ts | КАК ИЗМЕНИТЬ: Заголовок, вступление и цвет секции bg-[#eaf5ee] меняются в этом блоке; адрес таблицы — в SETTINGS_SHEET (src/data/settingsSync.ts), код записи — в scripts/settings-sheet-api.gs */}
      <section id="global" className="scroll-mt-[130px] bg-[#eaf5ee] py-8 lg:py-10">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease }}
            className="mb-4 flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-[#b8dac6] bg-white/85 px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#1d5e3a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2f8f5b]" aria-hidden="true" />
                Общие параметры сайта
              </div>
              <h2 className="text-[22px] font-black leading-[1.05] tracking-[-0.01em] lg:text-[28px]">
                Глобальные настройки
              </h2>
            </div>
            <p className="max-w-md text-[12.5px] leading-snug text-graphite/60">
              Связь с Google-таблицей, версия настроек и подключение веб-приложения для записи.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease }}
          >
            <SyncPanel sync={sync} publishState={publishState} />
          </motion.div>

          {/* БЛОК: Панель публикации и сброса настроек | ЗА ЧТО ОТВЕЧАЕТ: Показывает индикатор несохранённых изменений и кнопки «Сбросить к исходным» / «Сохранить и опубликовать» под блоком «Блок · Google-таблица» | ОТКУДА ДАННЫЕ: Флаг dirty и функции reset / apply | КАК ИЗМЕНИТЬ: Подписи кнопок и статусов редактируются внутри этого блока */}
          <div className="mt-4 rounded-xl border border-line bg-white/95 p-3 shadow-[0_12px_34px_rgba(20,25,27,0.12)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-[13px] font-semibold">
                {publishState.busy ? (
                  <span className="flex items-center gap-2 text-graphite/70">
                    <Loader2 size={15} strokeWidth={2.5} className="animate-spin" />
                    Публикуем настройки для всех пользователей…
                  </span>
                ) : dirty ? (
                  <span className="flex items-center gap-2 text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Есть неопубликованные изменения
                  </span>
                ) : publishState.error ? (
                  <span className="flex items-center gap-2 text-red-600">
                    <CloudOff size={15} strokeWidth={2.5} />
                    Сохранено только в этом браузере
                  </span>
                ) : savedAt ? (
                  <span className="flex items-center gap-2 text-emerald-700">
                    <Check size={15} strokeWidth={2.6} />
                    Опубликовано для всех в {savedAt}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-graphite/55">
                    <Cloud size={15} strokeWidth={2.4} className="text-graphite/35" />
                    Все изменения применены у всех пользователей
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={(isDefault && !dirty) || publishState.busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-[12.5px] font-bold text-graphite/75 transition-colors hover:border-graphite/50 disabled:opacity-40"
                >
                  <RotateCcw size={14} strokeWidth={2.4} />
                  Сбросить к исходным
                </button>
                <button
                  type="button"
                  onClick={apply}
                  disabled={!dirty || publishState.busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-graphite px-5 py-2.5 text-[13px] font-extrabold text-white transition-all hover:bg-pro hover:text-graphite disabled:opacity-40 disabled:hover:bg-graphite disabled:hover:text-white"
                >
                  {publishState.busy ? (
                    <Loader2 size={15} strokeWidth={2.5} className="animate-spin" />
                  ) : (
                    <Save size={15} strokeWidth={2.5} />
                  )}
                  Сохранить и опубликовать
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
