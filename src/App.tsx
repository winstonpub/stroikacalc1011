/* ============================================================================
 * ФАЙЛ: src/App.tsx — Главный переключатель страниц (маршрутизатор сайта)
 * ЗА ЧТО ОТВЕЧАЕТ: Определяет, какая страница сейчас открыта по адресу в браузере (например, /grilyato, /armstrong, /roof, /siding), меняет заголовок вкладки, прокручивает экран к нужному блоку и рисует общую шапку с кнопкой «Вверх».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из маршрутизатора src/utils/router.ts (History API без решётки #) и компонентов страниц из папки src/pages/.
 * КАК ИЗМЕНИТЬ: Чтобы добавить новую страницу, импортируйте её сверху, добавьте её адрес в src/utils/router.ts, в словарь заголовков titles и в блок <main> внизу файла.
 * ========================================================================= */

import { useEffect } from "react";
import Header from "./components/Header";
import ScrollTopButton from "./components/ScrollTopButton";
import MainPage from "./pages/MainPage";
import GrilyatoPage from "./pages/GrilyatoPage";
import ArmstrongPage from "./pages/ArmstrongPage";
import TestPage from "./pages/TestPage";
import AdminPage from "./pages/AdminPage";
import RoofPage from "./pages/RoofPage";
import SidingPage from "./pages/SidingPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAppLocation, type PageRoute } from "./utils/router";

/* БЛОК: Корневой компонент сайта (App)
 * ЗА ЧТО ОТВЕЧАЕТ: Устанавливает название вкладки браузера для каждой страницы, прокручивает экран вверх (или к якорю секции) и выводит шапку, активную страницу и кнопку «Вверх».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Получает текущий route и anchor из хука useAppLocation(), а содержимое страниц — из компонентов в src/pages/.
 * КАК ИЗМЕНИТЬ:
 *   — Чтобы поменять текст на вкладке браузера, отредактируйте нужную строку в объекте titles.
 *   — Чтобы подключить новую страницу, добавьте условие {route === "/ваш-адрес" && <ВашаСтраница />} внутри <main>. */
export default function App() {
  const { route, anchor, navId } = useAppLocation();

  /* БЛОК: Обновление заголовка вкладки и плавная прокрутка к секции
   * ЗА ЧТО ОТВЕЧАЕТ: Меняет document.title при смене раздела и переносит экран либо в самое начало страницы, либо к блоку с нужным id (например, calc или features).
   * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из словаря titles ниже и элемента на странице с атрибутом id={anchor}.
   * КАК ИЗМЕНИТЬ: Исправьте названия в словаре titles, если хотите переименовать заголовки вкладок. */
  useEffect(() => {
    const titles: Record<PageRoute, string> = {
      "/": "Главная - Челябинск Стройка",
      "/grilyato": "Грильято - Челябинск Стройка",
      "/armstrong": "Армстронг - Челябинск Стройка",
      "/roof": "Раскладка Кровля - Челябинск Стройка",
      "/siding": "Сайдинг - Челябинск Стройка",
      "/test": "Тест - Челябинск Стройка",
      "/admin": "Администрирование - Челябинск Стройка",
      "/404": "Страница не найдена (404) - Челябинск Стройка",
    };
    document.title = titles[route];

    if (!anchor || anchor.includes("=")) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    const timer = window.setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [route, anchor, navId]);

  return (
    <div className="min-h-screen bg-white">
      {/* БЛОК: Общая шапка сайта | ЗА ЧТО ОТВЕЧАЕТ: Показывает верхнее меню, логотип и бегущую строку на всех страницах, кроме «404» | ОТКУДА ДАННЫЕ: src/components/Header.tsx и настройки из админки | КАК ИЗМЕНИТЬ: Через страницу «Администрирование» (/admin) или в файле src/components/Header.tsx */}
      {route !== "/404" && <Header route={route} />}

      {/* БЛОК: Область активной страницы | ЗА ЧТО ОТВЕЧАЕТ: Показывает ровно ту страницу, адрес которой сейчас выбран | ОТКУДА ДАННЫЕ: Переменная route и файлы из папки src/pages/ | КАК ИЗМЕНИТЬ: Откройте соответствующий файл в src/pages/ (например, MainPage.tsx для главной) */}
      <main>
        {route === "/grilyato" && <GrilyatoPage />}
        {route === "/armstrong" && <ArmstrongPage />}
        {route === "/roof" && <RoofPage />}
        {route === "/siding" && <SidingPage />}
        {route === "/test" && <TestPage />}
        {route === "/admin" && <AdminPage />}
        {route === "/404" && <NotFoundPage />}
        {route === "/" && <MainPage />}
      </main>

      {/* БЛОК: Плавающая кнопка «Вверх» | ЗА ЧТО ОТВЕЧАЕТ: Появляется при прокрутке вниз и возвращает экран к началу страницы | ОТКУДА ДАННЫЕ: src/components/ScrollTopButton.tsx | КАК ИЗМЕНИТЬ: Порог появления и внешний вид настраиваются в src/components/ScrollTopButton.tsx */}
      <ScrollTopButton />
    </div>
  );
}
