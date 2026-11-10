/* ============================================================================
 * ФАЙЛ: src/pages/MainPage.tsx — Главная страница сайта (#/)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит приветственный баннер «Калькуляторы Стройка», плашки преимуществ (динамический срок доставки «Сегодня»/«Завтра» и «1 минута до готовой сметы»), витрину «Выберите Калькулятор» из 4 выровненных карточек и общий подвал.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Карточки калькуляторов берутся из массива systems прямо в этом файле, срок доставки («Сегодня» до 16:00, «Завтра» с 16:00 по Челябинску) — из хука useChelyabinskDelivery(), фотографии — из папки public/images/.
 * КАК ИЗМЕНИТЬ:
 *   — Чтобы изменить тексты, теги, картинки или ссылки карточек в блоке «Выберите Калькулятор», отредактируйте массив systems ниже.
 *   — Чтобы поменять главный заголовок, подзаголовок или фоновое фото баннера, отредактируйте секцию id="top".
 * ========================================================================= */

import { motion } from "framer-motion";
import {
  ArrowRight,
  Grid3X3,
  House,
  Layers3,
  Rows3,
} from "lucide-react";
import SiteFooter from "../components/SiteFooter";
import { useChelyabinskDelivery } from "../hooks/useChelyabinskDelivery";
import { useSiteSettings } from "../data/siteSettings";

const ease = [0.22, 1, 0.36, 1] as const;

/* БЛОК: Список карточек в разделе «Выберите Калькулятор» (systems)
 * ЗА ЧТО ОТВЕЧАЕТ: Определяет все карточки калькуляторов на главной странице (Грильято, Армстронг, Кровля, Сайдинг).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Тексты, теги, адреса перехода href и иконки заданы в этом массиве; картинки лежат в public/images/.
 * КАК ИЗМЕНИТЬ: Отредактируйте name (крупное название), eyebrow (жёлтая подпись), description (описание), image (путь к фото в public/), href (ссылка на страницу), tags (список плашек) или добавьте новый объект для нового калькулятора. */
const systems = [
  {
    name: "Грильято",
    eyebrow: "Ячеистый потолок",
    description:
      "Алюминиевая решётчатая система для торговых залов, офисов и общественных пространств.",
    image: "images/grilyato-hero.jpg",
    href: "#/grilyato",
    action: "Открыть калькулятор",
    tags: ["50×50", "75×75", "100×100"],
    Icon: Grid3X3,
  },
  {
    name: "Армстронг",
    eyebrow: "Модульный потолок",
    description:
      "Практичная система с плитами 600×600 для акустического комфорта и быстрого доступа к коммуникациям.",
    image: "images/armstrong-hero.jpg",
    href: "#/armstrong",
    action: "Открыть калькулятор",
    tags: ["600×600", "Т-24", "НГ"],
    Icon: Layers3,
  },
  {
    name: "Кровля",
    eyebrow: "Листовая кровля",
    description:
      "Профилированные листы и ондулин для скатных крыш частных домов, дач и хозяйственных построек.",
    image: "images/roof-hero.jpg",
    href: "#/roof",
    action: "Открыть калькулятор",
    tags: ["С20", "С8", "Монтерей", "Ондулин"],
    Icon: House,
  },
  {
    name: "Сайдинг",
    eyebrow: "Обшивка фасада",
    description:
      "Панельная ПВХ-система для наружной отделки стен: защита фасада и аккуратный внешний вид дома.",
    image: "images/siding-hero.jpg",
    href: "#/siding",
    action: "Открыть калькулятор",
    tags: ["ПВХ", "3000 × 203 мм", "Учёт обрезков"],
    Icon: Rows3,
  },
];

/* БЛОК: Компонент главной страницы (MainPage)
 * ЗА ЧТО ОТВЕЧАЕТ: Собирает воедино верхний Hero-экран, каталог калькуляторов и нижний блок (подвал) сайта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Срок доставки deliveryDay из useChelyabinskDelivery(), список систем из массива systems выше и подвал из src/components/SiteFooter.tsx.
 * КАК ИЗМЕНИТЬ: Каждый внутренний экран подписан ниже — правьте нужный текст или классы прямо внутри соответствующего <section>. */
