import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SidingCalculator from "../src/components/SidingCalculator";
import { DEFAULT_SIDING, calcSiding, createOpening, openingLetter } from "../src/data/siding";
import { buildSidingPrintHtml } from "../src/utils/printSidingLayout";

const calc = calcSiding(DEFAULT_SIDING);
const markup = renderToStaticMarkup(createElement(SidingCalculator));
const svg = markup.match(/<svg[^>]*viewBox="0 0 680 \d+"[\s\S]*?<\/svg>/)?.[0];
assert.ok(svg, "The facade SVG must be present");
const groups = new Map(
  Array.from(svg.matchAll(/<g data-siding-piece="([^"]+)" data-row="\d+">([\s\S]*?)<\/g>/g),
    ([, label, content]) => [label, content] as const),
);

test("the plan renders every calculated blank, including notched boundary panels", () => {
  assert.equal(groups.size, calc.pieces.length);
  for (const piece of calc.pieces) {
    const group = groups.get(piece.label);
    assert.ok(group, `Missing piece ${piece.label}`);
    assert.match(group, /<rect /);
    assert.ok(group.includes(String(piece.lenMm)));
  }
});

test("boundary panel numbers remain on exposed siding, not inside windows or doors", () => {
  const length = calc.L / 1000;
  const height = calc.H / 1000;
  const scale = Math.min(612 / length, 398 / height);
  const ox = 52 + (612 - length * scale) / 2;
  const bottom = 18 + (398 - height * scale) / 2 + height * scale;
  const boundaryPieces = calc.pieces.filter((piece) =>
    ([4, 11].includes(piece.row) && piece.x0 === 0 && piece.x1 === 3000) ||
    (piece.row === 10 && piece.x0 >= 3000),
  );
  assert.equal(boundaryPieces.length, 4);

  for (const piece of boundaryPieces) {
    const group = groups.get(piece.label)!;
    const label = group.match(/<text x="([^"]+)" y="([^"]+)"[^>]*>([^<]+)<\/text>/);
    assert.ok(label, `Missing visible label ${piece.label}`);
    assert.equal(label[3], piece.label);
    const x = (Number(label[1]) - ox) / scale;
    const y = (bottom - (Number(label[2]) - 3)) / scale;
    assert.ok(x >= piece.x0 / 1000 && x <= piece.x1 / 1000);
    for (const opening of calc.openings) {
      assert.ok(
        x < opening.x || x > opening.x + opening.width ||
        y < opening.y || y > opening.y + opening.height,
        `Label ${piece.label} is hidden by an opening`,
      );
    }
  }
});

test("the print document receives the corrected plan and purchase quantity", () => {
  const html = buildSidingPrintHtml(calc, svg);
  assert.ok(html.includes(svg));
  assert.match(html, new RegExp(`<strong>${calc.panels} `));
  assert.ok(html.includes('<title></title>'));
  assert.ok(html.includes("size: A4 landscape; margin: 0"));
});

test("the plan shows only opening letters, without sizes or position dimensions", () => {
  const decimal = (value: number) => value.toFixed(2).replace(".", ",");

  for (const opening of calc.openings) {
    const sizeText = `${decimal(opening.width)}×${decimal(opening.height)}`;
    assert.ok(!svg.includes(sizeText), `Size ${sizeText} must not be drawn on the plan`);
    for (const value of [opening.x, opening.y]) {
      assert.ok(
        !new RegExp(`>${decimal(value)} ?м<`).test(svg),
        `Position ${decimal(value)} м must not be drawn on the plan`,
      );
    }
  }

  assert.match(svg, /длина \d/, "Facade length dimension stays on the plan");
  assert.match(svg, /высота \d/, "Facade height dimension stays on the plan");
  assert.ok(!svg.includes("цепочка"), "Opening dimension chains are removed");
  for (const [index] of calc.openings.entries()) {
    assert.match(svg, new RegExp(`>${openingLetter(index)}</text>`), `Letter ${openingLetter(index)} stays on the plan`);
  }
});

test("new openings use the required sizes and centring", () => {
  const window = createOpening("window", 8, 3);
  assert.equal(window.width, 1);
  assert.equal(window.height, 1);
  assert.equal(window.x, 3.5);
  assert.equal(window.y, 1);

  const door = createOpening("door", 8, 3);
  assert.equal(door.width, 0.9);
  assert.equal(door.height, 2.1);
  assert.equal(door.x, 3.55);
  assert.equal(door.y, 0);

  assert.equal(createOpening("window", 0.6, 0.4).x, 0);
  assert.deepEqual(
    (() => { const small = createOpening("door", 0.6, 1); return { width: small.width, y: small.y }; })(),
    { width: 0.6, y: 0 },
  );
});

test("the editor has no window or door switching buttons", () => {
  assert.equal(
    markup.match(/aria-label="Удалить проём /g)?.length ?? 0,
    DEFAULT_SIDING.openings.length,
  );
  // only the two «add» buttons may carry window or door labels
  assert.equal(markup.match(/<\/svg>(?:Окно|Дверь)<\/button>/g)?.length ?? 0, 2);
  // the kind is now a plain badge, not a switch
  assert.equal(markup.match(/(?:Окно|Дверь)<\/span>/g)?.length ?? 0, DEFAULT_SIDING.openings.length);
});

test("element selection buttons use white text instead of yellow", () => {
  assert.ok(!markup.includes("bg-graphite text-pro"), "Selection buttons must not use yellow text");
  for (const label of ["J профиль", "Внутр. угол", "Наруж. угол", "Околооконная + финиш"]) {
    assert.ok(markup.includes(label), `Missing selection button ${label}`);
  }
  const activeButtons = markup.match(/bg-graphite text-white[^\"]*/g) ?? [];
  assert.ok(activeButtons.length >= 3, "Selection buttons must render with white active text");
});