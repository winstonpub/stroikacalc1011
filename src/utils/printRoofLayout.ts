/* ============================================================================
 * ФАЙЛ: src/utils/printRoofLayout.ts — Печать схемы укладки листов кровли на 1 лист A4
 * ЗА ЧТО ОТВЕЧАЕТ: Готовит печатный лист с чертежом раскладки листов кровли, карточками размеров, легендой и итогом листов
 *   строго на 1 альбомной странице A4 без браузерных колонтитулов (без даты, URL сайта, дубля заголовка и номера страницы).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Получает рассчитанные параметры кровли (calc) и готовую SVG-разметку чертежа из компонента RoofLayout в файле src/components/RoofCalculator.tsx.
 * КАК ИЗМЕНИТЬ: Заголовок печатного листа, названия карточек («Кровля», «Лист», «Перехлёст», «Раскладка») и стили печатной страницы меняются внутри констант ROOF_SHEET_CSS и buildRoofSheetMarkup.
 * ========================================================================= */

/* БЛОК: Структура данных расчёта кровли для печати и форматирование чисел (RoofLayoutPrintData)
 * ЗА ЧТО ОТВЕЧАЕТ: Описывает поля, которые передаются из калькулятора кровли на печать, и настраивает вывод чисел в русском формате (с запятой).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: Заполняется результатом функции calcRoof() из src/components/RoofCalculator.tsx.
 * КАК ИЗМЕНИТЬ: Количество знаков после запятой для размеров в метрах меняется в fmt2 (minimumFractionDigits / maximumFractionDigits). */
export interface RoofLayoutPrintData {
  roofLength: number;
  roofWidth: number;
  sheetLength: number;
  sheetWidth: number;
  overlapW: number;
  overlapL: number;
  sheets: number;
  columns: number;
  rows: number;
  savedW: number;
  savedL: number;
  seams: number;
}

const fmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const fmt2 = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/* Корневой класс скрытого печатного листа, который подставляется вместо сайта при печати */
const ROOT_CLASS = "roof-print-root";
const R = `.${ROOT_CLASS}`;

/* БЛОК: Стили печатного листа альбомного формата A4 (ROOF_SHEET_CSS)
 * ЗА ЧТО ОТВЕЧАЕТ: Верстает альбомный лист A4 (297×210 мм) с нулевыми полями @page { margin: 0 }, чтобы браузер не печатал дату, URL сайта и номер страницы, и умещает всю схему ровно на 1 лист.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: Значения цветов и отступов заданы прямо здесь.
 * КАК ИЗМЕНИТЬ: Максимальная высота чертежа на бумаге задаётся в .scheme svg (max-height: 118mm). */
