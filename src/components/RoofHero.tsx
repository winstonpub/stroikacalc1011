/* ============================================================================
 * ФАЙЛ: src/components/RoofHero.tsx — Верхний баннер страницы «Кровля»
 * ЗА ЧТО ОТВЕЧАЕТ: Отображает первый экран раздела #/roof («Раскладка Кровля»), кнопки «Калькулятор» и «О кровле», а также три карточки преимуществ (4 вида кровли, учёт обрезков и доставка «Сегодня»/«Завтра» по времени Челябинска).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Фоновое изображение — public/images/roof-hero.jpg, день доставки («Сегодня» до 16:00, «Завтра» с 16:00) — из хука useChelyabinskDelivery(), прокрутка onStart — из src/pages/RoofPage.tsx.
 * КАК ИЗМЕНИТЬ: Текст заголовка, описания, кнопок и плашек статистики редактируется прямо в разметке ниже; правило смены времени доставки — в src/utils/delivery.ts.
 * ========================================================================= */

import { motion } from "framer-motion";
import { ArrowRight, Warehouse, Scissors, Truck } from "lucide-react";
import { useChelyabinskDelivery } from "../hooks/useChelyabinskDelivery";

const ease = [0.22, 1, 0.36, 1] as const;

/* БЛОК: Компонент первого экрана страницы «Кровля» (RoofHero)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит обложку раздела кровли с динамическим расчётом дня доставки по челябинскому времени.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Хук useChelyabinskDelivery() и проп onStart.
 * КАК ИЗМЕНИТЬ: Поменяйте тексты или фоновую картинку в соответствующих блоках ниже. */
export default function RoofHero({ onStart }: { onStart: () => void }) {
  const deliveryDay = useChelyabinskDelivery();

  return (
    <section id="top" className="relative overflow-hidden bg-graphite text-white">
      {/* БЛОК: Фоновое изображение и градиентное затемнение | ЗА ЧТО ОТВЕЧАЕТ: Подложка баннера кровли | ОТКУДА ДАННЫЕ: Файл public/images/roof-hero.jpg | КАК ИЗМЕНИТЬ: Замените путь в атрибуте src на своё фото кровли в папке public/images/ */}
      <div className="absolute inset-0">
        <img
          src="images/roof-hero.jpg"
          alt="Кровельные системы и скатные крыши"
          className="h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/85 to-graphite/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-graphite/60" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 pb-14 pt-16 lg:px-8 lg:pb-20 lg:pt-24">
        {/* БЛОК: Заголовок «Раскладка Кровля», описание и кнопки действий | ЗА ЧТО ОТВЕЧАЕТ: Знакомит с калькулятором и ведёт к блокам #calc и #features | ОТКУДА ДАННЫЕ: Тексты заданы прямо здесь | КАК ИЗМЕНИТЬ: Отредактируйте содержимое <h1>, <p>, <button> и <a> */}
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.08, ease }}
            className="text-[44px] font-black leading-[0.98] tracking-[-0.02em] sm:text-[64px] lg:text-[84px]"
          >
            Раскладка
            <br />
            <span className="text-pro">Кровля</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18, ease }}
            className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/70 lg:text-[18px]"
          >
            Интерактивный калькулятор раскладки листов кровли: точный расчёт с учётом бокового и
            продольного перехлёста, схема укладки со стрелками и повторное использование подрезок.
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
              href="#/roof#features"
              className="inline-flex h-[52px] items-center gap-2 rounded-2xl border border-white/20 px-6 text-[15px] font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              О кровле
            </a>
          </motion.div>
        </div>

        {/* БЛОК: Карточки преимуществ внизу баннера | ЗА ЧТО ОТВЕЧАЕТ: Показывает 4 вида профиля, учёт обрезков и срок доставки по Челябинску | ОТКУДА ДАННЫЕ: Массив ниже и переменная deliveryDay из useChelyabinskDelivery() | КАК ИЗМЕНИТЬ: Поменяйте тексты big и small в массиве ниже */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.42, ease }}
          className="mt-14 grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {[
            { icon: Warehouse, big: "4 вида", small: "С20, С8, черепица, ондулин" },
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
