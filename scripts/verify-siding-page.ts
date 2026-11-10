import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SidingPage from "../src/pages/SidingPage";
import RoofPage from "../src/pages/RoofPage";
import RoofHero from "../src/components/RoofHero";
import Header from "../src/components/Header";
import { DEFAULT_SETTINGS, loadSettings } from "../src/data/siteSettings";

/* Локальное хранилище браузера, чтобы читать и подменять настройки в Node. */
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => void store.set(key, String(value)),
  removeItem: (key) => void store.delete(key),
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size;
  },
};

const SETTINGS_KEY = "site:blocks-settings";

const seed = (settings: unknown) => store.set(SETTINGS_KEY, JSON.stringify(settings));
const menuLabels = () => loadSettings().menu.map((item) => item.label);

test("the dropdown lists Кровля and the new Сайдинг page", () => {
  assert.deepEqual(
    DEFAULT_SETTINGS.menu.map((item) => item.label),
    ["Грильято", "Армстронг", "Кровля", "Сайдинг", "Тест", "Спецификация Материалов Тест"],
  );
  assert.equal(DEFAULT_SETTINGS.menu.find((item) => item.id === "m-siding")?.href, "#/siding");
  assert.equal(
    DEFAULT_SETTINGS.menu.some((item) => item.id === "m-admin" || item.href === "#/admin"),
    false,
    "the admin page must be hidden from the header dropdown",
  );
});

test("an already saved Администрирование item is hidden from the dropdown", () => {
  seed({
    menu: [
      { id: "m-grilyato", label: "Грильято", href: "#/grilyato", enabled: true },
      { id: "m-admin", label: "Администрирование", href: "#/admin", enabled: true },
      { id: "m-custom-admin", label: "Управление", href: "#/admin", enabled: true },
      { id: "m-test", label: "Тест", href: "#/test", enabled: true },
    ],
    knownMenuIds: [
      "m-grilyato",
      "m-armstrong",
      "m-roof",
      "m-siding",
      "m-test",
      "m-smeta-test",
      "m-admin",
    ],
  });
  assert.deepEqual(menuLabels(), ["Грильято", "Тест"]);
});

test("saved settings are renamed and receive the new page", () => {
  seed({
    ticker: { speed: 20, items: [{ id: "t1", text: "строка", enabled: true }] },
    menu: [
      { id: "m-grilyato", label: "Грильято", href: "#/grilyato", enabled: true },
      { id: "m-roof", label: "Раскладка Кровля", href: "#/roof", enabled: true },
      { id: "m-test", label: "Тест", href: "#/test", enabled: true },
      { id: "m-admin", label: "Администрирование", href: "#/admin", enabled: true },
    ],
  });
  const menu = loadSettings().menu;
  assert.deepEqual(
    menu.map((item) => item.label),
    ["Грильято", "Кровля", "Сайдинг", "Тест"],
  );
  assert.equal(menu[1].id, "m-roof");
  assert.equal(menu[2].href, "#/siding");
});

test("items removed by the administrator are not restored", () => {
  seed({
    menu: [
      { id: "m-grilyato", label: "Грильято", href: "#/grilyato", enabled: true },
      { id: "m-roof", label: "Кровля", href: "#/roof", enabled: true },
      { id: "m-siding", label: "Сайдинг", href: "#/siding", enabled: true },
    ],
    knownMenuIds: [
      "m-grilyato",
      "m-armstrong",
      "m-roof",
      "m-siding",
      "m-test",
      "m-smeta-test",
      "m-admin",
    ],
  });
  assert.deepEqual(menuLabels(), ["Грильято", "Кровля", "Сайдинг"]);
});

test("a custom label for the roof page is left untouched", () => {
  seed({
    menu: [
      { id: "m-roof", label: "Кровля и монтаж", href: "#/roof", enabled: true },
      { id: "m-siding", label: "Сайдинг", href: "#/siding", enabled: true },
    ],
    knownMenuIds: [
      "m-grilyato",
      "m-armstrong",
      "m-roof",
      "m-siding",
      "m-test",
      "m-smeta-test",
      "m-admin",
    ],
  });
  assert.deepEqual(menuLabels(), ["Кровля и монтаж", "Сайдинг"]);
});

test("the Сайдинг page keeps the Кровля layout and hosts the siding calculator", () => {
  const markup = renderToStaticMarkup(createElement(SidingPage));
  assert.ok(markup.includes("Обшивка"), "Hero heading");
  assert.ok(markup.includes("О сайдинге"), "Hero link to the system block");
  assert.ok(!markup.includes("О системе Сайдинг"), "Old hero link label is gone");
  assert.ok(!markup.includes("Печать и PDF в один лист"), "Smeta block is removed");
  assert.ok(!markup.includes("По Челябинску от 3-х дней"), "Delivery block is removed");
  assert.ok(markup.includes("Завершение сайдинга финишной планкой"), "Finish trim toggle label");
  assert.ok(!markup.includes("Финишная планка ставится по верху"), "Finish trim hint is removed");
  assert.ok(!markup.includes("border-pro/60 bg-pro/10"), "Finish trim toggle has no yellow effect");
  assert.ok(markup.includes('aria-label="Открыть план фасада на весь экран"'), "Facade plan zoom button");
  assert.ok(markup.includes("Расчёт ПВХ сайдинга"), "Siding calculator title");
  assert.ok(!markup.includes("Панель 3000 × 203 мм монтируется горизонтально без перехлёста"), "Intro paragraph is removed");
  assert.ok(!markup.includes("Площадь зашивки"), "Old sheathing area label is gone");
  assert.ok(markup.includes("Площадь обшивки"), "New sheathing area label above facade plan");
  assert.ok(markup.includes("Длина фасада"), "Siding calculator facade length");
  assert.ok(markup.includes("Из чего собирается фасад"), "Elements section");
  assert.ok(markup.includes("3000 × 203"), "Panel size from the elements catalogue");
  assert.ok(markup.includes('src="images/siding-hero.jpg"'), "Hero image");
  assert.ok(markup.includes('src="images/siding-detail.jpg"'), "Section image");
  assert.ok(markup.includes('id="features"'), "Anchor used by the header nav");
  assert.ok(markup.includes('id="calc"'), "Anchor used by hero and CTA buttons");
});

test("header and roof page use the new «О кровле» and «О сайдинге» labels", () => {
  const roofHeader = renderToStaticMarkup(createElement(Header, { route: "/roof" }));
  assert.ok(roofHeader.includes("О кровле"));
  assert.ok(!roofHeader.includes("О системе Кровля"));

  const sidingHeader = renderToStaticMarkup(createElement(Header, { route: "/siding" }));
  assert.ok(sidingHeader.includes("О сайдинге"));
  assert.ok(!sidingHeader.includes("О системе Сайдинг"));

  const roofHero = renderToStaticMarkup(createElement(RoofHero, { onStart: () => {} }));
  assert.ok(roofHero.includes("О кровле"));
  assert.ok(!roofHero.includes("О системе Кровля"));

  const roofPage = renderToStaticMarkup(createElement(RoofPage));
  assert.ok(roofPage.includes("Расчёт листов для кровли"));
  assert.ok(!roofPage.includes("Соберите свою кровлю"));
});
