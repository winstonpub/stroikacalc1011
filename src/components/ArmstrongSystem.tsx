/* ============================================================================
 * ФАЙЛ: src/components/ArmstrongSystem.tsx — Описание системы Армстронг и витрина комплектующих
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует нижнюю тёмную секцию страницы #/armstrong (блок «Система Армстронг», 8 карточек потолочных плит, 2 карточки профилей Т-24 и 2 карточки пристенных углов) с кнопками быстрого подбора в калькулятор.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Названия и фото товаров берутся из ARMSTRONG_TILES, ARMSTRONG_PROFILES и ARMSTRONG_ANGLES в файле src/data/armstrong.ts, а подробные описания и свойства прописаны в массивах TILES, PROFILES и ANGLES ниже.
 * КАК ИЗМЕНИТЬ:
 *   — Характеристики и описания плит редактируйте в массиве TILES ниже.
 *   — Описания профилей и углов редактируйте в константах PROFILES и ANGLES.
 *   — Сами фотографии и артикулы товаров меняются в src/data/armstrong.ts.
 * ========================================================================= */

import { motion } from "framer-motion";
import {
  ArrowRight, Droplets, Flame, Layers, ShieldCheck, Sparkles, Volume2,
} from "lucide-react";
import { ARMSTRONG_ANGLES, ARMSTRONG_PROFILES, ARMSTRONG_TILES } from "../data/armstrong";
import { cn } from "../utils/cn";

const ease = [0.22, 1, 0.36, 1] as const;

/* БЛОК: Подробные карточки восьми видов потолочных плит 600×600 (TILES)
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит описания, материал, упаковку, акустику, влагостойкость и области применения для каждой из 8 плит каталога.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Поле id связывает каждую карточку с товаром из ARMSTRONG_TILES в src/data/armstrong.ts.
 * КАК ИЗМЕНИТЬ: Поменяйте тексты badge, lead, acoustic, moisture, pack или список тегов uses в нужном объекте. */
interface TileInfo {
  id: string;
  kind: string;
  badge: string;
  featured?: boolean;
  lead: string;
  material: string;
  pack: string;
  acoustic: string;
  moisture: string;
  weight: string;
  uses: string[];
}

