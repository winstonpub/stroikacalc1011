/* ============================================================================
 * ФАЙЛ: src/utils/printSidingLayout.ts — Печать плана фасада и спецификации сайдинга на 1 лист A4
 * ЗА ЧТО ОТВЕЧАЕТ: Собирает лист A4 с планом фасада и таблицей материалов, и открывает системное окно печати.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: calcSiding(), SVG-план и (только для «Тест») уже рассчитанная спецификация с ценами.
 * КАК ИЗМЕНИТЬ: Общая печать — buildSidingSheetMarkup(); печать текущей спецификации «Тест» — specification и
 *   buildPricedSpecificationTable(). Передача строк из «Тест» выполняется в TestSidingCalculator.tsx → handlePrint().
 * ========================================================================= */

import type { SidingCalc } from "../data/siding";

const fmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const fmt2 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (value: number) => `${fmt.format(Math.round(value))} ₽`;

const ROOT_CLASS = "siding-print-root";

/** Только экранная спецификация страницы «Тест»: те же строки, без повторного расчёта или подмены названий. */
export interface SidingSpecificationPrintRow {
  art: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  sum: number;
  missing: boolean;
}

interface SidingPrintMeta {
  title: string;
  subtitle?: string;
  specification?: {
    rows: readonly SidingSpecificationPrintRow[];
    total: number;
    perM2: number;
    /** Строки раскрытого блока «Раскрой панелей» страницы «Тест» — без их переформатирования. */
    cuttingDetails: readonly string[];
  };
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);

/* БЛОК: Стили печатного листа (SHEET_CSS)
 * ЗА ЧТО ОТВЕЧАЕТ: Альбомный лист A4 без полей и колонтитулов; все правила ограничены контейнером .siding-print-root, чтобы не задевать сам сайт.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Задано здесь.
 * КАК ИЗМЕНИТЬ: Соотношение ширины схемы и таблицы — grid-template-columns у .sp-body; печатные цены — .sp-prices. */
const R = `.${ROOT_CLASS}`;
const SHEET_CSS = `
${R} { display: none; }
@media print {
  @page { size: A4 landscape; margin: 0; }
  body.spec-print-overlay #root { display: none !important; }
  body.spec-print-overlay ${R} { display: block !important; }
  body.spec-print-overlay ${R}, body.spec-print-overlay ${R} * { visibility: visible !important; }
  ${R} * { box-sizing: border-box; }
  ${R} {
    color: #14191b; background: #fff;
    font-family: "Onest", -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  ${R} .sp-page {
    width: 297mm; height: 210mm; padding: 7mm 11mm 6mm; overflow: hidden;
    display: flex; flex-direction: column; break-inside: avoid;
  }
  ${R} .sp-head { padding-bottom: 6px; border-bottom: 2px solid #20282b; flex-shrink: 0; }
  ${R} h1 { margin: 0; font-size: 18pt; line-height: 1.1; font-weight: 900; }
  ${R} .sp-subtitle { margin: 4px 0 0; font-size: 8pt; color: #687276; }
  ${R} .sp-params { display: grid; grid-template-columns: repeat(5, 1fr); margin: 6px 0; border: 1px solid #e5e4e0; flex-shrink: 0; }
  ${R} .sp-param { padding: 4px 9px; border-right: 1px solid #e5e4e0; }
  ${R} .sp-param:last-child { border-right: 0; }
  ${R} .sp-param span { display: block; color: #687276; font-size: 7pt; font-weight: 700; text-transform: uppercase; }
  ${R} .sp-param b { display: block; margin-top: 1px; font-size: 10pt; font-weight: 800; }
  ${R} .sp-body { display: grid; grid-template-columns: 1.35fr 1.15fr; gap: 10px; flex: 1 1 auto; min-height: 0; }
  ${R} .sp-scheme { border: 1px solid #e5e4e0; padding: 4px; min-height: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  ${R} .sp-scheme svg { display: block; width: 100% !important; height: 100% !important; max-height: 150mm !important; }
  ${R} table { width: 100%; border-collapse: collapse; font-size: 8.5pt; align-self: start; }
  ${R} th { text-align: left; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.05em; color: #687276; border-bottom: 1.5px solid #20282b; padding: 4px 6px; }
  ${R} td { padding: 4px 6px; border-bottom: 1px solid #e5e4e0; vertical-align: top; }
  ${R} td.n { width: 18px; color: #98a2a8; }
  ${R} td.name { font-weight: 700; }
  ${R} td.qty { text-align: right; font-weight: 800; white-space: nowrap; }
  ${R} .clr { color: #687276; font-weight: 600; }
  ${R} .cuts { margin-top: 3px; color: #687276; font-size: 6.2pt; line-height: 1.25; font-weight: 500; }
  ${R} .cuts b { color: #14191b; font-weight: 800; }

  /* Печать именно «Спецификации материалов» страницы «Тест»: артикули, названия, количества, цены и суммы. */
  ${R} .sp-prices { table-layout: fixed; font-size: 7.5pt; }
  ${R} .sp-prices caption { padding: 0 0 7px; text-align: left; font-size: 11pt; font-weight: 800; }
  ${R} .sp-prices th { padding: 4px; font-size: 6pt; }
  ${R} .sp-prices th, ${R} .sp-prices td { overflow-wrap: anywhere; }
  ${R} .sp-prices td { padding: 4px; }
  ${R} .sp-prices .sp-art { color: #687276; font-weight: 700; }
  ${R} .sp-prices .sp-name { font-weight: 700; line-height: 1.3; }
  ${R} .sp-prices .sp-size { display: block; margin-top: 2px; font-size: 6.5pt; color: #687276; font-weight: 400; }
  ${R} .sp-prices .sp-money { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  ${R} .sp-prices .sp-no-price { color: #b91c1c; font-size: 6.5pt; }
  ${R} .sp-prices tfoot { display: table-row-group; }
  ${R} .sp-prices tfoot td { background: #20282b; color: #fff; font-weight: 800; border-bottom-color: #687276; padding: 7px 4px; vertical-align: middle; }
  ${R} .sp-prices tfoot .sp-money { color: #ffcb05; font-size: 10pt; }
  ${R} .sp-prices tfoot .sp-per-m2 { color: rgba(255,255,255,0.55); font-size: 7.5pt; font-weight: 600; white-space: nowrap; }
  ${R} .sp-prices .sp-cut-title { display: block; margin-top: 5px; font-size: 6pt; font-weight: 800; }
  ${R} .sp-prices .sp-cut-list { margin: 2px 0 0; padding: 0; list-style: none; font-size: 4.8pt; line-height: 1.3; font-weight: 400; color: #687276; }
  ${R} .sp-prices .sp-cut-list li + li { margin-top: 2px; }
  ${R} .sp-prices .sp-cut-list b { color: #14191b; }
  ${R} .sp-prices tr { break-inside: avoid; }
  ${R} .sp-prices thead { display: table-header-group; }
}
`;

