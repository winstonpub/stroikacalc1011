/* ============================================================================
 * ФАЙЛ: src/data/settingsSync.ts — Чтение и запись общих настроек сайта в Google-таблицу
 * ЗА ЧТО ОТВЕЧАЕТ: Делает настройки из раздела «Администрирование» общими для ВСЕХ посетителей сайта: читает их из листа Google-таблицы (gid=2035849366) и отправляет туда изменения через веб-приложение Google Apps Script.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Чтение идёт напрямую из открытого по ссылке листа SETTINGS_SHEET в формате CSV; адрес и пароль записи хранятся в localStorage браузера администратора (задаются в админке).
 * КАК ИЗМЕНИТЬ:
 *   — Чтобы привязать другую таблицу или лист, поменяйте sheetId и gid в константе SETTINGS_SHEET.
 *   — Чтобы зашить адрес веб-приложения Apps Script прямо в код навсегда (чтобы не вводить в админке), впишите его в DEFAULT_SETTINGS_API_URL.
 * ========================================================================= */

import { parseCsv } from "./prices";
import type { SiteSettings } from "./siteSettings";

/* БЛОК: Параметры листа Google-таблицы и ключи подключения (SETTINGS_SHEET, DEFAULT_SETTINGS_API_URL, SETTINGS_REFRESH_MS)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт таблицу и лист для хранения настроек, частоту проверки (30 секунд) и максимальный размер одной ячейки (40 000 знаков).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Идентификатор таблицы и gid листа указаны в константе SETTINGS_SHEET.
 * КАК ИЗМЕНИТЬ: Поменяйте SETTINGS_REFRESH_MS (мс), если хотите проверять общие настройки чаще или реже 30 секунд. */
export const SETTINGS_SHEET = {
  sheetId: "1vfnmGjg2_2KXQPcAfb4UKIwwi1FfewI1pwJ2hcTBaIg",
  gid: "2035849366",
  url: "https://docs.google.com/spreadsheets/d/1vfnmGjg2_2KXQPcAfb4UKIwwi1FfewI1pwJ2hcTBaIg/edit?gid=2035849366#gid=2035849366",
} as const;

export const DEFAULT_SETTINGS_API_URL = "";

const API_URL_KEY = "site:settings-api-url";
const API_TOKEN_KEY = "site:settings-api-token";

export const SETTINGS_REFRESH_MS = 30_000;

const CHUNK_SIZE = 40_000;

export interface SettingsApiConfig {
  url: string;
  token: string;
}

export interface RemoteSettings {
  revision: number;
  settings: Partial<SiteSettings>;
  updatedAt: string;
  updatedBy: string;
}

/* БЛОК: Хранение адреса веб-приложения Apps Script и пароля записи (getApiConfig, setApiConfig, isPublishConfigured)
 * ЗА ЧТО ОТВЕЧАЕТ: Запоминает введённые на странице «Администрирование» адрес «…/exec» и пароль записи, чтобы администратору не приходилось вводить их заново.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из localStorage браузера администратора (или из DEFAULT_SETTINGS_API_URL, если он заполнен в коде).
 * КАК ИЗМЕНИТЬ: Настраивается прямо на сайте в разделе «Администрирование» → «Общие настройки для всех пользователей» → «Подключение к таблице». */
export function getApiConfig(): SettingsApiConfig {
  let url = DEFAULT_SETTINGS_API_URL;
  let token = "";
  try {
    url = localStorage.getItem(API_URL_KEY) || DEFAULT_SETTINGS_API_URL;
    token = localStorage.getItem(API_TOKEN_KEY) || "";
  } catch {}
  return { url: url.trim(), token: token.trim() };
}

export function setApiConfig(config: SettingsApiConfig): SettingsApiConfig {
  const safe = { url: config.url.trim(), token: config.token.trim() };
  try {
    localStorage.setItem(API_URL_KEY, safe.url);
    localStorage.setItem(API_TOKEN_KEY, safe.token);
  } catch {}
  return safe;
}

export function isPublishConfigured(): boolean {
  return /^https:\/\/script\.google\.com\/.+\/exec$/.test(getApiConfig().url);
}

/* БЛОК: Чтение общих настроек из листа Google-таблицы всеми посетителями (parseSettingsCsv, fetchRemoteSettings)
 * ЗА ЧТО ОТВЕЧАЕТ: Скачивает лист таблицы как CSV, собирает JSON настроек из строк settings1, settings2… и читает номер версии revision.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Напрямую с серверов docs.google.com по публичной ссылке на чтение листа SETTINGS_SHEET.
 * КАК ИЗМЕНИТЬ: Не меняйте названия ключей revision, updatedat, updatedby, settings1 — они совпадают с тем, что записывает скрипт scripts/settings-sheet-api.gs. */
function readEndpoints(): ((t: number) => string)[] {
  const { sheetId, gid } = SETTINGS_SHEET;
  return [
    (t) => `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&_=${t}`,
    (t) => `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&_=${t}`,
  ];
}

function rowsToMap(rows: string[][]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const key = (row[0] ?? "").trim();
    if (!key) continue;
    map.set(key.toLowerCase(), (row[1] ?? "").trim());
  }
  return map;
}