const TILES: TileInfo[] = [
  {
    id: "pharaon",
    kind: "Минеральное волокно",
    badge: "Самый экономичный",
    featured: true,
    lead: "Готовый набор из 24 белых плит 600×600 мм. Закрывает 8,64 м² одной коробкой — удобно для офисов, коридоров и типовых помещений.",
    material: "минеральная плита",
    pack: "24 шт · 8,64 м²",
    acoustic: "базовая",
    moisture: "стандартная",
    weight: "лёгкая",
    uses: ["Офисы", "Коридоры", "Переговорные", "Школы", "Администрации", "Склады"],
  },
  {
    id: "baikal",
    kind: "Knauf Armstrong",
    badge: "Акустический комфорт",
    lead: "Плита Байкал 90RH Board 12 мм: поглощает шум и держит ровный белый потолок. Коробка 20 шт закрывает 7,2 м².",
    material: "минеральное волокно 12 мм",
    pack: "20 шт · 7,2 м²",
    acoustic: "высокая",
    moisture: "стандартная",
    weight: "средняя",
    uses: ["Open space", "Колл-центры", "Классы", "Библиотеки", "Переговорные", "Приёмные"],
  },
  {
    id: "white-galvanized-steel",
    kind: "Металл · оцинковка",
    badge: "Для влажных зон",
    lead: "Оцинкованная сталь не боится влаги и легко моется. Подходит для кухонь, санузлов, лабораторий и технических помещений.",
    material: "оцинкованная сталь",
    pack: "штучно · 0,36 м²",
    acoustic: "умеренная",
    moisture: "высокая",
    weight: "средняя",
    uses: ["Санузлы", "Кухни", "Лаборатории", "Медблоки", "Производства", "Паркинги"],
  },
  {
    id: "white-steel",
    kind: "Металл · сталь",
    badge: "Прочный каркас",
    lead: "Стальная панель Tegular/Т-24: жёсткая кромка, ровная белая поверхность и долгий срок службы в общественных зонах.",
    material: "сталь с покрытием",
    pack: "штучно · 0,36 м²",
    acoustic: "умеренная",
    moisture: "средняя",
    weight: "средняя",
    uses: ["Торговые залы", "Холлы", "Коридоры ТРЦ", "Вокзалы", "Офисы", "Сервисные зоны"],
  },
  {
    id: "perforated-white",
    kind: "Металл · перфорация",
    badge: "Максимум акустики",
    lead: "Перфорированная белая панель снижает эхо и пропускает воздух. Выглядит технологично в современных интерьерах.",
    material: "перфорированный металл",
    pack: "штучно · 0,36 м²",
    acoustic: "высокая",
    moisture: "средняя",
    weight: "средняя",
    uses: ["Конференц-залы", "Аудитории", "Фитнес", "Кафе", "Шоурумы", "Ресепшен"],
  },
  {
    id: "so-dae-10",
    kind: "Минеральное волокно",
    badge: "SO-DAE · 10 мм",
    lead: "Белая минеральная плита SO-DAE 600×600×10 мм. В коробке 16 плит — 5,76 м² ровного светлого потолка для офисов и общественных помещений.",
    material: "минеральное волокно 10 мм",
    pack: "16 шт · 5,76 м²",
    acoustic: "базовая",
    moisture: "стандартная",
    weight: "лёгкая",
    uses: ["Офисы", "Коридоры", "Переговорные", "Магазины", "Школы", "Администрации"],
  },
  {
    id: "so-dae-7",
    kind: "Минеральное волокно",
    badge: "SO-DAE · 7 мм",
    lead: "Облегчённая белая плита SO-DAE 600×600×7 мм. Упаковка из 20 плит закрывает 7,2 м² — удобно для больших площадей и типовых офисов.",
    material: "минеральное волокно 7 мм",
    pack: "20 шт · 7,2 м²",
    acoustic: "базовая",
    moisture: "стандартная",
    weight: "лёгкая",
    uses: ["Open space", "Офисы", "Коридоры", "Классы", "Приёмные", "Склады"],
  },
  {
    id: "white-aluminum",
    kind: "Алюминий",
    badge: "Лёгкий металл",
    lead: "Алюминиевая панель не ржавеет, мало весит и не горит. Премиальный вид для офисов класса A, банков и лобби.",
    material: "алюминий",
    pack: "штучно · 0,36 м²",
    acoustic: "умеренная",
    moisture: "высокая",
    weight: "очень лёгкая",
    uses: ["Банки", "Лобби", "Бутики", "Клиники", "Офисы A-класса", "Выставки"],
  },
];

/* БЛОК: Данные для карточек профилей Т-24 и пристенных углов (PROFILES, ANGLES)
 * ЗА ЧТО ОТВЕЧАЕТ: Формирует описания, таблицы параметров и области применения для разделов «Виды профилей» и «Виды углов».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Названия и картинки берёт из ARMSTRONG_PROFILES и ARMSTRONG_ANGLES (src/data/armstrong.ts).
 * КАК ИЗМЕНИТЬ: Тексты описаний и характеристики details меняются прямо внутри PROFILES и ANGLES. */
interface AccessoryInfo {
  id: string;
  label: string;
  kind: string;
  badge: string;
  image: string;
  description: string;
  details: [string, string][];
  uses: string[];
}

