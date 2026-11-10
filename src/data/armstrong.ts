/* ============================================================================
 * ФАЙЛ: src/data/armstrong.ts — Каталог комплектующих и расчёт потолка Армстронг
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит список всех 6 потолочных плит 600×600, 2 серий Т-профиля («Премиум» и «Эконом») и 2 пристенных углов («Сталь» и «Алюминий»), пути к их фотографиям и функцию расчёта сметы calcArmstrong().
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Подвесы и типы берёт из src/data/grilyato.ts, фотографии — из папки public/images/armstrong/, а цены — из Google-таблицы через src/data/prices.ts.
 * КАК ИЗМЕНИТЬ:
 *   — Чтобы поменять название, артикул, фасовку коробки (packQty) или фотографии плиты — отредактируйте массив ARMSTRONG_TILES ниже.
 *   — Чтобы поменять артикулы профилей или углов — отредактируйте ARMSTRONG_PROFILES и ARMSTRONG_ANGLES.
 * ========================================================================= */

import {
  HANGERS, type CalcInput, type CalcResult, type GrilyatoColor, type SpecRow,
} from "./grilyato";
import type { PriceMap } from "./prices";

const ceil = Math.ceil;
const money = (v: number) => Math.round(v * 100) / 100;

/* БЛОК: Путь к папке фотографий и каталог потолочных плит 600×600 (IMG, ARMSTRONG_TILES)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт кнопки выбора плиты в калькуляторе Армстронг, миниатюры с листанием фото и правила пересчёта площади в штуки или упаковки (packQty: 24 у Pharaon, 20 у Байкал и SO-DAE 7 мм, 16 у SO-DAE 10 мм).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Фотографии лежат в папке public/images/armstrong/, цены подтягиваются по полю art из Google-таблицы.
 * КАК ИЗМЕНИТЬ: Положите новое фото в public/images/armstrong/ и пропишите его имя в image / gallery; поменяйте label (короткое имя на кнопке), name (полное имя в смете) или art (артикул). */
const IMG = "images/armstrong/";

export interface ArmstrongTile {
  id: string;
  label: string;
  name: string;
  art: string;
  image: string;
  gallery?: string[];
  packQty?: number;
}

export const DEFAULT_ARMSTRONG_TILE: ArmstrongTile = {
  id: "white-aluminum",
  label: "Белый алюминий",
  name: "Потолочная панель AP600A6 Tegular/Т-24 белый алюминий",
  art: "12903346", image: `${IMG}tile-aluminum.webp`,
  gallery: [`${IMG}tile-aluminum-1.webp`, `${IMG}tile-aluminum-2.webp`],
};

export const ARMSTRONG_TILES: readonly ArmstrongTile[] = [
  {
    id: "pharaon", label: "Комплект Pharaon 24шт.",
    name: "Набор потолочных плит Pharaon 600x600 мм цвет белый 24 шт.",
    art: "89372764", image: `${IMG}tile-pharaon-1.webp`,
    gallery: [`${IMG}tile-pharaon-1.webp`, `${IMG}tile-pharaon-2.webp`],
    packQty: 24,
  },
  {
    id: "baikal", label: "Комплект Байкал 20шт.",
    name: "Плита потолочная Knauf Armstrong Байкал 90RH Board 600x600x12 мм (в коробке 20 шт. 7.2 м2)",
    art: "82458369", image: `${IMG}tile-baikal-1.webp`,
    gallery: [`${IMG}tile-baikal-1.webp`, `${IMG}tile-baikal-2.webp`],
    packQty: 20,
  },
  {
    id: "white-galvanized-steel", label: "Белая оцинкованная сталь",
    name: "Потолочная панель AP600A6 Tegular/Т-24 белая оцинкованная сталь",
    art: "84585955", image: `${IMG}tile-galvanized-steel-1.webp`,
    gallery: [`${IMG}tile-galvanized-steel-1.webp`, `${IMG}tile-galvanized-steel-2.webp`],
  },
  {
    id: "white-steel", label: "Белая сталь",
    name: "Потолочная панель AP600A6 Tegular/Т-24 белая сталь",
    art: "15143311", image: `${IMG}tile-white-steel-1.webp`,
    gallery: [`${IMG}tile-white-steel-1.webp`, `${IMG}tile-white-steel-2.webp`],
  },
  {
    id: "perforated-white", label: "Перфорированная белая",
    name: "Потолочная панель AP600A6 Tegular/Т-24 перф. белый",
    art: "12903354", image: `${IMG}tile-perforated-1.webp`,
    gallery: [`${IMG}tile-perforated-1.webp`, `${IMG}tile-perforated-2.webp`],
  },
  {
    id: "so-dae-10", label: "Комплект SO-DAE 10 мм · 16 шт.",
    name: "Плита потолочная SO-DAE 600x600x10 мм белая 16 шт.",
    art: "89484210", image: `${IMG}tile-sodae10-1.webp`,
    gallery: [`${IMG}tile-sodae10-1.webp`, `${IMG}tile-sodae10-2.webp`],
    packQty: 16,
  },
  {
    id: "so-dae-7", label: "Комплект SO-DAE 7 мм · 20 шт.",
    name: "Плита потолочная SO-DAE 600x600x7 мм белая 20 шт.",
    art: "89484209", image: `${IMG}tile-sodae7-1.webp`,
    gallery: [`${IMG}tile-sodae7-1.webp`, `${IMG}tile-sodae7-2.webp`],
    packQty: 20,
  },
  DEFAULT_ARMSTRONG_TILE,
];

