/* ============================================================================
 * ФАЙЛ: src/components/HProfilePlacementControl.tsx — Смещение H-профиля на странице «Тест»
 * ЗА ЧТО ОТВЕЧАЕТ: Четыре независимые кнопки раскладки вертикальных стыков панелей, активна ровно одна:
 *   «Самый выгодный» — автоподбор с минимумом панелей и остатков; «Симметрично» — зеркально от центра;
 *   «Слева» — целые планки 3 м от левого края; «Справа» — зеркально от правого края.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Активный вариант value из src/data/testFacade.ts.
 * КАК ИЗМЕНИТЬ: Подписи и подсказки кнопок — в H_PROFILE_PLACEMENTS (src/data/testFacade.ts).
 * ========================================================================= */

import { AlignLeft, AlignRight, Coins, Columns2 } from "lucide-react";
import { H_PROFILE_PLACEMENTS, type HProfilePlacement } from "../data/testFacade";
import { cn } from "../utils/cn";

const PLACEMENT_ICONS: Record<HProfilePlacement, typeof Coins> = {
  optimal: Coins,
  symmetric: Columns2,
  left: AlignLeft,
  right: AlignRight,
};

export default function HProfilePlacementControl({
  value,
  onChange,
}: {
  value: HProfilePlacement;
  seams?: number[];
  onChange: (value: HProfilePlacement) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-2.5 lg:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-graphite/50">
          Смещение H профиля
        </span>
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-smoke p-1" role="group" aria-label="Смещение H профиля">
          {H_PROFILE_PLACEMENTS.map(({ id, label, hint }) => {
            const Icon = PLACEMENT_ICONS[id];
            const active = value === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                title={hint}
                onClick={() => onChange(id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pro",
                  active
                    ? "bg-graphite text-white shadow-sm"
                    : "text-graphite/60 hover:bg-white hover:text-graphite",
                )}
              >
                <Icon size={13} strokeWidth={2.4} className={active ? "text-pro" : "text-graphite/45"} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