const PROFILES: AccessoryInfo[] = ARMSTRONG_PROFILES.map((profile) => ({
  id: profile.id,
  label: profile.label,
  kind: `Т-профиль ${profile.label}`,
  badge: profile.id === "premium" ? "Профиль премиум-класса" : "Практичное решение",
  image: profile.image,
  description: profile.id === "premium"
    ? "Комплект белых направляющих для каркаса Т-24: несущий профиль и поперечные элементы формируют ровную ячейку 600×600 мм."
    : "Комплект белых направляющих Т-24 для типового подвесного потолка. Помогает собрать каркас с нужным шагом под плиты 600×600 мм.",
  details: [
    ["Система", "Т-24"],
    ["Несущий профиль", "3 700 мм"],
    ["Поперечные профили", "1 200 и 600 мм"],
    ["Цвет", "Белый"],
  ],
  uses: profile.id === "premium"
    ? ["Офисы", "Торговые залы", "Холлы", "Общественные помещения"]
    : ["Кабинеты", "Коридоры", "Складские зоны", "Типовой ремонт"],
}));

const ANGLES: AccessoryInfo[] = ARMSTRONG_ANGLES.map((angle) => ({
  id: angle.id,
  label: angle.label,
  kind: `Пристенный угол · ${angle.label.toLowerCase()}`,
  badge: angle.id === "steel" ? "Надёжное крепление" : "Лёгкий металл",
  image: angle.image,
  description: angle.id === "steel"
    ? "Стальной уголок закрепляет край каркаса по периметру помещения и задаёт аккуратную линию примыкания к стене."
    : "Алюминиевый уголок для периметра потолка: лёгкий, устойчивый к коррозии, с чистым белым финишем.",
  details: [
    ["Материал", angle.id === "steel" ? "Сталь" : "Алюминий"],
    ["Сечение", "19 × 19 мм"],
    ["Длина", "3 000 мм"],
    ["Цвет", "Белый"],
  ],
  uses: angle.id === "steel"
    ? ["Офисы", "Коридоры", "Торговые помещения", "Общественные зоны"]
    : ["Влажные зоны", "Кухни", "Клиники", "Премиальные интерьеры"],
}));

/* БЛОК: Карточка и секция комплектующих — профиля или угла (AccessoryCard, AccessorySection)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует карточку аксессуара и по нажатию кнопки внизу отправляет событие armstrong:select-profile / armstrong:select-angle в калькулятор и прокручивает экран вверх к расчёту.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Объект AccessoryInfo из массивов PROFILES / ANGLES.
 * КАК ИЗМЕНИТЬ: Внешний вид карточки меняется в классах внутри AccessoryCard. */
