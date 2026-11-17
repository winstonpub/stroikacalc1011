/* ============================================================================
 * ФАЙЛ: src/components/CalculatorCompactToggle.tsx — Общий компактный вид калькуляторов
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит выбор «Компактно» или «Подробно» для каждого калькулятора (Грильято, Армстронг,
 *   Кровля) и рисует кнопку переключения в шапке раздела. Компактный вид включён по умолчанию, как
 *   на странице «Сайдинг»: меньше отступы, поля размеров встают по два в ряд, строки таблиц тоньше.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Ключ localStorage передаётся при вызове useCompactView().
 * КАК ИЗМЕНИТЬ: Чтобы по умолчанию открывался просторный вид, передайте defaultCompact = false.
 * ========================================================================= */

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/* БЛОК: Состояние вида калькулятора (useCompactView)
 * ЗА ЧТО ОТВЕЧАЕТ: Возвращает compact (включён ли уплотнённый вид), setCompact и помощник dc(normal, compactClass),
 *   который подставляет нужный класс оформления в разметке.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: localStorage по ключу storageKey.
 * КАК ИЗМЕНИТЬ: Порог по умолчанию — аргумент defaultCompact. */
export function useCompactView(storageKey: string, defaultCompact = true) {
  const [compact, setCompact] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === null ? defaultCompact : saved === "1";
    } catch {
      return defaultCompact;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, compact ? "1" : "0");
    } catch {}
  }, [compact, storageKey]);

  const dc = (normal: string, compactValue: string) => (compact ? compactValue : normal);
  return { compact, setCompact, dc };
}

/* БЛОК: Кнопка «Компактно / Подробно» (CompactViewToggle)
 * ЗА ЧТО ОТВЕЧАЕТ: Те же подписи и вид, что на странице «Сайдинг»: в компактном виде кнопка предлагает
 *   вернуть подробный вид и наоборот.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: compact и onToggle от useCompactView().
 * КАК ИЗМЕНИТЬ: Подписи и подсказки — в тексте ниже. */
export function CompactViewToggle({ compact, onToggle }: { compact: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={compact}
      title={compact ? "Показать просторный вид с крупными полями" : "Убрать лишние отступы и сделать калькулятор компактнее"}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[12px] font-extrabold text-graphite/70 transition-colors hover:border-graphite/40 hover:text-graphite"
    >
      {compact ? <Maximize2 size={14} strokeWidth={2.4} /> : <Minimize2 size={14} strokeWidth={2.4} />}
      {compact ? "Подробно" : "Компактно"}
    </button>
  );
}
