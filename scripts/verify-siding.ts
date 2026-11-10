import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SIDING,
  SIDING_ELEMENTS,
  calcSiding,
  getVisibleSidingRects,
  rowSegments,
  type FacadeOpening,
  type SidingInput,
} from "../src/data/siding";

const panelLength = SIDING_ELEMENTS.panel.length;
const panelHeight = SIDING_ELEMENTS.panel.height;
const opening = (changes: Partial<FacadeOpening> = {}): FacadeOpening => ({
  id: "opening-a",
  kind: "window",
  trim: "j",
  width: 1.2,
  height: 1.4,
  x: 0.9,
  y: 0.9,
  ...changes,
});
const facade = (changes: Partial<SidingInput> = {}): SidingInput => ({
  ...DEFAULT_SIDING,
  facadeLength: 3,
  facadeHeight: 3,
  openings: [],
  ...changes,
});

test("partial window overlap keeps the complete blank below and above the window", () => {
  const openings = [opening()];
  assert.deepEqual(rowSegments(3000, 812, 1015, openings), [[0, 3000]]);
  assert.deepEqual(rowSegments(3000, 2233, 2436, openings), [[0, 3000]]);
  assert.deepEqual(rowSegments(3000, 1015, 1218, openings), [[0, 900], [2100, 3000]]);
});

test("a door removes full rows but not the partially intersected row above it", () => {
  const openings = [opening({ kind: "door", y: 0, height: 2.1 })];
  assert.deepEqual(rowSegments(3000, 1827, 2030, openings), [[0, 900], [2100, 3000]]);
  assert.deepEqual(rowSegments(3000, 2030, 2233, openings), [[0, 3000]]);
});

test("an opening wholly inside one row still needs the complete panel", () => {
  assert.deepEqual(
    rowSegments(3000, 812, 1015, [opening({ y: 0.85, height: 0.1 })]),
    [[0, 3000]],
  );
});

test("opening edges exactly on row boundaries do not create extra panels", () => {
  const door = opening({ kind: "door", y: 0, height: 2.03 });
  assert.deepEqual(rowSegments(3000, 1827, 2030, [door]), [[0, 900], [2100, 3000]]);
  assert.deepEqual(rowSegments(3000, 2030, 2233, [door]), [[0, 3000]]);

  const window = opening({ y: 2.03, height: 0.5 });
  assert.deepEqual(rowSegments(3000, 1827, 2030, [window]), [[0, 3000]]);
  assert.deepEqual(rowSegments(3000, 2030, 2233, [window]), [[0, 900], [2100, 3000]]);
});

test("the last shortened row is omitted only when fully covered to the facade top", () => {
  assert.deepEqual(
    rowSegments(3000, 2842, 3000, [opening({ y: 2.5, height: 0.5 })]),
    [[0, 900], [2100, 3000]],
  );
  assert.deepEqual(
    rowSegments(3000, 2842, 3000, [opening({ y: 2.5, height: 0.49 })]),
    [[0, 3000]],
  );
});

test("a full-width window keeps both notched boundary panels in the purchase count", () => {
  const result = calcSiding(facade({ openings: [opening({ x: 0, width: 3 })] }));
  assert.equal(result.rows, 15);
  assert.equal(result.panels, 9); // round(9 * 1.05) = 9
  assert.deepEqual(result.pieces.map((piece) => piece.row), [0, 1, 2, 3, 4, 11, 12, 13, 14]);
  assert.equal(result.cutLengthMm, 9 * panelLength);
  assert.ok(result.pieces.every((piece) => piece.lenMm === panelLength));
});

test("a full-width door keeps the panel immediately above the opening", () => {
  const result = calcSiding(facade({
    openings: [opening({ kind: "door", x: 0, y: 0, width: 3, height: 2.1 })],
  }));
  assert.equal(result.panels, 5); // round(5 * 1.05) = 5
  assert.deepEqual(result.pieces.map((piece) => piece.row), [10, 11, 12, 13, 14]);
});

