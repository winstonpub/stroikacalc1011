/* ============================================================================
 * ФАЙЛ: src/components/SidingSections.tsx — Информационный раздел «Сайдинг», элементы системы и подвал
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит на странице #/siding секцию описания системы («Фасад, который не нуждается в уходе»), 4 карточки преимуществ, крупное фото узла монтажа с плашкой «3000 × 203», сетку из 8 карточек комплектующих «Из чего собирается фасад» и подвал сайта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Названия и габариты 8 комплектующих берутся из объекта SIDING_ELEMENTS (src/data/siding.ts), фото узла — из public/images/siding-detail.jpg, а краткие описания элементов — из словаря notes внутри этого файла.
 * КАК ИЗМЕНИТЬ:
 *   — Тексты преимуществ меняйте в массиве feats ниже.
 *   — Краткие описания под каждым из 8 элементов меняйте в словаре notes.
 *   — Сами названия и размеры элементов (например, "3000 × 203 мм") меняются в src/data/siding.ts.
 * ========================================================================= */

import { motion } from "framer-motion";
import {
  Droplets,
  Layers,
  ShieldCheck,
  Wind,
} from "lucide-react";
import { SIDING_ELEMENTS } from "../data/siding";
import SiteFooter from "./SiteFooter";

const ease = [0.22, 1, 0.36, 1] as const;

/* БЛОК: Секция «Сайдинг» с преимуществами и справочником 8 элементов (SidingSystemBlock)
 * ЗА ЧТО ОТВЕЧАЕТ: Отрисовывает описание ПВХ сайдинга, фотографию монтажа и карточки всех планок и профилей системы.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Массив feats, словарь notes и справочник SIDING_ELEMENTS из src/data/siding.ts.
 * КАК ИЗМЕНИТЬ: Редактируйте тексты в feats, notes или в заголовках <h2>/<h3> ниже. */
function SidingSystemBlock() {
  const feats = [
    {
      icon: Layers,
      title: "Точный раскрой",
      text: "Калькулятор режет панели под окнами и дверьми и раскладывает куски так, чтобы обрезки уходили в дело, а не в отход.",
    },
    {
      icon: Droplets,
      title: "Защита от влаги",
      text: "Замковое соединение панелей отводит осадки, а J-профили и околооконные планки закрывают кромки по периметру проёмов.",
    },
    {
      icon: Wind,
      title: "Лёгкий и ветростойкий",
      text: "ПВХ панель весит немного, поэтому фасад не нагружает стены, а обрешётка компенсирует ветровые нагрузки уральской зимы.",
    },
    {
      icon: ShieldCheck,
      title: "Не боится солнца и мороза",
      text: "ПВХ не ржавеет и не гниёт: панель 3000 × 203 мм рассчитана на долгую эксплуатацию на жаре и в минусовые температуры.",
    },
  ];

  return (
    <section id="features" className="relative scroll-mt-[130px] overflow-hidden bg-graphite py-14 text-white lg:py-20">
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
          {/* БЛОК: Текст о сайдинге и 4 карточки преимуществ | ЗА ЧТО ОТВЕЧАЕТ: Левая колонка описания | ОТКУДА ДАННЫЕ: Массив feats | КАК ИЗМЕНИТЬ: Правьте текст в <h2>/<p> и объекты в feats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease }}
          >
            <div className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-pro">
              Сайдинг
            </div>
            <h2 className="text-[30px] font-black leading-[1.05] tracking-[-0.01em] lg:text-[42px]">
              Фасад, который
              <br />
              не нуждается в уходе
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/60 lg:text-[16px]">
              ПВХ сайдинг — проверенное решение для обшивки стен домов, дач, гаражей и пристроек.
              Панели набираются горизонтально снизу вверх от стартовой планки, каждый ряд режется
              по месту под проёмы.
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

          {/* БЛОК: Фото узла монтажа ПВХ сайдинга с плашкой «3000 × 203» | ЗА ЧТО ОТВЕЧАЕТ: Правая колонка с иллюстрацией | ОТКУДА ДАННЫЕ: Файл public/images/siding-detail.jpg | КАК ИЗМЕНИТЬ: Замените изображение public/images/siding-detail.jpg или подписи ниже */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <img
                src="images/siding-detail.jpg"
                alt="ПВХ сайдинг крупным планом"
                className="h-[380px] w-full object-cover lg:h-[520px]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite/95 to-transparent p-6 pt-16">
                <div className="mb-1 text-[13px] font-bold uppercase tracking-widest text-pro">
                  Технология монтажа
                </div>
                <div className="text-[14px] font-medium text-white/80">
                  Панели монтируются горизонтально от стартовой планки вверх, без перехлёста.
                  Вырезы под проёмы делаются по месту, а обрезки используются в следующих рядах.
                </div>
              </div>
            </div>
            <div className="absolute -right-3 -top-4 rounded-2xl bg-pro px-4 py-3 text-graphite shadow-xl animate-floaty lg:-right-5">
              <div className="text-[22px] font-black leading-none">3000 × 203</div>
              <div className="text-[11px] font-bold">габарит панели, мм</div>
            </div>
          </motion.div>
        </div>

        {/* БЛОК: Сетка «Элементы системы / Из чего собирается фасад» | ЗА ЧТО ОТВЕЧАЕТ: Показывает все 8 планок и профилей с габаритом и назначением | ОТКУДА ДАННЫЕ: SIDING_ELEMENTS из src/data/siding.ts и словарь notes ниже | КАК ИЗМЕНИТЬ: Отредактируйте строки в словаре notes для изменения подписей под элементами */}
        <div className="mt-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="mb-8"
          >
            <div className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-pro">
              Элементы системы
            </div>
            <h3 className="text-[30px] font-black leading-[1.05] tracking-[-0.01em] lg:text-[42px]">
              Из чего собирается фасад
            </h3>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/55">
              Все планки и профили длиной 3 м. Калькулятор сам определяет, где какой элемент
              нужен: обрамление проёмов, края фасада, верх и низ зашивки.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(SIDING_ELEMENTS).map(([key, element], i) => {
              const notes: Record<string, string> = {
                panel: "Основной элемент обшивки",
                start: "Начальная планка полностью перекрываемая сайдингом",
                hProfile: "Стыковочная планка сайдинга",
                finish: "Завершающая планка верхней части сайдинга",
                jamb: "Обрамление проёма",
                jProfile: "Завершающая планка боковой части сайдинга",
                innerCorner: "Внутренний угол сайдинга",
                outerCorner: "Наружный угол сайдинга",
              };
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease }}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-pro/60"
                >
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-pro">
                    {element.size}
                  </div>
                  <div className="mt-1.5 text-[17px] font-black leading-tight">{element.name}</div>
                  <div className="mt-2 text-[12.5px] leading-relaxed text-white/55">{notes[key]}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* БЛОК: Обёртка нижних секций страницы «Сайдинг» (SidingSections)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит блок описания системы SidingSystemBlock и общий подвал SiteFooter.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Компоненты SidingSystemBlock и SiteFooter.
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
export default function SidingSections() {
  return (
    <>
      <SidingSystemBlock />
      <SiteFooter />
    </>
  );
}
