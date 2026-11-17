/* ============================================================================
 * ФАЙЛ: src/utils/router.ts — Навигация по чистым адресам без решётки (#)
 * ЗА ЧТО ОТВЕЧАЕТ: Переключает страницы по обычным адресам вида /armstrong, /grilyato, /roof,
 *   /siding, /test, /admin, /404 без перезагрузки вкладки (History API), корректно работает
 *   как в корне домена, так и в подпапке GitHub Pages (например, /stroikacalc1011/armstrong),
 *   а старые закладки вида /#/armstrong автоматически переводит на чистый адрес /armstrong.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из адресной строки браузера (window.location.pathname и hash)
 *   и базового пути подпапки (переменная VITE_BASE_PATH при сборке или автоопределение).
 * КАК ИЗМЕНИТЬ: При добавлении новой страницы допишите её адрес в тип PageRoute и словарь ROUTES.
 * ========================================================================= */

import { useEffect, useState } from "react";

/* БЛОК: Список всех допустимых адресов страниц (PageRoute, ROUTES)
 * ЗА ЧТО ОТВЕЧАЕТ: Перечисляет внутренние маршруты сайта и псевдонимы старых адресов.
 * КАК ИЗМЕНИТЬ: Добавьте новый адрес в тип PageRoute и в словарь ROUTES ниже. */
export type PageRoute =
  | "/"
  | "/grilyato"
  | "/armstrong"
  | "/roof"
  | "/siding"
  | "/test"
  | "/admin"
  | "/404";

const ROUTES: Record<string, PageRoute> = {
  "/": "/",
  "/grilyato": "/grilyato",
  "/armstrong": "/armstrong",
  "/roof": "/roof",
  "/siding": "/siding",
  "/test": "/test",
  "/smeta-test": "/test",
  "/admin": "/admin",
  "/404": "/404",
};

const EXTERNAL_PROTOCOL_RE = /^(?:https?:|mailto:|tel:|javascript:|data:|blob:|\/\/)/i;
const STATIC_ASSET_RE = /\.(?:avif|bmp|css|csv|gif|ico|jpe?g|js|json|map|mp3|mp4|pdf|png|svg|txt|webm|webp|woff2?|xml|zip)$/i;

function normalizeBase(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "/" || trimmed === "." || trimmed === "./") return "";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "");
}

/* БЛОК: Определение базовой подпапки сайта (detectBasePath, BASE_PATH)
 * ЗА ЧТО ОТВЕЧАЕТ: Если сайт открыт в корне домена — возвращает "", а если опубликован
 *   в подпапке (например, https://user.github.io/stroikacalc1011/) — возвращает "/stroikacalc1011". */
function detectBasePath(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  if (env.VITE_BASE_PATH !== undefined) {
    return normalizeBase(env.VITE_BASE_PATH);
  }
  if (env.BASE_URL && env.BASE_URL !== "/" && env.BASE_URL !== "./") {
    return normalizeBase(env.BASE_URL);
  }
  if (typeof window === "undefined") return "";

  const { protocol, hostname, pathname } = window.location;
  if (protocol !== "http:" && protocol !== "https:") return "";

  if (/\/index\.html$/i.test(pathname)) {
    return normalizeBase(pathname.replace(/\/index\.html$/i, ""));
  }

  if (/\.github\.io$/i.test(hostname)) {
    const first = pathname.replace(/^\/+/, "").split("/")[0] ?? "";
    if (first && !(`/${first.toLowerCase()}` in ROUTES)) {
      return `/${first}`;
    }
  }

  return "";
}

const BASE_PATH = detectBasePath();

function canUseBrowserHistory(): boolean {
  if (typeof window === "undefined") return false;
  const { protocol, origin } = window.location;
  return (protocol === "http:" || protocol === "https:") && origin !== "null";
}

export function getBasePath(): string {
  return BASE_PATH;
}

/* БЛОК: Приведение внутренних ссылок к чистому виду без «#/» (normalizeInternalHref)
 * ЗА ЧТО ОТВЕЧАЕТ: Переводит старые адреса вида "#/armstrong" → "/armstrong", "#/" → "/",
 *   "#/armstrong#features" → "/armstrong#features". Внешние ссылки (https://…) и якоря
 *   текущей страницы (#calc, #systems) оставляет без изменений. */
export function normalizeInternalHref(rawHref: string): string {
  const trimmed = rawHref.trim();
  if (!trimmed) return "/";
  if (EXTERNAL_PROTOCOL_RE.test(trimmed)) return trimmed;

  if (trimmed === "#") return "/";

  if (trimmed.startsWith("#/")) {
    const withoutHash = trimmed.slice(1);
    const [rawPath = "/", anchor = ""] = withoutHash.split("#");
    const cleanPath = normalizeRoutePathname(rawPath);
    return anchor ? `${cleanPath}#${anchor}` : cleanPath;
  }

  if (trimmed.startsWith("#")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    const [rawPath = "/", anchor = ""] = trimmed.split("#");
    const cleanPath = normalizeRoutePathname(stripBasePath(rawPath));
    return anchor ? `${cleanPath}#${anchor}` : cleanPath;
  }

  return trimmed;
}