const ROOF_SHEET_CSS = `
  ${R} { display: none; }
  @media print {
    @page { size: A4 landscape; margin: 0; }
    body.spec-print-overlay #root { display: none !important; }
    body.spec-print-overlay ${R} { display: block !important; }
    body.spec-print-overlay ${R}, body.spec-print-overlay ${R} * { visibility: visible !important; }
    ${R}, ${R} * { box-sizing: border-box; }
    ${R} {
      margin: 0;
      padding: 0;
      color: #14191b;
      background: #fff;
      font-family: "Onest", -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    ${R} .page {
      width: 297mm;
      height: 210mm;
      padding: 7mm 11mm 6mm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
      break-after: avoid;
      page-break-after: avoid;
    }
    body.spec-print-active ${R} header {
      display: flex !important;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 6px;
      border-bottom: 2px solid #20282b;
      flex-shrink: 0;
    }
    ${R} h1 {
      margin: 0;
      font-size: 19pt;
      line-height: 1.1;
      font-weight: 900;
      letter-spacing: -0.01em;
    }
    ${R} .total { text-align: right; white-space: nowrap; }
    ${R} .total strong {
      display: block;
      color: #20282b;
      font-size: 22pt;
      line-height: 1;
      font-weight: 900;
    }
    ${R} .total span {
      color: #687276;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    ${R} .params {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin: 6px 0;
      border: 1px solid #e5e4e0;
      background: #fff;
      flex-shrink: 0;
    }
    ${R} .param { padding: 5px 10px; border-right: 1px solid #e5e4e0; }
    ${R} .param:last-child { border-right: 0; }
    ${R} .param span {
      display: block;
      color: #687276;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    ${R} .param b {
      display: block;
      margin-top: 1px;
      font-size: 10.5pt;
      font-weight: 800;
    }
    ${R} .scheme {
      padding: 4px;
      border: 1px solid #e5e4e0;
      background: #fff;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    ${R} .scheme svg {
      display: block;
      width: 100% !important;
      max-width: 100% !important;
      height: 100% !important;
      max-height: 118mm !important;
      min-width: 0 !important;
      object-fit: contain;
    }
    ${R} .scheme svg g {
      opacity: 1 !important;
    }
    ${R} .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;
      margin-top: 5px;
      font-size: 8pt;
      font-weight: 600;
      flex-shrink: 0;
    }
    ${R} .legend span { display: inline-flex; align-items: center; gap: 5px; }
    ${R} .swatch {
      width: 18px;
      height: 8px;
      border: 1px solid #98a2a8;
      background: #fff;
      display: inline-block;
    }
    ${R} .swatch.overlap { border-color: #a98700; background: #fff3bf; }
    ${R} .swatch.saved { border-color: #2f8f5b; background: #e2f3e8; }
    ${R} .swatch.sheet { border-color: #68798a; background: #eaf0f6; }
    body.spec-print-active ${R} footer {
      display: flex !important;
      justify-content: space-between;
      gap: 16px;
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px solid #e5e4e0;
      color: #687276;
      font-size: 7.5pt;
      font-weight: 600;
      flex-shrink: 0;
    }
  }
`;

/* БЛОК: Разметка печатного листа схемы укладки (buildRoofSheetMarkup)
 * ЗА ЧТО ОТВЕЧАЕТ: Собирает содержимое листа: шапку с итогом листов, 4 карточки параметров, чертёж, легенду и нижнюю строку.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: Числа из объекта calc, векторный чертёж из строки svg и признак наличия отходов hasWaste.
 * КАК ИЗМЕНИТЬ: Заголовок на бумаге меняется в теге <h1>Схема укладки листов</h1>, подписи параметров — в блоке <div class="params">, нижняя строка — в теге <footer>. */
export function buildRoofSheetMarkup(
  calc: RoofLayoutPrintData,
  svg: string,
  hasWaste: boolean,
): string {
  const saved = calc.savedW + calc.savedL;
  const overlapX = Math.round(calc.overlapW * 1000);
  const overlapY = Math.round(calc.overlapL * 1000);

  return `
  <div class="page">
    <header>
      <h1>Схема укладки листов</h1>
      <div class="total">
        <strong>${fmt.format(calc.sheets)} шт</strong>
        <span>Итого листов</span>
      </div>
    </header>

    <div class="params">
      <div class="param">
        <span>Кровля</span>
        <b>${fmt2.format(calc.roofLength)} × ${fmt2.format(calc.roofWidth)} м</b>
      </div>
      <div class="param">
        <span>Лист</span>
        <b>${fmt2.format(calc.sheetLength)} × ${fmt2.format(calc.sheetWidth)} м</b>
      </div>
      <div class="param">
        <span>Перехлёст</span>
        <b>${fmt.format(overlapX)}ш ${fmt.format(overlapY)}д мм</b>
      </div>
      <div class="param">
        <span>Раскладка</span>
        <b>${fmt.format(calc.columns)} в ряду · ${fmt.format(calc.rows)} рядов</b>
      </div>
    </div>

    <div class="scheme">${svg}</div>

    <div class="legend">
      <span><i class="swatch sheet"></i>лист</span>
      <span><i class="swatch overlap"></i>перехлёст ${fmt.format(overlapX)}ш ${fmt.format(overlapY)}д мм</span>
      ${saved > 0 ? '<span><i class="swatch saved"></i>остаток листа используется повторно</span>' : ""}
      <span><i class="swatch"></i>${hasWaste ? "отход подрезки" : "без отходов"}</span>
    </div>

    <footer>
      <span>Полос перехлёста: ${fmt.format(calc.seams)}${saved > 0 ? ` · сэкономлено листов за счёт обрезков: ${fmt.format(saved)}` : ""}</span>
      <span>Полезная площадь: ${fmt2.format(calc.roofLength * calc.roofWidth)} м²</span>
    </footer>
  </div>`;
}

