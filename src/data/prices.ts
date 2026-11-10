/* ============================================================================
 * ФАЙЛ: src/data/prices.ts — Загрузка онлайн-цен и ссылок на товары из Google-таблицы
 * ЗА ЧТО ОТВЕЧАЕТ: Каждые 60 секунд автоматически загружает свежие цены и ссылки по артикулам из Google-таблицы (столбец A — артикул, столбец B — цена в ₽, столбец C — ссылка на товар), а если интернета нет — подставляет встроенный резервный прайс-лист SNAPSHOT_PRICES.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Читает CSV-выгрузку Google-таблицы SPEC_PRICE_SHEET (или DEFAULT_PRICE_SHEET) напрямую из браузера посетителя.
 * КАК ИЗМЕНИТЬ:
 *   — Чтобы обновить цены товаров без правки кода, просто поменяйте их в самой Google-таблице (столбец B).
 *   — Чтобы переключить сайт на другую Google-таблицу цен, замените sheetId и gid в объекте SPEC_PRICE_SHEET ниже.
 *   — Чтобы изменить резервные офлайн-цены или добавить новый артикул, отредактируйте словарь SNAPSHOT_PRICES.
 * ========================================================================= */

import { useCallback, useEffect, useRef, useState } from "react";

/* БЛОК: Адреса Google-таблиц с ценами и частота автопроверки (DEFAULT_PRICE_SHEET, SPEC_PRICE_SHEET, REFRESH_MS)
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит идентификаторы таблиц (sheetId и номер листа gid), строит ссылки для скачивания CSV и задаёт интервал проверки 60 секунд.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Значения sheetId и gid взяты из URL ваших открытых по ссылке Google-таблиц.
 * КАК ИЗМЕНИТЬ: Для смены таблицы цен подставьте новый sheetId и gid в SPEC_PRICE_SHEET; чтобы проверять цены чаще или реже — поменяйте REFRESH_MS (в миллисекундах, 60_000 = 60 секунд). */
export interface PriceSheetSource {
  sheetId: string;
  gid: string;
  url: string;
}

const sheetUrl = (sheetId: string, gid: string) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/edit?gid=${gid}#gid=${gid}`;

export const DEFAULT_PRICE_SHEET: PriceSheetSource = {
  sheetId: "16SWWagWF6RLSaoCezFa2J09J1n-RPQ4QDG3b8SpubZg",
  gid: "84984568",
  url: sheetUrl("16SWWagWF6RLSaoCezFa2J09J1n-RPQ4QDG3b8SpubZg", "84984568"),
};

export const SPEC_PRICE_SHEET: PriceSheetSource = {
  sheetId: "1vfnmGjg2_2KXQPcAfb4UKIwwi1FfewI1pwJ2hcTBaIg",
  gid: "0",
  url: "https://docs.google.com/spreadsheets/d/1vfnmGjg2_2KXQPcAfb4UKIwwi1FfewI1pwJ2hcTBaIg/edit?gid=0#gid=0",
};

export const PRICE_SHEET_URL = DEFAULT_PRICE_SHEET.url;
export const SPEC_PRICE_SHEET_URL = SPEC_PRICE_SHEET.url;

function priceEndpoints(source: PriceSheetSource) {
  return [
    (t: number) =>
      `https://docs.google.com/spreadsheets/d/${source.sheetId}/gviz/tq?tqx=out:csv&gid=${source.gid}&_=${t}`,
    (t: number) =>
      `https://docs.google.com/spreadsheets/d/${source.sheetId}/export?format=csv&gid=${source.gid}&_=${t}`,
  ];
}

export const REFRESH_MS = 60_000;

/* БЛОК: Резервный прайс-лист товаров Грильято, Армстронг и сайдинга (SNAPSHOT_PRICES)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает цены и ссылки на карточки lemanapro.ru в первую секунду загрузки страницы или при отсутствии связи с Google-таблицей.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Ключ — артикул товара, первый аргумент функции P(...) — цена в рублях, второй — хвост ссылки на chelyabinsk.lemanapro.ru/product/...
 * КАК ИЗМЕНИТЬ: Поменяйте число в P(цена, "ссылка") или добавьте новую строку "артикул": P(цена, "адрес-товара"). Когда таблица онлайн, её значения перекрывают этот список. */
