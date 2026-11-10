/* ============================================================================
 * ФАЙЛ: src/utils/pagePrint.ts — Печать страниц спецификаций без лишних колонтитулов
 * ЗА ЧТО ОТВЕЧАЕТ: Переключает текущую страницу спецификации в печатный режим (1 лист A4 без шапки и подвала сайта) и запускает системное окно печати браузера с временно очищенным заголовком вкладки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Работает в связке с CSS-правилами .spec-print-active из файла src/index.css и заголовком document.title.
 * КАК ИЗМЕНИТЬ: Сам механизм вызова печати менять не нужно; если требуется поправить внешний вид печатной таблицы или отступы на бумаге, редактируйте блок @media print в src/index.css.
 * ========================================================================= */

/* БЛОК: Печать спецификации прямо со страницы калькулятора (printSpecificationOverlay)
 * ЗА ЧТО ОТВЕЧАЕТ: На время печати включает на <body> классы spec-print-active и spec-print-overlay — тогда браузер выводит на лист A4 только скрытый блок SpecPrintPortal (тот же формат, что и на странице «Спецификация материалов»), а сам калькулятор скрыт. После печати классы и заголовок вкладки возвращаются.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Правила оформления берёт из @media print в src/index.css.
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
export function printSpecificationOverlay() {
  const body = document.body;
  const wasActive = body.classList.contains("spec-print-active");
  const originalTitle = document.title;
  let restored = false;

  const restore = () => {
    if (restored) return;
    restored = true;
    document.title = originalTitle;
    body.classList.remove("spec-print-overlay");
    if (!wasActive) body.classList.remove("spec-print-active");
    window.removeEventListener("afterprint", restore);
  };

  document.title = " ";
  body.classList.add("spec-print-active", "spec-print-overlay");
  window.addEventListener("afterprint", restore);
  window.print();
}
