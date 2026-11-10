/* Тестовая страница временно показывает заглушку. Калькулятор из
 * src/components/TestSidingCalculator.tsx остается нужен странице «Сайдинг». */

import SiteFooter from "../components/SiteFooter";

export default function TestPage() {
  return (
    <>
      <section className="flex min-h-[60vh] items-center bg-white px-4 py-20 lg:px-8">
        <div className="mx-auto w-full max-w-[720px] text-center">
          <h1 className="text-[36px] font-black leading-tight tracking-tight text-ink sm:text-[52px]">
            Тестовая страница
          </h1>
          <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-graphite/65">
            Раздел временно не показывает содержимое и готовится к публикации.
          </p>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