export interface PriceEntry {
  price: number;
  url?: string;
}
export type PriceMap = Record<string, PriceEntry>;

const P = (price: number, slug: string): PriceEntry => ({
  price,
  url: `https://chelyabinsk.lemanapro.ru/product/${slug}/`,
});

export const SNAPSHOT_PRICES: PriceMap = {
  "82151718": P(53, "profil-grilyato-albes-mama-50x50x40-mm-belyy-06-m-82151718"),
  "82151719": P(53, "profil-grilyato-albes-papa-50x50x40-mm-belyy-06-m-82151719"),
  "82151720": P(214, "reyka-napravlyayushchaya-grilyato-albes-50x50x40-mm-belyy-24-m-82151720"),
  "82151717": P(53, "reyka-napravlyayushchaya-grilyato-albes-50x50x40-mm-belyy-06-m-82151717"),
  "82151722": P(52, "profil-grilyato-albes-mama-50x50x40-mm-seryy-06-m-82151722"),
  "82151723": P(52, "profil-grilyato-albes-papa-50x50x40-mm-seryy-06-m-82151723"),
  "82151724": P(207, "reyka-napravlyayushchaya-grilyato-albes-50x50x40-mm-seryy-24-m-82151724"),
  "82151721": P(52, "reyka-napravlyayushchaya-grilyato-albes-50x50x40-mm-seryy-06-m-82151721"),
  "82151726": P(54, "profil-grilyato-albes-mama-50x50x40-mm-chernyy-06-m-82151726"),
  "82151727": P(54, "profil-grilyato-albes-papa-50x50x40-mm-chernyy-06-m-82151727"),
  "82151728": P(217, "reyka-napravlyayushchaya-grilyato-albes-50x50x40-mm-chernyy-24-m-82151728"),
  "82151725": P(54, "reyka-napravlyayushchaya-grilyato-albes-50x50x40-mm-chernyy-06-m-82151725"),
  "82151742": P(53, "profil-grilyato-albes-mama-75x75x40-mm-belyy-06-m-82151742"),
  "82151743": P(53, "profil-grilyato-albes-papa-75x75x40-mm-belyy-06-m-82151743"),
  "82151744": P(214, "reyka-napravlyayushchaya-grilyato-albes-75x75x40-mm-belyy-24-m-82151744"),
  "82151741": P(53, "reyka-napravlyayushchaya-grilyato-albes-75x75x40-mm-belyy-06-m-82151741"),
  "82151746": P(52, "profil-grilyato-albes-mama-75x75x40-mm-seryy-06-m-82151746"),
  "82151747": P(52, "profil-grilyato-albes-papa-75x75x40-mm-seryy-06-m-82151747"),
  "82151748": P(207, "reyka-napravlyayushchaya-grilyato-albes-75x75x40-mm-seryy-24-m-82151748"),
  "82151745": P(52, "reyka-napravlyayushchaya-grilyato-albes-75x75x40-mm-seryy-06-m-82151745"),
  "82151750": P(54, "profil-grilyato-albes-mama-75x75x40-mm-chernyy-06-m-82151750"),
  "82151751": P(54, "profil-grilyato-albes-papa-75x75x40-mm-chernyy-06-m-82151751"),
  "82151752": P(217, "reyka-napravlyayushchaya-grilyato-albes-75x75x40-mm-chernyy-24-m-82151752"),
  "82151749": P(54, "reyka-napravlyayushchaya-grilyato-albes-75x75x40-mm-chernyy-06-m-82151749"),
  "82151769": P(37, "profil-grilyato-albes-mama-100x100x40-mm-belyy-06-m-82151769"),
  "82151770": P(53, "profil-grilyato-albes-papa-100x100x40-mm-belyy-06-m-82151770"),
  "82151772": P(214, "reyka-napravlyayushchaya-grilyato-albes-100x100x40-mm-belyy-24-m-82151772"),
  "82151771": P(107, "reyka-napravlyayushchaya-grilyato-albes-100x100x40-mm-belyy-12-m-82151771"),
  "82151768": P(53, "reyka-napravlyayushchaya-grilyato-albes-100x100x40-mm-belyy-06-m-82151768"),
  "82151774": P(52, "profil-grilyato-albes-mama-100x100x40-mm-seryy-06-m-82151774"),
  "82151775": P(52, "profil-grilyato-albes-papa-100x100x40-mm-seryy-06-m-82151775"),
  "82151777": P(207, "reyka-napravlyayushchaya-grilyato-albes-100x100x40-mm-seryy-24-m-82151777"),
  "82151776": P(103, "reyka-napravlyayushchaya-grilyato-albes-100x100x40-mm-seryy-12-m-82151776"),
  "82151773": P(52, "reyka-napravlyayushchaya-grilyato-albes-100x100x40-mm-seryy-06-m-82151773"),
  "82151779": P(54, "profil-grilyato-albes-mama-100x100x40-mm-chernyy-06-m-82151779"),
  "82151780": P(54, "profil-grilyato-albes-papa-100x100x40-mm-chernyy-06-m-82151780"),
  "82151782": P(217, "reyka-napravlyayushchaya-grilyato-albes-100x100x40-mm-chernyy-24-m-82151782"),
  "82151781": P(110, "reyka-napravlyayushchaya-grilyato-albes-100x100x40-mm-chernyy-12-m-82151781"),
  "82151778": P(54, "reyka-napravlyayushchaya-grilyato-albes-100x100x40-mm-chernyy-06-m-82151778"),
  "82151813": P(13.9, "profil-soedinitelnyy-grilyato-50x10-mm-82151813"),
  "82936532": P(31, "evro-podves-albes-l-1500-mm-82936532"),
  "82936531": P(23, "evro-podves-albes-l-1000-mm-82936531"),
  "82936530": P(14.9, "evro-podves-albes-l-500-mm-82936530"),
  "12903338": P(20, "evro-podves-dlya-potolka-v-sbore-275x36-mm-12903338"),
  "82936536": P(176, "ugolok-pl19x24-ekonom-chernyy-82936536"),
  "82936535": P(198, "ugol-pl19x24-metallik-ekonom-82936535"),
  "82936537": P(202, "ugolok-pl19x24-belyy-matovyy-ekonom-82936537"),
  "89372764": P(3083, "nabor-potolochnyh-plit-pharaon-600x600-mm-cvet-belyy-24-sht-89372764"),
  "82458369": P(3824, "plita-potolochnaya-knauf-armstrong-baykal-90rh-board-600x600x12-mm-v-korobke-20-sht-72-m2-82458369"),
  "89484209": P(3853, "plita-potolochnaya-so-dae-600x600x7-mm-belaya-20-sht-89484209"),
  "89484210": P(4300, "plita-potolochnaya-so-dae-600x600x10-mm-belaya-16-sht-89484210"),
  "84585955": P(294, "potolochnaya-panel-ap600a6-tegular-t-24-belaya-ocinkovannaya-stal-84585955"),
  "15143311": P(317, "potolochnaya-panel-ap600a6-tegular-t-24-belaya-stal-15143311"),
  "12903354": P(466, "potolochnaya-panel-ap600a6-tegular-t-24-perf-belyy-12903354"),
  "12903346": P(396, "potolochnaya-panel-ap600a6-tegular-t-24-belyy-alyuminiy-12903346"),
  "15386313": P(486, "t-profil-premium-24x38x3700-mm-cvet-belyy-15386313"),
  "15386305": P(158, "t-profil-premium-24x29x1200-mm-cvet-belyy-15386305"),
  "15386292": P(78, "t-profil-premium-24x29x600-mm-cvet-belyy-15386292"),
  "15052647": P(190, "t-profil-ekonom-24x3700-mm-cvet-belyy-15052647"),
  "15052639": P(61, "t-profil-ekonom-24x1200-mm-cvet-belyy-15052639"),
  "15052621": P(31, "t-profil-ekonom-24x600-mm-cvet-belyy-15052621"),
  "13452305": P(85, "profil-uglovoy-pristenochnyy-stalnoy-19x19x3000-mm-cvet-belyy-13452305"),
  "15656344": P(173, "profil-uglovoy-pristenochnyy-alyuminievyy-19x19x3000-mm-cvet-belyy-15656344"),

  // Резервные цены MONLID из подключённой таблицы. Онлайн-данные таблицы имеют приоритет.
  // Артикулов 89407962, 89407963 и 89407965 в таблице пока нет: цена не подставляется до их добавления.
  "89407609": P(256, "sayding-pvh-monlid-korabelnyy-brus-3-m-belyy-061-m-89407609"),
  "89407612": P(256, "sayding-pvh-monlid-korabelnyy-brus-3-m-seryy-061-m-89407612"),
  "89407616": P(256, "sayding-pvh-monlid-korabelnyy-brus-3-m-bezhevyy-061-m-89407616"),
  "89407617": P(256, "sayding-pvh-monlid-korabelnyy-brus-3-m-vanilnyy-061-m-89407617"),
  "89407615": P(323, "sayding-pvh-monlid-korabelnyy-brus-3-m-zelenyy-061-m-89407615"),
  "89407951": P(836, "h-profil-dlya-saydinga-monlid-cvet-belyy-89407951"),
  "89407952": P(836, "h-profil-dlya-saydinga-monlid-cvet-seryy-89407952"),
  "89407970": P(1580, "h-profil-dlya-saydinga-monlid-cvet-bezhevyy-89407970"),
  "89407973": P(836, "h-profil-dlya-saydinga-monlid-cvet-vanilnyy-89407973"),
  "89407958": P(836, "h-profil-dlya-saydinga-monlid-cvet-zelenyy-89407958"),
  "89407956": P(838, "h-profil-dlya-saydinga-monlid-cvet-korichnevyy-89407956"),
  "89407961": P(507, "planka-finishnaya-dlya-saydinga-monlid-cvet-belyy-89407961"),
  "89407957": P(507, "planka-finishnaya-dlya-saydinga-monlid-cvet-bezhevyy-89407957"),
  "89407964": P(686, "planka-finishnaya-dlya-saydinga-monlid-cvet-korichnevyy-89407964"),
  "89407945": P(294, "j-profil-dlya-saydinga-monlid-cvet-belyy-3-m-89407945"),
  "89407959": P(294, "j-profil-dlya-saydinga-monlid-cvet-seryy-89407959"),
  "89407969": P(294, "j-profil-dlya-saydinga-monlid-cvet-bezhevyy-89407969"),
  "89407972": P(294, "j-profil-dlya-saydinga-monlid-cvet-vanilnyy-89407972"),
  "89407949": P(294, "j-profil-dlya-saydinga-monlid-cvet-zelenyy-89407949"),
  "89407955": P(384, "j-profil-dlya-saydinga-monlid-cvet-korichnevyy-3-m-89407955"),
  "89407960": P(1528, "ugol-vnutrenniy-dlya-saydinga-monlid-cvet-belyy-89407960"),
  "89407968": P(1528, "ugol-vnutrenniy-dlya-saydinga-monlid-cvet-bezhevyy-89407968"),
  "89407947": P(1987, "ugol-vnutrenniy-dlya-saydinga-monlid-cvet-korichnevyy-89407947"),
  "89407944": P(1850, "ugol-naruzhnyy-dlya-saydinga-monlid-cvet-belyy-89407944"),
  "89407950": P(1850, "ugol-naruzhnyy-dlya-saydinga-monlid-cvet-seryy-89407950"),
  "89407967": P(1850, "ugol-naruzhnyy-dlya-saydinga-monlid-cvet-bezhevyy-89407967"),
  "89407971": P(960, "ugol-naruzhnyy-dlya-saydinga-monlid-cvet-vanilnyy-89407971"),
  "89407974": P(1850, "ugol-naruzhnyy-dlya-saydinga-monlid-cvet-zelenyy-89407974"),
  "89407946": P(1133, "ugol-naruzhnyy-dlya-saydinga-monlid-cvet-korichnevyy-89407946"),
};