/* БЛОК: Печать схемы прямо на странице «Кровля» (printRoofLayoutOverlay)
 * ЗА ЧТО ОТВЕЧАЕТ: Работает так же, как кнопка «Печать» на страницах «Грильято», «Армстронг» и «Сайдинг»:
 *   временно добавляет на текущую страницу скрытый лист A4 и стили, прячет сайт, сразу вызывает системное окно
 *   печати браузера (без открытия новой вкладки) и после печати всё убирает.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: Расчёт calc и SVG-схема из блока «Схема укладки листов» (src/components/RoofCalculator.tsx).
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
export function printRoofLayoutOverlay(
  calc: RoofLayoutPrintData,
  svg: SVGSVGElement | null,
  hasWaste: boolean,
): boolean {
  if (!svg) return false;

  /* БЛОК: Статический снимок текущей схемы | ЗА ЧТО ОТВЕЧАЕТ: Убирает анимации и стили экрана
     из копии SVG, чтобы все листы и перехлёсты сразу были видны на печатном листе.
     Исходная схема остаётся без изменений; ссылки внутри SVG получают уникальные id. */
  const snapshot = svg.cloneNode(true) as SVGSVGElement;
  const svgNodes: SVGElement[] = [snapshot, ...snapshot.querySelectorAll<SVGElement>("*")];
  const idMap = new Map<string, string>();
  for (const node of svgNodes) {
    node.removeAttribute("class");
    node.removeAttribute("style");
    const id = node.getAttribute("id");
    if (id) {
      const printId = `roof-print-${id}`;
      idMap.set(id, printId);
      node.setAttribute("id", printId);
    }
  }
  for (const node of svgNodes) {
    for (const attribute of Array.from(node.attributes)) {
      if (!attribute.value.includes("url(")) continue;
      const value = attribute.value.replace(
        /url\((['"]?)#([^'")]+)\1\)/g,
        (match: string, quote: string, id: string) => {
          const replacement = idMap.get(id);
          return replacement ? `url(${quote}#${replacement}${quote})` : match;
        },
      );
      node.setAttribute(attribute.name, value);
    }
  }
  snapshot.setAttribute("aria-hidden", "true");
  snapshot.removeAttribute("aria-label");
  snapshot.removeAttribute("role");

  const body = document.body;
  const originalTitle = document.title;
  const scrollPosition = { left: window.scrollX, top: window.scrollY };
  const style = document.createElement("style");
  style.textContent = ROOF_SHEET_CSS;
  const root = document.createElement("div");
  root.className = ROOT_CLASS;
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = buildRoofSheetMarkup(calc, snapshot.outerHTML, hasWaste);

  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.title = originalTitle;
    body.classList.remove("spec-print-active", "spec-print-overlay");
    style.remove();
    root.remove();
    window.removeEventListener("afterprint", restore);
    window.requestAnimationFrame(() => {
      window.scrollTo({ ...scrollPosition, behavior: "instant" });
    });
  };

  try {
    document.head.appendChild(style);
    body.appendChild(root);
    document.title = " ";
    body.classList.add("spec-print-active", "spec-print-overlay");
    window.addEventListener("afterprint", restore);
    window.print();
    return true;
  } catch {
    restore();
    return false;
  }
}

/* БЛОК: Резервный способ печати в отдельном окне (buildRoofLayoutPrintHtml)
 * ЗА ЧТО ОТВЕЧАЕТ: Собирает полный HTML-документ листа A4 — используется, если понадобится печать в новой вкладке.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЯ: Разметка из buildRoofSheetMarkup() и стили из ROOF_SHEET_CSS.
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
export function buildRoofLayoutPrintHtml(
  calc: RoofLayoutPrintData,
  svg: string,
  hasWaste: boolean,
): string {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title></title>
<style>${ROOF_SHEET_CSS}</style>
</head>
<body>
${buildRoofSheetMarkup(calc, svg, hasWaste)}
</body>
</html>`;
}
