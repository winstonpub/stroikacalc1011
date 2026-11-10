/* ============================================================================
 * ФАЙЛ: src/components/CellSchemePreview.tsx — Миниатюра схемы кассеты Грильято с увеличением
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит под кнопками выбора размера ячейки в калькуляторе Грильято карточку с техническим чертежом кассеты и по клику разворачивает его на весь экран.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Получает выбранный размер ячейки mm, цвет профилей colorId и подпись label из src/components/Calculator.tsx, а сам чертёж рисует компонент CellScheme из src/components/CellScheme.tsx.
 * КАК ИЗМЕНИТЬ: Подпись «Схема ячейки» внизу миниатюры и оформление полноэкранного диалога меняются прямо здесь; сам векторный чертёж — в src/components/CellScheme.tsx.
 * ========================================================================= */

import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { CellScheme } from "./CellScheme";

/* БЛОК: Компонент превью и полноэкранного окна схемы ячейки (CellSchemePreview)
 * ЗА ЧТО ОТВЕЧАЕТ: При смене размера или цвета сбрасывает зум, а при открытии на весь экран блокирует прокрутку страницы и закрывает окно по клавише Escape или клику по фону.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Пропсы mm, colorId, label и дочерний чертёж <CellScheme />.
 * КАК ИЗМЕНИТЬ: Максимальная ширина увеличенного чертежа задана классом max-w-[900px]. */
export default function CellSchemePreview({
  mm,
  colorId,
  label,
}: {
  mm: number;
  colorId: string;
  label: string;
}) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => setZoomed(false), [mm, colorId]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomed]);

  return (
    <>
      {/* БЛОК: Компактная карточка схемы в левой панели калькулятора | ЗА ЧТО ОТВЕЧАЕТ: Кликабельное превью чертежа с подписью размера внизу | ОТКУДА ДАННЫЕ: <CellScheme /> и строка label | КАК ИЗМЕНИТЬ: Текст «Схема ячейки» меняется в нижнем <span> */}
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          title="Открыть схему на весь экран"
          aria-label={`Открыть схему ячейки ${label} на весь экран`}
          className="group relative block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-pro"
        >
          <CellScheme
            key={`${mm}-${colorId}`}
            mm={mm}
            colorId={colorId}
            className="block h-auto w-full animate-scheme-in p-2"
          />
          <span className="pointer-events-none absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-graphite/60 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            <Maximize2 size={14} strokeWidth={2.2} />
          </span>
        </button>
        <div className="flex items-center justify-between border-t border-line bg-smoke px-3 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-graphite/45">Схема ячейки</span>
          <span className="text-right text-[12px] font-extrabold text-graphite">{label}</span>
        </div>
      </div>

      {/* БЛОК: Полноэкранное модальное окно схемы ячейки | ЗА ЧТО ОТВЕЧАЕТ: Показывает крупный чертёж кассеты поверх страницы | ОТКУДА ДАННЫЕ: Состояние zoomed и <CellScheme /> | КАК ИЗМЕНИТЬ: Заголовок окна меняется в <div>Схема ячейки {label}</div> */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-graphite/95 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Схема ячейки на весь экран: ${label}`}
          onClick={() => setZoomed(false)}
        >
          <div className="flex items-center justify-between gap-4 text-white">
            <div className="text-[13px] font-bold">Схема ячейки {label}</div>
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Закрыть"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>
          <div className="mt-3 flex min-h-0 flex-1 items-center justify-center p-2">
            <div
              className="max-h-full w-full max-w-[900px]"
              onClick={(e) => e.stopPropagation()}
            >
              <CellScheme
                mm={mm}
                colorId={colorId}
                className="max-h-full w-full rounded-xl bg-white p-3 shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
