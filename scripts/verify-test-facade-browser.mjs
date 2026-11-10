import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";

const playwrightModule = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const chromium = playwrightModule.chromium ?? playwrightModule.default?.chromium;
const port = process.env.PORT || "4189";
const url = `http://127.0.0.1:${port}`;
const output = process.env.FACADE_SCREENSHOT_DIR || "/tmp/facade-check/output";
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", port, "--strictPort"], { stdio: "pipe" });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, "Preview server starts");
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("https://docs.google.com/**", (route) => route.fulfill({
    status: 200, contentType: "text/csv", body: '"key","value"\n',
  }));
  await context.addInitScript(() => {
    window.__printCalls = 0;
    window.print = () => { window.__printCalls++; };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${url}/#/test`, { waitUntil: "domcontentloaded" });
  await page.locator("#calc").waitFor();
  const mode = (label) => page.getByRole("group", { name: "Режим отображения" }).getByRole("button", { name: label, exact: true });
  const gableType = page.getByRole("group", { name: "Тип фронтона", exact: true });
  const typeBtn = (label) => gableType.getByRole("button", { name: label, exact: true });
  const seamBtn = (label) => page.getByRole("group", { name: "Смещение H профиля" }).getByRole("button", { name: label, exact: true });
  const panelLegend = () => page.locator("fieldset[aria-label='Тип фасада'] legend").first();
  const field = async (label, value) => {
    await page.getByRole("textbox", { name: label, exact: true }).fill(value);
    await page.getByRole("textbox", { name: label, exact: true }).blur();
  };
  const diagram = page.locator("#plan-panel-side1 svg[data-facade-mode]");
  const quantities = () => page.getByTestId("test-facade-specification").locator("tbody tr").evaluateAll((rows) =>
    rows.map((row) => [row.cells[0].textContent, row.cells[2].textContent]));

  // Над «План фасада» остаются ТОЛЬКО две кнопки: «Одна сторона» и «3D»
  const topButtons = (await page.getByRole("group", { name: "Режим отображения" }).getByRole("button").allTextContents()).map((t) => t.trim());
  assert.deepEqual(topButtons, ["Одна сторона", "3D"], "Above facade plan there are ONLY 'Одна сторона' and '3D'");
  assert.equal(await mode("Одна сторона").getAttribute("aria-pressed"), "true");

  // В блоке «Тип фронтона» присутствуют все 5 кнопок, и в каждой есть значок (svg)
  const allTypeLabels = ["Без фронтона", "С фронтоном", "С ломаным фронтоном", "Фронтон", "Ломаный фронтон"];
  for (const label of allTypeLabels) {
    assert.ok(await typeBtn(label).isVisible(), `${label}: type button visible`);
    assert.equal(await typeBtn(label).locator("svg").count(), 1, `${label}: contains an icon`);
  }

  // «Запас» всегда под «Цвета», кнопка «Один цвет» убрана во всех вариантах
  const reserveBelowColors = () =>
    page.evaluate(() => {
      const divs = [...document.querySelectorAll("#calc div")];
      const exact = (text) => divs.filter((el) => el.textContent.trim() === text).pop();
      const colors = exact("Цвета");
      const reserve = exact("Запас");
      return Boolean(colors && reserve) && (colors.compareDocumentPosition(reserve) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
  for (const label of allTypeLabels) {
    await typeBtn(label).click();
    assert.equal(await gableType.count(), 1, `${label}: only one facade type selector`);
    const typeBounds = await gableType.boundingBox();
    const sizeLabel = label === "Фронтон" || label === "Ломаный фронтон" ? "Ширина основания" : "Длина фасада";
    const sizeBounds = await page.getByRole("textbox", { name: sizeLabel, exact: true }).boundingBox();
    assert.ok(typeBounds && sizeBounds && typeBounds.y + typeBounds.height <= sizeBounds.y,
      `${label}: facade type selector is above the dimension fields`);
    assert.equal(await page.getByRole("button", { name: "Один цвет", exact: true }).count(), 0, `${label}: single color toggle removed`);
    assert.ok(await reserveBelowColors(), `${label}: reserve sits below the colors block`);
    assert.ok(await seamBtn("Слева").isVisible(), `${label}: Слева button visible`);
    assert.ok(await seamBtn("Справа").isVisible(), `${label}: Справа button visible`);
  }
  await typeBtn("Без фронтона").click();

  const modeBounds = await page.getByRole("group", { name: "Режим отображения" }).boundingBox();
  const printBounds = await page.getByRole("button", { name: "Печать", exact: true }).boundingBox();
  assert.ok(modeBounds.y + modeBounds.height <= printBounds.y, "Mode buttons are above the facade plan");
  await field("Длина фасада", "8");
  await field("Высота фасада", "3");
  const ordinaryQuantities = await quantities();
  const ordinaryStorage = await page.evaluate(() => localStorage.getItem("test:siding-input"));

  // --- Смещение H-профиля: четыре независимые кнопки, активна ровно одна ---
  const readSeams = async () => (await page.locator("#plan-panel-side1 svg").first().getAttribute("data-seams"))
    .split(",").filter(Boolean).map(Number);
  const panelQty = (rows) => Number(rows[0][1].replace(/\D/g, ""));
  const pressedCount = async () =>
    await page.getByRole("group", { name: "Смещение H профиля" }).locator("button[aria-pressed='true']").count();
  assert.equal(await seamBtn("Самый выгодный").getAttribute("aria-pressed"), "true", "Profitable placement is default");
  assert.equal(await pressedCount(), 1, "Exactly one H button pressed");
  assert.equal(await page.getByText(/Швы:/).count(), 0, "Seam text removed");
  assert.equal(await page.getByText(/Швы подобраны так/).count(), 0, "Optimal hint removed");
  const optimalSeams = await readSeams();
  await seamBtn("Справа").click();
  assert.equal(await seamBtn("Справа").getAttribute("aria-pressed"), "true");
  assert.equal(await seamBtn("Самый выгодный").getAttribute("aria-pressed"), "false", "Самый выгодный released when Справа pressed");
  assert.equal(await pressedCount(), 1, "Still exactly one pressed");
  assert.deepEqual(await readSeams(), [2000, 5000], "Справа: seams counted from the right edge");
  await seamBtn("Слева").click();
  assert.equal(await seamBtn("Слева").getAttribute("aria-pressed"), "true");
  assert.equal(await seamBtn("Справа").getAttribute("aria-pressed"), "false", "Справа released when Слева pressed");
  assert.equal(await pressedCount(), 1);
  assert.deepEqual(await readSeams(), [3000, 6000], "Слева: seams counted from the left edge");
  await seamBtn("Симметрично").click();
  assert.equal(await seamBtn("Симметрично").getAttribute("aria-pressed"), "true");
  assert.equal(await seamBtn("Слева").getAttribute("aria-pressed"), "false");
  assert.equal(await pressedCount(), 1);
  const symmetricSeams = await readSeams();
  assert.ok(symmetricSeams.length > 0, "Symmetric layout keeps seams on an 8 m facade");
  assert.deepEqual(symmetricSeams, [...symmetricSeams].reverse().map((s) => 8000 - s), "Seams are mirrored");
  assert.equal(await page.getByText(/Швы:/).count(), 0, "Seam text stays removed in symmetric mode");
  assert.equal(await page.getByText(/Раскладка зеркальна/).count(), 0, "Symmetric hint removed");
  const symmetricQuantities = await quantities();
  await seamBtn("Самый выгодный").click();
  assert.equal(await seamBtn("Самый выгодный").getAttribute("aria-pressed"), "true");
  assert.equal(await pressedCount(), 1);
  assert.deepEqual(await readSeams(), optimalSeams);
  assert.ok(panelQty(await quantities()) <= panelQty(symmetricQuantities), "Profitable placement buys no more panels");
  console.log("PASS: H-profile buttons independent;", "optimal seams", optimalSeams.join("/"), "symmetric seams", symmetricSeams.join("/"));

  // Кнопка «Завершение сайдинга финишной планкой» убрана — элемент считается всегда.
  assert.equal(await page.getByRole("button", { name: /Завершение сайдинга финишной планкой/ }).count(), 0, "Finish toggle removed");
  assert.equal(await page.getByRole("textbox", { name: "От низа фасада", exact: true }).count(), 0, "Old field name removed");
  assert.ok(await page.getByRole("textbox", { name: "От земли", exact: true }).first().isVisible(), "Field renamed to «От земли»");

  // Положение проёмов: поле «От левого края» убрано, расстояния — в окнах «Слева» / «Справа» размером с кнопку «По центру».
  assert.equal(await page.getByRole("textbox", { name: "От левого края", exact: true }).count(), 0, "Left-edge field removed from openings");
  const doorSlider = page.getByRole("slider", { name: "Положение двери по фасаду" });
  assert.ok(await doorSlider.isVisible(), "Door position slider exists");
  const doorCard = page.locator("div.rounded-2xl", { has: doorSlider });
  const doorLeft = doorCard.getByRole("textbox", { name: "Слева от края, метры" });
  const doorRight = doorCard.getByRole("textbox", { name: "Справа от края, метры" });
  assert.equal(await doorLeft.inputValue(), "5,60", "Left input shows the door offset");
  assert.equal(await doorRight.inputValue(), "1,50", "Right input is complementary to the left");
  const doorBefore = await doorSlider.getAttribute("aria-valuetext");
  await doorSlider.focus();
  await page.keyboard.press("ArrowRight");
  assert.notEqual(await doorSlider.getAttribute("aria-valuetext"), doorBefore, "Slider moves the door");
  await doorCard.getByRole("button", { name: "По центру", exact: true }).click();
  assert.match(await doorSlider.getAttribute("aria-valuetext"), /^3,55 м/, "Door centered by the button");
  assert.equal(await doorLeft.inputValue(), "3,55");
  assert.equal(await doorRight.inputValue(), "3,55");
  // Возвращаем дверь через окно «Справа»: 7,10 − 1,50 = 5,60
  await doorRight.fill("1,5");
  await doorRight.blur();
  assert.equal(await doorLeft.inputValue(), "5,60");
  assert.equal(await doorRight.inputValue(), "1,50");
  // У окна те же окна ввода и нет поля «От левого края»
  const windowCard = page.locator("div.rounded-2xl", { has: page.getByRole("slider", { name: "Положение окна по фасаду" }) });
  assert.ok(await windowCard.getByRole("textbox", { name: "Слева от края, метры" }).isVisible());
  assert.ok(await windowCard.getByRole("textbox", { name: "Справа от края, метры" }).isVisible());
  assert.equal(await windowCard.getByRole("textbox", { name: "От левого края", exact: true }).count(), 0);

  // Финишная планка по верху считается всегда: печатный лист содержит её количество.
  await page.getByRole("button", { name: "Печать", exact: true }).click();
  await page.waitForFunction(() => window.__printCalls === 1);
  const plainFinishRow = page.locator(".siding-print-root table tbody tr", { hasText: "Финишная планка" });
  assert.match(await plainFinishRow.locator("td.qty").textContent(), /шт/, "Finish plank counted for a plain facade");
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.evaluate(() => { window.__printCalls = 0; });
  assert.equal(await page.locator(".siding-print-root").count(), 0);
  console.log("PASS: finish toggle removed, field renamed, door slider works, finish plank always counted");

  await typeBtn("С фронтоном").click();
  assert.equal(await diagram.getAttribute("data-facade-mode"), "side-gable");
  assert.equal(await page.getByRole("textbox", { name: "Общая высота", exact: true }).inputValue(), "5,4");
  assert.equal(await page.getByRole("textbox", { name: "Высота фронтона", exact: true }).inputValue(), "2,4");
  assert.ok(await page.getByText("Окна и двери", { exact: true }).isVisible());

  // Стандарт для фасада: бежевый сайдинг, коричневые доборные элементы, окно и дверь с J профилем
  const colorIsChecked = async (row, color) =>
    (await page.getByRole("radio", { name: `${row}: ${color}`, exact: true }).getAttribute("aria-checked")) === "true";
  assert.ok(await colorIsChecked("Сайдинг ПВХ", "Бежевый"), "Siding is beige");
  for (const row of ["H профиль", "Финишная планка", "Околооконная планка", "J профиль", "Угол внутренний", "Угол наружный"]) {
    assert.ok(await colorIsChecked(row, "Коричневый"), `${row} is brown`);
  }
  for (const kind of ["окна", "двери"]) {
    const card = page.locator("div.rounded-2xl", { has: page.getByRole("slider", { name: `Положение ${kind} по фасаду` }) });
    assert.equal(await card.getByRole("button", { name: "J профиль", exact: true }).getAttribute("aria-pressed"), "true", `${kind}: J профиль selected by default`);
  }
  assert.equal(await page.getByRole("button", { name: /Завершение сайдинга финишной планкой/ }).count(), 0, "Finish toggle stays removed in gable mode");
  const apexPanel = page.getByTestId("apex-control");
  const apexLeft = apexPanel.getByRole("textbox", { name: "Слева до вершины, метры" });
  const apexRight = apexPanel.getByRole("textbox", { name: "Справа до вершины, метры" });
  assert.equal(await page.getByRole("textbox", { name: "Смещение вершины", exact: true }).count(), 0, "Top apex offset field removed");

  // Панель режимов со стеной: только «Тип фасада» с пятью кнопками, без старых заголовков и пояснений
  assert.ok(await page.getByText("Тип фасада", { exact: true }).isVisible(), "Panel titled «Тип фасада»");
  assert.equal(await page.getByText("Фронтон над фасадом", { exact: true }).count(), 0, "Old «Фронтон над фасадом» caption removed");
  assert.equal(await page.getByText("Тип фронтона", { exact: true }).count(), 0, "«Тип фронтона» caption removed");
  // Порядок полей: Общая высота — сразу под Длиной фасада, Смещение вершины — под Высотой фронтона
  const sideGableOrder = await page.evaluate(() => {
    const wanted = ["Длина фасада", "Общая высота", "Высота фасада", "Высота фронтона", "Смещение вершины"];
    return [...document.querySelectorAll("#calc label, #calc [data-field-caption]")]
      .filter((n) => wanted.includes(n.textContent.trim()))
      .map((n) => ({ text: n.textContent.trim(), top: n.getBoundingClientRect().top }))
      .sort((a, b) => a.top - b.top)
      .map((n) => n.text);
  });
  assert.deepEqual(sideGableOrder, ["Длина фасада", "Общая высота", "Высота фасада", "Высота фронтона", "Смещение вершины"],
    "С фронтоном: Общая высота under Длина фасада, Смещение вершины under Высота фронтона");

  // Блок «Тип фронтона»: пять кнопок с новыми названиями.
  const typeLabels = (await gableType.getByRole("button").allTextContents()).map((text) => text.trim());
  assert.deepEqual(typeLabels, ["Без фронтона", "С фронтоном", "С ломаным фронтоном", "Фронтон", "Ломаный фронтон"], "Five gable type buttons");
  assert.equal(await typeBtn("С фронтоном").getAttribute("aria-pressed"), "true", "С фронтоном is the default");
  assert.equal(await diagram.getAttribute("data-gable-shape"), "gable", "Triangular shape by default");
  assert.equal(await diagram.getAttribute("data-profile-points"), "3", "Triangular profile has three points");

  // «С ломаным фронтоном»: излом есть, блока «Пропорции» нет.
  await typeBtn("С ломаным фронтоном").click();
  assert.equal(await diagram.getAttribute("data-gable-shape"), "broken", "Broken shape over the facade");
  assert.equal(await diagram.getAttribute("data-facade-mode"), "side-gable", "Still the wall with a gable");
  assert.ok(await page.getByRole("textbox", { name: "Общая высота", exact: true }).isVisible(), "Broken gable keeps total height under facade height");
  assert.ok(await page.getByRole("textbox", { name: "Высота фронтона", exact: true }).isVisible(), "Broken gable keeps gable height under facade height");
  assert.equal(await diagram.getAttribute("data-profile-points"), "5", "Broken profile has five points");
  assert.ok(await page.getByRole("textbox", { name: "Высота излома", exact: true }).isVisible(), "Break height field appears");
  assert.ok(await page.getByRole("textbox", { name: "Отступ излома", exact: true }).isVisible(), "Break inset field appears");
  assert.equal(await page.getByRole("group", { name: "Пропорции ломаного фронтона" }).count(), 0, "Proportions block removed from side gable");
  assert.equal(await page.getByText("Пропорции", { exact: true }).count(), 0);
  for (const preset of ["Мансарда", "Голландский", "Пологий"]) {
    assert.equal(await page.getByRole("button", { name: preset, exact: true }).count(), 0, `${preset} button removed from side gable`);
  }
  // Текст про скаты и блок «Скаты» убраны из режима «С ломаным фронтоном»
  assert.equal(await page.getByText("Каждый скат состоит").count(), 0, "Slope explanation removed");
  assert.equal(await page.getByText("J профиль по скатам:").count(), 0, "Slopes summary removed");
  assert.equal(await page.getByRole("group", { name: "Скаты ломаного фронтона" }).count(), 0, "Slopes block removed");
  const sideBrokenOrder = await page.evaluate(() => {
    const wanted = ["Длина фасада", "Общая высота", "Высота фасада", "Высота фронтона", "Высота излома", "Отступ излома", "Смещение вершины"];
    return [...document.querySelectorAll("#calc label, #calc [data-field-caption]")]
      .filter((n) => wanted.includes(n.textContent.trim()))
      .map((n) => ({ text: n.textContent.trim(), top: n.getBoundingClientRect().top }))
      .sort((a, b) => a.top - b.top)
      .map((n) => n.text);
  });
  assert.deepEqual(sideBrokenOrder,
    ["Длина фасада", "Общая высота", "Высота фасада", "Высота фронтона", "Высота излома", "Отступ излома", "Смещение вершины"],
    "С ломаным фронтоном: излом и смещение вершины под Высотой фронтона");

  // «С фронтоном»: обратно к треугольнику.
  await typeBtn("С фронтоном").click();
  assert.equal(await diagram.getAttribute("data-gable-shape"), "gable", "Shape back to triangular");
  assert.equal(await diagram.getAttribute("data-profile-points"), "3");
  assert.equal(await page.getByRole("textbox", { name: "Высота излома", exact: true }).count(), 0, "Break fields hidden for triangular gable");

  // «Без фронтона»: прямая стена, поля фронтона исчезают, а проёмы и режим остаются.
  const plainDiagram = page.locator("#plan-panel-side1 svg[data-seams]").first();
  await typeBtn("Без фронтона").click();
  assert.equal(await typeBtn("Без фронтона").getAttribute("aria-pressed"), "true");
  assert.equal(await plainDiagram.getAttribute("data-facade-mode"), null, "No gable diagram without a gable");
  assert.equal(await page.getByRole("textbox", { name: "Общая высота", exact: true }).count(), 0, "Total height hidden");
  assert.equal(await page.getByRole("textbox", { name: "Высота фронтона", exact: true }).count(), 0, "Gable height hidden");
  assert.equal(await mode("Одна сторона").getAttribute("aria-pressed"), "true", "Mode stays on side facade");
  assert.ok(await page.getByRole("textbox", { name: "Длина фасада", exact: true }).isVisible(), "Facade size fields stay");
  assert.ok(await page.getByText("Окна и двери", { exact: true }).isVisible(), "Openings stay");
  assert.equal(await page.getByText("Фасад без фронтона").count(), 0, "Explanation text removed");
  assert.ok(await page.getByText("Тип фасада", { exact: true }).isVisible(), "«Тип фасада» panel kept");
  const noGableOrder = await page.evaluate(() => {
    const wanted = ["Длина фасада", "Общая высота", "Высота фасада", "Высота фронтона", "Смещение вершины"];
    return [...document.querySelectorAll("#calc label, #calc [data-field-caption]")]
      .filter((n) => wanted.includes(n.textContent.trim()))
      .map((n) => n.textContent.trim());
  });
  assert.deepEqual(noGableOrder, ["Длина фасада", "Высота фасада"], "Без фронтона: only wall size fields");
  assert.deepEqual(await quantities(), ordinaryQuantities, "«Без фронтона» gives exactly the «Одна сторона» specification");

  // «Фронтон» и «Ломаный фронтон» без «С»: только фронтон без стены (отдельные режимы).
  await typeBtn("Фронтон").click();
  assert.equal(await mode("Одна сторона").getAttribute("aria-pressed"), "true", "Top switcher stays on flat facade view");
  assert.equal(await diagram.getAttribute("data-facade-mode"), "gable");
  assert.equal(await page.getByText("Окна и двери", { exact: true }).count(), 0, "No wall doors header");
  assert.ok(await page.getByText("Окна", { exact: true }).first().isVisible(), "Standalone gable offers windows");
  assert.equal(await page.getByRole("button", { name: "Дверь", exact: true }).count(), 0, "No door button on standalone gables");
  assert.equal(await typeBtn("Фронтон").getAttribute("aria-pressed"), "true", "Block stays visible and shows the active type");
  assert.equal(await typeBtn("Ломаный фронтон").getAttribute("aria-pressed"), "false", "Type buttons keep their own labels");
  assert.equal(await panelLegend().textContent(), "Тип фасада", "Standalone gable panel is titled «Тип фасада»");
  assert.equal(await page.getByText("Размеры фронтона", { exact: true }).count(), 0, "Old «Размеры фронтона» caption removed");
  assert.equal(await page.getByRole("group", { name: "Пропорции ломаного фронтона" }).count(), 0, "Plain gable has no proportions");
  await typeBtn("Ломаный фронтон").click();
  assert.equal(await mode("Одна сторона").getAttribute("aria-pressed"), "true", "Top switcher stays on flat facade view");
  assert.equal(await diagram.getAttribute("data-facade-mode"), "broken-gable");
  assert.equal(await panelLegend().textContent(), "Тип фасада", "Standalone broken gable panel is titled «Тип фасада»");
  assert.equal(await page.getByRole("group", { name: "Пропорции ломаного фронтона" }).count(), 0, "Standalone broken gable lost its proportions block");
  assert.equal(await page.getByRole("group", { name: "Скаты ломаного фронтона" }).count(), 0, "Standalone broken gable lost its slopes block");
  assert.equal(await page.getByText("J профиль по скатам:").count(), 0, "Slopes summary removed");

  // Возврат к стене с треугольным фронтоном — дальше сценарий идёт как раньше.
  await typeBtn("С фронтоном").click();
  assert.equal(await mode("Одна сторона").getAttribute("aria-pressed"), "true");
  assert.equal(await diagram.getAttribute("data-facade-mode"), "side-gable");
  assert.equal(await diagram.getAttribute("data-gable-shape"), "gable");
  console.log("PASS: gable type block — five buttons, renamed labels, no proportions on side gable");

  await field("Общая высота", "6");
  assert.equal(await page.getByRole("textbox", { name: "Высота фронтона", exact: true }).inputValue(), "3");
  await field("Высота фронтона", "2,5");
  assert.equal(await page.getByRole("textbox", { name: "Общая высота", exact: true }).inputValue(), "5,5", "Total height follows gable height");
  await field("Общая высота", "6");
  assert.equal(await page.getByRole("textbox", { name: "Высота фронтона", exact: true }).inputValue(), "3", "Gable height follows total height");
  await apexLeft.fill("5,2");
  await apexLeft.blur();
  assert.equal(await diagram.getAttribute("data-apex-x"), "5.2");
  assert.equal(await diagram.getAttribute("data-gable-height"), "3");
  assert.equal(await diagram.getAttribute("data-net-area"), "32.43");
  assert.equal(await apexLeft.inputValue(), "5,20", "Side-gable left input shows 5,20");
  assert.equal(await apexRight.inputValue(), "2,80", "Side-gable right input shows 2,80");
  const sideGableSeams = await readSeams();
  assert.equal(await diagram.locator("g[data-h-seam] rect").count(), sideGableSeams.length * 2, "Side-gable H-profile rendered as hatched band");
  assert.equal(await diagram.locator("g[data-h-seam] line").count(), sideGableSeams.length * 2, "Side-gable H-profile has two dashed border lines per seam");
  assert.notDeepEqual(await quantities(), ordinaryQuantities, "Gable material quantities are recalculated");
  await apexRight.fill("5,5");
  await apexRight.blur();
  assert.equal(await diagram.getAttribute("data-apex-x"), "2.5");
  assert.equal(await apexLeft.inputValue(), "2,50");
  await page.getByRole("slider", { name: "Положение вершины относительно центра" }).focus();
  await page.keyboard.press("Home");
  assert.equal(await diagram.getAttribute("data-apex-x"), "0");
  // Кнопка «По центру» есть и у бегунков проёмов — кликаем только в контроле смещения вершины.
  await apexPanel.getByRole("button", { name: "По центру", exact: true }).click();
  await page.waitForFunction(() => {
    const input = document.querySelector("[data-testid='apex-control'] input[aria-label='Слева до вершины, метры']");
    return input?.value === "4,00";
  }, null, { timeout: 3000 });
  assert.equal(await diagram.getAttribute("data-apex-x"), "4");
  assert.equal(await apexLeft.inputValue(), "4,00");
  assert.equal(await apexRight.inputValue(), "4,00");
  await diagram.screenshot({ path: `${output}/side-gable.png` });

  await typeBtn("Фронтон").click();
  assert.equal(await diagram.getAttribute("data-facade-mode"), "gable");
  assert.equal(await page.getByText("Окна и двери", { exact: true }).count(), 0);
  assert.equal(await page.getByRole("textbox", { name: "Смещение вершины", exact: true }).count(), 0, "Top apex offset field removed on Gable");
  assert.equal(await typeBtn("Фронтон").getAttribute("aria-pressed"), "true", "Standalone gable shows «Фронтон» as the active type");
  assert.equal(await diagram.getAttribute("data-gable-shape"), "gable", "Standalone gable is triangular");
  await field("Ширина основания", "9");
  await field("Высота фронтона", "3,5");
  await apexLeft.fill("2,5");
  await apexLeft.blur();
  assert.equal(await diagram.getAttribute("data-apex-x"), "2.5");
  assert.equal(await apexLeft.inputValue(), "2,50", "Gable left input shows 2,50");
  assert.equal(await apexRight.inputValue(), "6,50", "Gable right input shows 6,50");
  const plainGableSeams = await readSeams();
  assert.equal(await diagram.locator("g[data-h-seam] rect").count(), plainGableSeams.length * 2, "Gable H-profile rendered as hatched band");
  assert.equal(await diagram.locator("g[data-h-seam] line").count(), plainGableSeams.length * 2, "Gable H-profile has two dashed border lines per seam");
  // Отдельный фронтон считает окно (1,2 × 1,4 = 1,68 м²): 15,75 − 1,68 = 14,07; дверь исключена
  assert.equal(await diagram.getAttribute("data-net-area"), "14.07");
  assert.ok(await page.getByText("Окна", { exact: true }).first().isVisible(), "Standalone gable shows windows editor");
  assert.equal(await page.getByRole("button", { name: "Дверь", exact: true }).count(), 0, "Standalone gable has no door button");
  assert.equal(await diagram.locator('rect[stroke="#1f4f8a"]').count(), 1, "Standalone gable draws the window on the plan");
  await diagram.screenshot({ path: `${output}/gable.png` });

  await page.getByRole("button", { name: "Открыть план фасада на весь экран", exact: true }).click();
  assert.ok(await page.getByRole("dialog", { name: "План фасада на весь экран" }).isVisible());
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);

  await page.getByRole("button", { name: "Печать", exact: true }).click();
  await page.waitForFunction(() => window.__printCalls === 1);
  assert.equal(context.pages().length, 1);
  assert.ok((await page.locator(".siding-print-root h1").textContent()).includes("Фронтон"));
  assert.notEqual(await page.locator(".siding-print-root clipPath").getAttribute("id"), await diagram.locator("clipPath").getAttribute("id"));
  assert.ok(await page.locator(".siding-print-root [clip-path]").evaluate((node) => {
    const id = node.getAttribute("clip-path").slice(5, -1);
    return Boolean(document.getElementById(id)?.closest(".siding-print-root"));
  }), "Print diagram uses its own clip path");
  await page.emulateMedia({ media: "print" });
  assert.ok(await page.locator(".siding-print-root svg[data-facade-mode='gable']").isVisible());
  await page.locator(".siding-print-root").screenshot({ path: `${output}/gable-print.png` });
  const pdf = await page.pdf({ path: `${output}/gable.pdf`, preferCSSPageSize: true, printBackground: true });
  assert.equal((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length, 1);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.emulateMedia({ media: "screen" });
  assert.equal(await page.locator(".siding-print-root").count(), 0);

  await mode("3D").click();
  assert.ok(await page.locator("#plan-panel-3d").isVisible());
  assert.equal(await mode("3D").getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "Вальмовая", exact: true }).click();
  await page.getByRole("button", { name: "Цвет кровли: Синий", exact: true }).click();
  await page.getByRole("tab", { name: "Вид сверху" }).click();
  assert.ok(await page.locator("#plan-panel-top").isVisible());
  await page.getByRole("textbox", { name: "Длина, метры", exact: true }).fill("9");
  await page.getByRole("textbox", { name: "Длина, метры", exact: true }).blur();
  await page.getByRole("button", { name: "Показать в 3D", exact: true }).click();
  assert.ok(await page.getByRole("img", { name: /Изометрический вид дома: длина 9 м/ }).isVisible());

  await mode("Одна сторона").click();
  assert.equal(await mode("Одна сторона").getAttribute("aria-pressed"), "true");
  await typeBtn("С фронтоном").click();
  assert.equal(await page.getByRole("textbox", { name: "Общая высота", exact: true }).inputValue(), "6");
  await typeBtn("Фронтон").click();
  assert.equal(await page.getByRole("textbox", { name: "Ширина основания", exact: true }).inputValue(), "9");
  await seamBtn("Симметрично").click();
  const gableSeams = await readSeams();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#calc").waitFor();
  assert.equal(await typeBtn("Фронтон").getAttribute("aria-pressed"), "true");
  assert.equal(await seamBtn("Симметрично").getAttribute("aria-pressed"), "true", "H placement persists");
  assert.deepEqual(await readSeams(), gableSeams, "Seam layout persists after reload");
  // «Справа» — тоже независимый одиночный вариант: выбирается и переживает перезагрузку сам по себе
  await seamBtn("Справа").click();
  assert.equal(await seamBtn("Справа").getAttribute("aria-pressed"), "true");
  assert.equal(await seamBtn("Симметрично").getAttribute("aria-pressed"), "false", "Симметрично released");
  const rightSeams = await readSeams();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#calc").waitFor();
  assert.equal(await seamBtn("Справа").getAttribute("aria-pressed"), "true", "H direction persists");
  assert.deepEqual(await readSeams(), rightSeams, "Right-edge layout persists after reload");
  await seamBtn("Симметрично").click();
  assert.equal(await page.getByRole("textbox", { name: "Высота фронтона", exact: true }).inputValue(), "3,5");
  assert.equal(await apexLeft.inputValue(), "2,50");
  assert.equal(await apexRight.inputValue(), "6,50");

  await field("Ширина основания", "1");
  assert.equal(await diagram.getAttribute("data-apex-offset"), "-0.5");
  await field("Высота фронтона", "-4");
  assert.equal(await diagram.getAttribute("data-gable-height"), "0.1");
  await field("Ширина основания", "6");
  await field("Высота фронтона", "2,4");
  await apexPanel.getByRole("button", { name: "По центру", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await diagram.scrollIntoViewIfNeeded();
  assert.ok(await diagram.isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "Mobile page does not overflow");
  await page.locator("#plan-panel-side1").screenshot({ path: `${output}/gable-mobile.png` });

  // --- Ломаный фронтон через блок «Тип фронтона» ---
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${url}/#/test`, { waitUntil: "domcontentloaded" });
  await page.locator("#calc").waitFor();
  const currentTopButtons = (await page.getByRole("group", { name: "Режим отображения" }).getByRole("button").allTextContents()).map((t) => t.trim());
  assert.deepEqual(currentTopButtons, ["Одна сторона", "3D"], "Top bar strictly contains only 'Одна сторона' and '3D'");

  await typeBtn("Ломаный фронтон").click();
  assert.equal(await diagram.getAttribute("data-facade-mode"), "broken-gable");
  assert.equal(await diagram.getAttribute("data-profile-points"), "5", "Профиль из пяти точек");
  assert.equal(await page.getByRole("textbox", { name: "Смещение вершины", exact: true }).count(), 0, "Top apex offset field removed on Broken gable");
  assert.equal(await typeBtn("Ломаный фронтон").getAttribute("aria-pressed"), "true", "Standalone broken gable shows «Ломаный фронтон» as the active type");
  assert.equal(await diagram.getAttribute("data-gable-shape"), "broken", "Standalone broken gable is broken");
  assert.equal(await apexLeft.inputValue(), "3,00", "Broken-gable left input shows 3,00");
  assert.equal(await apexRight.inputValue(), "3,00", "Broken-gable right input shows 3,00");
  const brokenGableSeams = await readSeams();
  assert.equal(await diagram.locator("g[data-h-seam] rect").count(), brokenGableSeams.length * 2, "Broken-gable H-profile rendered as hatched band");
  assert.equal(await diagram.locator("g[data-h-seam] line").count(), brokenGableSeams.length * 2, "Broken-gable H-profile has two dashed border lines per seam");
  assert.equal(await diagram.getAttribute("data-break-height"), "1.8");
  assert.equal(await diagram.getAttribute("data-break-inset"), "1");
  // Отдельный ломаный фронтон учитывает окно по умолчанию (1,2 × 1,4 = 1,68 м²): 11,4 − 1,68 = 9,72; двери нет
  assert.equal(await diagram.getAttribute("data-net-area"), "9.72");
  assert.equal(await page.getByText("Окна и двери", { exact: true }).count(), 0);
  assert.ok(await page.getByText("Окна", { exact: true }).first().isVisible(), "Standalone broken gable shows windows editor");
  assert.equal(await page.getByRole("button", { name: "Дверь", exact: true }).count(), 0, "Standalone broken gable has no door button");
  assert.equal(await diagram.locator('rect[stroke="#1f4f8a"]').count(), 1, "Standalone broken gable draws the window on the plan");
  for (const label of ["Ширина основания", "Высота фронтона", "Высота излома", "Отступ излома"]) {
    assert.ok(await page.getByRole("textbox", { name: label, exact: true }).isVisible(), `${label} поле видно`);
  }
  assert.ok(await apexLeft.isVisible(), "Слева до вершины видно");
  assert.ok(await apexRight.isVisible(), "Справа до вершины видно");
  assert.equal(await page.getByRole("group", { name: "Пропорции ломаного фронтона" }).count(), 0, "Standalone broken gable has no proportions block");
  assert.equal(await page.getByRole("group", { name: "Скаты ломаного фронтона" }).count(), 0, "Standalone broken gable has no slopes block");
  assert.equal(await page.getByText("J профиль по скатам:").count(), 0, "Slopes summary removed");
  assert.equal(await panelLegend().textContent(), "Тип фасада", "Standalone broken gable panel titled «Тип фасада»");
  await diagram.screenshot({ path: `${output}/broken-gable.png` });

  // Бегунки излома и предел смещения вершины
  const insetSlider = page.getByRole("slider", { name: "Отступ излома от края" });
  await insetSlider.focus();
  await page.keyboard.press("End");
  assert.equal(await diagram.getAttribute("data-break-inset"), "2.7");
  const apexSlider = page.getByRole("slider", { name: "Положение вершины относительно центра" });
  // Предел смещения: половина ширины минус отступ излома и зазор 0,05 м → 3 − 2,7 − 0,05 = 0,25
  assert.equal(await apexSlider.getAttribute("max"), "0.25", "Вершина ограничена изломами");
  await apexSlider.focus();
  await page.keyboard.press("End");
  assert.equal(await diagram.getAttribute("data-apex-offset"), "0.25");
  const heightSlider = page.getByRole("slider", { name: "Высота излома фронтона" });
  await heightSlider.focus();
  await page.keyboard.press("Home");
  assert.equal(await diagram.getAttribute("data-break-height"), "0.05");
  await field("Высота излома", "1,5");
  await field("Отступ излома", "1,2");
  assert.equal(await diagram.getAttribute("data-break-height"), "1.5");
  assert.equal(await diagram.getAttribute("data-break-inset"), "1.2");

  // Печать ломаного фронтона
  await page.getByRole("button", { name: "Печать", exact: true }).click();
  await page.waitForFunction(() => window.__printCalls === 1);
  assert.ok((await page.locator(".siding-print-root h1").textContent()).includes("Ломаный фронтон"));
  assert.ok((await page.locator(".siding-print-root .sp-subtitle").textContent()).includes("Излом"));
  await page.emulateMedia({ media: "print" });
  assert.ok(await page.locator(".siding-print-root svg[data-facade-mode='broken-gable']").isVisible());
  await page.locator(".siding-print-root").screenshot({ path: `${output}/broken-gable-print.png` });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { window.__printCalls = 0; });
  assert.equal(await page.locator(".siding-print-root").count(), 0);

  // Сохранение после перезагрузки
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#calc").waitFor();
  assert.equal(await mode("Одна сторона").getAttribute("aria-pressed"), "true");
  assert.equal(await typeBtn("Ломаный фронтон").getAttribute("aria-pressed"), "true");
  assert.equal(await page.getByRole("textbox", { name: "Высота излома", exact: true }).inputValue(), "1,5");
  assert.equal(await page.getByRole("textbox", { name: "Отступ излома", exact: true }).inputValue(), "1,2");

  // Мобильная ширина без горизонтальной прокрутки
  await page.setViewportSize({ width: 390, height: 844 });
  await diagram.scrollIntoViewIfNeeded();
  assert.ok(await diagram.isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "Broken gable fits mobile width");
  await page.locator("#plan-panel-side1").screenshot({ path: `${output}/broken-gable-mobile.png` });
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log("PASS: broken gable mode, break controls, presets, clamped apex, print, persistence, mobile");

  await page.goto(`${url}/#/siding`, { waitUntil: "domcontentloaded" });
  await page.locator("#calc").waitFor();
  assert.equal(await page.getByRole("group", { name: "Режим расчёта фасада" }).count(), 0);
  assert.equal(await page.getByRole("group", { name: "Смещение H профиля" }).count(), 0);
  assert.equal(await page.getByRole("textbox", { name: "Длина фасада", exact: true }).inputValue(), "8");
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log("PASS: four modes, adjustable gables, quantities, print, persistence, 3D, mobile, unchanged Siding page");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}