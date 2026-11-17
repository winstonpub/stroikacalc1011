/* ============================================================================
 * ФАЙЛ: src/components/admin/AboutVisibilityToggle.tsx — Переключатель блока «О …» в админке
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит строку-переключатель, которым администратор включает или выключает блок описания
 *   системы («О грильято», «О системе Армстронг», «О кровле», «О сайдинге») на странице сайта.
 *   Значение общее для всех посетителей: сохраняется вместе с остальными настройками и применяется
 *   после нажатия «Сохранить и опубликовать».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Значение value и обработчик onChange передаёт PageSettingsSection.tsx из settings.aboutVisible.
 * КАК ИЗМЕНИТЬ: Название блока задаётся аргументом title при вызове; внешний вид переключателя — классами ниже.
 * ========================================================================= */

import { cn } from "../../utils/cn";

/* БЛОК: Строка-переключатель блока «О …» (AboutVisibilityToggle)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает название блока, пояснение и выключатель в том же стиле, что и остальные выключатели админки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Аргументы title, value и onChange.
 * КАК ИЗМЕНИТЬ: Пояснения «Показывается…» и «Скрыт…» меняются в тексте ниже. */
export default function AboutVisibilityToggle({
  title,
  value,
  onChange,
}: {
  title: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
        value ? "border-graphite bg-smoke" : "border-line bg-white hover:border-graphite/40",
      )}
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-extrabold">{title}</span>
        <span className="mt-0.5 block text-[12px] font-medium leading-snug text-graphite/55">
          {value ? "Показывается всем посетителям" : "Скрыт для всех посетителей"}
          {" · "}общая настройка, вступит в силу после публикации внизу страницы
        </span>
      </span>
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", value ? "bg-graphite" : "bg-line")}>
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
            value ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
