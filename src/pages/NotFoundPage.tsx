/* ============================================================================
 * ФАЙЛ: src/pages/NotFoundPage.tsx — Страница «404» (#/404)
 * ЗА ЧТО ОТВЕЧАЕТ: Полностью занимает экран однотонным фоном #20282B без шапки, бегущей строки и подвала.
 *   По центру экрана — анимированная сборка логотипа (домик-калькулятор и надпись «404»),
 *   под ним — текст «Страница не найдена» и кнопка «На главную». Направляющие чертежа убраны.
 *   Анимация играет циклично: сборка → пауза 2 с с собранным логотипом → логотип исчезает → пауза 1 с → сначала.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: SVG-рисунок вставлен в этот файл (NOT_FOUND_SVG); длительности фаз — NF_ANIMATION_MS,
 *   NF_PAUSE_AFTER_MS и NF_PAUSE_BLANK_MS (миллисекунды). Расстояние между логотипом и текстом — из общих
 *   настроек сайта (notFound.logoGap в src/data/siteSettings.ts).
 * КАК ИЗМЕНИТЬ: Текст и кнопку правьте в JSX ниже; длительность пауз — в NF_PAUSE_AFTER_MS и NF_PAUSE_BLANK_MS.
 *   Расстояние между логотипом и текстом меняется без кода: «Администрирование» → «Блоки и наполнение
 *   страниц сайта» → «404».
 * ========================================================================= */

import { useEffect, useRef, useState } from "react";
import { useSiteSettings } from "../data/siteSettings";
import { cn } from "../utils/cn";
import { toHref } from "../utils/router";

/* БЛОК: Анимированный SVG «404 · построение» (NOT_FOUND_SVG)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует домик-калькулятор и цифры «404» по этапам: контур → детали → надпись.
 *   Все внутренние анимации SVG запускаются с нулевой задержкой и зависят от общего времени,
 *   которое задаётся CSS-переменной --nf-cycle на корневом элементе (см. src/index.css, .nf-art).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Готовая SVG-разметка владельца сайта; задержки переписаны на var(--nf-delay).
 * КАК ИЗМЕНИТЬ: Замените строку целиком. Чтобы анимация оставалась цикличной, оставьте var(--nf-delay)
 *   в атрибутах style — сдвиг этапов пересчитается автоматически. */