function AccessoryCard({
  info,
  group,
  index,
}: {
  info: AccessoryInfo;
  group: "profile" | "angle";
  index: number;
}) {
  const choose = () => {
    window.dispatchEvent(new CustomEvent(`armstrong:select-${group}`, { detail: info.id }));
    document.getElementById("calc")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition-colors hover:border-pro/50"
    >
      <div className="relative overflow-hidden bg-white/5">
        <img
          src={info.image}
          alt={info.kind}
          loading="lazy"
          className="block aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-graphite/85 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white backdrop-blur">
          {info.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h4 className="text-[23px] font-black leading-none tracking-[-0.02em]">{info.label}</h4>
        <div className="mt-2 text-[12px] font-extrabold uppercase tracking-[0.16em] text-pro">{info.kind}</div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-white/60">{info.description}</p>

        <dl className="mt-5 divide-y divide-white/10 border-y border-white/10 text-[13px]">
          {info.details.map(([key, value]) => (
            <div key={key} className="flex items-baseline justify-between gap-3 py-2.5">
              <dt className="text-white/55">{key}</dt>
              <dd className="text-right font-bold tabular">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/45">Подходит для</div>
          <div className="flex flex-wrap gap-1.5">
            {info.uses.map((use) => (
              <span
                key={use}
                className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11.5px] font-semibold text-white/80"
              >
                {use}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={choose}
          className="mt-auto inline-flex items-center gap-2 pt-6 text-[13.5px] font-extrabold text-pro transition-all hover:gap-3"
        >
          Выбрать {group === "profile" ? "профиль" : "угол"} «{info.label}»
          <ArrowRight size={15} strokeWidth={2.6} />
        </button>
      </div>
    </motion.article>
  );
}

function AccessorySection({
  id,
  eyebrow,
  title,
  description,
  group,
  items,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  group: "profile" | "angle";
  items: AccessoryInfo[];
}) {
  return (
    <div id={id} className="mt-16 scroll-mt-[130px] lg:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease }}
        className="mb-8"
      >
        <div className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-pro">{eyebrow}</div>
        <h3 className="text-[30px] font-black leading-[1.05] tracking-[-0.01em] lg:text-[42px]">{title}</h3>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/55">{description}</p>
      </motion.div>
      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((info, index) => (
          <AccessoryCard key={info.id} info={info} group={group} index={index} />
        ))}
      </div>
    </div>
  );
}

/* БЛОК: Карточка одной потолочной плиты Армстронг (TileCard)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает фотографию плиты, плашки «Акустика» и «Влага», таблицу свойств и кнопку «Рассчитать с плитой…», которая подставляет плиту в калькулятор.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Описание info из массива TILES и фото/название из ARMSTRONG_TILES (src/data/armstrong.ts).
 * КАК ИЗМЕНИТЬ: Список строк параметров меняется в массиве rows внутри TileCard. */
function TileCard({ info, index }: { info: TileInfo; index: number }) {
  const tile = ARMSTRONG_TILES.find((item) => item.id === info.id);
  const photo = tile?.gallery?.[0] ?? tile?.image ?? "";

  const pick = () => {
    window.dispatchEvent(new CustomEvent("armstrong:select-tile", { detail: info.id }));
    document.getElementById("calc")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const rows: [string, string][] = [
    ["Материал", info.material],
    ["Упаковка", info.pack],
    ["Акустика", info.acoustic],
    ["Влагостойкость", info.moisture],
    ["Вес", info.weight],
    ["Модуль", "600 × 600 мм"],
  ];

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay: index * 0.08, ease }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border bg-white/[0.04] transition-all duration-300 hover:-translate-y-1",
        info.featured
          ? "border-pro/60 shadow-[0_24px_60px_rgba(255,203,5,0.08)]"
          : "border-white/10 hover:border-pro/50",
      )}
    >
      <div className="relative">
        <img
          src={photo}
          alt={tile?.name ?? info.kind}
          className="block aspect-[3/2] w-full object-cover"
        />
        <span
          className={cn(
            "absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide",
            info.featured ? "bg-pro text-graphite" : "border border-white/15 bg-graphite/80 text-white backdrop-blur",
          )}
        >
          {info.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h4 className="text-[22px] font-black leading-none tracking-[-0.02em]">{tile?.label}</h4>
        <div className="mt-2 text-[12px] font-extrabold uppercase tracking-[0.16em] text-pro">{info.kind}</div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-white/60">{info.lead}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/45">
              <Volume2 size={13} strokeWidth={2.4} /> Акустика
            </div>
            <div className="mt-1 text-[20px] font-black leading-none">{info.acoustic}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/45">
              <Droplets size={13} strokeWidth={2.4} /> Влага
            </div>
            <div className="mt-1 text-[20px] font-black leading-none text-pro">{info.moisture}</div>
          </div>
        </div>

        <dl className="mt-5 divide-y divide-white/10 border-y border-white/10 text-[13px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 py-2.5">
              <dt className="text-white/55">{k}</dt>
              <dd className="text-right font-bold tabular">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/45">Где используется</div>
          <div className="flex flex-wrap gap-1.5">
            {info.uses.map((use) => (
              <span
                key={use}
                className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11.5px] font-semibold text-white/80"
              >
                {use}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={pick}
          className="mt-auto inline-flex items-center gap-2 pt-6 text-[13.5px] font-extrabold text-pro transition-all hover:gap-3"
        >
          Рассчитать с плитой «{tile?.label}»
          <ArrowRight size={15} strokeWidth={2.6} />
        </button>
      </div>
    </motion.article>
  );
}

/* БЛОК: Главная секция «Система Армстронг» со всеми подразделами (ArmstrongSystem)
 * ЗА ЧТО ОТВЕЧАЕТ: Выводит вводный рассказ с 4 преимуществами, фотографию каркаса Т-24 и три каталожные витрины: плиты (#sizes), профили (#profiles) и углы (#angles).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Локальный массив feats, фото images/armstrong-hero.jpg и массивы TILES, PROFILES, ANGLES выше.
 * КАК ИЗМЕНИТЬ: Заголовки и описания секций редактируются прямо в разметке ниже. */
export default function ArmstrongSystem() {
  const feats = [
    { icon: Layers, title: "Модуль 600×600", text: "Плиты укладываются на каркас Т-24. Любую панель снимают без инструмента — доступ к вентиляции, датчикам и проводке." },
    { icon: ShieldCheck, title: "Акустика и свет", text: "Минеральные плиты снижают шум в open space. Белая поверхность отражает до 85% света и делает помещение светлее." },
    { icon: Sparkles, title: "Шесть видов плит", text: "Минеральное волокно, сталь, оцинковка, перфорация и алюминий — под офис, влажную зону или премиальный холл." },
    { icon: Flame, title: "Класс НГ", text: "Негорючие материалы. Металлические панели моются, не боятся влаги и служат десятки лет." },
  ];

  return (
    <section id="features" className="relative overflow-hidden bg-graphite py-14 text-white lg:py-20 scroll-mt-[130px]">
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="relative mx-auto max-w-[1400px] px-4 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease }}
          >
            <div className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-pro">
              Система Армстронг
            </div>
            <h2 className="text-[30px] font-black leading-[1.05] tracking-[-0.01em] lg:text-[42px]">
              Потолок, который<br />держит порядок сверху
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/60 lg:text-[16px]">
              Армстронг — модульный подвесной потолок из плит 600×600 мм на каркасе Т-24.
              Скрывает коммуникации, снижает шум и даёт доступ в любую точку запотолочного
              пространства. Подходит для офисов, магазинов, школ, клиник и общественных холлов.
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

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <img
                src="images/armstrong-hero.jpg"
                alt="Подвесной потолок Армстронг крупным планом"
                className="h-[380px] w-full object-cover lg:h-[520px]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite/95 to-transparent p-6 pt-16">
                <div className="mb-1 text-[13px] font-bold uppercase tracking-widest text-pro">Каркас Т-24</div>
                <div className="text-[14px] font-medium text-white/80">
                  Несущие 3,7 м и поперечные 1,2 / 0,6 м собирают ячейку 600×600 — плита ложится без саморезов.
                </div>
              </div>
            </div>
            <div className="absolute -right-3 -top-4 rounded-2xl bg-pro px-4 py-3 text-graphite shadow-xl animate-floaty lg:-right-5">
              <div className="text-[22px] font-black leading-none">600</div>
              <div className="text-[11px] font-bold">модуль, мм</div>
            </div>
          </motion.div>
        </div>

        <div id="sizes" className="mt-16 scroll-mt-[130px] lg:mt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="mb-8"
          >
            <div className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-pro">
              Виды плит
            </div>
            <h3 className="text-[30px] font-black leading-[1.05] tracking-[-0.01em] lg:text-[42px]">
              Выбор плиты
            </h3>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/55">
              8 вариантов плит: минераловатные SO-DAE, Байкал, Pharaon, стальные, оцинкованные, перфорированные и алюминиевые
            </p>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-3">
            {TILES.map((info, i) => (
              <TileCard key={info.id} info={info} index={i} />
            ))}
          </div>
        </div>

      <AccessorySection
        id="profiles"
        eyebrow="Виды профилей"
        title="Выбор профиля"
        description="Несущие и поперечные направляющие формируют каркас потолка."
        group="profile"
        items={PROFILES}
      />

      <AccessorySection
        id="angles"
        eyebrow="Виды углов"
        title="Выбор угла"
        description="Пристенный угол проходит по периметру помещения, поддерживает край каркаса и оформляет примыкание к стене."
        group="angle"
        items={ANGLES}
      />
      </div>
    </section>
  );
}
