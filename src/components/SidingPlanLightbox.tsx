/* ============================================================================
 * ФАЙЛ: src/components/SidingPlanLightbox.tsx — Полноэкранный просмотр плана фасада
 * ЗА ЧТО ОТВЕЧАЕТ: При клике по плану фасада в калькуляторе сайдинга открывает его поверх всего экрана на тёмной подложке с размерами стены, подписями профилей краёв и закрытием по Esc, крестику или клику вне чертежа.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Получает расчёт calc, ввод input и готовую SVG-строку плана из компонента src/components/SidingCalculator.tsx, а расшифровку краёв — из EDGE_LABELS (src/data/siding.ts).
 * КАК ИЗМЕНИТЬ: Подписи в шапке и внизу полноэкранного окна меняются в SidingPlanLightbox, а внешний вид значка увеличения на превью — в компоненте PlanZoomHint.
 * ========================================================================= */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { EDGE_LABELS, type SidingCalc, type SidingInput } from "../data/siding";
import { cn } from "../utils/cn";

/* БЛОК: Модальное окно полноэкранного плана фасада (SidingPlanLightbox)
 * ЗА ЧТО ОТВЕЧАЕТ: Выносит диалог в document.body, временно отключает прокрутку страницы, слушает клавишу Escape и отображает крупный SVG-чертёж фасада.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Пропсы calc, input, svg и коллбэк закрытия onClose.
 * КАК ИЗМЕНИТЬ: Максимальная ширина области просмотра на больших экранах задаётся классом max-w-[1300px]. */
export default function SidingPlanLightbox({
  calc,
  input,
  svg,
  onClose,
  details,
}: {
  calc: SidingCalc;
  input: SidingInput;
  svg: string;
  onClose: () => void;
  details?: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-graphite/95 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="План фасада на весь экран"
      onClick={onClose}
    >
      <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between gap-4 text-white">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold sm:text-[18px]">
            План фасада · {calc.L / 1000} × {calc.H / 1000} м
          </div>
          <div className="mt-0.5 text-[12px] font-semibold text-white/50">
            {details ?? `${EDGE_LABELS[input.leftEdge]} · ${EDGE_LABELS[input.rightEdge]} · проёмов ${calc.openings.length}`}
          </div>
        </div>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Закрыть план фасада"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pro"
        >
          <X size={20} strokeWidth={2.2} />
        </button>
      </div>

      <div
        className="mx-auto mt-3 flex min-h-0 w-full max-w-[1300px] flex-1 items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex max-h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white p-3 shadow-2xl animate-scheme-in"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <div className="mx-auto mt-3 w-full max-w-[1300px] text-center text-[12px] font-medium text-white/45">
        Нажмите Esc или вне схемы, чтобы закрыть
      </div>
    </div>,
    document.body,
  );
}

/* БЛОК: Иконка увеличения в углу плана фасада (PlanZoomHint)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает аккуратный квадратный значок развёртывания в правом верхнем углу плана при наведении мыши.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Иконка Maximize2 из пакета lucide-react.
 * КАК ИЗМЕНИТЬ: Положение значка регулируется классами right-4 top-4. */
export function PlanZoomHint({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg border border-line bg-white/90 text-graphite/70 opacity-0 shadow-sm transition-opacity",
        className,
      )}
    >
      <Maximize2 size={15} strokeWidth={2.3} aria-hidden="true" />
    </span>
  );
}
