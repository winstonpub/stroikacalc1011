import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SIDING,
  SIDING_TRIM_ROW_KEYS,
  calcSiding,
  getAvailableSidingColors,
  getSidingColor,
  getSidingPanelColor,
  getUnifiedSidingColors,
  normalizeTrimColors,
  type SidingTrimPart,
} from "../src/data/siding";
import { getSidingProduct, SIDING_PRODUCTS, type SidingProductPart } from "../src/data/sidingCatalog";
import { SNAPSHOT_PRICES, parsePriceCsv } from "../src/data/prices";

const expected: Record<SidingProductPart, Record<string, string>> = {
  panel: { white: "89407609", gray: "89407612", ivory: "89407616", vanilla: "89407617", green: "89407615" },
  start: { white: "89407965" },
  hProfile: { white: "89407951", gray: "89407952", ivory: "89407970", vanilla: "89407973", green: "89407958", brown: "89407956" },
  finish: { white: "89407961", ivory: "89407957", brown: "89407964" },
  jProfile: { white: "89407945", gray: "89407959", ivory: "89407969", vanilla: "89407972", green: "89407949", brown: "89407955" },
  innerCorner: { white: "89407960", ivory: "89407968", brown: "89407947" },
  outerCorner: { white: "89407944", gray: "89407950", ivory: "89407967", vanilla: "89407971", green: "89407974", brown: "89407946" },
  jamb: { white: "89407962", brown: "89407963" },
};

test("all 31 requested product variants map to the correct articles and specification rows", () => {
  let count = 0;
  for (const part of Object.keys(expected) as SidingProductPart[]) {
    assert.deepEqual(Object.keys(SIDING_PRODUCTS[part]).sort(), Object.keys(expected[part]).sort());
    for (const [colorId, art] of Object.entries(expected[part])) {
      const product = getSidingProduct(part, colorId);
      assert.ok(product, `${part}/${colorId}`);
      assert.equal(product.art, art);
      assert.ok(product.name.includes("MONLID"));
      const input = {
        ...DEFAULT_SIDING,
        singleColor: false,
        colorId: part === "panel" ? colorId : "white",
        trimColors: part === "panel" ? DEFAULT_SIDING.trimColors : { ...DEFAULT_SIDING.trimColors, [part]: colorId },
      };
      const rowKey = part === "panel" ? "panel" : part === "start" ? "start" : SIDING_TRIM_ROW_KEYS[part as SidingTrimPart];
      const row = calcSiding(input).table.find((entry) => entry.key === rowKey);
      assert.equal(row?.art, art, `${part}/${colorId}`);
      assert.equal(row?.name, product.name, `${part}/${colorId}`);
      count++;
    }
  }
  assert.equal(count, 32);
});

test("each item offers only its requested colors", () => {
  for (const part of Object.keys(expected) as SidingProductPart[]) {
    assert.deepEqual(getAvailableSidingColors(part).map((color) => color.id).sort(), Object.keys(expected[part]).sort());
  }
  assert.equal(getSidingProduct("panel", "brown"), undefined);
  assert.equal(getSidingProduct("jamb", "ivory"), undefined);
  assert.equal(getSidingProduct("finish", "green"), undefined);
});

test("old ivory selections remain beige; unsupported saved options safely fall back to white", () => {
  assert.equal(getSidingColor("ivory").name, "Бежевый");
  assert.equal(getSidingColor("beige").id, "ivory");
  assert.equal(getSidingPanelColor("brown").id, "white");
  const colors = normalizeTrimColors({ hProfile: "ivory", finish: "green", jamb: "brown", innerCorner: "vanilla" });
  assert.equal(colors.hProfile, "ivory");
  assert.equal(colors.finish, "white");
  assert.equal(colors.jamb, "brown");
  assert.equal(colors.innerCorner, "white");
});

test("single-color choices are shared by every material actually required by the calculation", () => {
  const defaultRows = calcSiding(DEFAULT_SIDING).table;
  assert.deepEqual(getUnifiedSidingColors(defaultRows).map((color) => color.id), ["white"]);

  const noJambOrFinish = {
    ...DEFAULT_SIDING,
    straightTop: false,
    openings: DEFAULT_SIDING.openings.map((opening) => ({ ...opening, trim: "j" as const })),
  };
  const options = getUnifiedSidingColors(calcSiding(noJambOrFinish).table).map((color) => color.id);
  assert.deepEqual(options, ["white", "gray", "ivory", "vanilla", "green"]);
  const rows = calcSiding({ ...noJambOrFinish, singleColor: true, colorId: "vanilla" }).table;
  assert.ok(rows.filter((row) => row.key !== "start" && row.qty > 0 && row.colorName).every((row) => row.colorName === "Ваниль"));
  assert.equal(rows.find((row) => row.key === "start")?.art, "89407965");
});

test("verified sheet prices provide fallback values without inventing missing jamb prices", () => {
  const supplied = Object.values(expected).flatMap((colors) => Object.values(colors));
  assert.equal(supplied.filter((art) => SNAPSHOT_PRICES[art] !== undefined).length, 29);
  assert.equal(SNAPSHOT_PRICES["89407962"], undefined);
  assert.equal(SNAPSHOT_PRICES["89407963"], undefined);
  assert.equal(SNAPSHOT_PRICES["89407609"].price, 256);
  assert.equal(SNAPSHOT_PRICES["89407970"].price, 1580);
  const fresh = parsePriceCsv('"89407962","710","https://example.com/white"\n"89407963","950","https://example.com/brown"');
  assert.equal(fresh["89407962"].price, 710);
  assert.equal(fresh["89407963"].price, 950);
});
