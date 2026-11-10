/* ============================================================================
 * ФАЙЛ: src/components/SiteFooter.tsx — Общий подвал (нижний блок) всех страниц сайта
 * ЗА ЧТО ОТВЕЧАЕТ: Отображает нижнюю тёмную секцию с логотипом, колонкой ссылок «Калькуляторы», колонкой информации «Магазин», кнопкой «Настройка» (переход в админку) и нижней строкой копирайта с текущим годом.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Заголовки колонок, все ссылки и строки информации приходят из useSiteSettings() (настраиваются в «Администрировании» #/admin и синхронизируются через Google-таблицу).
 * КАК ИЗМЕНИТЬ:
 *   — Названия колонок, ссылки и контактные строки редактируйте прямо на странице #/admin в блоке «Нижний блок с логотипом».
 *   — Текст кнопки «Настройка» или самую нижнюю подпись «Челябинск · Калькуляторы Стройка» можно изменить внизу этого файла.
 * ========================================================================= */

import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { useSiteSettings } from "../data/siteSettings";
import { cn } from "../utils/cn";
import { FooterIcon } from "./FooterIcon";
import { LogoMark } from "./Header";

/* БЛОК: Компонент подвала сайта (SiteFooter)
 * ЗА ЧТО ОТВЕЧАЕТ: Отбирает включённые ссылки и строки контактов, автоматически перестраивает сетку на 2, 3 или 4 колонки (если какая-то колонка полностью скрыта) и рисует подвал.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из поля footer хука useSiteSettings().
 * КАК ИЗМЕНИТЬ: Все данные колонок меняются в админке, а вёрстка и отступы — в JSX-блоках ниже. */
export default function SiteFooter() {
  const { footer, logo: logoSettings } = useSiteSettings();
  const logo = logoSettings.footer;

  const links = footer.links.filter((item) => item.enabled);
  const info = footer.info.filter((item) => item.enabled);

  const showLinks = links.length > 0;
  const showInfo = info.length > 0;
  const columns = 2 + Number(showLinks) + Number(showInfo);

  const gridTemplate =
    columns === 4
      ? "md:grid-cols-[1.3fr_1fr_1fr_1.2fr]"
      : columns === 3
        ? "md:grid-cols-[1.4fr_1fr_1.2fr]"
        : "md:grid-cols-[1.4fr_1.2fr]";

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-8 lg:py-16">
        <div className={cn("grid gap-10", gridTemplate)}>
          {/* БЛОК: Первая колонка — логотип со ссылкой на главную | ЗА ЧТО ОТВЕЧАЕТ: Показывает фирменный знак и возвращает на #/ при клике | ОТКУДА ДАННЫЕ: LogoMark из src/components/Header.tsx | КАК ИЗМЕНИТЬ: Высота логотипа меняется в height={54} */}
          <div className={cn(logo.align === "center" && "text-center", logo.align === "right" && "text-right")}>
            {logo.visible && (
              <a
                href="#/"
                className="inline-flex items-center transition-opacity hover:opacity-90"
                aria-label="Челябинск Стройка — на главную"
                style={{ transform: `translate(${logo.offsetX}px, ${logo.offsetY}px)` }}
              >
                <LogoMark height={Math.min(logo.height, 64)} cityColor={logo.cityColor} />
              </a>
            )}
          </div>

          {/* БЛОК: Вторая колонка — список ссылок («Калькуляторы») | ЗА ЧТО ОТВЕЧАЕТ: Выводит внутренние и внешние ссылки (внешние https://... автоматически открываются в новой вкладке) | ОТКУДА ДАННЫЕ: footer.calculatorsTitle и footer.links из настроек админки | КАК ИЗМЕНИТЬ: В «Администрировании» (#/admin) или в DEFAULT_SETTINGS внутри src/data/siteSettings.ts */}
          {showLinks && (
            <nav aria-label={footer.calculatorsTitle.trim() || "Разделы сайта"}>
              <div className="mb-4 text-[12px] font-extrabold uppercase tracking-[0.16em] text-white/40">
                {footer.calculatorsTitle}
              </div>
              <ul className="space-y-2.5 text-[13.5px] font-semibold text-white/70">
                {links.map((item) => {
                  const external = /^https?:\/\//i.test(item.href.trim());
                  return (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noreferrer" : undefined}
                        className="group inline-flex items-center gap-1.5 transition-colors hover:text-pro"
                      >
                        {item.label}
                        <ArrowUpRight
                          size={12}
                          strokeWidth={2.4}
                          aria-hidden="true"
                          className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-70"
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {/* БЛОК: Третья колонка — информация о магазине («Магазин») | ЗА ЧТО ОТВЕЧАЕТ: Показывает адрес, часы работы, телефоны и любые добавленные строки со значками | ОТКУДА ДАННЫЕ: footer.storeTitle и footer.info из настроек админки | КАК ИЗМЕНИТЬ: В «Администрировании» (#/admin) */}
          {showInfo && (
            <div>
              <div className="mb-4 text-[12px] font-extrabold uppercase tracking-[0.16em] text-white/40">
                {footer.storeTitle}
              </div>
              <ul className="space-y-3 text-[13.5px] text-white/70">
                {info.map((item) => (
                  <li key={item.id} className="flex items-start gap-2.5">
                    <FooterIcon name={item.icon} size={15} className="mt-0.5 shrink-0 text-pro" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* БЛОК: Четвёртая колонка — кнопка «Настройка» | ЗА ЧТО ОТВЕЧАЕТ: Ведёт на защищённую паролем страницу «Администрирование» (#/admin) | ОТКУДА ДАННЫЕ: Статическая ссылка href="#/admin" | КАК ИЗМЕНИТЬ: Текст кнопки или адрес перехода можно поменять прямо здесь */}
          <div className="flex items-start md:justify-end">
            <a
              href="#/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] font-bold text-white/75 transition-colors hover:border-pro/60 hover:bg-pro hover:text-graphite"
            >
              <SlidersHorizontal size={15} strokeWidth={2.4} />
              Настройка
            </a>
          </div>
        </div>

        {/* БЛОК: Нижняя подпись с текущим годом | ЗА ЧТО ОТВЕЧАЕТ: Выводит строку копирайта в самом низу страницы | ОТКУДА ДАННЫЕ: Год берётся автоматически из системной даты new Date().getFullYear() | КАК ИЗМЕНИТЬ: Поменяйте текст «Челябинск · Калькуляторы Стройка» в строке ниже */}
        <div className="mt-12 border-t border-white/10 pt-6 text-[12px] font-medium text-white/35">
          Челябинск · Калькуляторы Стройка · {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