function joinChunks(rows: string[][]): string {
  const parts: { index: number; text: string }[] = [];
  for (const row of rows) {
    const key = (row[0] ?? "").trim().toLowerCase();
    const match = /^settings(\d*)$/.exec(key);
    if (!match) continue;
    parts.push({ index: match[1] ? Number(match[1]) : 0, text: row[1] ?? "" });
  }
  return parts
    .sort((a, b) => a.index - b.index)
    .map((part) => part.text)
    .join("");
}

export function parseSettingsCsv(text: string): RemoteSettings | null {
  const rows = parseCsv(text);
  const map = rowsToMap(rows);
  const json = joinChunks(rows).trim();
  if (!json) return null;

  let settings: Partial<SiteSettings>;
  try {
    settings = JSON.parse(json) as Partial<SiteSettings>;
  } catch {
    return null;
  }
  if (!settings || typeof settings !== "object") return null;

  const revision = Number(map.get("revision"));
  return {
    revision: Number.isFinite(revision) ? revision : 0,
    settings,
    updatedAt: map.get("updatedat") ?? "",
    updatedBy: map.get("updatedby") ?? "",
  };
}

export async function fetchRemoteSettings(): Promise<RemoteSettings | null> {
  let lastError: unknown = new Error("Таблица недоступна");
  for (const make of readEndpoints()) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(make(Date.now()), { cache: "no-store", signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseSettingsCsv(await res.text());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/* БЛОК: Отправка и публикация настроек в Google-таблицу (splitPayload, publishRemoteSettings)
 * ЗА ЧТО ОТВЕЧАЕТ: При нажатии «Сохранить и опубликовать» в админке отправляет настройки в Google Apps Script, последовательно пробуя три способа (обычный POST, JSONP и фоновый запрос с проверкой записи), чтобы обойти любые ограничения браузеров.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Принимает объект настроек settings из src/data/siteSettings.ts и адрес/пароль из getApiConfig().
 * КАК ИЗМЕНИТЬ: Логику отправки менять не требуется — убедитесь лишь, что скрипт scripts/settings-sheet-api.gs развёрнут в вашей Google-таблице с доступом «У всех». */
export interface PublishResult {
  ok: boolean;
  transport: "fetch" | "jsonp" | "background" | "none";
  error?: string;
  revision?: number;
}

interface ApiAnswer {
  ok?: boolean;
  error?: string;
  revision?: number;
}

export function splitPayload(json: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < json.length; i += CHUNK_SIZE) chunks.push(json.slice(i, i + CHUNK_SIZE));
  return chunks.length ? chunks : [""];
}

async function sendByFetch(url: string, body: Record<string, unknown>): Promise<ApiAnswer> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow",
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return JSON.parse(await res.text()) as ApiAnswer;
  } finally {
    clearTimeout(timer);
  }
}

function sendByJsonp(url: string, body: Record<string, unknown>): Promise<ApiAnswer> {
  return new Promise((resolve, reject) => {
    const name = `__siteSettingsCb${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) query.set(key, String(value));
    query.set("callback", name);

    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Таблица не ответила"));
    }, 20_000);

    const cleanup = () => {
      window.clearTimeout(timer);
      delete (window as unknown as Record<string, unknown>)[name];
      script.remove();
    };

    (window as unknown as Record<string, unknown>)[name] = (answer: ApiAnswer) => {
      cleanup();
      resolve(answer);
    };

    script.src = `${url}?${query.toString()}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("Веб-приложение недоступно"));
    };
    document.head.appendChild(script);
  });
}

async function sendInBackground(url: string, body: Record<string, unknown>): Promise<void> {
  await fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
}

async function confirmRevision(revision: number, attempts = 6): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((done) => setTimeout(done, 1500));
    try {
      const remote = await fetchRemoteSettings();
      if (remote && remote.revision >= revision) return true;
    } catch {}
  }
  return false;
}

export async function publishRemoteSettings(
  settings: SiteSettings,
  revision: number,
  author = "Администрирование",
): Promise<PublishResult> {
  const { url, token } = getApiConfig();
  if (!url) {
    return { ok: false, transport: "none", error: "Не указан адрес веб-приложения Google Apps Script" };
  }

  const chunks = splitPayload(JSON.stringify(settings));
  const body: Record<string, unknown> = {
    action: "save",
    token,
    revision,
    author,
    chunks: chunks.length,
    payload: chunks.join(""),
  };

  try {
    const answer = await sendByFetch(url, body);
    if (answer?.ok) return { ok: true, transport: "fetch", revision };
    if (answer?.error) return { ok: false, transport: "fetch", error: answer.error };
  } catch {}

  try {
    const answer = await sendByJsonp(url, body);
    if (answer?.ok) return { ok: true, transport: "jsonp", revision };
    if (answer?.error) return { ok: false, transport: "jsonp", error: answer.error };
  } catch {}

  try {
    await sendInBackground(url, body);
    const confirmed = await confirmRevision(revision);
    if (confirmed) return { ok: true, transport: "background", revision };
    return {
      ok: false,
      transport: "background",
      error: "Таблица не подтвердила запись. Проверьте адрес веб-приложения и пароль.",
    };
  } catch (error) {
    return {
      ok: false,
      transport: "none",
      error: error instanceof Error ? error.message : "Не удалось отправить настройки",
    };
  }
}
