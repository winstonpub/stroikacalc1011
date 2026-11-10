/* ============================================================================
 * ФАЙЛ: src/pages/SidingPage.tsx — Страница калькулятора ПВХ сайдинга (#/siding)
 * ЗА ЧТО ОТВЕЧАЕТ: Собирает полную страницу «Сайдинг»: верхний баннер «Обшивка Сайдинг», калькулятор фасада с окнами/дверьми, раскроем и запасом, а также описание системы с 8 карточками элементов и подвал.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Компоненты SidingHero.tsx, SidingCalculator.tsx и SidingSections.tsx из папки src/components/. Калькулятор — тот же, что на странице «Тест», но со своей памятью введённых значений (ключи "siding:*").
 * КАК ИЗМЕНИТЬ:
 *   — Тексты и фото верхнего баннера меняются в src/components/SidingHero.tsx.
 *   — Поля калькулятора, план фасада и таблица материалов меняются в src/components/TestSidingCalculator.tsx и src/data/siding.ts; подключение на этой странице — в src/components/SidingCalculator.tsx.
 *   — Блок «Фасад, который не нуждается в уходе» и описания 8 элементов меняются в src/components/SidingSections.tsx.
 * ========================================================================= */

import { useCallback } from "react";
import SidingHero from "../components/SidingHero";
import SidingCalculator from "../components/SidingCalculator";
import SidingSections from "../components/SidingSections";

/* БЛОК: Компонент страницы «Сайдинг» (SidingPage)
 * ЗА ЧТО ОТВЕЧАЕТ: Связывает кнопку «Калькулятор» в баннере с прокруткой к расчёту (id="calc") и выводит все разделы страницы.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из компонентов SidingHero, SidingCalculator и SidingSections.
 * КАК ИЗМЕНИТЬ: Атрибут background="white" задаёт белый фон секции калькулятора (замените на "smoke" для светло-серого фона). */
export default function SidingPage() {
  const scrollToCalc = useCallback(() => {
    document.getElementById("calc")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      {/* БЛОК: Верхний баннер «Обшивка Сайдинг» | ЗА ЧТО ОТВЕЧАЕТ: Первый экран с фото фасада, кнопками «Калькулятор» / «О сайдинге» и 3 карточками статистики | ОТКУДА ДАННЫЕ: src/components/SidingHero.tsx | КАК ИЗМЕНИТЬ: Откройте src/components/SidingHero.tsx */}
      <SidingHero onStart={scrollToCalc} />

      {/* БЛОК: Калькулятор ПВХ сайдинга | ЗА ЧТО ОТВЕЧАЕТ: Размеры фасада, запас %, окна и двери, кликабельный план фасада, раскрой и спецификация | ОТКУДА ДАННЫЕ: src/components/SidingCalculator.tsx и src/data/siding.ts | КАК ИЗМЕНИТЬ: Откройте эти два файла */}
      <SidingCalculator background="white" />

      {/* БЛОК: Раздел «О сайдинге», карточки 8 элементов и подвал | ЗА ЧТО ОТВЕЧАЕТ: Преимущества ПВХ сайдинга, справочник элементов системы и нижний подвал | ОТКУДА ДАННЫЕ: src/components/SidingSections.tsx | КАК ИЗМЕНИТЬ: Откройте src/components/SidingSections.tsx */}
      <SidingSections />
    </>
  );
}
