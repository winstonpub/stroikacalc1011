/* ============================================================================
 * ФАЙЛ: src/components/PriceStatusBar.tsx — Полоса статуса онлайн-проверки цен
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает зелёный индикатор «Цены автоматически проверены в …», число цен из таблицы,
 *   подпись «автопроверка каждые 60 секунд» и кнопку ручной проверки. Используется на страницах
 *   «Грильято»/«Армстронг» и «Тест», чтобы плашка выглядела и работала одинаково.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Состояние хука usePrices() из src/data/prices.ts и интервал REFRESH_MS.
 * КАК ИЗМЕНИТЬ: Формулировки статусов онлайн/загрузки/офлайн редактируются прямо внутри этого блока.
 * ========================================================================= */

import { RefreshCw, WifiOff } from "lucide-react";
import { REFRESH_MS, type PriceStatus } from "../data/prices";
import { cn } from "../utils/cn";

/* БЛОК: Полоса статуса онлайн-проверки цен в блоке «Спецификация материалов» (PriceStatusBar)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает зелёный индикатор «Цены автоматически проверены в …», число цен из таблицы, подпись «автопроверка каждые 60 секунд» и кнопку ручной проверки «Проверить».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Состояние хука usePrices() из src/data/prices.ts и интервал REFRESH_MS.
 * КАК ИЗМЕНИТЬ: Формулировки статусов онлайн/загрузки/офлайн редактируются прямо внутри этого блока. */
export function PriceStatusBar(props: {
  status: PriceStatus; updatedAt: Date | null; refreshing: boolean;
  changed: number; onRefresh: () => void;
  autoCheck?: boolean; checkedCount?: number;
}) {
  const { status, updatedAt, refreshing, changed, onRefresh, autoCheck = false, checkedCount = 0 } = props;
  const time = updatedAt?.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const live = status === "live";
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 lg:px-5 py-2.5 border-b text-[12.5px] font-semibold",
        live ? "bg-emerald-50/70 border-emerald-100 text-emerald-900"
          : status === "loading" ? "bg-smoke border-line text-graphite/70"
          : "bg-amber-50 border-amber-100 text-amber-900"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {live ? (
          <span className="relative flex w-2.5 h-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </span>
        ) : status === "loading" ? (
          <RefreshCw size={13} strokeWidth={2.6} className="animate-spin shrink-0" />
        ) : (
          <WifiOff size={14} strokeWidth={2.4} className="shrink-0" />
        )}
        <span className="truncate">
          {live && (autoCheck ? <>Цены автоматически проверены в {time}</> : <>Цены обновлены в {time}</>)}
          {status === "loading" && (autoCheck ? <>Проверяем цены по таблице…</> : <>Обновляем цены…</>)}
          {status === "offline" && (autoCheck ? <>Не удалось проверить цены по таблице — показаны сохранённые</> : <>Не удалось обновить цены — показаны сохранённые</>)}
        </span>
        {live && autoCheck && checkedCount > 0 && (
          <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-extrabold">
            цен в таблице: {checkedCount}
          </span>
        )}
        {live && changed > 0 && (
          <span className="shrink-0 rounded-full bg-pro text-graphite px-2 py-0.5 text-[11px] font-extrabold">
            изменилось цен: {changed}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-[11.5px] opacity-60">
          {autoCheck ? (
            <>автопроверка каждые {REFRESH_MS / 1000} секунд</>
          ) : (
            <>авто-обновление каждые {REFRESH_MS / 1000} с</>
          )}
        </span>
        <button
          onClick={onRefresh} disabled={refreshing}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-current/20 bg-white/70 hover:bg-white transition-colors disabled:opacity-60"
        >
          <RefreshCw size={12} strokeWidth={2.7} className={refreshing ? "animate-spin" : ""} />
          {autoCheck ? "Проверить" : "Обновить"}
        </button>
      </div>
    </div>
  );
}
