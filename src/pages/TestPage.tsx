/* ============================================================================
 * ФАЙЛ: src/pages/TestPage.tsx — Страница «Тест» (#/test): заглушка
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает временную заглушку «Тестовая страница» вместо содержимого.
 *   Калькулятор фасада из src/components/TestSidingCalculator.tsx остался нужен странице «Сайдинг».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Тексты заданы прямо здесь; подвал берётся из src/components/SiteFooter.tsx.
 * КАК ИЗМЕНИТЬ:
 *   — Чтобы вернуть содержимое, импортируйте нужные компоненты (например, SidingHero,
 *     TestSidingCalculator, SidingSections) и выведите их вместо заглушки ниже.
 *   — Текст заглушки меняется в блоках с <h1> и <p>.
 * ========================================================================= */

import SiteFooter from "../components/SiteFooter";
import { toHref } from "../utils/router";

/* БЛОК: Заглушка страницы «Тест» (TestPage)
 * ЗА ЧТО ОТВЕЧАЕТ: Тёмный баннер с названием страницы и белая карточка с пояснением «Раздел временно
 *   не показывает содержимое». Внизу — общий подвал сайта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Тексты прописаны здесь.
 * КАК ИЗМЕНИТЬ: Поменяйте текст внутри <h1> и <p>. */
export default function TestPage() {
  return (
    <>
      {/* БЛОК: Верхний баннер «Тестовая страница» | ЗА ЧТО ОТВЕЧАЕТ: Первый экран с названием раздела */}
      <section id="top" className="relative overflow-hidden bg-graphite text-white">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-4 pb-14 pt-16 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="max-w-3xl">
            <h1 className="text-[44px] font-black leading-[0.98] tracking-[-0.02em] sm:text-[64px] lg:text-[84px]">
              Тестовая
              <br />
              <span className="text-pro">страница</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/70 lg:text-[18px]">
              Раздел временно не показывает содержимое и готовится к публикации.
            </p>
          </div>
        </div>
      </section>

      {/* БЛОК: Карточка-заглушка | ЗА ЧТО ОТВЕЧАЕТ: Пояснение для посетителя вместо материалов раздела */}
      <section className="flex min-h-[40vh] items-center bg-white px-4 py-16 lg:px-8">
        <div className="mx-auto w-full max-w-[720px] text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-smoke">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#20282b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
            </svg>
          </div>
          <h2 className="mt-5 text-[26px] font-black leading-tight tracking-tight text-ink sm:text-[32px]">
            Раздел готовится
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-relaxed text-graphite/65">
            Здесь появится содержимое тестового раздела. Пока что воспользуйтесь калькуляторами
            в главном меню сайта.
          </p>
          <a
            href={toHref("/")}
            className="mt-6 inline-flex h-[48px] items-center gap-2 rounded-2xl bg-pro px-6 text-[14px] font-extrabold text-graphite transition-all hover:gap-3 hover:bg-pro-soft"
          >
            Перейти на главную
          </a>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
