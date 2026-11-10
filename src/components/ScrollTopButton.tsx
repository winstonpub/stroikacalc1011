/* ============================================================================
 * ФАЙЛ: src/components/ScrollTopButton.tsx — Плавающая кнопка «Вверх»
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает в левом нижнем углу экрана кнопку «Вверх», когда посетитель прокрутил страницу вниз больше чем на 400 пикселей, и плавно возвращает экран к шапке при нажатии (при печати кнопка скрывается).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Читает текущую вертикальную прокрутку окна браузера window.scrollY.
 * КАК ИЗМЕНИТЬ: Чтобы кнопка появлялась раньше или позже, измените число в константе SHOW_AFTER = 400; чтобы перенести её в правый угол — замените классы left-4 lg:left-6 на right-4 lg:right-6.
 * ========================================================================= */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

/* БЛОК: Порог прокрутки в пикселях и компонент кнопки «Вверх» (SHOW_AFTER, ScrollTopButton)
 * ЗА ЧТО ОТВЕЧАЕТ: Следит за скроллом страницы, учитывает системную настройку уменьшения анимации и рендерит анимированную кнопку поверх контента.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Событие браузера "scroll" и медиа-запрос prefers-reduced-motion.
 * КАК ИЗМЕНИТЬ: Текст кнопки («Вверх») и отступ от нижнего края на телефонах (bottom-24, чтобы не закрывать панель итогов) меняются в <motion.button> ниже. */
const SHOW_AFTER = 400;

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-top"
          type="button"
          onClick={toTop}
          aria-label="Вверх"
          title="Вверх"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="spec-no-print group fixed bottom-24 left-4 z-40 flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-graphite pl-3.5 pr-4 text-[13px] font-extrabold text-white shadow-[0_12px_30px_rgba(20,25,27,0.35)] transition-colors hover:bg-pro hover:text-graphite focus:outline-none focus-visible:ring-2 focus-visible:ring-pro focus-visible:ring-offset-2 print:hidden lg:bottom-6 lg:left-6"
        >
          <ArrowUp size={18} strokeWidth={2.6} className="transition-transform group-hover:-translate-y-0.5" />
          Вверх
        </motion.button>
      )}
    </AnimatePresence>
  );
}
