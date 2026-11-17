/* ============================================================================
 * ФАЙЛ: src/data/siteFiles.ts — Справочник всех файлов сайта для вкладки «Файлы» в админке (вкладку убрали, файл сейчас не используется)
 * ЗА ЧТО ОТВЕЧАЕТ: Перечисляет каждый файл проекта с пояснением простым языком: за что отвечает,
 *   где используется и что будет, если его удалить. Отдельно помечены файлы, которые нигде не используются,
 *   с объяснением, почему они всё ещё лежат в проекте.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Составлен вручную по результатам проверки импортов и ссылок в коде.
 *   Сам список не читает папку проекта: на опубликованном сайте этого сделать нельзя.
 * КАК ИЗМЕНИТЬ: Добавили новый файл — допишите строку в нужную группу ниже. Удалили файл — уберите его
 *   строку. Нашли ещё один неиспользуемый файл — поставьте status: "unused" и опишите причину в поле why.
 * ========================================================================= */

export type SiteFileStatus = "used" | "unused" | "service";

export interface SiteFileEntry {
  /** Путь от корня проекта */
  path: string;
  /** Что делает файл, одним-двумя предложениями */
  purpose: string;
  /** Где подключается или на какие страницы влияет */
  usedBy?: string;
  /** used — работает на сайте; service — нужен для сборки, публикации или проверок; unused — ни на что не влияет */
  status: SiteFileStatus;
  /** Для unused: почему файл ещё существует и можно ли его удалить */
  why?: string;
  /** Предупреждение о найденной проблеме (битая ссылка и т. п.) */
  warning?: string;
}

export interface SiteFileGroup {
  id: string;
  title: string;
  description: string;
  files: SiteFileEntry[];
}