function normalizeRoutePathname(rawPath: string): string {
  const collapsed = `/${rawPath.replace(/^\/+|\/+$/g, "")}`;
  return collapsed === "/" ? "/" : collapsed;
}

/* БЛОК: Снятие префикса подпапки с пути (stripBasePath) */
export function stripBasePath(pathname: string): string {
  let clean = pathname || "/";
  if (BASE_PATH && (clean === BASE_PATH || clean.startsWith(`${BASE_PATH}/`))) {
    clean = clean.slice(BASE_PATH.length) || "/";
  }
  clean = clean.replace(/\/index\.html$/i, "") || "/";
  return clean.startsWith("/") ? clean : `/${clean}`;
}

/* БЛОК: Извлечение чистого пути страницы из любой ссылки (extractRoutePath)
 * ЗА ЧТО ОТВЕЧАЕТ: Возвращает канонический путь вида "/armstrong" или "/" без подпапки и без якоря. */
export function extractRoutePath(href: string): string {
  const normalized = normalizeInternalHref(href);
  if (EXTERNAL_PROTOCOL_RE.test(normalized) || normalized.startsWith("#")) return normalized;
  const pathOnly = normalized.split("#")[0] || "/";
  return normalizeRoutePathname(pathOnly);
}

/* БЛОК: Сборка готового href для тега <a> (toHref)
 * ЗА ЧТО ОТВЕЧАЕТ: Добавляет базовую подпапку сайта (если она есть) к чистому маршруту:
 *   в корне домена "/armstrong" → "/armstrong", на GitHub Pages → "/stroikacalc1011/armstrong". */
export function toHref(target: string): string {
  const trimmed = target.trim();
  if (!trimmed) return BASE_PATH ? `${BASE_PATH}/` : "/";
  if (EXTERNAL_PROTOCOL_RE.test(trimmed)) return trimmed;

  const normalized = normalizeInternalHref(trimmed);
  if (normalized.startsWith("#")) return normalized;

  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  const [pathPart = "/", anchor = ""] = withLeadingSlash.split("#");
  const fullPath =
    pathPart === "/"
      ? BASE_PATH
        ? `${BASE_PATH}/`
        : "/"
      : `${BASE_PATH}${pathPart}`;
  return anchor ? `${fullPath}#${anchor}` : fullPath;
}

/* БЛОК: Ссылка на файл из папки public/ (assetUrl)
 * ЗА ЧТО ОТВЕЧАЕТ: Строит корректный путь к изображениям (images/…) на любой вложенной странице
 *   (/armstrong, /armstrong/, /stroikacalc1011/armstrong и т.д.). */
export function assetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, "");
  if (typeof window !== "undefined" && !canUseBrowserHistory()) {
    return clean;
  }
  return `${BASE_PATH}/${clean}`;
}

/* БЛОК: Распознавание маршрута по pathname (resolveRoute)
 * ЗА ЧТО ОТВЕЧАЕТ: Сопоставляет путь страницы со списком ROUTES; при опечатке возвращает "/404". */
export function resolveRoute(pathname: string): PageRoute {
  const relative = stripBasePath(pathname);
  const trimmed = relative.replace(/^\/+|\/+$/g, "");
  if (!trimmed) return "/";
  const segments = trimmed.split("/");
  if (segments.length > 1) return "/404";
  const key = `/${segments[0].toLowerCase()}`;
  return ROUTES[key] ?? "/404";
}

export interface AppLocation {
  route: PageRoute;
  anchor: string;
  navId: number;
}

let navCounter = 0;
let memoryLocation: { route: PageRoute; anchor: string } = { route: "/", anchor: "" };
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

