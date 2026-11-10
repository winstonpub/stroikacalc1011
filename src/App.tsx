/* ============================================================================
 * ФАЙЛ: src/App.tsx — Главный переключатель страниц (маршрутизатор сайта)
 * ЗА ЧТО ОТВЕЧАЕТ: Определяет, какая страница сейчас открыта по адресу после знака «#» (например, #/grilyato, #/roof, #/siding), меняет заголовок вкладки браузера, прокручивает экран к нужному блоку и рисует общую шапку с кнопкой «Вверх».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из адресной строки браузера (window.location.hash) и компонентов страниц из папки src/pages/.
 * КАК ИЗМЕНИТЬ: Чтобы добавить новую страницу, импортируйте её сверху, добавьте её адрес в тип PageRoute, в функцию getLocation(), в словарь заголовков titles и в блок <main> внизу файла.
 * ========================================================================= */

import { useEffect, useState } from "react";
import Header from "./components/Header";
import ScrollTopButton from "./components/ScrollTopButton";
import MainPage from "./pages/MainPage";
import GrilyatoPage from "./pages/GrilyatoPage";
import ArmstrongPage from "./pages/ArmstrongPage";
import TestPage from "./pages/TestPage";
import AdminPage from "./pages/AdminPage";
import RoofPage from "./pages/RoofPage";
import SidingPage from "./pages/SidingPage";

/* БЛОК: Список всех допустимых адресов страниц (PageRoute)
 * ЗА ЧТО ОТВЕЧАЕТ: Перечисляет все внутренние маршруты сайта, чтобы TypeScript проверял отсутствие опечаток в ссылках.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Задаётся прямо здесь разработчиком/владельцем сайта.
 * КАК ИЗМЕНИТЬ: При создании нового раздела допишите сюда новую строку через символ «|», например | "/fasad". */
type PageRoute =
  | "/"
  | "/grilyato"
  | "/armstrong"
  | "/roof"
  | "/siding"
  | "/test"
  | "/admin";

/* БЛОК: Распознавание текущего адреса и якоря прокрутки (getLocation)
 * ЗА ЧТО ОТВЕЧАЕТ: Разбирает часть адреса после «#» на путь страницы (route) и необязательный якорь блока (anchor, например #/roof#calc → страница "/roof", прокрутка к блоку id="calc").
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Читает window.location.hash из адресной строки браузера.
 * КАК ИЗМЕНИТЬ: Чтобы привязать новый URL к странице, добавьте строку вида: if (rawPath.startsWith("/новый-адрес")) return { route: "/новый-адрес", anchor }; */
function getLocation(): { route: PageRoute; anchor: string } {
  const rawHash = window.location.hash.replace(/^#/, "");
  const [rawPath = "", anchor = ""] = rawHash.split("#");

  if (rawPath.startsWith("/admin")) return { route: "/admin", anchor };
  if (rawPath.startsWith("/armstrong")) return { route: "/armstrong", anchor };
  if (rawPath.startsWith("/grilyato")) return { route: "/grilyato", anchor };
  if (rawPath.startsWith("/roof")) return { route: "/roof", anchor };
  if (rawPath.startsWith("/siding")) return { route: "/siding", anchor };
  if (rawPath.startsWith("/test")) return { route: "/test", anchor };
  return { route: "/", anchor };
}

/* БЛОК: Слежение за переходами между страницами (useHashLocation)
 * ЗА ЧТО ОТВЕЧАЕТ: Подписывается на событие смены адреса в браузере (клики по меню, кнопки «Назад»/«Вперёд») и мгновенно переключает отображаемую страницу без перезагрузки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Вызывает функцию getLocation() при каждом событии "hashchange".
 * КАК ИЗМЕНИТЬ: Менять не требуется — блок автоматически работает для любых маршрутов из getLocation(). */
function useHashLocation() {
  const [location, setLocation] = useState(getLocation);

  useEffect(() => {
    const onHash = () => setLocation(getLocation());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return location;
}

/* БЛОК: Корневой компонент сайта (App)
 * ЗА ЧТО ОТВЕЧАЕТ: Устанавливает название вкладки браузера для каждой страницы, прокручивает экран вверх (или к якорю секции) и выводит шапку, активную страницу и кнопку «Вверх».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Получает текущий route и anchor из хука useHashLocation(), а содержимое страниц — из компонентов в src/pages/.
 * КАК ИЗМЕНИТЬ:
 *   — Чтобы поменять текст на вкладке браузера, отредактируйте нужную строку в объекте titles.
 *   — Чтобы подключить новую страницу, добавьте условие {route === "/ваш-адрес" && <ВашаСтраница />} внутри <main>. */
export default function App() {
  const { route, anchor } = useHashLocation();

  /* БЛОК: Обновление заголовка вкладки и плавная прокрутка к секции
   * ЗА ЧТО ОТВЕЧАЕТ: Меняет document.title при смене раздела и переносит экран либо в самое начало страницы, либо к блоку с нужным id (например, calc или features).
   * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из словаря titles ниже и элемента на странице с атрибутом id={anchor}.
   * КАК ИЗМЕНИТЬ: Исправьте названия в словаре titles, если хотите переименовать заголовки вкладок. */
  useEffect(() => {
    const titles: Record<PageRoute, string> = {
      "/": "Главная - Калькуляторы Стройка Челябинск",
      "/grilyato": "Грильято - Калькуляторы Стройка Челябинск",
      "/armstrong": "Армстронг - Калькуляторы Стройка Челябинск",
      "/roof": "Раскладка Кровля - Калькуляторы Стройка Челябинск",
      "/siding": "Сайдинг - Калькуляторы Стройка Челябинск",
      "/test": "Тест - Калькуляторы Стройка Челябинск",
      "/admin": "Администрирование - Калькуляторы Стройка Челябинск",
    };
    document.title = titles[route];

    if (!anchor) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    const timer = window.setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [route, anchor]);

  return (
    <div className="min-h-screen bg-white">
      {/* БЛОК: Общая шапка сайта | ЗА ЧТО ОТВЕЧАЕТ: Показывает верхнее меню, логотип и бегущую строку на всех страницах | ОТКУДА ДАННЫЕ: src/components/Header.tsx и настройки из админки | КАК ИЗМЕНИТЬ: Через страницу «Администрирование» (#/admin) или в файле src/components/Header.tsx */}
      <Header route={route} />

      {/* БЛОК: Область активной страницы | ЗА ЧТО ОТВЕЧАЕТ: Показывает ровно ту страницу, адрес которой сейчас выбран | ОТКУДА ДАННЫЕ: Переменная route и файлы из папки src/pages/ | КАК ИЗМЕНИТЬ: Откройте соответствующий файл в src/pages/ (например, MainPage.tsx для главной) */}
      <main>
        {route === "/grilyato" && <GrilyatoPage />}
        {route === "/armstrong" && <ArmstrongPage />}
        {route === "/roof" && <RoofPage />}
        {route === "/siding" && <SidingPage />}
        {route === "/test" && <TestPage />}
        {route === "/admin" && <AdminPage />}
        {route === "/" && <MainPage />}
      </main>

      {/* БЛОК: Плавающая кнопка «Вверх» | ЗА ЧТО ОТВЕЧАЕТ: Появляется при прокрутке вниз и возвращает экран к началу страницы | ОТКУДА ДАННЫЕ: src/components/ScrollTopButton.tsx | КАК ИЗМЕНИТЬ: Порог появления и внешний вид настраиваются в src/components/ScrollTopButton.tsx */}
      <ScrollTopButton />
    </div>
  );
}
