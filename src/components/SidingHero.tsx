/* ============================================================================
 * ФАЙЛ: src/components/SidingHero.tsx — Верхний баннер страницы «Сайдинг»
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует первый экран страницы #/siding («Обшивка Сайдинг») с фоновым фото фасада, описанием расчёта, кнопками «Калькулятор» и «О сайдинге» и тремя плашками статистики со сроком доставки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Фотография фасада — из файла public/images/siding-hero.jpg, день доставки («Сегодня» до 16:00, «Завтра» с 16:00 по Челябинску) — из хука useChelyabinskDelivery(), обработчик прокрутки onStart — из src/pages/SidingPage.tsx.
 * КАК ИЗМЕНИТЬ: Поменяйте заголовок, подзаголовок, кнопки или подписи плашек прямо в JSX ниже; чтобы заменить фоновое фото — положите новый файл в public/images/siding-hero.jpg.
 * ========================================================================= */

import { motion } from "framer-motion";
import { ArrowRight, Layers, Scissors, Truck } from "lucide-react";
import { useChelyabinskDelivery } from "../hooks/useChelyabinskDelivery";

const ease = [0.22, 1, 0.36, 1] as const;

/* БЛОК: Компонент первого экрана страницы «Сайдинг» (SidingHero)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит баннер раздела сайдинга и обновляет надпись «Сегодня»/«Завтра» по часам Челябинска.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Хук useChelyabinskDelivery() и функция прокрутки onStart.
 * КАК ИЗМЕНИТЬ: Отредактируйте тексты в секциях ниже. */
export default function SidingHero({ onStart }: { onStart: () => void }) {
  const deliveryDay = useChelyabinskDelivery();

  return (
    <section id="top" className="relative overflow-hidden bg-graphite text-white">
      {/* БЛОК: Фоновая фотография фасада и градиенты | ЗА ЧТО ОТВЕЧАЕТ: Визуальный фон под текстом баннера | ОТКУДА ДАННЫЕ: Файл public/images/siding-hero.jpg | КАК ИЗМЕНИТЬ: Замените изображение public/images/siding-hero.jpg или поменяйте путь в src */}
      <div className="absolute inset-0">
        <img
          src="images/siding-hero.jpg"
          alt="Фасад из ПВХ сайдинга"
          className="h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/85 to-graphite/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-graphite/60" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 pb-14 pt-16 lg:px-8 lg:pb-20 lg:pt-24">
        {/* БЛОК: Заголовок «Обшивка Сайдинг», текст описания и кнопки | ЗА ЧТО ОТВЕЧАЕТ: Главный заголовок раздела и переходы к калькулятору (#calc) и описанию (#features) | ОТКУДА ДАННЫЕ: Задано прямо здесь | КАК ИЗМЕНИТЬ: Поменяйте текст внутри <h1>, <p>, <button> и <a> */}
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.08, ease }}
            className="text-[44px] font-black leading-[0.98] tracking-[-0.02em] sm:text-[64px] lg:text-[84px]"
          >
            Обшивка
            <br />
            <span className="text-pro">Сайдинг</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18, ease }}
            className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/70 lg:text-[18px]"
          >
            Интерактивный калькулятор фасада из ПВХ сайдинга: панели 3000 × 203 мм монтируются
            горизонтально без перехлёста, вырезы под окна и двери считаются по месту, а обрезки
            панелей уходят в следующие ряды.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.28, ease }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex h-[52px] items-center gap-2.5 rounded-2xl bg-pro px-7 text-[15px] font-extrabold text-graphite transition-all hover:gap-4 hover:bg-pro-soft"
            >
              Калькулятор
              <ArrowRight size={19} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <a
              href="#/siding#features"
              className="inline-flex h-[52px] items-center gap-2 rounded-2xl border border-white/20 px-6 text-[15px] font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              О сайдинге
            </a>
          </motion.div>
        </div>

        {/* БЛОК: Три плашки статистики сайдинга | ЗА ЧТО ОТВЕЧАЕТ: Кратко показывает 8 элементов системы, учёт обрезков и срок доставки | ОТКУДА ДАННЫЕ: Массив ниже и переменная deliveryDay | КАК ИЗМЕНИТЬ: Поменяйте строки big и small в массиве ниже */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.42, ease }}
          className="mt-14 grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {[
            { icon: Layers, big: "8 элементов", small: "панели, планки, профили и углы" },
            { icon: Scissors, big: "Учет обрезков", small: "учитываются обрезки и используются повторно" },
            { icon: Truck, big: deliveryDay, small: "доставка по Челябинску" },
          ].map(({ icon: Icon, big, small }) => (
            <div
              key={small}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur transition-colors hover:border-pro/50"
            >
              <Icon size={18} strokeWidth={2.2} className="text-pro" />
              <div className="mt-2 text-[26px] font-black leading-none tabular">{big}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-white/60">{small}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