/* БЛОК: Разбор CSV-текста из Google-таблицы (parseCsv, parsePrice, parsePriceCsv, fetchPrices)
 * ЗА ЧТО ОТВЕЧАЕТ: Читает строки таблицы с учётом кавычек, запятых и значка рубля «₽», превращая столбцы A, B, C в готовый словарь цен по артикулам.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Скачивает текстовый CSV по адресам priceEndpoints(source); также функция parseCsv используется модулем настроек src/data/settingsSync.ts.
 * КАК ИЗМЕНИТЬ: Если в вашей таблице артикул переедет в другой столбец, поменяйте индексы r[0] (артикул), r[1] (цена) и r[2] (ссылка) в функции parsePriceCsv. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      rows.push(row); row = [];
    } else cur += ch;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

function parsePrice(raw: string | undefined): number | null {
  if (!raw) return null;
  const s = raw.replace(/[\s\u00a0₽руб.р]+$/gi, "").replace(/[\s\u00a0]/g, "").replace(",", ".");
  const v = parseFloat(s);
  return Number.isFinite(v) && v >= 0 ? v : null;
}

export function parsePriceCsv(text: string): PriceMap {
  const map: PriceMap = {};
  for (const r of parseCsv(text)) {
    const art = (r[0] ?? "").trim();
    if (!/^\d{5,}$/.test(art)) continue;
    const price = parsePrice(r[1]);
    if (price === null) continue;
    const url = (r[2] ?? "").trim();
    map[art] = { price, url: /^https?:\/\//.test(url) ? url : undefined };
  }
  return map;
}

async function fetchPrices(source: PriceSheetSource = DEFAULT_PRICE_SHEET): Promise<PriceMap> {
  let lastErr: unknown = new Error("no endpoints");
  for (const make of priceEndpoints(source)) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(make(Date.now()), { cache: "no-store", signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const map = parsePriceCsv(await res.text());
      if (Object.keys(map).length < 5) throw new Error("Пустой ответ таблицы");
      return map;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/* БЛОК: React-хук автоматического обновления цен на страницах сайта (usePrices)
 * ЗА ЧТО ОТВЕЧАЕТ: Отдаёт калькуляторам и сметам актуальные цены, статус связи ("loading" / "live" / "offline"), время последней проверки и кнопку ручной проверки «Проверить».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Объединяет резервный словарь SNAPSHOT_PRICES со свежими данными из fetchPrices(source) каждые 60 секунд, при возврате на вкладку и при появлении интернета.
 * КАК ИЗМЕНИТЬ: Используется компонентом Calculator.tsx и страницами смет; менять логику хука не требуется. */
export type PriceStatus = "loading" | "live" | "offline";

export function usePrices(source: PriceSheetSource = DEFAULT_PRICE_SHEET) {
  const [prices, setPrices] = useState<PriceMap>(SNAPSHOT_PRICES);
  const [status, setStatus] = useState<PriceStatus>("loading");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [changed, setChanged] = useState(0);
  const [checkedCount, setCheckedCount] = useState(0);
  const busy = useRef(false);
  const current = useRef<PriceMap>(SNAPSHOT_PRICES);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setRefreshing(true);
    try {
      const fresh = await fetchPrices(source);
      setCheckedCount(Object.keys(fresh).length);
      const merged: PriceMap = { ...SNAPSHOT_PRICES, ...fresh };
      let diff = 0;
      for (const k of Object.keys(merged)) {
        if (current.current[k]?.price !== merged[k].price) diff++;
      }
      current.current = merged;
      setPrices(merged);
      setChanged(diff);
      setStatus("live");
      setUpdatedAt(new Date());
    } catch {
      setStatus((s) => (s === "live" ? "live" : "offline"));
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }, [source]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", refresh);
    };
  }, [refresh]);

  return { prices, status, updatedAt, refreshing, refresh, changed, checkedCount, source, sheetUrl: source.url };
}
