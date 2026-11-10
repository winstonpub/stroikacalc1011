/* ============================================================================
 * ФАЙЛ: src/pages/RoofPage.tsx — Страница калькулятора кровли (#/roof)
 * ЗА ЧТО ОТВЕЧАЕТ: Собирает страницу «Кровля»: верхний баннер «Раскладка Кровля», интерактивный калькулятор «Расчёт листов для кровли» со схемой укладки и печатью, описание системы кровли, карточки 4 видов материалов и подвал сайта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Компоненты RoofHero.tsx, RoofCalculator.tsx и RoofSections.tsx из папки src/components/.
 * КАК ИЗМЕНИТЬ:
 *   — Заголовок и подзаголовок над калькулятором меняются прямо здесь в атрибутах title и eyebrow у <RoofCalculator />.
 *   — Тексты верхнего баннера — в src/components/RoofHero.tsx, готовые размеры листов — в «Администрировании» (#/admin), а карточки С20/С8/Монтерей/Ондулин — в src/components/RoofTypeGuide.tsx.
 * ========================================================================= */

import { useCallback } from "react";
import RoofHero from "../components/RoofHero";
import RoofCalculator from "../components/RoofCalculator";
import RoofSections from "../components/RoofSections";

/* БЛОК: Компонент страницы «Кровля» (RoofPage)
 * ЗА ЧТО ОТВЕЧАЕТ: Отрисовывает баннер, калькулятор кровли на белом фоне и информационные секции с подвалом.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Собирает готовые компоненты разделов кровли.
 * КАК ИЗМЕНИТЬ: Поменяйте текст в title="..." или eyebrow="..." у <RoofCalculator>, чтобы переименовать шапку калькулятора. */
export default function RoofPage() {
  const scrollToCalc = useCallback(() => {
    document.getElementById("calc")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      {/* БЛОК: Верхний баннер «Раскладка Кровля» | ЗА ЧТО ОТВЕЧАЕТ: Первый экран с кнопками «Калькулятор», «О кровле» и карточками преимуществ | ОТКУДА ДАННЫЕ: src/components/RoofHero.tsx | КАК ИЗМЕНИТЬ: Откройте src/components/RoofHero.tsx */}
      <RoofHero onStart={scrollToCalc} />

      {/* БЛОК: Калькулятор раскладки листов кровли | ЗА ЧТО ОТВЕЧАЕТ: Поля размеров кровли и листа, готовые виды листов, чертёж со стрелками обрезков, кнопка «Печать» и таблица итогов | ОТКУДА ДАННЫЕ: src/components/RoofCalculator.tsx и пресеты из «Администрирования» | КАК ИЗМЕНИТЬ: Готовые размеры листов — в админке (#/admin), расчёт и чертёж — в src/components/RoofCalculator.tsx */}
      <RoofCalculator
        title="Расчёт листов для кровли"
        eyebrow="Калькулятор · Раскладка Кровля"
        background="white"
      />

      {/* БЛОК: Описание системы кровли, 4 карточки видов профиля и подвал | ЗА ЧТО ОТВЕЧАЕТ: Блок «Система Кровли», кликабельные схемы волн С20/С8/Монтерей/Ондулин и подвал | ОТКУДА ДАННЫЕ: src/components/RoofSections.tsx и src/components/RoofTypeGuide.tsx | КАК ИЗМЕНИТЬ: Откройте эти файлы */}
      <RoofSections />
    </>
  );
}
