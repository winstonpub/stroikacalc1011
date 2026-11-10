/* ============================================================================
 * ФАЙЛ: src/pages/ArmstrongPage.tsx — Страница модульного потолка Армстронг (#/armstrong)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит верхний баннер «Потолки Армстронг» с кнопками и живым сроком доставки, калькулятор комплектующих Армстронга, каталог плит/профилей/углов и подвал сайта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: День доставки («Сегодня»/«Завтра») приходит из useChelyabinskDelivery(), цены — из Google-таблицы SPEC_PRICE_SHEET, а каталог материалов и описание системы — из src/components/ArmstrongSystem.tsx и src/data/armstrong.ts.
 * КАК ИЗМЕНИТЬ:
 *   — Заголовок, описание, фоновое фото и карточки преимуществ баннера редактируются прямо в первой секции ниже.
 *   — Плиты, профили, углы и их цены/артикулы редактируются в src/data/armstrong.ts и в Google-таблице.
 * ========================================================================= */

import { motion } from "framer-motion";
import { ArrowRight, LayoutGrid, Layers3, Truck } from "lucide-react";

import SiteFooter from "../components/SiteFooter";
import Calculator from "../components/Calculator";
import ArmstrongSystem from "../components/ArmstrongSystem";
import { SPEC_PRICE_SHEET } from "../data/prices";
import { useChelyabinskDelivery } from "../hooks/useChelyabinskDelivery";

const ease = [0.22, 1, 0.36, 1] as const;

/* БЛОК: Компонент страницы «Армстронг» (ArmstrongPage)
 * ЗА ЧТО ОТВЕЧАЕТ: Отрисовывает все четыре раздела страницы сверху вниз: Hero-баннер, калькулятор в режиме mode="armstrong", каталог системы и общий подвал.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Хук челябинского времени useChelyabinskDelivery() и дочерние компоненты.
 * КАК ИЗМЕНИТЬ: Править тексты баннера можно прямо внутри первой <section> ниже. */
export default function ArmstrongPage() {
  const deliveryDay = useChelyabinskDelivery();

  return (
    <>
      {/* БЛОК: Верхний баннер «Потолки Армстронг» | ЗА ЧТО ОТВЕЧАЕТ: Фоновое фото, крупный заголовок, кнопки «Калькулятор» и «О системе Армстронг», 3 карточки статистики со сроком доставки | ОТКУДА ДАННЫЕ: Фото images/armstrong-hero.jpg и хук useChelyabinskDelivery() | КАК ИЗМЕНИТЬ: Поменяйте текст внутри <h1>/<p>, фото в <img src="..."> или плашки в массиве со статистикой */}
      <section className="relative overflow-hidden bg-graphite text-white">
        <div className="absolute inset-0">
          <img
            src="images/armstrong-hero.jpg"
            alt="Подвесной потолок Армстронг в современном офисе"
            className="w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/85 to-graphite/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-graphite/55" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 lg:px-8 pt-16 pb-14 lg:pt-24 lg:pb-20">
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease }}
              className="text-[44px] leading-[0.98] sm:text-[64px] lg:text-[84px] font-black tracking-[-0.02em]"
            >
              Потолки
              <br />
              <span className="text-pro">Армстронг</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.18, ease }}
              className="mt-5 max-w-xl text-[16px] lg:text-[18px] leading-relaxed text-white/70"
            >
              Модульная подвесная система с акустическими плитами: скрывает коммуникации,
              снижает шум и даёт доступ в любую точку запотолочного пространства.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.28, ease }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href="#/armstrong#calc"
                className="group inline-flex items-center gap-2.5 h-[52px] px-7 rounded-2xl bg-pro text-graphite font-extrabold text-[15px] hover:bg-pro-soft transition-all hover:gap-4"
              >
                Калькулятор
                <ArrowRight size={19} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#/armstrong#features"
                className="inline-flex items-center gap-2 h-[52px] px-6 rounded-2xl border border-white/20 text-white/85 font-bold text-[15px] hover:bg-white/10 hover:text-white transition-colors"
              >
                О системе Армстронг
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.42, ease }}
            className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl"
          >
            {[
              { icon: LayoutGrid, big: "8 видов", small: "потолочных плит" },
              { icon: Layers3, big: "3 материала", small: "минеральная вата, сталь, алюминий" },
              { icon: Truck, big: deliveryDay, small: "доставка по Челябинску" },
            ].map(({ icon: Icon, big, small }) => (
              <div key={small} className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur px-4 py-4 hover:border-pro/50 transition-colors">
                <Icon size={18} strokeWidth={2.2} className="text-pro" />
                <div className="mt-2 text-[26px] font-black leading-none tabular">{big}</div>
                <div className="mt-1 text-[12.5px] leading-snug text-white/60">{small}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* БЛОК: Калькулятор потолка Армстронг | ЗА ЧТО ОТВЕЧАЕТ: Расчёт помещения, выбор плиты/профиля/угла/подвеса с фото и смета с онлайн-ценами | ОТКУДА ДАННЫЕ: src/data/armstrong.ts и Google-таблица SPEC_PRICE_SHEET | КАК ИЗМЕНИТЬ: Товары и формулы — в src/data/armstrong.ts, интерфейс — в src/components/Calculator.tsx */}
      <Calculator
        showPlan={false}
        showTableTotal={false}
        mode="armstrong"
        priceSheet={SPEC_PRICE_SHEET}
        background="white"
      />

      {/* БЛОК: Описание системы и подробные карточки плит, профилей и углов | ЗА ЧТО ОТВЕЧАЕТ: Раздел #features с карточками и кнопками быстрого выбора материала в калькулятор | ОТКУДА ДАННЫЕ: src/components/ArmstrongSystem.tsx | КАК ИЗМЕНИТЬ: Откройте src/components/ArmstrongSystem.tsx */}
      <ArmstrongSystem />

      {/* БЛОК: Подвал сайта | ЗА ЧТО ОТВЕЧАЕТ: Логотип, ссылки, информация о магазине и кнопка «Настройка» | ОТКУДА ДАННЫЕ: src/components/SiteFooter.tsx | КАК ИЗМЕНИТЬ: В «Администрировании» (#/admin) */}
      <SiteFooter />
    </>
  );
}
