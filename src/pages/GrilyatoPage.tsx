/* ============================================================================
 * ФАЙЛ: src/pages/GrilyatoPage.tsx — Страница потолка Грильято (#/grilyato)
 * ЗА ЧТО ОТВЕЧАЕТ: Собирает полную страницу системы Грильято: верхний баннер, интерактивный калькулятор с проверкой цен по Google-таблице, раздел описания системы с карточками типоразмеров и подвал сайта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Состоит из блоков Hero.tsx, Calculator.tsx и Sections.tsx; источник онлайн-цен SPEC_PRICE_SHEET берётся из src/data/prices.ts.
 * КАК ИЗМЕНИТЬ:
 *   — Тексты верхнего баннера меняются в src/components/Hero.tsx.
 *   — Чтобы включить на странице схему плана потолка или подвал сметы прямо в калькуляторе, поменяйте showPlan={false} / showTableTotal={false} на true.
 *   — Описание системы и карточки 50×50, 75×75, 100×100 меняются в src/components/Sections.tsx и src/components/SizeGuide.tsx.
 * ========================================================================= */

import { useCallback } from "react";
import Hero from "../components/Hero";
import Calculator from "../components/Calculator";
import Sections from "../components/Sections";
import { SPEC_PRICE_SHEET } from "../data/prices";

/* БЛОК: Компонент страницы Грильято (GrilyatoPage)
 * ЗА ЧТО ОТВЕЧАЕТ: Связывает кнопку «Калькулятор» в баннере с плавной прокруткой к расчёту (id="calc") и выводит все секции страницы.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Компоненты из папки src/components/ и настройки таблицы цен SPEC_PRICE_SHEET.
 * КАК ИЗМЕНИТЬ: Печать запускается напрямую из калькулятора без перехода на отдельную страницу спецификации. */
export default function GrilyatoPage() {
  const scrollToCalc = useCallback(() => {
    document.getElementById("calc")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      {/* БЛОК: Верхний баннер «Потолки Грильято» | ЗА ЧТО ОТВЕЧАЕТ: Заголовок, кнопки и 3 плашки статистики | ОТКУДА ДАННЫЕ: src/components/Hero.tsx | КАК ИЗМЕНИТЬ: Откройте src/components/Hero.tsx */}
      <Hero onStart={scrollToCalc} />

      {/* БЛОК: Калькулятор Грильято и спецификация материалов | ЗА ЧТО ОТВЕЧАЕТ: Поля расчёта помещения, выбор ячейки/цвета/подвеса, итоговая карточка и таблица цен | ОТКУДА ДАННЫЕ: Формулы из src/data/grilyato.ts и цены из таблицы SPEC_PRICE_SHEET | КАК ИЗМЕНИТЬ: Интерфейс — в src/components/Calculator.tsx, товары и формулы — в src/data/grilyato.ts */}
      <Calculator showPlan={false} showTableTotal={false} priceSheet={SPEC_PRICE_SHEET} />

      {/* БЛОК: Описание системы Грильято, карточки ячеек и подвал | ЗА ЧТО ОТВЕЧАЕТ: Секция «Потолок, который работает на пространство», сравнение 100×100 / 75×75 / 50×50 и подвал | ОТКУДА ДАННЫЕ: src/components/Sections.tsx и src/components/SizeGuide.tsx | КАК ИЗМЕНИТЬ: Откройте эти два файла */}
      <Sections />
    </>
  );
}
