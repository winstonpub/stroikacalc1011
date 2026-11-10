/* ============================================================================
 * ФАЙЛ: src/components/ArticleCell.tsx — Ячейка артикула товара со ссылкой и копированием
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит номер артикула в таблицах спецификаций: клик по цифрам открывает карточку товара на сайте магазина, а клик по иконке справа копирует артикул в буфер обмена и на 1,6 секунды показывает зелёную галочку.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Номер артикула (art) приходит из справочников src/data/grilyato.ts и src/data/armstrong.ts, а ссылка на товар (url) — из столбца C Google-таблицы цен (src/data/prices.ts).
 * КАК ИЗМЕНИТЬ: Подсказку при наведении на ссылку («Открыть товар на lemanapro.ru») или длительность показа галочки (1600 мс) можно изменить в компоненте ArticleCell ниже.
 * ========================================================================= */

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../utils/cn";

/* БЛОК: Копирование текста в буфер обмена (copyToClipboard)
 * ЗА ЧТО ОТВЕЧАЕТ: Записывает артикул в буфер обмена современным методом navigator.clipboard, а если браузер его ограничивает — через скрытое поле textarea.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Получает строку артикула text при клике на кнопку копирования.
 * КАК ИЗМЕНИТЬ: Служебная функция — менять не требуется. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

/* БЛОК: Компонент ячейки артикула в таблице сметы (ArticleCell)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует ссылку (или текст, если ссылки в таблице нет) и кнопку копирования, которая автоматически прячется на бумаге при печати благодаря классу spec-no-print.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Параметры art и url из строки спецификации SpecRow.
 * КАК ИЗМЕНИТЬ: Поменяйте текст "Не указан", если нужно иначе обозначать позиции без артикула. */
export default function ArticleCell({ art, url }: { art?: string; url?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!art) return <span className="text-graphite/60">Не указан</span>;

  const copyArticle = async () => {
    if (await copyToClipboard(art)) setCopied(true);
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          title="Открыть товар на lemanapro.ru"
          className="text-graphite/60 underline decoration-pro decoration-2 underline-offset-4 hover:text-graphite"
        >
          {art}
        </a>
      ) : (
        <span className="text-graphite/60">{art}</span>
      )}
      <button
        type="button"
        onClick={copyArticle}
        title={copied ? "Артикул скопирован" : `Копировать артикул ${art}`}
        aria-label={copied ? `Артикул ${art} скопирован` : `Копировать артикул ${art}`}
        className={cn(
          "spec-no-print inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pro",
          copied ? "bg-emerald-50 text-emerald-600" : "text-graphite/45 hover:bg-pro/20 hover:text-graphite",
        )}
      >
        {copied ? <Check size={13} strokeWidth={2.8} /> : <Copy size={13} strokeWidth={2.4} />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? `Артикул ${art} скопирован в буфер обмена` : ""}
      </span>
    </span>
  );
}