test("partial overlaps crossing an H joint retain the full blanks on both sides", () => {
  const result = calcSiding(facade({
    facadeLength: 6,
    openings: [opening({ x: 2.5, width: 1 })],
  }));
  for (const row of [4, 11]) {
    assert.deepEqual(
      result.pieces.filter((piece) => piece.row === row).map(({ x0, x1 }) => [x0, x1]),
      [[0, 3000], [3000, 6000]],
    );
  }
  assert.deepEqual(
    result.pieces.filter((piece) => piece.row === 5).map(({ x0, x1 }) => [x0, x1]),
    [[0, 2500], [3500, 6000]],
  );
  assert.equal(result.hLengthMm, 1600);
});

test("each opening is checked independently within a shared row", () => {
  assert.deepEqual(rowSegments(6000, 812, 1015, [
    opening({ x: 0.5, width: 1, y: 0.9 }),
    opening({ id: "opening-b", kind: "door", x: 4, width: 1, y: 0, height: 2.1 }),
  ]), [[0, 4000], [5000, 6000]]);
});

test("full-height openings still exclude siding and H profiles", () => {
  const result = calcSiding(facade({
    facadeLength: 6,
    openings: [opening({ x: 2, width: 2, y: 0, height: 3 })],
  }));
  assert.equal(result.hLengthMm, 0);
  assert.equal(result.table.find((row) => row.key === "h")?.qty, 0);
  assert.ok(result.pieces.every((piece) => piece.x1 <= 2000 || piece.x0 >= 4000));
});

test("default window and door boundary rows are accounted for and offcuts remain reusable", () => {
  const result = calcSiding(DEFAULT_SIDING);
  for (const row of [4, 11]) {
    assert.ok(result.pieces.some((piece) => piece.row === row && piece.x0 === 0 && piece.x1 === 3000));
  }
  for (const [x0, x1] of [[3000, 6000], [6000, 8000]]) {
    assert.ok(result.pieces.some((piece) => piece.row === 10 && piece.x0 === x0 && piece.x1 === x1));
  }
  assert.ok(result.panelPlan.some((panel) => panel.items.length > 1));
  assert.ok(result.panels < result.pieces.length);
  assert.equal(result.table.find((row) => row.key === "panel")?.qty, result.panels);
  assert.equal(result.pieces.reduce((sum, piece) => sum + piece.lenMm, 0), result.cutLengthMm);

  for (const panel of result.panelPlan) {
    assert.equal(panel.items.reduce((sum, piece) => sum + piece.lenMm, 0), panel.usedMm);
    assert.equal(panel.usedMm + panel.wasteMm, panelLength);
    assert.ok(panel.wasteMm >= 0);
    assert.ok(panel.items.every((piece) => piece.panel === panel.panel));
  }
});

test("unperforated facade uses 32 panels for 6 by 3 metres with 5% spare", () => {
  const result = calcSiding(facade({ facadeLength: 6, sparePct: 5 }));
  assert.equal(result.rows, Math.ceil(3000 / panelHeight));
  assert.equal(result.panels, 32); // 30 blanks + 5% spare
  assert.equal(result.hLengthMm, 3000);
});

test("spare 0 keeps the base purchase counts", () => {
  const result = calcSiding(facade({ facadeLength: 6, sparePct: 0 }));
  assert.equal(result.sparePct, 0);
  assert.equal(result.panels, 30);
  assert.equal(result.table.find((row) => row.key === "start")?.qty, 2);
  assert.equal(result.table.find((row) => row.key === "h")?.qty, 1);
  assert.equal(result.table.find((row) => row.key === "finish")?.qty, 2);
});