export default function MainPage() {
  const deliveryDay = useChelyabinskDelivery();
  const settings = useSiteSettings();
  /* Карточка показывается, пока в админке не выключена кнопка «Главная» (флаг onHome); пункт меню шапки управляется отдельно */
  const visibleSystems = systems.filter((system) => {
    const item = settings.menu.find((entry) => entry.href === system.href);
    return !item || item.onHome !== false;
  });

  return (
    <>
      {/* БЛОК: Верхний приветственный экран «Калькуляторы Стройка» (id="top") | ЗА ЧТО ОТВЕЧАЕТ: Крупный баннер с заголовком, кнопкой прокрутки к каталогу и двумя карточками преимуществ | ОТКУДА ДАННЫЕ: Фоновое фото images/grilyato-hero.jpg и день доставки deliveryDay (зависит от 16:00 по Челябинску) | КАК ИЗМЕНИТЬ: Поменяйте текст внутри <h1> и <p>, фото в <img src="..."> или подписи плашек в массиве с deliveryDay и "1 минута" */}
      <section id="top" className="relative overflow-hidden bg-graphite text-white">
        <div className="absolute inset-0">
          <img
            src="images/main-hero.jpg"
            alt="Современный интерьер с подвесным потолком"
            className="h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/88 to-graphite/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-graphite/60" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-28">
          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease }}
              className="text-[44px] font-black leading-[0.98] tracking-[-0.02em] sm:text-[64px] lg:text-[84px]"
            >
              Калькуляторы Стройка
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.18, ease }}
              className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/70 lg:text-[18px]"
            >
              Удобные расчеты с характеристиками материалов
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.28, ease }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href="#systems"
                className="group inline-flex h-[52px] items-center gap-2.5 rounded-2xl bg-pro px-7 text-[15px] font-extrabold text-graphite transition-all hover:gap-4 hover:bg-pro-soft"
              >
                Выбрать Калькулятор
                <ArrowRight size={19} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.42, ease }}
            className="mt-14 grid max-w-xl grid-cols-2 gap-3"
          >
            {[
              { value: deliveryDay, label: "доставка по Челябинску" },
              { value: "1 минута", label: "до готовой сметы" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur transition-colors hover:border-pro/50"
              >
                <div className="text-[24px] font-black leading-none tabular lg:text-[27px]">{item.value}</div>
                <div className="mt-1 text-[12px] leading-snug text-white/60">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* БЛОК: Каталог систем «Выберите Калькулятор» (id="systems") | ЗА ЧТО ОТВЕЧАЕТ: Выводит карточки калькуляторов. Карточки, выключенные кнопкой «Главная» в админке, не показываются | ОТКУДА ДАННЫЕ: Массив systems и флаг onHome из settings.menu */}
      {visibleSystems.length > 0 && <section id="systems" className="scroll-mt-[130px] bg-smoke py-14 lg:py-20">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="mb-10"
          >
            <h2 className="text-[32px] font-black leading-[1.02] tracking-[-0.01em] lg:text-[46px]">
              Выберите Калькулятор
            </h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleSystems.map(({ name, eyebrow, description, image, href, action, tags, Icon }, index) => (
              <motion.a
                key={name}
                href={href}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.75, delay: index * 0.1, ease }}
                className="group relative flex min-h-[430px] overflow-hidden rounded-3xl border border-line bg-graphite text-white shadow-[0_12px_34px_rgba(20,25,27,0.12)]"
              >
                <img
                  src={image}
                  alt={`${eyebrow}: ${name}`}
                  className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/55 to-graphite/10" />
                <div className="relative grid w-full grid-rows-[auto_auto_auto_minmax(6.5rem,1fr)_auto_auto] p-6 lg:p-8">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-pro text-graphite">
                    <Icon size={22} strokeWidth={2.3} />
                  </div>
                  <div className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-pro">{eyebrow}</div>
                  <h3 className="mt-2 text-[36px] font-black leading-none tracking-[-0.02em]">{name}</h3>
                  <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-white/70">{description}</p>
                  <div className="mt-5 flex min-h-[4.5rem] flex-wrap content-start gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="h-fit rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11.5px] font-bold text-white/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="mt-2 inline-flex items-center gap-2 self-end text-[14px] font-extrabold text-pro transition-all group-hover:gap-3">
                    {action}
                    <ArrowRight size={16} strokeWidth={2.6} />
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>}

      {/* БЛОК: Подвал сайта | ЗА ЧТО ОТВЕЧАЕТ: Нижний блок с логотипом, ссылками, контактами магазина и кнопкой «Настройка» | ОТКУДА ДАННЫЕ: src/components/SiteFooter.tsx и настройки админки | КАК ИЗМЕНИТЬ: На странице «Администрирование» (#/admin) */}
      <SiteFooter />
    </>
  );
}
