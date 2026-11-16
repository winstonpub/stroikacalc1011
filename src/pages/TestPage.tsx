/* ============================================================================
 * ФАЙЛ: src/pages/TestPage.tsx — Страница «Тест» (#/test), копия страницы «Сайдинг»
 * ЗА ЧТО ОТВЕЧАЕТ: Собирает полную копию страницы «Сайдинг»: верхний баннер «Обшивка Сайдинг»,
 *   калькулятор фасада с окнами/дверьми, раскроем и запасом, а также описание системы с 8 карточками элементов и подвал.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Компоненты SidingHero.tsx, TestSidingCalculator.tsx (variant="test", своя отдельная память "test:*")
 *   и SidingSections.tsx из папки src/components/.
 * КАК ИЗМЕНИТЬ:
 *   — Тексты и фото верхнего баннера меняются в src/components/SidingHero.tsx.
 *   — Поля калькулятора, план фасада и таблица материалов меняются в src/components/TestSidingCalculator.tsx и src/data/siding.ts.
 *   — Блок «Фасад, который не нуждается в уходе» и описания 8 элементов меняются в src/components/SidingSections.tsx.
 * ========================================================================= */

import { useCallback } from "react";
import SidingHero from "../components/SidingHero";
import TestSidingCalculator from "../components/TestSidingCalculator";
import SidingSections from "../components/SidingSections";

/* БЛОК: Компонент страницы «Тест» (TestPage)
 * ЗА ЧТО ОТВЕЧАЕТ: Связывает кнопку «Калькулятор» в баннере с прокруткой к расчёту (id="calc") и выводит все разделы страницы «Сайдинг».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из компонентов SidingHero, TestSidingCalculator и SidingSections.
 * КАК ИЗМЕНИТЬ: Атрибут background="white" задаёт белый фон секции калькулятора (замените на "smoke" для светло-серого фона). */
export default function TestPage() {
  const scrollToCalc = useCallback(() => {
    document.getElementById("calc")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      {/* БЛОК: Верхний баннер «Обшивка Сайдинг» | ЗА ЧТО ОТВЕЧАЕТ: Первый экран с фото фасада, кнопками «Калькулятор» / «О сайдинге» и 3 карточками статистики | ОТКУДА ДАННЫЕ: src/components/SidingHero.tsx */}
      <SidingHero onStart={scrollToCalc} featuresHref="#/test#features" />

      {/* БЛОК: Калькулятор ПВХ сайдинга | ЗА ЧТО ОТВЕЧАЕТ: Размеры фасада, запас %, окна и двери, кликабельный план фасада, раскрой и спецификация (своя память "test:*") | ОТКУДА ДАННЫЕ: src/components/TestSidingCalculator.tsx и src/data/siding.ts */}
      <TestSidingCalculator background="white" variant="test" />

      {/* БЛОК: Раздел «О сайдинге», карточки 8 элементов и подвал | ЗА ЧТО ОТВЕЧАЕТ: Преимущества ПВХ сайдинга, справочник элементов системы и нижний подвал | ОТКУДА ДАННЫЕ: src/components/SidingSections.tsx */}
      <SidingSections />
    </>
  );
}