const NOT_FOUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="236" height="299" viewBox="0 0 236 299" role="img" aria-label="404 · анимация построения">
  <title>404 · построение</title>
  <style>
    @keyframes reveal { from { opacity: 0 } to { opacity: 1 } }
    @keyframes trace { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
    @keyframes hideTrace { to { opacity: 0 } }
    @keyframes rise { from { opacity: 0; transform: translateY(var(--rise)) } to { opacity: 1; transform: translateY(0) } }
    @keyframes widen { from { opacity: 0; transform: scaleX(0) } to { opacity: 1; transform: scaleX(1) } }
    @keyframes extend { from { opacity: 0; transform: scaleY(0) } to { opacity: 1; transform: scaleY(1) } }
    @keyframes pop { from { opacity: 0; transform: scale(0.3) } to { opacity: 1; transform: scale(1) } }
    @media (prefers-reduced-motion: reduce) {
      g[style], path[style] { animation: none !important; opacity: 1 !important; transform: none !important }
      path[stroke-dasharray] { display: none !important }
    }
  </style>
  <rect width="236" height="299" fill="#20282B"/>
  <g transform="translate(32 32)">
    <g transform="translate(0 0) scale(0.336)">
      <path d="M243.1 54.9A20 20 0 0 1 268.9 54.9L426.07 187.61A28 28 0 0 1 436 209L436 440A28 28 0 0 1 408 468L104 468A28 28 0 0 1 76 440L76 209A28 28 0 0 1 85.93 187.61Z" fill="#f5c400" style="opacity:0;animation:reveal 292ms cubic-bezier(.33,1,.68,1) var(--nf-delay-644ms) both"/>
      <path d="M243.1 54.9A20 20 0 0 1 268.9 54.9L426.07 187.61A28 28 0 0 1 436 209L436 440A28 28 0 0 1 408 468L104 468A28 28 0 0 1 76 440L76 209A28 28 0 0 1 85.93 187.61Z" fill="none" stroke="#f5c400" stroke-width="4" pathLength="100" stroke-dasharray="100" style="stroke-dashoffset:100;animation:trace 648ms cubic-bezier(.33,1,.68,1) var(--nf-delay-288ms) both,hideTrace 60ms linear var(--nf-delay-936ms) forwards"/>
      <g style="--rise:32px;transform-box:fill-box;transform-origin:center;animation:rise 432ms cubic-bezier(.33,1,.68,1) var(--nf-delay-864ms) both"><path d="M116 172V100A8 8 0 0 1 124 92H152A8 8 0 0 1 160 100V172Z" fill="#f5c400"/></g>
      <g style="--rise:30px;transform-box:fill-box;transform-origin:center;animation:widen 468ms cubic-bezier(.33,1,.68,1) var(--nf-delay-1188ms) both"><rect x="112" y="212" width="288" height="64" rx="14" fill="#2b2b2b"/></g>
      <g style="--rise:30px;transform-box:fill-box;transform-origin:center;animation:pop 245ms cubic-bezier(.2,1.45,.3,1) var(--nf-delay-1584ms) both"><rect x="112" y="300" width="54" height="54" rx="12" fill="#ecf6fa"/></g>
      <g style="--rise:30px;transform-box:fill-box;transform-origin:center;animation:pop 245ms cubic-bezier(.2,1.45,.3,1) var(--nf-delay-1663ms) both"><rect x="190" y="300" width="54" height="54" rx="12" fill="#ecf6fa"/></g>
      <g style="--rise:30px;transform-box:fill-box;transform-origin:center;animation:pop 245ms cubic-bezier(.2,1.45,.3,1) var(--nf-delay-1742ms) both"><rect x="268" y="300" width="54" height="54" rx="12" fill="#ecf6fa"/></g>
      <g style="--rise:30px;transform-box:fill-box;transform-origin:center;animation:pop 244ms cubic-bezier(.2,1.45,.3,1) var(--nf-delay-1822ms) both"><rect x="112" y="378" width="54" height="54" rx="12" fill="#ecf6fa"/></g>
      <g style="--rise:30px;transform-box:fill-box;transform-origin:center;animation:pop 245ms cubic-bezier(.2,1.45,.3,1) var(--nf-delay-1901ms) both"><rect x="190" y="378" width="54" height="54" rx="12" fill="#ecf6fa"/></g>
      <g style="--rise:30px;transform-box:fill-box;transform-origin:center;animation:pop 245ms cubic-bezier(.2,1.45,.3,1) var(--nf-delay-1980ms) both"><rect x="268" y="378" width="54" height="54" rx="12" fill="#ecf6fa"/></g>
      <g style="--rise:30px;transform-box:fill-box;transform-origin:center bottom;animation:extend 324ms cubic-bezier(.33,1,.68,1) var(--nf-delay-2124ms) both"><rect x="346" y="300" width="54" height="132" rx="12" fill="#e0a800"/></g>
      <g style="--rise:30px;transform-box:fill-box;transform-origin:center;animation:widen 180ms cubic-bezier(.33,1,.68,1) var(--nf-delay-2340ms) both"><rect x="360" y="353" width="26" height="8" rx="4" fill="#2b2b2b"/></g>
      <g style="--rise:30px;transform-box:fill-box;transform-origin:center;animation:widen 180ms cubic-bezier(.33,1,.68,1) var(--nf-delay-2412ms) both"><rect x="360" y="371" width="26" height="8" rx="4" fill="#2b2b2b"/></g>
    </g>
    <g transform="translate(0 188)">
      <g style="--rise:10px;animation:rise 324ms cubic-bezier(.33,1,.68,1) var(--nf-delay-2808ms) both"><path d="M332 0H650V385H735V588H650V700H415V588H0V406ZM415 214L269 385H415Z" fill="#F5C400" transform="translate(23.925 0) scale(0.05)"/></g>
      <g style="--rise:10px;animation:rise 324ms cubic-bezier(.33,1,.68,1) var(--nf-delay-2952ms) both"><path d="M376.25 -26.25C583.68 -26.25 752.5 142.56 752.5 350C752.5 557.44 583.68 726.25 376.25 726.25C168.81 726.25 0 557.44 0 350C0 142.56 168.81 -26.25 376.25 -26.25ZM376.25 493.59C455.54 493.59 519.84 429.07 519.84 350C519.84 270.93 455.54 206.41 376.25 206.41C296.95 206.41 232.65 270.93 232.65 350C232.65 429.07 296.95 493.59 376.25 493.59Z" fill="#F5C400" transform="translate(67.175 0) scale(0.05)"/></g>
      <g style="--rise:10px;animation:rise 324ms cubic-bezier(.33,1,.68,1) var(--nf-delay-3096ms) both"><path d="M332 0H650V385H735V588H650V700H415V588H0V406ZM415 214L269 385H415Z" fill="#F5C400" transform="translate(111.325 0) scale(0.05)"/></g>
    </g>
  </g>
</svg>`;

/* БЛОК: Размеры рисунка для расчёта расстояния до текста (NF_ART_MAX_WIDTH, NF_ART_VIEW_WIDTH, NF_ART_BLANK_BOTTOM)
 * ЗА ЧТО ОТВЕЧАЕТ: Внутри рисунка под цифрами «404» есть пустое поле. Чтобы расстояние из админки
 *   совпадало с тем, что видно на экране, это поле вычитается из отступа текста.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из разметки NOT_FOUND_SVG: ширина рисунка 236, высота 299, нижний край
 *   цифр — на отметке 256,3, значит пустое поле снизу равно 42,7 единицы.
 * КАК ИЗМЕНИТЬ: NF_ART_MAX_WIDTH — наибольшая ширина логотипа на экране в пикселях. Остальные два числа
 *   меняйте только если заменили сам рисунок NOT_FOUND_SVG. */
const NF_ART_MAX_WIDTH = 280;
const NF_ART_VIEW_WIDTH = 236;
const NF_ART_BLANK_BOTTOM = 42.7;

/* БЛОК: Настройка цикла анимации (NF_ANIMATION_MS, NF_PAUSE_AFTER_MS, NF_PAUSE_BLANK_MS)
 * ЗА ЧТО ОТВЕЧАЕТ: Считает, сколько длится сборка логотипа, и задаёт паузы после неё.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Длительность сборки — 3,42 с: последняя цифра «4» появляется к 3096+324=3420 мс.
 * КАК ИЗМЕНИТЬ: NF_PAUSE_AFTER_MS — пауза с собранным логотипом (2 секунды), NF_PAUSE_BLANK_MS — пауза
 *   с пустым фоном (1 секунда). NF_ANIMATION_MS пересчитывается сам, вручную его менять не нужно. */
const NF_ANIMATION_MS = 3420;
const NF_PAUSE_AFTER_MS = 2000;
const NF_PAUSE_BLANK_MS = 1000;

/* БЛОК: Страница «404» (NotFoundPage)
 * ЗА ЧТО ОТВЕЧАЕТ: Полноэкранная страница с фоном #20282B: по центру экрана цикличная анимация
 *   логотипа, под ним текст «Страница не найдена» и кнопка «На главную». Шапка, бегущая строка и подвал
 *   на этой странице не выводятся.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: NOT_FOUND_SVG и тайминги выше.
 * КАК ИЗМЕНИТЬ: Текст, кнопка и размер логотипа — в JSX ниже. */
export default function NotFoundPage() {
  const artRef = useRef<HTMLDivElement>(null);
  /* Фазы цикла: play — идёт сборка, hold — логотип собран (пауза 1 с), blank — логотип скрыт (пауза 1 с) */
  const [phase, setPhase] = useState<"play" | "hold" | "blank">("play");
  /* runId растёт при каждом новом запуске сборки: именно он перезапускает анимацию SVG.
     Без него вставка происходила бы на каждой смене фазы, и логотип начинал собираться заново во время паузы. */
  const [runId, setRunId] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  /* Расстояние между логотипом и текстом, px — задаётся в админке на карточке страницы «404» */
  const logoGap = useSiteSettings().notFound.logoGap;

  /* БЛОК: Цикл анимации (useEffect с таймерами)
   * ЗА ЧТО ОТВЕЧАЕТ: По окончании сборки держит логотип 1 с, затем прячет его на 1 с и запускает сборку снова.
   *   При «уменьшении движения» в системе цикл отключается: логотип показывается сразу и не мигает.
   * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Тайминги NF_ANIMATION_MS / NF_PAUSE_AFTER_MS / NF_PAUSE_BLANK_MS выше.
   * КАК ИЗМЕНИТЬ: Не требуется — длительности задаются константами. */
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduced = () => setReducedMotion(query.matches);
    syncReduced();
    query.addEventListener("change", syncReduced);

    if (query.matches) return () => query.removeEventListener("change", syncReduced);

    let timers: number[] = [];
    const schedule = () => {
      /* Сборка идёт NF_ANIMATION_MS, затем логотип держится NF_PAUSE_AFTER_MS, затем пустой фон — и снова */
      timers.push(window.setTimeout(() => setPhase("hold"), NF_ANIMATION_MS));
      timers.push(window.setTimeout(() => setPhase("blank"), NF_ANIMATION_MS + NF_PAUSE_AFTER_MS));
      timers.push(
        window.setTimeout(() => {
          setPhase("play");
          setRunId((n) => n + 1);
          schedule();
        }, NF_ANIMATION_MS + NF_PAUSE_AFTER_MS + NF_PAUSE_BLANK_MS),
      );
    };
    schedule();

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
      query.removeEventListener("change", syncReduced);
    };
  }, []);

  /* Вставка рисунка: при первом показе и при каждом новом цикле (runId), чтобы анимация шла с нуля.
     На фазах hold и blank рисунок не трогаем — логотип просто держится на экране или скрыт прозрачностью. */
  useEffect(() => {
    const node = artRef.current;
    if (!node || reducedMotion) return;
    node.innerHTML = NOT_FOUND_SVG;
    /* Длительность сборки передаётся в SVG через CSS-переменные задержек и общего цикла */
    node.style.setProperty("--nf-cycle", `${NF_ANIMATION_MS + NF_PAUSE_AFTER_MS}ms`);
    node.style.setProperty("--nf-delay-288ms", "288ms");
    node.style.setProperty("--nf-delay-644ms", "644ms");
    node.style.setProperty("--nf-delay-936ms", "936ms");
    node.style.setProperty("--nf-delay-864ms", "864ms");
    node.style.setProperty("--nf-delay-1188ms", "1188ms");
    node.style.setProperty("--nf-delay-1584ms", "1584ms");
    node.style.setProperty("--nf-delay-1663ms", "1663ms");
    node.style.setProperty("--nf-delay-1742ms", "1742ms");
    node.style.setProperty("--nf-delay-1822ms", "1822ms");
    node.style.setProperty("--nf-delay-1901ms", "1901ms");
    node.style.setProperty("--nf-delay-1980ms", "1980ms");
    node.style.setProperty("--nf-delay-2124ms", "2124ms");
    node.style.setProperty("--nf-delay-2340ms", "2340ms");
    node.style.setProperty("--nf-delay-2412ms", "2412ms");
    node.style.setProperty("--nf-delay-2808ms", "2808ms");
    node.style.setProperty("--nf-delay-2952ms", "2952ms");
    node.style.setProperty("--nf-delay-3096ms", "3096ms");
  }, [runId, reducedMotion]);

  return (
    <section
      data-nf-phase={phase}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#20282B] px-6 py-16 text-center text-white"
      aria-label="Страница не найдена (404)"
    >
      <div className="flex w-full max-w-[560px] flex-col items-center">
        {/* БЛОК: Анимация логотипа по центру | ЗА ЧТО ОТВЕЧАЕТ: Цикличная сборка домика и «404».
            Фазы: play — сборка, hold — собранный логотип (пауза 2 с), blank — пустой фон (пауза 1 с).
            Блок остаётся на месте и в фазе blank (только прозрачный), поэтому текст не прыгает. */}
        <div
          className={cn(
            "w-full transition-opacity duration-500",
            phase === "blank" ? "opacity-0" : "opacity-100",
          )}
          style={{ maxWidth: NF_ART_MAX_WIDTH }}
          aria-hidden={phase === "blank"}
        >
          <div ref={artRef} className="nf-art" />
        </div>

        {/* БЛОК: Текст и кнопка под логотипом, по центру | ЗА ЧТО ОТВЕЧАЕТ: Заголовок «Страница не найдена» и кнопка «На главную».
            Отступ сверху = расстояние из админки (logoGap) минус пустое поле внутри рисунка под цифрами «404»,
            поэтому на экране получается ровно заданное число пикселей на любой ширине экрана.
            КАК ИЗМЕНИТЬ: Расстояние — в админке на карточке страницы «404», в коде его править не нужно. */}
        <div
          data-testid="nf-text"
          className="relative z-10 flex max-w-xl flex-col items-center text-center"
          style={{
            marginTop: `calc(${logoGap}px - min(${NF_ART_MAX_WIDTH}px, 100%) * ${NF_ART_BLANK_BOTTOM} / ${NF_ART_VIEW_WIDTH})`,
          }}
        >
          <h1 className="text-[46px] font-black leading-[0.98] tracking-[-0.02em] sm:text-[64px] lg:text-[76px]">
            Страница
            <br />
            <span className="text-[#f5c400]">не найдена</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65 lg:text-[17px]">
            Такого адреса на сайте нет: возможно, в ссылке опечатка или страница была переименована.
          </p>

          <div className="mt-8 flex justify-center">
            <a
              href={toHref("/")}
              className="inline-flex h-[52px] items-center gap-2 rounded-2xl bg-[#f5c400] px-7 text-[15px] font-extrabold text-[#20282B] transition-all hover:gap-3 hover:bg-[#ffe066]"
            >
              На главную
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