/** Точное представление переданных specRows, с теми же названиями, артикулами и ценами, что на странице «Тест». */
function buildPricedSpecificationTable(spec: NonNullable<SidingPrintMeta["specification"]>): string {
  // Раскрой — в отдельной строке под первой позицией, не вставлен в название сайдинга.
  const cuttingDetails = spec.cuttingDetails.length > 0 ? `
    <tr class="sp-cutting-row">
      <td colspan="5">
        <span class="sp-cut-title">Раскрой панелей</span>
        <ul class="sp-cut-list">
          ${spec.cuttingDetails.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}
        </ul>
      </td>
    </tr>` : "";
  const rows = spec.rows.map((row, index) => `
    <tr>
      <td class="sp-art">${escapeHtml(row.art || "Не указан")}</td>
      <td class="sp-name">${escapeHtml(row.name)}</td>
      <td class="qty">${fmt.format(row.qty)} шт</td>
      <td class="sp-money">${row.missing ? '<span class="sp-no-price">нет цены</span>' : fmt.format(row.price)}</td>
      <td class="sp-money">${row.missing ? '<span class="sp-no-price">нет цены</span>' : fmt.format(row.sum)}</td>
    </tr>${index === 0 ? cuttingDetails : ""}`).join("");

  return `<table class="sp-prices">
    <caption>Спецификация материалов</caption>
    <colgroup>
      <col style="width:18%"><col style="width:35%"><col style="width:12%"><col style="width:16%"><col style="width:19%">
    </colgroup>
    <thead>
      <tr>
        <th>Артикул</th><th>Наименование</th><th style="text-align:right">Кол-во</th>
        <th style="text-align:right">Цена, ₽</th><th style="text-align:right">Сумма, ₽</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3">Итого материалы</td>
        <td class="sp-money"><span class="sp-per-m2">${money(spec.perM2)}/м²</span></td>
        <td class="sp-money">${money(spec.total)}</td>
      </tr>
    </tfoot>
  </table>`;
}

/* БЛОК: Разметка печатного листа (buildSidingSheetMarkup)
 * ЗА ЧТО ОТВЕЧАЕТ: Заголовок (без описания, если не передано), план фасада, характеристики и спецификацию.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: calc, SVG-план, цвет. Для тестовой страницы также передаются цены и строки из specRows.
 * КАК ИЗМЕНИТЬ: Обычный шаблон без цен сохраняется для «Сайдинг»; optional specification включает полный шаблон «Тест». */
