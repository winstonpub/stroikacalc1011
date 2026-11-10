import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ArmstrongPage from "../src/pages/ArmstrongPage";
import MainPage from "../src/pages/MainPage";
import RoofHero from "../src/components/RoofHero";
import SidingHero from "../src/components/SidingHero";
import SidingSections from "../src/components/SidingSections";
import { getChelyabinskDeliveryDay } from "../src/utils/delivery";

const cases = [
  ["2026-06-15T00:00:00.000Z", "Сегодня"],
  ["2026-06-15T10:59:59.999Z", "Сегодня"],
  ["2026-06-15T11:00:00.000Z", "Завтра"],
  ["2026-06-15T11:00:00.001Z", "Завтра"],
  ["2026-06-15T18:59:59.999Z", "Завтра"],
  ["2026-06-15T19:00:00.000Z", "Сегодня"],
  ["2026-12-31T19:00:00.000Z", "Сегодня"],
  ["2026-01-15T10:59:59.999Z", "Сегодня"],
  ["2026-01-15T11:00:00.000Z", "Завтра"],
] as const;

for (const [instant, expected] of cases) {
  test(`Chelyabinsk delivery at ${instant} is ${expected}`, () => {
    assert.equal(getChelyabinskDeliveryDay(new Date(instant)), expected);
  });
}

test("delivery does not depend on the visitor's timezone", () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ["UTC", "Europe/Moscow", "America/New_York", "Asia/Tokyo"]) {
      process.env.TZ = zone;
      assert.equal(getChelyabinskDeliveryDay(new Date("2026-06-15T10:59:00Z")), "Сегодня");
      assert.equal(getChelyabinskDeliveryDay(new Date("2026-06-15T11:00:00Z")), "Завтра");
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

function atTime(instant: string, run: () => void) {
  const OriginalDate = globalThis.Date;
  const time = OriginalDate.parse(instant);
  globalThis.Date = class extends OriginalDate {
    constructor(value?: string | number) {
      super(value === undefined ? time : value);
    }
    static now() { return time; }
  } as DateConstructor;
  try {
    run();
  } finally {
    globalThis.Date = OriginalDate;
  }
}

test("all three hero blocks show the time-dependent delivery label", () => {
  for (const [instant, expected] of [cases[1], cases[2], cases[5]]) {
    atTime(instant, () => {
      const heroes = [
        createElement(ArmstrongPage),
        createElement(RoofHero, { onStart: () => {} }),
        createElement(SidingHero, { onStart: () => {} }),
      ];
      for (const hero of heroes) {
        const markup = renderToStaticMarkup(hero).match(/<section\b[\s\S]*?<\/section>/)?.[0];
        assert.ok(markup);
        const text = markup.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
        assert.ok(text.includes(`${expected} доставка по Челябинску`));
        assert.ok(!text.includes("от 3-х дней"));
      }
    });
  }
});

test("the homepage offers four matching calculator cards, including siding", () => {
  const markup = renderToStaticMarkup(createElement(MainPage));
  const catalog = markup.match(/<section id="systems"[\s\S]*?<\/section>/)?.[0];
  assert.ok(catalog);
  assert.ok(!catalog.includes("Раскладка Кровля"));
  const cards = Array.from(catalog.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/g));
  assert.equal(cards.length, 4);

  for (const [route, name] of [
    ["grilyato", "Грильято"],
    ["armstrong", "Армстронг"],
    ["roof", "Кровля"],
    ["siding", "Сайдинг"],
  ]) {
    const card = cards.find(([, attributes]) => attributes.includes(`href="#/${route}"`));
    assert.ok(card, `Missing card for ${route}`);
    assert.match(card[2], new RegExp(`<h3[^>]*>${name}</h3>`));
    assert.ok(card[2].includes("Открыть калькулятор"));
  }
  assert.ok(catalog.includes('src="images/siding-hero.jpg"'));
  assert.ok(existsSync("public/images/siding-hero.jpg"));
});

test("homepage cards drop the availability badge and share one aligned row grid", () => {
  const markup = renderToStaticMarkup(createElement(MainPage));
  const catalog = markup.match(/<section id="systems"[\s\S]*?<\/section>/)?.[0];
  assert.ok(catalog);
  assert.ok(!catalog.includes("Калькулятор доступен"));

  const cards = Array.from(catalog.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/g));
  assert.equal(cards.length, 4);
  // every card uses the same explicit row template, so icons, eyebrows,
  // headings, descriptions and tags line up across the row
  for (const [, , body] of cards) {
    assert.ok(body.includes("grid-rows-[auto_auto_auto_minmax(6.5rem,1fr)_auto_auto]"));
    assert.ok(!body.includes("justify-end"));
    assert.ok(body.includes("self-end"));
  }
});

test("roof and siding cards use roof-house and panel-rows icons", () => {
  const markup = renderToStaticMarkup(createElement(MainPage));
  const cardFor = (route: string) =>
    Array.from(markup.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/g)).find(([, attributes]) =>
      attributes.includes(`href="#/${route}"`),
    )?.[2] ?? "";
  // lucide marks every icon with its kebab-case name
  assert.ok(cardFor("roof").includes("lucide-house"));
  assert.ok(cardFor("siding").includes("lucide-rows-3"));
  assert.ok(!cardFor("roof").includes("lucide-layers-3"));
  assert.ok(!cardFor("siding").includes("lucide-layers "));
});

test("the Armstrong hero has the system link next to the calculator button", () => {
  const markup = renderToStaticMarkup(createElement(ArmstrongPage));
  const hero = markup.match(/<section\b[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.ok(hero.includes("Калькулятор"));
  assert.ok(hero.includes('href="#/armstrong#features"'));
  assert.ok(hero.includes("О системе Армстронг"));
  // same secondary-button styling as the Grilyato hero
  assert.ok(hero.includes("border border-white/20"));
  // the anchor exists on the page
  assert.ok(markup.includes('id="features"'));
});

test("the siding section is renamed and the redundant promotional block is removed", () => {
  const markup = renderToStaticMarkup(createElement(SidingSections));
  const section = markup.match(/<section id="features"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /<div[^>]*>Сайдинг<\/div>/);
  assert.ok(!section.includes("Система Сайдинг"));
  assert.ok(!section.includes("Точный расчёт без переплат"));
  assert.ok(!section.includes("К калькулятору сайдинга"));
  assert.ok(section.includes("Из чего собирается фасад"));
});