test("spare is calculated as a true percentage, not added piece-by-piece", () => {
  const r1 = calcSiding(facade({ facadeLength: 6, sparePct: 1 }));
  assert.equal(r1.panels, 30); // round(30 * 1.01) = 30, not +1 piece
  assert.equal(r1.table.find((row) => row.key === "start")?.qty, 2);
  assert.equal(r1.table.find((row) => row.key === "h")?.qty, 1);
  assert.equal(r1.table.find((row) => row.key === "finish")?.qty, 2);
  assert.equal(r1.table.find((row) => row.key === "outer")?.qty, 2);

  const r10 = calcSiding(facade({ facadeLength: 6, sparePct: 10 }));
  assert.equal(r10.sparePct, 10);
  assert.equal(r10.panels, 33); // 30 + 10% = 33
  assert.equal(r10.table.find((row) => row.key === "start")?.qty, 2); // round(2 * 1.1) = 2
  assert.equal(r10.table.find((row) => row.key === "outer")?.qty, 2); // round(2 * 1.1) = 2

  const r25 = calcSiding(facade({ facadeLength: 6, sparePct: 25 }));
  assert.equal(r25.panels, 38); // round(30 * 1.25) = 38
  assert.equal(r25.table.find((row) => row.key === "start")?.qty, 3); // round(2 * 1.25) = 3
  assert.equal(r25.table.find((row) => row.key === "finish")?.qty, 3); // round(2 * 1.25) = 3
  assert.equal(r25.table.find((row) => row.key === "outer")?.qty, 3); // round(2 * 1.25) = 3

  // exact floating-point test: 100 panels + 10% must be 110, not 111
  const r100 = calcSiding(facade({ facadeLength: 10, facadeHeight: 6, sparePct: 10 }));
  assert.equal(r100.panels, 110);
});

test("spare above 50% is clamped", () => {
  const result = calcSiding(facade({ facadeLength: 6, sparePct: 200 }));
  assert.equal(result.sparePct, 50);
  assert.equal(result.panels, 45); // ceil(30 * 1.5)
});

test("the plan retains the strips below and above a full-width window", () => {
  const openings = [opening({ x: 0, width: 3 })];
  assert.deepEqual(getVisibleSidingRects({ row: 4, x0: 0, x1: 3000 }, 3000, openings), [
    { x0: 0, x1: 3000, y0: 812, y1: 900 },
  ]);
  assert.deepEqual(getVisibleSidingRects({ row: 11, x0: 0, x1: 3000 }, 3000, openings), [
    { x0: 0, x1: 3000, y0: 2300, y1: 2436 },
  ]);
});

test("the plan retains the strip immediately above a full-width door", () => {
  assert.deepEqual(getVisibleSidingRects({ row: 10, x0: 0, x1: 3000 }, 3000, [
    opening({ kind: "door", x: 0, y: 0, width: 3, height: 2.1 }),
  ]), [{ x0: 0, x1: 3000, y0: 2100, y1: 2233 }]);
});

test("visible pieces cover the entire facade outside openings without gaps or stock reuse errors", () => {
  const cases = [
    DEFAULT_SIDING,
    facade({ openings: [opening()] }),
    facade({ openings: [opening({ x: 0, width: 3 })] }),
    facade({ openings: [opening({ kind: "door", x: 0, y: 0, width: 3, height: 2.1 })] }),
    facade({ openings: [opening({ x: 0, y: 2.5, width: 3, height: 0.49 })] }),
    facade({ facadeLength: 6, openings: [opening({ x: 2.5, width: 1 })] }),
    facade({ facadeHeight: 0.2, openings: [opening({ height: 0.1, y: 0.05 })] }),
  ];

  for (const input of cases) {
    const result = calcSiding(input);
    const rectangles = result.pieces.flatMap((piece) => getVisibleSidingRects(piece, result.H, result.openings));
    const area = rectangles.reduce((sum, rect) => sum + (rect.x1 - rect.x0) * (rect.y1 - rect.y0), 0);
    const mm = (metres: number) => Math.round(metres * 1000);
    const openingsArea = result.openings.reduce((sum, o) => sum + mm(o.width) * mm(o.height), 0);
    assert.equal(area, result.L * result.H - openingsArea);
    assert.ok(result.panels * panelLength * panelHeight >= area);

    for (const rect of rectangles) {
      assert.ok(rect.x1 > rect.x0 && rect.y1 > rect.y0);
      assert.ok(rect.x0 >= 0 && rect.x1 <= result.L && rect.y0 >= 0 && rect.y1 <= result.H);
      for (const o of result.openings) {
        assert.ok(
          rect.x1 <= mm(o.x) || rect.x0 >= mm(o.x) + mm(o.width) ||
          rect.y1 <= mm(o.y) || rect.y0 >= mm(o.y) + mm(o.height),
        );
      }
    }
  }
});