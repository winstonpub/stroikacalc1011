/* ============================================================================
 * ФАЙЛ: src/components/Hero.tsx — Верхний баннер страницы «Грильято»
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует первый экран страницы #/grilyato с фоновым фото потолка Грильято, крупным заголовком «Потолки Грильято», описанием, кнопками «Калькулятор» и «О системе Грильято» и тремя карточками характеристик.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Фоновая фотография берётся из файла public/images/grilyato-hero.jpg, обработчик кнопки onStart передаётся из src/pages/GrilyatoPage.tsx, остальные тексты заданы прямо здесь.
 * КАК ИЗМЕНИТЬ: Поменяйте заголовок в <h1>, описание в <p>, фоновое фото в <img src="images/grilyato-hero.jpg"> или три карточки преимуществ в массиве внизу компонента.
 * ========================================================================= */

import { motion } from "framer-motion";
import { ArrowRight, Grid3X3, PackageCheck, Truck } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

/* БЛОК: Компонент верхнего баннера Грильято (Hero)
 * ЗА ЧТО ОТВЕЧАЕТ: Отображает обложку раздела Грильято и запускает плавную прокрутку к калькулятору при нажатии жёлтой кнопки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Коллбэк onStart из GrilyatoPage.tsx и локальные тексты ниже.
 * КАК ИЗМЕНИТЬ: Править любые надписи и цифры можно прямо в JSX-разметке ниже. */
export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section id="top" className="relative overflow-hidden bg-graphite text-white">
      {/* БЛОК: Фоновая фотография и затемняющие градиенты | ЗА ЧТО ОТВЕЧАЕТ: Создаёт подложку под белым текстом | ОТКУДА ДАННЫЕ: Файл public/images/grilyato-hero.jpg | КАК ИЗМЕНИТЬ: Замените файл в папке public/images/ или укажите другой путь в src */}
      <div className="absolute inset-0">
        <img
          src="images/grilyato-hero.jpg"
          alt="Чёрный потолок Грильято с встроенной подсветкой"
          className="w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/80 to-graphite/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-graphite/60" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 lg:px-8 pt-16 pb-14 lg:pt-24 lg:pb-20">
        {/* БЛОК: Заголовок, описание и кнопки перехода | ЗА ЧТО ОТВЕЧАЕТ: Главный оффер страницы и быстрые кнопки к калькулятору и описанию системы | ОТКУДА ДАННЫЕ: Тексты заданы здесь, кнопка «Калькулятор» вызывает onStart | КАК ИЗМЕНИТЬ: Поменяйте текст внутри <h1>, <p>, <button> или <a> */}
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.08, ease }}
            className="text-[44px] leading-[0.98] sm:text-[64px] lg:text-[84px] font-black tracking-[-0.02em]"
          >
            Потолки
            <br />
            <span className="text-pro">Грильято</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18, ease }}
            className="mt-5 max-w-xl text-[16px] lg:text-[18px] leading-relaxed text-white/70"
          >
            Ячеистая подвесная система из алюминиевых профилей: скрывает коммуникации,
            пропускает свет и воздух и даёт доступ в любую точку запотолочного пространства.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.28, ease }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button
              onClick={onStart}
              className="group inline-flex items-center gap-2.5 h-[52px] px-7 rounded-2xl bg-pro text-graphite font-extrabold text-[15px] hover:bg-pro-soft transition-all hover:gap-4"
            >
              Калькулятор
              <ArrowRight size={19} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <a
              href="#/grilyato#features"
              className="inline-flex items-center gap-2 h-[52px] px-6 rounded-2xl border border-white/20 text-white/85 font-bold text-[15px] hover:bg-white/10 hover:text-white transition-colors"
            >
              О системе Грильято
            </a>
          </motion.div>
        </div>

        {/* БЛОК: Три карточки ключевых фактов о Грильято | ЗА ЧТО ОТВЕЧАЕТ: Показывает сводку по размерам ячеек, цветам и доставке | ОТКУДА ДАННЫЕ: Локальный массив из 3 объектов ниже | КАК ИЗМЕНИТЬ: Поменяйте поля big (крупная надпись) и small (пояснение снизу) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.42, ease }}
          className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl"
        >
          {[
            { icon: Grid3X3, big: "3 размера", small: "ячейки: 50×50, 75×75, 100×100" },
            { icon: PackageCheck, big: "3 цвета", small: "чёрный, белый, металлик" },
            { icon: Truck, big: "от 3-х дней", small: "доставка по Челябинску" },
          ].map(({ icon: Icon, big, small }) => (
            <div
              key={small}
              className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur px-4 py-4 hover:border-pro/50 transition-colors"
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
