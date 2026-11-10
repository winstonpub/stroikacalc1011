/* ============================================================================
 * ФАЙЛ: src/data/sidingCatalog.ts — Товары MONLID для калькулятора сайдинга
 * ЗА ЧТО ОТВЕЧАЕТ: Связывает материал и выбранный цвет с артикулом и точным названием товара.
 * Цены и ссылки по артикулам загружаются из Google-таблицы в src/data/prices.ts.
 * КАК ИЗМЕНИТЬ: Найдите материал и цвет в SIDING_PRODUCTS, затем замените art или name.
 * Идентификатор ivory сохранён для совместимости с ранее выбранным цветом «Слоновая кость»;
 * на сайте этот цвет теперь называется «Бежевый».
 * ========================================================================= */

export type SidingColorId = "white" | "gray" | "ivory" | "vanilla" | "green" | "brown";
export type SidingProductPart = "panel" | "start" | "hProfile" | "finish" | "jProfile" | "innerCorner" | "outerCorner" | "jamb";

export interface SidingProduct {
  art: string;
  name: string;
}

type SidingProductVariants = Partial<Record<SidingColorId, SidingProduct>> & { white: SidingProduct };

export const SIDING_PRODUCTS: Record<SidingProductPart, SidingProductVariants> = {
  panel: {
    white: { art: "89407609", name: "Сайдинг ПВХ MONLID корабельный брус 3 м белый 0.61 м²" },
    gray: { art: "89407612", name: "Сайдинг ПВХ MONLID корабельный брус 3 м серый 0.61 м²" },
    ivory: { art: "89407616", name: "Сайдинг ПВХ MONLID корабельный брус 3 м бежевый 0.61 м²" },
    vanilla: { art: "89407617", name: "Сайдинг ПВХ MONLID корабельный брус 3 м ванильный 0.61 м²" },
    green: { art: "89407615", name: "Сайдинг ПВХ MONLID корабельный брус 3 м зеленый 0.61 м²" },
  },
  start: {
    white: { art: "89407965", name: "Планка стартовая для сайдинга MONLID цвет белый" },
  },
  hProfile: {
    white: { art: "89407951", name: "H-профиль для сайдинга MONLID цвет белый" },
    gray: { art: "89407952", name: "H-профиль для сайдинга MONLID цвет серый" },
    ivory: { art: "89407970", name: "H-профиль для сайдинга MONLID цвет бежевый" },
    vanilla: { art: "89407973", name: "H-профиль для сайдинга MONLID цвет ванильный" },
    green: { art: "89407958", name: "H-профиль для сайдинга MONLID цвет зеленый" },
    brown: { art: "89407956", name: "H-профиль для сайдинга MONLID цвет коричневый" },
  },
  finish: {
    white: { art: "89407961", name: "Планка финишная для сайдинга MONLID цвет белый" },
    ivory: { art: "89407957", name: "Планка финишная для сайдинга MONLID цвет бежевый" },
    brown: { art: "89407964", name: "Планка финишная для сайдинга MONLID цвет коричневый" },
  },
  jProfile: {
    white: { art: "89407945", name: "J-профиль для сайдинга MONLID цвет белый 3 м" },
    gray: { art: "89407959", name: "J-профиль для сайдинга MONLID цвет серый" },
    ivory: { art: "89407969", name: "J-профиль для сайдинга MONLID цвет бежевый" },
    vanilla: { art: "89407972", name: "J-профиль для сайдинга MONLID цвет ванильный" },
    green: { art: "89407949", name: "J-профиль для сайдинга MONLID цвет зеленый" },
    brown: { art: "89407955", name: "J-профиль для сайдинга MONLID цвет коричневый 3 м" },
  },
  innerCorner: {
    white: { art: "89407960", name: "Угол внутренний для сайдинга MONLID цвет белый" },
    ivory: { art: "89407968", name: "Угол внутренний для сайдинга MONLID цвет бежевый" },
    brown: { art: "89407947", name: "Угол внутренний для сайдинга MONLID цвет коричневый" },
  },
  outerCorner: {
    white: { art: "89407944", name: "Угол наружный для сайдинга MONLID цвет белый" },
    gray: { art: "89407950", name: "Угол наружный для сайдинга MONLID цвет серый" },
    ivory: { art: "89407967", name: "Угол наружный для сайдинга MONLID цвет бежевый" },
    vanilla: { art: "89407971", name: "Угол наружный для сайдинга MONLID цвет ванильный" },
    green: { art: "89407974", name: "Угол наружный для сайдинга MONLID цвет зеленый" },
    brown: { art: "89407946", name: "Угол наружный для сайдинга MONLID цвет коричневый" },
  },
  jamb: {
    white: { art: "89407962", name: "Планка околооконная для сайдинга MONLID цвет белый" },
    brown: { art: "89407963", name: "Планка околооконная для сайдинга MONLID цвет коричневый" },
  },
};

/** Возвращает товар только если указанный цвет предусмотрен для этого материала. */
export function getSidingProduct(part: SidingProductPart, colorId: string): SidingProduct | undefined {
  return SIDING_PRODUCTS[part][colorId as SidingColorId];
}