/* Перевод старых адресов с решёткой (/#/armstrong, /#/roof#features) в чистые (/armstrong, /roof#features) */
function upgradeLegacyHashUrl(): boolean {
  if (typeof window === "undefined") return false;
  const { hash } = window.location;
  if (!hash.startsWith("#/")) return false;

  const converted = normalizeInternalHref(hash);
  const [pathPart = "/", anchor = ""] = converted.split("#");
  memoryLocation = { route: resolveRoute(pathPart), anchor: decodeAnchor(anchor) };

  if (canUseBrowserHistory()) {
    try {
      window.history.replaceState(null, "", toHref(converted));
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

function decodeAnchor(raw: string): string {
  const clean = raw.replace(/^#/, "");
  if (!clean) return "";
  try {
    return decodeURIComponent(clean);
  } catch {
    return clean;
  }
}

function readCurrentLocation(): AppLocation {
  if (typeof window === "undefined") {
    return { route: "/", anchor: "", navId: navCounter };
  }

  upgradeLegacyHashUrl();

  if (!canUseBrowserHistory()) {
    return { route: memoryLocation.route, anchor: memoryLocation.anchor, navId: navCounter };
  }

  const route = resolveRoute(window.location.pathname);
  const rawHash = window.location.hash;
  const anchor = rawHash && !rawHash.startsWith("#/") ? decodeAnchor(rawHash) : "";

  // Убираем лишний завершающий слэш у внутренних разделов (например, /armstrong/ → /armstrong)
  const relative = stripBasePath(window.location.pathname);
  if (route !== "/404" && relative !== "/" && relative.endsWith("/")) {
    const cleanTarget = toHref(`${relative.replace(/\/+$/, "")}${anchor ? `#${anchor}` : ""}`);
    try {
      window.history.replaceState(null, "", cleanTarget);
    } catch {
      // Игнорируем ограничения браузера
    }
  }

  memoryLocation = { route, anchor };
  return { route, anchor, navId: navCounter };
}

/* БЛОК: Программный переход на страницу без перезагрузки (navigate) */
export function navigate(target: string, options?: { replace?: boolean }): void {
  if (typeof window === "undefined") return;

  const trimmed = target.trim();
  if (trimmed.startsWith("#") && !trimmed.startsWith("#/") && trimmed !== "#") {
    const anchor = decodeAnchor(trimmed);
    memoryLocation = { route: memoryLocation.route, anchor };
    if (canUseBrowserHistory()) {
      const nextUrl = `${window.location.pathname}${window.location.search}#${anchor}`;
      const sameUrl = window.location.hash === `#${anchor}`;
      try {
        if (options?.replace || sameUrl) {
          window.history.replaceState(null, "", nextUrl);
        } else {
          window.history.pushState(null, "", nextUrl);
        }
      } catch {
        // Работаем через состояние в памяти
      }
    }
    navCounter += 1;
    notifyListeners();
    return;
  }

  const normalized = normalizeInternalHref(trimmed);
  const [pathPart = "/", rawAnchor = ""] = normalized.split("#");
  const anchor = decodeAnchor(rawAnchor);
  const nextRoute = resolveRoute(pathPart);
  memoryLocation = { route: nextRoute, anchor };

  if (canUseBrowserHistory()) {
    const nextHref = toHref(normalized);
    const currentHref = `${window.location.pathname}${window.location.hash}`;
    try {
      if (options?.replace || nextHref === currentHref) {
        window.history.replaceState(null, "", nextHref);
      } else {
        window.history.pushState(null, "", nextHref);
      }
    } catch {
      // Работаем через состояние в памяти
    }
  }

  navCounter += 1;
  notifyListeners();
}

/* БЛОК: Хук отслеживания активной страницы и перехвата кликов по внутренним ссылкам (useAppLocation)
 * ЗА ЧТО ОТВЕЧАЕТ: Подписывается на кнопки «Назад»/«Вперёд» браузера и перехватывает обычные клики
 *   по внутренним ссылкам <a href="/...">, переключая страницы мгновенно без перезагрузки. */
export function useAppLocation(): AppLocation {
  const [location, setLocation] = useState<AppLocation>(readCurrentLocation);

  useEffect(() => {
    const sync = () => setLocation(readCurrentLocation());
    const onPopOrHash = () => {
      navCounter += 1;
      sync();
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;

      const linkTarget = link.getAttribute("target");
      if (linkTarget && linkTarget.toLowerCase() !== "_self") return;
      if (link.hasAttribute("download")) return;

      const rawHref = link.getAttribute("href")?.trim() ?? "";
      if (!rawHref) return;
      if (/^(?:mailto:|tel:|javascript:|data:|blob:)/i.test(rawHref)) return;

      // Старые ссылки с #/ и якоря текущей страницы (#calc, #systems)
      if (rawHref.startsWith("#")) {
        event.preventDefault();
        navigate(rawHref);
        return;
      }

      // Внутренние ссылки от корня (/armstrong, /roof#features и т.п.)
      if (rawHref.startsWith("/") && !rawHref.startsWith("//")) {
        const pathOnly = rawHref.split("#")[0]?.split("?")[0] ?? "/";
        if (STATIC_ASSET_RE.test(pathOnly)) return;
        if (BASE_PATH && pathOnly !== BASE_PATH && !pathOnly.startsWith(`${BASE_PATH}/`)) {
          // Если ссылка написана без подпапки (например, "/grilyato" из настроек) — ведём внутри сайта
          event.preventDefault();
          navigate(rawHref);
          return;
        }
        event.preventDefault();
        navigate(rawHref);
        return;
      }

      // Проверка полных ссылок того же домена
      if (!canUseBrowserHistory()) return;
      let parsed: URL;
      try {
        parsed = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (parsed.origin !== window.location.origin) return;
      if (STATIC_ASSET_RE.test(parsed.pathname)) return;
      if (BASE_PATH && parsed.pathname !== BASE_PATH && !parsed.pathname.startsWith(`${BASE_PATH}/`)) {
        return;
      }

      event.preventDefault();
      const relative = stripBasePath(parsed.pathname);
      navigate(`${relative}${parsed.hash}`);
    };

    listeners.add(sync);
    window.addEventListener("popstate", onPopOrHash);
    window.addEventListener("hashchange", onPopOrHash);
    document.addEventListener("click", onDocumentClick);

    return () => {
      listeners.delete(sync);
      window.removeEventListener("popstate", onPopOrHash);
      window.removeEventListener("hashchange", onPopOrHash);
      document.removeEventListener("click", onDocumentClick);
    };
  }, []);

  return location;
}