export function getArmstrongTile(id: string): ArmstrongTile {
  return ARMSTRONG_TILES.find((tile) => tile.id === id) ?? DEFAULT_ARMSTRONG_TILE;
}

/* БЛОК: Варианты каркаса Т-профиля Т-24 (ARMSTRONG_PROFILES)
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит серии «Премиум» и «Эконом» — у каждой серии сразу три артикула: несущая направляющая 3,7 м (main37), поперечная 1,2 м (cross12) и поперечная 0,6 м (cross06).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Артикулы магазина Лемана Про Челябинск.
 * КАК ИЗМЕНИТЬ: Поменяйте артикулы внутри объекта arts или подпись на кнопке в поле label. */
export interface ArmstrongProfile {
  id: string;
  label: string;
  arts: { main37: string; cross12: string; cross06: string };
  image: string;
}

export const ARMSTRONG_PROFILES: readonly ArmstrongProfile[] = [
  {
    id: "premium", label: "Премиум",
    arts: { main37: "15386313", cross12: "15386305", cross06: "15386292" },
    image: `${IMG}profile-premium.webp`,
  },
  {
    id: "economy", label: "Эконом",
    arts: { main37: "15052647", cross12: "15052639", cross06: "15052621" },
    image: `${IMG}profile-economy.webp`,
  },
];

export const DEFAULT_ARMSTRONG_PROFILE: ArmstrongProfile = ARMSTRONG_PROFILES[0];

export function getArmstrongProfile(id: string): ArmstrongProfile {
  return ARMSTRONG_PROFILES.find((profile) => profile.id === id) ?? DEFAULT_ARMSTRONG_PROFILE;
}

/* БЛОК: Варианты пристенного периметрального угла 3 м (ARMSTRONG_ANGLES)
 * ЗА ЧТО ОТВЕЧАЕТ: Задаёт выбор стального или алюминиевого уголка 19×19×3000 мм по периметру комнаты.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Артикулы магазина Лемана Про Челябинск.
 * КАК ИЗМЕНИТЬ: Измените label (текст кнопки), name (название в смете) или art (артикул). */
export interface ArmstrongAngle {
  id: string;
  label: string;
  name: string;
  art: string;
  image: string;
}

export const ARMSTRONG_ANGLES: readonly ArmstrongAngle[] = [
  {
    id: "steel", label: "Сталь",
    name: "Угол периметральный стальной 19x19x3000мм белый", art: "13452305",
    image: `${IMG}angle-steel.webp`,
  },
  {
    id: "aluminum", label: "Алюминий",
    name: "Угол периметральный алюминиевый 19x19x3000мм белый", art: "15656344",
    image: `${IMG}angle-aluminum.webp`,
  },
];

