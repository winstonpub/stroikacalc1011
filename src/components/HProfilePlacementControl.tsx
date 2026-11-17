/* ============================================================================
 * ФАЙЛ: src/components/HProfilePlacementControl.tsx — Смещение H-профиля в блоке «План фасада»
 * ЗА ЧТО ОТВЕЧАЕТ: Независимые кнопки раскладки вертикальных стыков панелей, активна ровно одна:
 *   «Самый выгодный» — автоподбор с минимумом панелей и остатков; «Симметрично» — зеркально от центра;
 *   «От центра» (только страница «Тест») — H-профиль ровно по центру, панели идут от него в обе стороны;
 *   «Слева» — целые планки 3 м от левого края; «Справа» — зеркально от правого края.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Активный вариант value и список кнопок options из src/data/testFacade.ts.
 * КАК ИЗМЕНИТЬ: Подписи и подсказки кнопок — в H_PROFILE_PLACEMENTS и H_PROFILE_PLACEMENT_CENTER
 *   (src/data/testFacade.ts); значки кнопок — в PLACEMENT_ICONS ниже.
 * ========================================================================= */

import { AlignLeft, AlignRight, Coins, Columns2, UnfoldHorizontal } from "lucide-react";
import { H_PROFILE_PLACEMENTS, type HProfilePlacement } from "../data/testFacade";
import { cn } from "../utils/cn";

const PLACEMENT_ICONS: Record<HProfilePlacement, typeof Coins> = {
  optimal: Coins,
  symmetric: Columns2,
  center: UnfoldHorizontal,
  left: AlignLeft,
  right: AlignRight,
};

export default function HProfilePlacementControl({
  value,
  onChange,
  options = H_PROFILE_PLACEMENTS,
  dense = false,
}: {
  value: HProfilePlacement;
  seams?: number[];
  onChange: (value: HProfilePlacement) => void;
  /** Список кнопок: по умолчанию четыре варианта страницы «Сайдинг»; страница «Тест» передаёт список с «От центра» */
  options?: { id: HProfilePlacement; label: string; hint: string }[];
  /** Уплотнённый вид страницы «Тест»: меньше отступы и высота кнопок */
  dense?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between border-b border-line", dense ? "gap-x-3 gap-y-1 px-3 py-1.5" : "gap-x-4 gap-y-2 px-4 py-2.5 lg:px-5")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-extrabold uppercase tracking-wider text-graphite/50", dense ? "text-[10px]" : "text-[11px]")}>
          Смещение H профиля
        </span>
        <div className={cn("flex flex-wrap items-center rounded-xl bg-smoke", dense ? "gap-0.5 p-0.5" : "gap-1 p-1")} role="group" aria-label="Смещение H профиля">
          {options.map(({ id, label, hint }) => {
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
                  dense
                    ? "inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pro"
                    : "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pro",
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
