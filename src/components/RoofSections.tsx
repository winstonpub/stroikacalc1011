/* ============================================================================
 * ФАЙЛ: src/components/RoofSections.tsx — Информационный раздел системы кровли и подвал
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит на странице #/roof тёмную секцию «Система Кровли» (описание технологии укладки, 4 преимущества, фото с плашкой «С20 / С8»), справочник 4 видов кровельных материалов <RoofTypeGuide />, плашку быстрого возврата к калькулятору и подвал сайта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Фотография — из public/images/roof-detail.jpg, карточки профилей кровли — из src/components/RoofTypeGuide.tsx, подвал — из src/components/SiteFooter.tsx.
 * КАК ИЗМЕНИТЬ: Преимущества кровли редактируйте в массиве feats, заголовок и описание — в <h2>/<p>, а карточки С20/С8/Монтерей/Ондулин — в файле src/components/RoofTypeGuide.tsx.
 * ========================================================================= */

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Layers,
  Droplets,
  Wind,
} from "lucide-react";
import SiteFooter from "./SiteFooter";
import RoofTypeGuide from "./RoofTypeGuide";

const ease = [0.22, 1, 0.36, 1] as const;

/* БЛОК: Секция «Система Кровли» с преимуществами и гидом по материалам (RoofSystemBlock)
 * ЗА ЧТО ОТВЕЧАЕТ: Описывает укладку листовой кровли с перехлёстами, выводит 4 карточки достоинств, иллюстрацию и блок «Виды кровли».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Локальный массив feats и дочерний компонент RoofTypeGuide.
 * КАК ИЗМЕНИТЬ: Поменяйте тексты внутри массива feats или в разметке ниже. */
function RoofSystemBlock() {
  const feats = [
    {
      icon: Layers,
      title: "Быстрый монтаж",
      text: "Крупноформатные листы быстро закрывают большие площади скатов с ровным нахлёстом по длине и ширине.",
    },
    {
      icon: Droplets,
      title: "100% защита от влаги",
      text: "Правильный перехлёст листов и замок профиля отводят осадки и защищают подкровельное пространство от протечек.",
    },
    {
      icon: Wind,
      title: "Стойкость к ветру и снегу",
      text: "Рёбра жёсткости профнастила и металлочерепицы выдерживают высокие снеговые нагрузки уральской зимы.",
    },
    {
      icon: ShieldCheck,
      title: "Долговечные покрытия",
      text: "Оцинкованная сталь с полимерным покрытием не ржавеет, не выгорает на солнце и служит от 25 до 50 лет.",
    },
  ];

  return (
    <section id="features" className="relative overflow-hidden bg-graphite py-14 text-white lg:py-20 scroll-mt-[130px]">
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="relative mx-auto max-w-[1400px] px-4 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* БЛОК: Текст о системе кровли и 4 карточки преимуществ | ЗА ЧТО ОТВЕЧАЕТ: Левая колонка описания | ОТКУДА ДАННЫЕ: Массив feats выше | КАК ИЗМЕНИТЬ: Отредактируйте заголовок, абзац или элементы массива feats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease }}
          >
            <div className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-pro">
              Система Кровли
            </div>
            <h2 className="text-[30px] font-black leading-[1.05] tracking-[-0.01em] lg:text-[42px]">
              Кровля, которая<br />надёжно защищает дом
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/60 lg:text-[16px]">
              Листовые кровельные материалы — проверенное решение для скатных крыш домов,
              коттеджей, гаражей, навесов и промышленных зданий.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {feats.map(({ icon: Icon, title, text }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-pro/60"
                >
                  <Icon size={20} strokeWidth={2.2} className="mb-2.5 text-pro" />
                  <div className="mb-1 text-[15px] font-extrabold">{title}</div>
                  <div className="text-[13px] leading-relaxed text-white/55">{text}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* БЛОК: Иллюстрация технологии укладки с плашкой «С20 / С8» | ЗА ЧТО ОТВЕЧАЕТ: Правая колонка с фотографией и пояснением монтажа | ОТКУДА ДАННЫЕ: Файл public/images/roof-detail.jpg | КАК ИЗМЕНИТЬ: Положите новое фото в public/images/ и укажите путь в src */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <img
                src="images/roof-detail.jpg"
                alt="Кровельные материалы и профили"
                className="h-[380px] w-full object-cover lg:h-[520px]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite/95 to-transparent p-6 pt-16">
                <div className="mb-1 text-[13px] font-bold uppercase tracking-widest text-pro">
                  Технология укладки
                </div>
                <div className="text-[14px] font-medium text-white/80">
                  Монтаж листов ведётся снизу вверх с боковым и продольным нахлёстом.
                  Остатки от подрезки крайних листов используются на следующих рядах.
                </div>
              </div>
            </div>
            <div className="absolute -right-3 -top-4 rounded-2xl bg-pro px-4 py-3 text-graphite shadow-xl animate-floaty lg:-right-5">
              <div className="text-[22px] font-black leading-none">С20 / С8</div>
              <div className="text-[11px] font-bold">популярный профиль</div>
            </div>
          </motion.div>
        </div>

        {/* БЛОК: Четыре карточки видов кровли со схемами волн | ЗА ЧТО ОТВЕЧАЕТ: Сравнение С20, С8, Монтерей и Ондулина | ОТКУДА ДАННЫЕ: src/components/RoofTypeGuide.tsx | КАК ИЗМЕНИТЬ: Откройте src/components/RoofTypeGuide.tsx */}
        <RoofTypeGuide />

      </div>
    </section>
  );
}

/* БЛОК: Обёртка нижних разделов страницы «Кровля» (RoofSections)
 * ЗА ЧТО ОТВЕЧАЕТ: Последовательно выводит RoofSystemBlock и общий подвал SiteFooter.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из компонентов RoofSystemBlock и SiteFooter.
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
export default function RoofSections() {
  return (
    <>
      <RoofSystemBlock />
      <SiteFooter />
    </>
  );
}