export const DEFAULT_ARMSTRONG_ANGLE: ArmstrongAngle = ARMSTRONG_ANGLES[0];

export function getArmstrongAngle(id: string): ArmstrongAngle {
  return ARMSTRONG_ANGLES.find((angle) => angle.id === id) ?? DEFAULT_ARMSTRONG_ANGLE;
}

/* БЛОК: Главная функция расчёта потолка Армстронг (calcArmstrong)
 * ЗА ЧТО ОТВЕЧАЕТ: Считает количество плит/коробок (площадь ÷ 0,36 ÷ packQty), направляющих 3,7 м, 1,2 м и 0,6 м, периметральных углов по 3 м и подвесов с учётом запаса, подставляет цены и считает итог.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Размеры помещения input, выбранные id комплектующих из калькулятора и словарь цен prices из Google-таблицы.
 * КАК ИЗМЕНИТЬ: Нормы расхода направляющих и подвесов на 1 м² заданы в строках расчёта tiles, main37, cross12, cross06, angleQty и hangQty. */
const TILE_COLOR: GrilyatoColor = { id: "white", name: "Белый", ral: "белый алюминий", hex: "#f2f2ef" };

export function calcArmstrong(
  input: CalcInput,
  prices: PriceMap,
  tileId = DEFAULT_ARMSTRONG_TILE.id,
  profileId = DEFAULT_ARMSTRONG_PROFILE.id,
  angleId = DEFAULT_ARMSTRONG_ANGLE.id,
): CalcResult {
  const tile = getArmstrongTile(tileId);
  const profile = getArmstrongProfile(profileId);
  const angle = getArmstrongAngle(angleId);
  const hanger = HANGERS.find((h) => h.len === input.hangerLen) ?? HANGERS[1];
  const f = 1 + Math.min(50, Math.max(0, input.sparePct)) / 100;

  const area = input.length * input.width;
  const perimeter = 2 * input.length + 2 * input.width;

  const tiles = ceil((area * f) / 0.36 / (tile.packQty ?? 1));
  const main37 = ceil((area * 0.83 * f) / 3.7);
  const cross12 = ceil((area * 1.67 * f) / 1.2);
  const cross06 = ceil((area * 0.83 * f) / 0.6);
  const angleQty = ceil((perimeter * f) / 3);
  const hangQty = ceil(area * 0.7 * f);

  const mk = (key: string, art: string, name: string, qty: number, unit: string): SpecRow => {
    const entry = art ? prices[art] : undefined;
    const p = entry?.price ?? 0;
    return { key, art, name, qty, unit, price: p, sum: money(qty * p), url: entry?.url, missing: !entry };
  };

  const rows: SpecRow[] = [
    mk("tile", tile.art, tile.name, tiles, "шт"),
    mk(
      "main37", profile.arts.main37,
      `Несущая направляющая 3,7 м — Т-профиль ${profile.label} 24x38x3700 мм цвет белый`,
      main37, "шт",
    ),
    mk(
      "cross12", profile.arts.cross12,
      `Поперечная направляющая 1,2 м — Т-профиль ${profile.label} 24x29x1200 мм цвет белый`,
      cross12, "шт",
    ),
    mk(
      "cross06", profile.arts.cross06,
      `Поперечная направляющая 0,6 м — Т-профиль ${profile.label} 24x29x600 мм цвет белый`,
      cross06, "шт",
    ),
    mk("angle", angle.art, angle.name, angleQty, "шт"),
    mk("hang", hanger.art, `Евро подвес L-${input.hangerLen}`, hangQty, "шт"),
  ];

  const total = money(rows.reduce((acc, r) => acc + r.sum, 0));

  return {
    area,
    perimeter,
    reshetka: tiles,
    rows,
    total,
    perM2: area > 0 ? total / area : 0,
    positions: rows.length,
    color: { ...TILE_COLOR, ral: tile.label },
    cell: {
      mm: 600,
      key: "100х100",
      label: "600×600",
      momFactor: 0,
      note: "Потолочная панель 600×600",
    },
    hanger,
    needs12: false,
  };
}