export const SITE_FILE_GROUPS: SiteFileGroup[] = [
  {
    id: "root",
    title: "Корень проекта",
    description: "Точка входа сайта, настройки сборки и инструкции.",
    files: [
      {
        path: "index.html",
        purpose: "Каркас страницы: кодировка, описание для поисковиков, иконка вкладки, шрифты и запуск React.",
        usedBy: "Единственная HTML-страница сайта; при сборке в неё встраиваются все скрипты и стили.",
        status: "used",
      },
      {
        path: "package.json",
        purpose: "Список библиотек (React, Tailwind, Supabase и др.) и команды npm run dev / build.",
        usedBy: "npm при установке и сборке; GitHub Actions при публикации.",
        status: "service",
      },
      {
        path: "package-lock.json",
        purpose: "Точные версии всех библиотек, чтобы сборка на GitHub совпадала с локальной.",
        usedBy: "Команда npm ci в .github/workflows/deploy.yml.",
        status: "service",
      },
      {
        path: "vite.config.ts",
        purpose: "Настройки сборщика Vite: React, Tailwind и упаковка сайта в один файл dist/index.html.",
        usedBy: "npm run build и npm run dev.",
        status: "service",
      },
      {
        path: "tsconfig.json",
        purpose: "Правила проверки типов TypeScript (строгий режим, псевдоним @/ для папки src).",
        usedBy: "Редактор кода и проверка npx tsc.",
        status: "service",
      },
      {
        path: ".gitattributes",
        purpose: "Единые переводы строк в Git на Windows и Linux.",
        usedBy: "Git при коммитах.",
        status: "service",
      },
      {
        path: ".github/workflows/deploy.yml",
        purpose: "Автоматическая сборка и публикация на GitHub Pages при каждом push в ветку main.",
        usedBy: "GitHub Actions.",
        status: "service",
      },
      {
        path: "README.md",
        purpose: "Краткое описание проекта, ссылка на сайт и предупреждение о смене пароля записи в таблицу.",
        usedBy: "Показывается на странице репозитория GitHub.",
        status: "service",
      },
      {
        path: "DEPLOY.md",
        purpose: "Пошаговая инструкция по публикации сайта на GitHub Pages.",
        usedBy: "Только для чтения человеком.",
        status: "service",
      },
      {
        path: "SUPABASE.md",
        purpose: "Инструкция по подключению базы Supabase и выдаче доступа в «Администрирование».",
        usedBy: "Только для чтения человеком.",
        status: "service",
      },
      {
        path: "supabase/schema.sql",
        purpose: "SQL-скрипт создания таблицы администраторов admins с защитой RLS.",
        usedBy: "Выполняется вручную один раз в SQL Editor панели Supabase.",
        status: "service",
      },
      {
        path: "docs/roof-profile-geometry.md",
        purpose: "Справка по размерам волн кровельных профилей (С20, С8, Монтеррей, Ондулин) для чертежей.",
        usedBy: "Только для чтения: объясняет числа в src/data/roofProfiles.ts.",
        status: "service",
      },
    ],
  },
  {
    id: "entry",
    title: "Запуск и переключение страниц",
    description: "Файлы, с которых начинается работа сайта.",
    files: [
      {
        path: "src/main.tsx",
        purpose: "Запускает React, подключает стили и восстанавливает вход администратора из Supabase.",
        usedBy: "index.html.",
        status: "used",
      },
      {
        path: "src/App.tsx",
        purpose: "Определяет открытую страницу по чистому адресу (/grilyato, /armstrong, /roof…), меняет заголовок вкладки и выводит шапку.",
        usedBy: "src/main.tsx.",
        status: "used",
      },
      {
        path: "src/utils/router.ts",
        purpose: "Маршрутизация без решётки (#): переходы History API, поддержка подпапки GitHub Pages и перенаправление старых #/-ссылок.",
        usedBy: "src/App.tsx, шапка, подвал, страницы и админка.",
        status: "used",
      },
      {
        path: "src/index.css",
        purpose: "Фирменные цвета, шрифт, ползунки, бегущая строка, гирлянда, снег, компактный вид калькуляторов и правила печати.",
        usedBy: "Все страницы.",
        status: "used",
      },
    ],
  },
  {
    id: "pages",
    title: "Страницы сайта",
    description: "Каждый файл — одна страница, которую открывает src/App.tsx.",
    files: [
      { path: "src/pages/MainPage.tsx", purpose: "Главная: баннер и карточки «Выберите калькулятор».", usedBy: "Адрес /.", status: "used" },
      { path: "src/pages/GrilyatoPage.tsx", purpose: "Страница Грильято: баннер, калькулятор, блок «О системе» и подвал.", usedBy: "Адрес /grilyato.", status: "used" },
      { path: "src/pages/ArmstrongPage.tsx", purpose: "Страница Армстронг: баннер, калькулятор, каталог плит и подвал.", usedBy: "Адрес /armstrong.", status: "used" },
      { path: "src/pages/RoofPage.tsx", purpose: "Страница Кровля: баннер, калькулятор раскладки листов, блок «О кровле» и подвал.", usedBy: "Адрес /roof.", status: "used" },
      { path: "src/pages/SidingPage.tsx", purpose: "Страница Сайдинг: баннер, калькулятор фасада, блок «О сайдинге» и подвал.", usedBy: "Адрес /siding.", status: "used" },
      { path: "src/pages/TestPage.tsx", purpose: "Страница Тест: заглушка «Тестовая страница» вместо содержимого раздела.", usedBy: "Адрес /test.", status: "used" },
      { path: "src/pages/NotFoundPage.tsx", purpose: "Страница «404»: анимированный рисунок, пояснение и кнопки возврата при неверном адресе.", usedBy: "Адрес /404 и любой неизвестный адрес.", status: "used" },
      { path: "src/pages/AdminPage.tsx", purpose: "Панель «Администрирование»: вход, карта страниц, настройки, публикация в таблицу.", usedBy: "Адрес /admin.", status: "used" },
    ],
  },
  {
    id: "layout",
    title: "Общие части сайта",
    description: "Шапка, подвал и элементы, которые есть на каждой странице.",
    files: [
      { path: "src/components/Header.tsx", purpose: "Шапка: логотип, кнопка списка разделов, адрес, бегущая строка, гирлянда и снег.", usedBy: "src/App.tsx; логотипы также в подвале и админке.", status: "used" },
      { path: "src/components/SiteFooter.tsx", purpose: "Подвал: логотип, ссылки, информация о магазине, кнопка «Настройка».", usedBy: "Все страницы.", status: "used" },
      { path: "src/components/FooterIcon.tsx", purpose: "Набор значков для строк подвала (адрес, часы, телефон…).", usedBy: "Подвал и редактор подвала в админке.", status: "used" },
      { path: "src/components/ScrollTopButton.tsx", purpose: "Плавающая кнопка «Вверх».", usedBy: "src/App.tsx.", status: "used" },
      { path: "src/components/ArticleCell.tsx", purpose: "Ячейка артикула в сметах: ссылка на товар и копирование номера.", usedBy: "Все калькуляторы и печатные листы.", status: "used" },
      { path: "src/components/PriceStatusBar.tsx", purpose: "Полоса «Цены проверены…» с кнопкой «Проверить».", usedBy: "Калькуляторы Грильято, Армстронг, Сайдинг, Тест.", status: "used" },
      { path: "src/components/CalculatorCompactToggle.tsx", purpose: "Кнопка «Компактно / Подробно» и запоминание выбора.", usedBy: "Калькуляторы Грильято, Армстронг и Кровля.", status: "used" },
    ],
  },
  {
    id: "ceilings",
    title: "Потолки: Грильято и Армстронг",
    description: "Калькулятор потолков и всё, что к нему относится.",
    files: [
      { path: "src/components/Calculator.tsx", purpose: "Общий калькулятор потолков: размеры, выбор материалов, смета, печать, CSV.", usedBy: "Страницы Грильято и Армстронг.", status: "used" },
      { path: "src/components/Hero.tsx", purpose: "Верхний баннер страницы Грильято.", usedBy: "src/pages/GrilyatoPage.tsx.", status: "used" },
      { path: "src/components/Sections.tsx", purpose: "Блок «О системе Грильято» и подвал.", usedBy: "Страница Грильято; блок можно скрыть в админке.", status: "used" },
      { path: "src/components/SizeGuide.tsx", purpose: "Сравнение ячеек 50×50, 75×75, 100×100.", usedBy: "src/components/Sections.tsx.", status: "used" },
      { path: "src/components/CellScheme.tsx", purpose: "Чертежи кассет Грильято для трёх размеров ячейки.", usedBy: "src/components/CellSchemePreview.tsx.", status: "used" },
      { path: "src/components/CellSchemePreview.tsx", purpose: "Миниатюра чертежа ячейки с увеличением по клику.", usedBy: "Калькулятор Грильято.", status: "used" },
      { path: "src/components/PlanPreview.tsx", purpose: "План потолка (вид сверху) с полноэкранным режимом.", usedBy: "Калькулятор; на текущих страницах выключен (showPlan={false}).", status: "used" },
      { path: "src/components/ArmstrongSystem.tsx", purpose: "Блок «О системе Армстронг» с витриной плит, профилей и углов.", usedBy: "Страница Армстронг; блок можно скрыть в админке.", status: "used" },
      { path: "src/components/SpecSheet.tsx", purpose: "Печатный лист «Спецификация материалов» для потолков.", usedBy: "Кнопка «Печать» в калькуляторе потолков.", status: "used" },
      { path: "src/data/grilyato.ts", purpose: "Товары, артикулы и формулы Грильято, форматирование чисел, адрес магазина STORE.", usedBy: "Калькулятор, шапка, подвал, настройки.", status: "used" },
      { path: "src/data/armstrong.ts", purpose: "Плиты, профили, углы Армстронга с артикулами, фото и формулой расчёта.", usedBy: "Калькулятор Армстронг и его витрина.", status: "used" },
      { path: "src/utils/calcStorage.ts", purpose: "Сохраняет введённые размеры и выбранные материалы потолка в браузере.", usedBy: "Калькулятор потолков.", status: "used" },
      { path: "src/utils/pagePrint.ts", purpose: "Печать сметы прямо со страницы: прячет сайт и показывает только печатный лист.", usedBy: "Калькулятор потолков.", status: "used" },
      {
        path: "src/utils/printSpec.ts",
        purpose: "Старый способ печати сметы: собирал отдельную HTML-страницу и открывал её в новой вкладке.",
        status: "unused",
        why: "Ни один файл его не подключает. Печать потолков переведена на src/utils/pagePrint.ts (без новой вкладки), а этот файл остался от прежней версии: его забыли удалить при переходе. Удаление безопасно и ни на что не повлияет; оставлен как образец на случай, если понадобится печать в отдельном окне.",
      },
    ],
  },
  {
    id: "roof",
    title: "Кровля",
    description: "Калькулятор раскладки листов и справочник профилей.",
    files: [
      { path: "src/components/RoofCalculator.tsx", purpose: "Калькулятор кровли: три формы ската, раскладка листов, схема, печать, таблица итогов.", usedBy: "src/pages/RoofPage.tsx.", status: "used" },
      { path: "src/components/RoofHero.tsx", purpose: "Верхний баннер страницы Кровля.", usedBy: "src/pages/RoofPage.tsx.", status: "used" },
      { path: "src/components/RoofSections.tsx", purpose: "Блок «О кровле» и подвал.", usedBy: "Страница Кровля; блок можно скрыть в админке.", status: "used" },
      { path: "src/components/RoofTypeGuide.tsx", purpose: "Карточки «Виды кровли» с сечениями профилей и выбором материала.", usedBy: "src/components/RoofSections.tsx.", status: "used" },
      { path: "src/components/RoofWavePreview.tsx", purpose: "Чертёж сечения волны профиля.", usedBy: "src/components/RoofTypeGuide.tsx.", status: "used" },
      { path: "src/data/roofProfiles.ts", purpose: "Геометрия волн С20, С8, Монтеррей и Ондулина.", usedBy: "Карточки «Виды кровли».", status: "used" },
      { path: "src/data/roofShapes.ts", purpose: "Формы ската (прямоугольник, треугольник, трапеция), их контуры и раскрой листов с обрезками.", usedBy: "src/components/RoofCalculator.tsx.", status: "used" },
      { path: "src/utils/printRoofLayout.ts", purpose: "Печать схемы укладки листов на один лист A4.", usedBy: "Кнопка «Печать» в калькуляторе кровли.", status: "used" },
    ],
  },
  {
    id: "siding",
    title: "Сайдинг и Тест",
    description: "Калькулятор фасада, общий для страниц «Сайдинг» и «Тест».",
    files: [
      { path: "src/components/TestSidingCalculator.tsx", purpose: "Калькулятор фасада: типы фасада, проёмы, план, раскрой, смета, печать, компактный вид.", usedBy: "Страница Сайдинг (через SidingCalculator.tsx).", status: "used" },
      { path: "src/components/SidingCalculator.tsx", purpose: "Тонкая обёртка: подключает калькулятор фасада на страницу Сайдинг с ключами памяти siding:*.", usedBy: "src/pages/SidingPage.tsx.", status: "used" },
      { path: "src/components/SidingHero.tsx", purpose: "Верхний баннер «Обшивка Сайдинг».", usedBy: "Страница Сайдинг.", status: "used" },
      { path: "src/components/SidingSections.tsx", purpose: "Блок «О сайдинге», карточки 8 элементов и подвал.", usedBy: "Страница Сайдинг; блок можно скрыть в админке.", status: "used" },
      { path: "src/components/GableFields.tsx", purpose: "Кнопки типа фасада и поля фронтона: высота, излом, смещение вершины.", usedBy: "Калькулятор фасада.", status: "used" },
      { path: "src/components/GableFacadeScheme.tsx", purpose: "Чертёж фасада с фронтоном.", usedBy: "Калькулятор фасада.", status: "used" },
      { path: "src/components/HProfilePlacementControl.tsx", purpose: "Кнопки смещения H-профиля: Самый выгодный, Симметрично, От центра, Слева, Справа.", usedBy: "Калькулятор фасада.", status: "used" },
      { path: "src/components/SidingPlanLightbox.tsx", purpose: "Полноэкранный просмотр плана фасада.", usedBy: "Калькулятор фасада.", status: "used" },
      { path: "src/components/SidingHouse3D.tsx", purpose: "Объёмный вид дома.", usedBy: "Калькулятор фасада, режим «3D вид».", status: "used" },
      { path: "src/components/SidingTopView.tsx", purpose: "Вид дома сверху с размерами.", usedBy: "Калькулятор фасада, режим «Вид сверху».", status: "used" },
      { path: "src/components/HouseRoofSelector.tsx", purpose: "Выбор формы кровли дома для 3D-вида.", usedBy: "Калькулятор фасада.", status: "used" },
      { path: "src/data/siding.ts", purpose: "Элементы сайдинга, цвета, проёмы и формула расчёта.", usedBy: "Калькулятор фасада, админка, печать.", status: "used" },
      { path: "src/data/sidingCatalog.ts", purpose: "Товары MONLID с артикулами и доступными цветами.", usedBy: "src/data/siding.ts.", status: "used" },
      { path: "src/data/testFacade.ts", purpose: "Геометрия фронтонов, правила швов H-профиля и раскрой панелей.", usedBy: "Калькулятор фасада.", status: "used" },
      { path: "src/data/house3D.ts", purpose: "Размеры дома и кровли для 3D-вида и вида сверху.", usedBy: "Калькулятор фасада.", status: "used" },
      { path: "src/utils/printSidingLayout.ts", purpose: "Печать плана фасада и сметы на один лист A4.", usedBy: "Кнопка «Печать» в калькуляторе фасада.", status: "used" },
    ],
  },
  {
    id: "settings",
    title: "Настройки, цены и админка",
    description: "Общие настройки сайта, загрузка цен, вход администратора.",
    files: [
      { path: "src/data/siteSettings.ts", purpose: "Все общие настройки: бегущая строка, меню, подвал, логотипы, стартовые значения калькуляторов, показ блоков «О …».", usedBy: "Почти все части сайта и админка.", status: "used" },
      { path: "src/data/settingsSync.ts", purpose: "Чтение настроек из Google-таблицы и публикация туда из админки.", usedBy: "src/data/siteSettings.ts и админка.", status: "used" },
      { path: "src/data/prices.ts", purpose: "Загрузка цен и ссылок на товары из Google-таблицы.", usedBy: "Все калькуляторы.", status: "used" },
      { path: "src/components/admin/PageSettingsSection.tsx", purpose: "Раздел «Блоки и наполнение страниц сайта» в админке, включая вкладку «Файлы».", usedBy: "src/pages/AdminPage.tsx.", status: "used" },
      { path: "src/components/admin/AboutVisibilityToggle.tsx", purpose: "Переключатель показа блоков «О грильято», «О системе Армстронг», «О кровле», «О сайдинге».", usedBy: "Раздел настройки страниц.", status: "used" },
      {
        path: "src/components/admin/SiteFilesSection.tsx",
        purpose: "Вкладка «Файлы»: список файлов по группам, поиск и фильтр по статусу.",
        usedBy: "Не подключён: кнопку «Файлы» убрали из раздела «Настройка страниц».",
        status: "unused",
        why: "Кнопку «Файлы» убрали из админки по запросу владельца. Файл больше не подключается ни к одной странице и ни на что не влияет, его можно удалить. Код сохранён, чтобы вернуть вкладку при необходимости.",
      },
      {
        path: "src/components/admin/SiteAuditSection.tsx",
        purpose: "Вкладка «ИИ»: разбор недочётов сайта, как исправить и где менять.",
        usedBy: "Не подключён: кнопку «ИИ» убрали из раздела «Настройка страниц».",
        status: "unused",
        why: "Кнопку «ИИ» убрали из админки по запросу владельца. Файл больше не подключается ни к одной странице и ни на что не влияет, его можно удалить. Код сохранён, чтобы вернуть вкладку при необходимости.",
      },
      {
        path: "src/data/siteFiles.ts",
        purpose: "Справочник файлов для вкладки «Файлы».",
        usedBy: "Используется только файлом SiteFilesSection.tsx, который сейчас не подключён.",
        status: "unused",
        why: "Справочник нужен только вкладке «Файлы», которую убрали из админки. Сам по себе он ни на что не влияет; можно удалить вместе с SiteFilesSection.tsx.",
      },
      {
        path: "src/data/siteAudit.ts",
        purpose: "Список недочётов сайта с решениями для вкладки «ИИ».",
        usedBy: "Используется только файлом SiteAuditSection.tsx, который сейчас не подключён.",
        status: "unused",
        why: "Список нужен только вкладке «ИИ», которую убрали из админки. Сам по себе он ни на что не влияет; можно удалить вместе с SiteAuditSection.tsx.",
      },
      { path: "src/integrations/supabase/config.ts", purpose: "Адрес проекта Supabase и публичный ключ.", usedBy: "Вход в админку.", status: "used" },
      { path: "src/integrations/supabase/client.ts", purpose: "Единое подключение к Supabase с запоминанием входа.", usedBy: "src/integrations/supabase/adminAuth.ts.", status: "used" },
      { path: "src/integrations/supabase/adminAuth.ts", purpose: "Вход по почте и паролю, проверка почты в таблице admins, выход.", usedBy: "Экран входа в админку и шапка.", status: "used" },
      { path: "src/utils/adminSession.ts", purpose: "Сообщает шапке и админке, вошёл ли администратор.", usedBy: "Шапка, админка, src/main.tsx.", status: "used" },
      { path: "src/hooks/useChelyabinskDelivery.ts", purpose: "Автообновление надписи «Сегодня / Завтра» о доставке.", usedBy: "Баннеры главной, Армстронга, Кровли, Сайдинга.", status: "used" },
      { path: "src/utils/delivery.ts", purpose: "Расчёт дня доставки по времени Челябинска (граница 16:00).", usedBy: "src/hooks/useChelyabinskDelivery.ts.", status: "used" },
      { path: "src/utils/cn.ts", purpose: "Склейка CSS-классов без дублей.", usedBy: "Почти все компоненты.", status: "used" },
    ],
  },
  {
    id: "images",
    title: "Картинки (public/images)",
    description: "Фотографии подключаются по относительному пути images/…, поэтому работают и локально, и на GitHub Pages.",
    files: [
      { path: "public/images/main-hero.jpg", purpose: "Фон баннера главной страницы.", usedBy: "src/pages/MainPage.tsx.", status: "used" },
      { path: "public/images/grilyato-hero.jpg", purpose: "Фон баннера Грильято и карточка на главной.", usedBy: "Hero.tsx, MainPage.tsx.", status: "used" },
      { path: "public/images/grilyato-detail.jpg", purpose: "Фото узла в блоке «О системе Грильято».", usedBy: "Sections.tsx.", status: "used" },
      { path: "public/images/armstrong-hero.jpg", purpose: "Фон баннера Армстронг, карточка на главной и витрина.", usedBy: "ArmstrongPage.tsx, MainPage.tsx, ArmstrongSystem.tsx.", status: "used" },
      { path: "public/images/roof-hero.jpg", purpose: "Фон баннера Кровля и карточка на главной.", usedBy: "RoofHero.tsx, MainPage.tsx.", status: "used" },
      { path: "public/images/roof-detail.jpg", purpose: "Фото в блоке «О кровле».", usedBy: "RoofSections.tsx.", status: "used" },
      { path: "public/images/siding-hero.jpg", purpose: "Фон баннера Сайдинг/Тест и карточка на главной.", usedBy: "SidingHero.tsx, MainPage.tsx.", status: "used" },
      { path: "public/images/siding-detail.jpg", purpose: "Фото в блоке «О сайдинге».", usedBy: "SidingSections.tsx.", status: "used" },
      { path: "public/images/armstrong/tile-*.webp (16 файлов)", purpose: "Фото восьми плит Армстронга, по два ракурса: Pharaon, Байкал, белая и оцинкованная сталь, перфорированная, алюминий, SO-DAE 7 и 10.", usedBy: "Пути собираются в src/data/armstrong.ts; показываются в калькуляторе и витрине.", status: "used" },
      { path: "public/images/armstrong/profile-premium.webp, profile-economy.webp", purpose: "Фото Т-профилей «Премиум» и «Эконом».", usedBy: "src/data/armstrong.ts.", status: "used" },
      { path: "public/images/armstrong/angle-steel.webp, angle-aluminum.webp", purpose: "Фото пристенных углов «Сталь» и «Алюминий».", usedBy: "src/data/armstrong.ts.", status: "used" },
    ],
  },
  {
    id: "scripts",
    title: "Служебные скрипты (scripts)",
    description: "На сайт не попадают. Один нужен для таблицы настроек, остальные — проверки для разработчика.",
    files: [
      { path: "scripts/settings-sheet-api.gs", purpose: "Код для Google Apps Script: принимает настройки из админки и записывает их в таблицу.", usedBy: "Вставляется вручную в Google-таблицу (Расширения → Apps Script). Без него публикация настроек не работает.", status: "service" },
      { path: "scripts/verify-test-facade.ts", purpose: "Автопроверка расчётов фасада, фронтонов и швов H-профиля (33 теста).", usedBy: "Запуск: npx tsx scripts/verify-test-facade.ts.", status: "service" },
      { path: "scripts/verify-siding.ts", purpose: "Автопроверка формул сайдинга.", usedBy: "Запуск вручную через npx tsx.", status: "service" },
      { path: "scripts/verify-siding-catalog.ts", purpose: "Проверка каталога товаров MONLID и цен.", usedBy: "Запуск вручную через npx tsx.", status: "service" },
      { path: "scripts/verify-siding-page.ts", purpose: "Проверка, что страницы Сайдинг и Кровля собираются без ошибок.", usedBy: "Запуск вручную через npx tsx.", status: "service" },
      { path: "scripts/verify-siding-view.ts", purpose: "Проверка разметки калькулятора сайдинга.", usedBy: "Запуск вручную через npx tsx.", status: "service" },
      { path: "scripts/verify-roof-profiles.ts", purpose: "Проверка геометрии кровельных профилей.", usedBy: "Запуск вручную через npx tsx.", status: "service" },
      { path: "scripts/verify-delivery-content.ts", purpose: "Проверка надписей о доставке на страницах.", usedBy: "Запуск вручную через npx tsx.", status: "service" },
      { path: "scripts/verify-test-facade-browser.mjs", purpose: "Проверка страницы Тест в настоящем браузере (Playwright).", usedBy: "Запуск после npm run build при установленном Playwright.", status: "service" },
      { path: "scripts/verify-main-cards-browser.mjs", purpose: "Проверка карточек главной в браузере (Playwright).", usedBy: "Запуск после npm run build.", status: "service" },
      { path: "scripts/verify-delivery-browser.mjs", purpose: "Проверка смены «Сегодня / Завтра» в браузере (Playwright).", usedBy: "Запуск после npm run build.", status: "service" },
    ],
  },
];

/* БЛОК: Сводка по справочнику (countSiteFiles)
 * ЗА ЧТО ОТВЕЧАЕТ: Считает, сколько файлов работает на сайте, сколько служебных и сколько не используется.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: SITE_FILE_GROUPS выше. Группы картинок считаются по числу файлов в скобках.
 * КАК ИЗМЕНИТЬ: Не требуется. */
export function countSiteFiles(): { total: number; used: number; service: number; unused: number } {
  const counts = { total: 0, used: 0, service: 0, unused: 0 };
  for (const group of SITE_FILE_GROUPS) {
    for (const file of group.files) {
      const match = /\((\d+) файл/.exec(file.path);
      const commaParts = file.path.includes(", ") ? file.path.split(", ").length : 1;
      const n = match ? Number(match[1]) : commaParts;
      counts.total += n;
      counts[file.status] += n;
    }
  }
  return counts;
}