function buildSidingSheetMarkup(calc: SidingCalc, svg: string, colorName: string, meta?: SidingPrintMeta): string {
  const cutDetails = calc.panelPlan
    .filter((panel) => panel.items.length > 1)
    .map((panel) => {
      const pieces = panel.items
        .map((item) => `${item.label}: ${fmt.format(item.lenMm / 1000)} м, ряд ${item.row + 1}`)
        .join("; ");
      return `Панель ${panel.panel}: ${pieces}${panel.wasteMm > 0 ? `; остаток ${fmt.format(panel.wasteMm / 1000)} м` : "; без остатка"}`;
    })
    .join("<br>");

  const rows = calc.table
    .map(
      (r, i) => `<tr>
        <td class="n">${i + 1}</td>
        <td class="name">${r.shortName ?? r.name}${r.colorName ? `<span class="clr"> · ${r.colorName.toLowerCase()}</span>` : ""}${i === 0 && cutDetails ? `<div class="cuts"><b>Раскрой:</b><br>${cutDetails}</div>` : ""}</td>
        <td class="qty">${r.qty > 0 ? `${fmt.format(r.qty)} шт` : "—"}</td>
      </tr>`,
    )
    .join("");

  const specification = meta?.specification;
  return `<div class="sp-page">
    <div class="sp-head"><h1>${escapeHtml(meta?.title ?? "Фасад · ПВХ сайдинг")}</h1>${meta?.subtitle ? `<p class="sp-subtitle">${escapeHtml(meta.subtitle)}</p>` : ""}</div>
    <div class="sp-params">
      <div class="sp-param"><span>Фасад</span><b>${fmt2.format(calc.L / 1000)} × ${fmt2.format(calc.H / 1000)} м</b></div>
      <div class="sp-param"><span>Площадь обшивки</span><b>${fmt.format(calc.netArea)} м²</b></div>
      <div class="sp-param"><span>Рядов панелей</span><b>${fmt.format(calc.rows)}</b></div>
      <div class="sp-param"><span>Проёмов</span><b>${fmt.format(calc.openings.length)}</b></div>
      <div class="sp-param"><span>Цвет</span><b>${escapeHtml(colorName)}</b></div>
    </div>
    <div class="sp-body">
      <div class="sp-scheme">${svg}</div>
      ${specification ? buildPricedSpecificationTable(specification) : `
        <table><thead><tr><th></th><th>Элемент</th><th style="text-align:right">Кол-во</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`}
    </div>
  </div>`;
}

/* БЛОК: Запуск печати прямо на странице (printSidingOverlay)
 * ЗА ЧТО ОТВЕЧАЕТ: Временно добавляет на страницу скрытый лист и стили, прячет сайт на время печати, вызывает window.print() и после закрытия окна печати всё убирает.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Вызывается кнопкой «Печать» в блоке спецификации. В «Тест» получает те же строки и суммы, что на экране.
 * КАК ИЗМЕНИТЬ: specification используется только при передаче specRows; без него остаётся исходная печать без цен. */
export function printSidingOverlay(calc: SidingCalc, svg: string, colorName: string, meta?: SidingPrintMeta): boolean {
  if (!svg) return false;
  const body = document.body;

  const style = document.createElement("style");
  style.textContent = SHEET_CSS;
  const root = document.createElement("div");
  root.className = ROOT_CLASS;
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = buildSidingSheetMarkup(calc, svg, colorName, meta);

  // Печатный SVG не должен ссылаться на clipPath и маркеры скрытого исходного чертежа.
  const ids = new Map<string, string>();
  const prefix = `siding-print-${Date.now()}-`;
  for (const node of root.querySelectorAll<SVGElement>("svg [id]")) {
    const id = node.id;
    ids.set(id, `${prefix}${id}`);
    node.id = `${prefix}${id}`;
  }
  for (const node of root.querySelectorAll<SVGElement>("svg, svg *")) {
    for (const attribute of Array.from(node.attributes)) {
      const value = attribute.value.replace(/url\((['"]?)#([^'")]+)\1\)/g,
        (match: string, quote: string, id: string) => ids.has(id) ? `url(${quote}#${ids.get(id)}${quote})` : match);
      if (value !== attribute.value) node.setAttribute(attribute.name, value);
    }
  }

  const originalTitle = document.title;
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.title = originalTitle;
    body.classList.remove("spec-print-active", "spec-print-overlay");
    style.remove();
    root.remove();
    window.removeEventListener("afterprint", restore);
  };

  document.head.appendChild(style);
  body.appendChild(root);
  document.title = " ";
  body.classList.add("spec-print-active", "spec-print-overlay");
  window.addEventListener("afterprint", restore);
  window.print();
  return true;
}
