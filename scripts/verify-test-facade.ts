import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SIDING,
  SIDING_ELEMENTS,
  calcSiding,
  openingPerimeterMm,
  type FacadeOpening,
  type SidingInput,
} from "../src/data/siding";
import {
  BROKEN_GABLE_PRESETS,
  DEFAULT_TEST_FACADE,
  GABLE_TYPE_OPTIONS,
  H_PROFILE_PLACEMENTS,
  TEST_FACADE_MODES,
  applyGableType,
  calcTestFacade,
  getGableGeometry,
  getGableType,
  getSeamRule,
  gableSpanAtHeight,
  gableHeightAtX,
  maxBrokenApexOffset,
  maxBrokenInset,
  resolveSeamPositions,
  sanitizeTestFacade,
  withStandardFacadeColors,
  type BrokenGableParameters,
  type GableGeometry,
  type GableType,
  type HProfilePlacement,
  type TestFacadeMode,
} from "../src/data/testFacade";

const input: SidingInput = { ...DEFAULT_SIDING, facadeLength: 8, facadeHeight: 3, sparePct: 0, openings: [] };
const jambWindow = (changes: Partial<FacadeOpening> = {}): FacadeOpening => ({
  id: "jamb-window",
  kind: "window",
  trim: "jamb",
  width: 1.2,
  height: 1.4,
  x: 2,
  y: 0.9,
  ...changes,
});
const geometry = (mode: Exclude<TestFacadeMode, "side">, changes: { width?: number; height?: number; apexOffset?: number } = {}) =>
  getGableGeometry(input, sanitizeTestFacade({
    mode,
    sideGable: changes,
    gable: changes,
  }))!;

test("one side follows the standard calculator when the 3 m grid is the cheapest layout", () => {
  const settings = sanitizeTestFacade({ mode: "side-gable", sideGable: { shape: "none" } });
  assert.equal(getGableGeometry(DEFAULT_SIDING, settings), null);
  for (const facadeLength of [3, 6, 9, 12]) {
    const plain = { ...DEFAULT_SIDING, facadeLength, facadeHeight: 3, sparePct: 0, openings: [] };
    assert.deepEqual(calcTestFacade(plain, null, "optimal"), calcSiding(plain));
  }
});

test("standard facade colors: beige siding, brown trims, J profile at every opening", () => {
  const before = JSON.stringify(DEFAULT_SIDING);
  const result = withStandardFacadeColors(DEFAULT_SIDING);
  assert.equal(result.colorId, "ivory", "Сайдинг бежевый");
  for (const part of ["hProfile", "finish", "jamb", "jProfile", "innerCorner", "outerCorner"] as const) {
    assert.equal(result.trimColors?.[part], "brown", `${part}: коричневый`);
  }
  assert.ok(result.openings.length > 0, "проёмы сохранены");
  assert.ok(result.openings.every((opening) => opening.trim === "j"), "окно и дверь получили J профиль");
  assert.deepEqual(
    result.openings.map((opening) => [opening.id, opening.width, opening.height, opening.x, opening.y]),
    DEFAULT_SIDING.openings.map((opening) => [opening.id, opening.width, opening.height, opening.x, opening.y]),
    "размеры и положение проёмов не меняются",
  );
  assert.equal(result.singleColor, false);
  assert.equal(JSON.stringify(DEFAULT_SIDING), before, "исходный ввод не мутируется");
  const priced = calcSiding(result);
  assert.equal(priced.table.find((item) => item.key === "jamb")?.qty, 0, "околооконная планка больше не нужна");
  assert.ok(priced.table.find((item) => item.key === "j")!.qty > 0, "J профиль закрывает оба проёма");
  assert.equal(priced.table.find((item) => item.key === "panel")?.colorName, "Бежевый");
  assert.equal(priced.table.find((item) => item.key === "finish")?.colorName, "Коричневый");
});

test("profitable placement never buys more panels than the standard grid", () => {
  for (const facadeLength of [4, 5, 7, 8, 10, 11, 13]) {
    for (const sparePct of [0, 5]) {
      const input = { ...DEFAULT_SIDING, facadeLength, sparePct };
      const standard = calcSiding(input);
      const profitable = calcTestFacade(input, null, "optimal");
      assert.ok(profitable.panels <= standard.panels, `${facadeLength} м: ${profitable.panels} <= ${standard.panels}`);
      assert.ok(profitable.wasteArea <= standard.wasteArea);
    }
  }
});

test("symmetric placement mirrors seams around the center", () => {
  for (const facadeLength of [3.5, 4, 5, 7, 8, 10, 11]) {
    const L = Math.round(facadeLength * 1000);
    const seams = getSeamRule(L, "symmetric");
    assert.deepEqual(seams, [...seams].reverse().map((s) => L - s));
    const edges = [seams[0], ...seams.slice(1).map((s, i) => s - seams[i]), L - seams[seams.length - 1]];
    assert.ok(edges.every((segment) => segment > 0 && segment <= SIDING_ELEMENTS.panel.length));
  }
  assert.deepEqual(getSeamRule(3000, "symmetric"), []);
  assert.deepEqual(getSeamRule(2000, "optimal"), []);
  assert.deepEqual(getSeamRule(3001, "optimal"), [3000]);
});

test("H buttons are four independent modes, exactly one active", () => {
  assert.deepEqual(H_PROFILE_PLACEMENTS.map((item) => item.id), ["optimal", "symmetric", "left", "right"]);
  assert.deepEqual(H_PROFILE_PLACEMENTS.map((item) => item.label), ["Самый выгодный", "Симметрично", "Слева", "Справа"]);
  assert.deepEqual(getSeamRule(8000, "left"), [3000, 6000]);
  assert.deepEqual(getSeamRule(8000, "right"), [2000, 5000]);
  assert.deepEqual(getSeamRule(7000, "right"), [1000, 4000]);
  assert.deepEqual(getSeamRule(6000, "right"), [3000]);
  assert.deepEqual(getSeamRule(3000, "right"), []);
  assert.deepEqual(getSeamRule(3000, "left"), []);
  assert.deepEqual(getSeamRule(8000, "optimal"), [3000, 6000], "«Самый выгодный» стартует с той же сетки, что «Слева»");

  assert.equal(sanitizeTestFacade({}).hPlacement, "optimal", "По умолчанию — Самый выгодный");
  assert.equal(sanitizeTestFacade({ hPlacement: "right" }).hPlacement, "right");
  assert.equal(sanitizeTestFacade({ hPlacement: "bogus" }).hPlacement, "optimal");
  // Миграция старого формата (placement + align): optimal+right → «Справа», остальное → «Самый выгодный»/«Симметрично»
  assert.equal(sanitizeTestFacade({ hPlacement: "optimal", hAlign: "right" } as never).hPlacement, "right");
  assert.equal(sanitizeTestFacade({ hPlacement: "optimal", hAlign: "left" } as never).hPlacement, "optimal");
  assert.equal(sanitizeTestFacade({ hPlacement: "symmetric", hAlign: "right" } as never).hPlacement, "symmetric");

  // Подрезка уходит к противоположному от старта краю
  const wall8 = { ...DEFAULT_SIDING, facadeLength: 8, facadeHeight: 3, sparePct: 0, openings: [] };
  const leftResult = calcTestFacade(wall8, null, "left", resolveSeamPositions(wall8, null, "left"));
  const rightResult = calcTestFacade(wall8, null, "right", resolveSeamPositions(wall8, null, "right"));
  assert.deepEqual(
    leftResult.pieces.filter((p) => p.row === 0).map((p) => [p.x0, p.x1, p.lenMm]),
    [[0, 3000, 3000], [3000, 6000, 3000], [6000, 8000, 2000]],
    "Слева: целые панели от левого края, подрезка справа",
  );
  assert.deepEqual(
    rightResult.pieces.filter((p) => p.row === 0).map((p) => [p.x0, p.x1, p.lenMm]),
    [[0, 2000, 2000], [2000, 5000, 3000], [5000, 8000, 3000]],
    "Справа: целые панели от правого края, подрезка слева",
  );
  assert.equal(rightResult.panels, leftResult.panels, "число панелей не меняется");

  // «Самый выгодный» никогда не хуже любого фиксированного варианта
  for (const facadeLength of [4, 5, 7, 8, 10, 11, 13]) {
    const probe = { ...DEFAULT_SIDING, facadeLength, facadeHeight: 3, sparePct: 0, openings: [] };
    const best = calcTestFacade(probe, null, "optimal");
    for (const fixed of ["left", "right", "symmetric"] as HProfilePlacement[]) {
      const other = calcTestFacade(probe, null, fixed);
      assert.ok(best.panels <= other.panels, `${facadeLength} м: optimal ${best.panels} <= ${fixed} ${other.panels}`);
    }
  }
});

test("H profile follows the chosen seam layout and panels never exceed source length", () => {
  const input = { ...DEFAULT_SIDING, facadeLength: 8, facadeHeight: 3, sparePct: 0, openings: [] };
  for (const placement of ["optimal", "symmetric", "left", "right"] as HProfilePlacement[]) {
    const seams = resolveSeamPositions(input, null, placement);
    const result = calcTestFacade(input, null, placement, seams);
    assert.equal(result.seamLines, seams.length);
    assert.equal(result.hLengthMm, seams.length * 3000);
    assert.equal(result.cutLengthMm, 8000 * 15);
    for (const panel of result.panelPlan) assert.ok(panel.usedMm <= SIDING_ELEMENTS.panel.length);
    assert.ok(result.pieces.every((piece) => piece.lenMm <= SIDING_ELEMENTS.panel.length));
  }
  assert.deepEqual(getSeamRule(8000, "symmetric"), [1000, 4000, 7000]);
});

test("wall and full-width gable use actual polygon area", () => {
  const g = geometry("side-gable");
  assert.equal(g.width, 8);
  assert.equal(g.wallHeight, 3);
  assert.equal(g.totalHeight, 5.4);
  assert.equal(g.apexX, 4);
  const result = calcTestFacade(input, g);
  assert.equal(result.facadeArea, 8 * 3 + 8 * 2.4 / 2);
  assert.equal(result.netArea, result.facadeArea);
  assert.equal(result.H, 5400);
  assert.ok(result.panels > calcSiding(input).panels);
  assert.ok(result.hLengthMm > calcSiding(input).hLengthMm);
});

test("standalone gables keep windows but exclude doors", () => {
  const withBoth = {
    ...DEFAULT_SIDING,
    openings: [
      { id: "w1", kind: "window", trim: "j", width: 1.2, height: 1.4, x: 2, y: 0.9 },
      { id: "d1", kind: "door", trim: "j", width: 0.9, height: 2.1, x: 4, y: 0 },
    ],
  };
  for (const mode of ["gable", "broken-gable"] as const) {
    const g = getGableGeometry(withBoth, sanitizeTestFacade({ mode }))!;
    const result = calcTestFacade(withBoth, g);
    assert.ok(result.openings.length > 0, `${mode}: окно остаётся`);
    assert.ok(result.openings.every((o) => o.kind === "window"), `${mode}: дверей нет`);
    assert.ok(result.netArea < result.facadeArea, `${mode}: окно вычитается из площади`);
  }
});

test("standalone gable windows stay inside the slopes", () => {
  const g = getGableGeometry(input, sanitizeTestFacade({ mode: "gable", gable: { width: 6 } }))!;
  const wide = { id: "w", kind: "window", trim: "j", width: 5.9, height: 2.3, x: 0, y: 0 };
  const result = calcTestFacade({ ...input, openings: [wide] }, g);
  assert.equal(result.openings.length, 1);
  const [o] = result.openings;
  const [spanLeft, spanRight] = gableSpanAtHeight(g, o.y + o.height);
  assert.ok(o.x >= spanLeft - 1e-9 && o.x + o.width <= spanRight + 1e-9, "окно вписано в контур");
});

test("standalone gable without openings keeps corner profiles at zero", () => {
  const clean = { ...DEFAULT_SIDING, openings: [] };
  const before = JSON.stringify(clean);
  const result = calcTestFacade(clean, geometry("gable"));
  assert.equal(result.facadeArea, 7.2);
  assert.equal(result.netArea, 7.2);
  assert.equal(result.openingsArea, 0);
  assert.equal(result.openings.length, 0);
  assert.equal(result.table.find((item) => item.key === "outer")?.qty, 0);
  assert.equal(result.table.find((item) => item.key === "jamb")?.qty, 0);
  assert.ok(result.table.find((item) => item.key === "j")!.qty > 0);
  assert.equal(JSON.stringify(clean), before);
});

test("combined facade keeps windows, doors, and their material allowance", () => {
  const plain = calcSiding(DEFAULT_SIDING);
  const g = getGableGeometry(DEFAULT_SIDING, sanitizeTestFacade({ mode: "side-gable" }))!;
  const result = calcTestFacade(DEFAULT_SIDING, g);
  assert.deepEqual(result.openings, plain.openings);
  assert.equal(result.openingsArea, plain.openingsArea);
  assert.equal(result.netArea, Math.round((plain.netArea + g.width * g.gableHeight / 2) * 100) / 100);
  assert.equal(result.table.find((item) => item.key === "jamb")?.qty, plain.table.find((item) => item.key === "jamb")?.qty);
});

test("gable slopes are trimmed with J profile only — never with the top finish plank", () => {
  const g = geometry("side-gable");
  const result = calcTestFacade(input, g);
  const finishRow = result.table.find((item) => item.key === "finish")!;
  const jRow = result.table.find((item) => item.key === "j")!;
  const slopeMm = (g.leftSlope + g.rightSlope) * 1000;
  // У тестового фасада проёмов нет, края — наружные углы: вся длина J профиля — два ската.
  assert.equal(jRow.qty, Math.ceil(slopeMm / SIDING_ELEMENTS.jProfile.length));
  assert.match(jRow.note, /скатам фронтона/);
  assert.equal(finishRow.qty, 0, "no finish plank on the gable slopes");
  assert.match(finishRow.note, /J профилем/);
  // Прямоугольный фасад по-прежнему завершается финишной планкой по верху.
  const square = calcTestFacade(input, null);
  assert.equal(square.table.find((item) => item.key === "finish")?.qty, Math.ceil(8000 / SIDING_ELEMENTS.finish.length));
  assert.equal(square.table.find((item) => item.key === "j")?.qty, 0);
  // Окна с околооконной планкой добавляют финишную планку только под них.
  const window = jambWindow();
  const withJamb = calcTestFacade({ ...input, openings: [window] }, g);
  assert.equal(
    withJamb.table.find((item) => item.key === "finish")?.qty,
    Math.ceil(openingPerimeterMm(window) / SIDING_ELEMENTS.finish.length),
  );
});

test("signed apex offset changes slopes but not triangular area", () => {
  const left = geometry("gable", { apexOffset: -2 });
  const right = geometry("gable", { apexOffset: 2 });
  assert.equal(left.apexX, 1);
  assert.equal(right.apexX, 5);
  assert.equal(left.leftSlope, right.rightSlope);
  assert.equal(left.rightSlope, right.leftSlope);
  assert.deepEqual(gableSpanAtHeight(left, 1.2), [0.5, 3.5]);
  assert.deepEqual(gableSpanAtHeight(right, 1.2), [2.5, 5.5]);
  assert.equal(calcTestFacade(input, left).facadeArea, calcTestFacade(input, right).facadeArea);
});

test("apex at either edge is valid and does not divide by zero", () => {
  for (const offset of [-3, 3]) {
    const g = geometry("gable", { apexOffset: offset });
    assert.equal(gableHeightAtX(g, g.apexX), 2.4);
    assert.ok(Number.isFinite(gableHeightAtX(g, 0)));
    assert.ok(Number.isFinite(gableHeightAtX(g, 6)));
    const result = calcTestFacade(input, g);
    assert.ok(Number.isFinite(result.hLengthMm));
    assert.ok(result.panels > 0);
  }
});

test("invalid saved values fall back safely and shrinking width bounds the apex", () => {
  assert.deepEqual(sanitizeTestFacade({ mode: "unknown", sideGable: { height: null } }), sanitizeTestFacade(null));
  const settings = sanitizeTestFacade({ mode: "gable", gable: { width: 2, height: "3,5", apexOffset: 7 } });
  assert.equal(settings.gable.width, 2);
  assert.equal(settings.gable.height, 3.5);
  assert.equal(settings.gable.apexOffset, 1);
  assert.equal(sanitizeTestFacade({ gable: { height: -10, width: Infinity } }).gable.height, 0.1);
});

function verifyPacking(g: GableGeometry, placement: HProfilePlacement = "optimal") {
  const result = calcTestFacade(input, g, placement);
  const panelLength = SIDING_ELEMENTS.panel.length;
  const rowHeight = SIDING_ELEMENTS.panel.height;
  assert.ok(result.panelsArea >= result.netArea);
  assert.ok(result.table.every((item) => Number.isInteger(item.qty) && item.qty >= 0));
  assert.equal(result.cutLengthMm, result.panelPlan.reduce((sum, panel) => sum + panel.usedMm, 0));
  assert.equal(result.pieces.length, result.panelPlan.reduce((sum, panel) => sum + panel.items.length, 0));
  for (const panel of result.panelPlan) {
    assert.ok(panel.usedMm <= panelLength);
    assert.equal(panel.usedMm + panel.wasteMm, panelLength);
  }
  for (const piece of result.pieces) {
    assert.ok(piece.lenMm > 0 && piece.lenMm <= panelLength);
    assert.ok(piece.x0 >= 0 && piece.x1 <= result.L);
    const span = gableSpanAtHeight(g, piece.row * rowHeight / 1000);
    assert.ok(piece.x0 >= span[0] * 1000 - 1.01);
    assert.ok(piece.x1 <= span[1] * 1000 + 1.01);
  }
  return result;
}

test("rectangular blanks cover every gable row and never overfill a source panel", () => {
  for (const placement of ["optimal", "symmetric", "left", "right"] as HProfilePlacement[]) {
    for (const mode of ["side-gable", "gable"] as const) {
      for (const height of [0.1, 0.203, 2.4, 5, 20]) {
        for (const apexOffset of [-50, -1.2, 0, 1.5, 50]) {
          verifyPacking(geometry(mode, { width: 6.5, height, apexOffset }), placement);
        }
      }
    }
  }
});

test("reserve increases quantities without changing shape or cut lengths", () => {
  const g = geometry("gable");
  const base = calcTestFacade(input, g);
  const spare = calcTestFacade({ ...input, sparePct: 10 }, g);
  assert.deepEqual(base.pieces, spare.pieces);
  assert.equal(base.netArea, spare.netArea);
  assert.ok(spare.panels >= base.panels);
  for (const item of base.table) {
    assert.equal(spare.table.find((row) => row.key === item.key)?.qty, Math.round(item.qty * 1.1));
  }
});

/* ---------------------------------------------------------------------------
 * Ломаный фронтон: четыре ската, излом и собственные пределы
 * ------------------------------------------------------------------------- */

const brokenGeometry = (changes: Partial<BrokenGableParameters> = {}) =>
  getGableGeometry(input, sanitizeTestFacade({ mode: "broken-gable", brokenGable: changes }))!;

test("broken gable mode is offered right after the plain gable", () => {
  const ids = TEST_FACADE_MODES.map((mode) => mode.id);
  assert.deepEqual(ids, ["side", "side-gable", "gable", "broken-gable"]);
  assert.equal(TEST_FACADE_MODES[3].label, "Ломаный фронтон");
  assert.equal(DEFAULT_TEST_FACADE.brokenGable.breakHeight, 1.8);
});

test("broken gable builds a five point profile with a real break", () => {
  const g = brokenGeometry();
  assert.equal(g.mode, "broken-gable");
  assert.equal(g.profile.length, 5);
  assert.equal(g.apexIndex, 2);
  assert.equal(g.wallHeight, 0);
  assert.equal(g.breakHeight, 1.8);
  assert.equal(g.breakInset, 1);
  assert.deepEqual(g.profile.map((p) => [p.x, p.y]), [[0, 0], [1, 1.8], [3, 3], [5, 1.8], [6, 0]]);
  // Площадь: трапеция под изломом + треугольник над ним
  assert.equal(g.gableArea, 5 * 1.8 + (4 * 1.2) / 2);
  const perSide = Math.hypot(1, 1.8) + Math.hypot(2, 1.2);
  assert.ok(Math.abs(g.slopeLength - perSide * 2) < 0.011);
  assert.ok(g.slopeLength > Math.hypot(3, 3) * 2, "ломаный скат длиннее прямого");
});

const closeSpan = (actual: [number, number], expected: [number, number]) => {
  assert.ok(Math.abs(actual[0] - expected[0]) < 1e-9, `левый край ${actual[0]} ≈ ${expected[0]}`);
  assert.ok(Math.abs(actual[1] - expected[1]) < 1e-9, `правый край ${actual[1]} ≈ ${expected[1]}`);
};

test("broken gable spans and heights follow both slope segments", () => {
  const g = brokenGeometry();
  closeSpan(gableSpanAtHeight(g, 0), [0, 6]);
  closeSpan(gableSpanAtHeight(g, 0.9), [0.5, 5.5]);
  closeSpan(gableSpanAtHeight(g, 1.8), [1, 5]);
  closeSpan(gableSpanAtHeight(g, 2.4), [2, 4]);
  closeSpan(gableSpanAtHeight(g, 3), [3, 3]);
  assert.equal(gableHeightAtX(g, 0), 0);
  assert.equal(gableHeightAtX(g, 1), 1.8);
  assert.equal(gableHeightAtX(g, 3), 3);
  assert.equal(gableHeightAtX(g, 5), 1.8);
  assert.equal(gableHeightAtX(g, 6), 0);
  assert.ok(Math.abs(gableHeightAtX(g, 2) - 2.4) < 1e-9);
});

test("broken gable is clad with J profile along all four slopes and no top finish plank", () => {
  const g = brokenGeometry();
  const result = calcTestFacade({ ...DEFAULT_SIDING, openings: [] }, g);
  const jRow = result.table.find((item) => item.key === "j")!;
  const finishRow = result.table.find((item) => item.key === "finish")!;
  assert.equal(jRow.qty, Math.ceil((g.slopeLength * 1000) / SIDING_ELEMENTS.jProfile.length));
  assert.match(jRow.note, /скатам фронтона/);
  assert.equal(finishRow.qty, 0);
  assert.equal(result.openings.length, 0, "отдельный фронтон без проёмов");
  assert.equal(result.netArea, g.gableArea);
  assert.equal(result.table.find((item) => item.key === "outer")?.qty, 0);
  assert.ok(result.panels > 0);
});

test("break controls stay inside safe limits and keep the profile monotonic", () => {
  const wide = brokenGeometry({ width: 6, height: 3, breakInset: 99, apexOffset: 99 });
  assert.equal(wide.breakInset, maxBrokenInset(6));
  assert.equal(wide.apexOffset, maxBrokenApexOffset(6, wide.breakInset));
  const flat = brokenGeometry({ height: 3, breakHeight: 99 });
  assert.equal(flat.breakHeight, 2.95);
  const tiny = brokenGeometry({ width: 0.5, height: 0.3, breakHeight: 0.01, breakInset: 0.01, apexOffset: -5 });
  for (const g of [wide, flat, tiny, brokenGeometry({ apexOffset: -99 })]) {
    for (let i = 1; i < g.profile.length; i++) {
      assert.ok(g.profile[i].x > g.profile[i - 1].x, "x строго возрастает");
    }
    assert.ok(g.breakHeight < g.gableHeight);
    assert.ok(g.apexX > g.breakInset && g.apexX < g.width - g.breakInset);
    const result = calcTestFacade(input, g);
    assert.ok(Number.isFinite(result.hLengthMm) && result.panels > 0);
    assert.ok(result.panelsArea >= result.netArea);
  }
});

test("preset proportions produce valid broken gables", () => {
  for (const preset of BROKEN_GABLE_PRESETS) {
    const g = brokenGeometry({
      breakHeight: Math.round(3 * preset.heightRatio * 100) / 100,
      breakInset: Math.round(6 * preset.insetRatio * 100) / 100,
    });
    assert.ok(g.breakHeight > 0 && g.breakHeight < g.gableHeight);
    assert.ok(g.breakInset > 0 && g.breakInset < g.width / 2);
    assert.ok(g.gableArea > 0 && g.gableArea < g.width * g.gableHeight);
    verifyPacking(g);
  }
});

test("side gable can switch between triangular and broken shape", () => {
  const triangle = getGableGeometry(
    input,
    sanitizeTestFacade({ mode: "side-gable", sideGable: { shape: "gable", height: 2.4, breakHeight: 1.4, breakInset: 0.8 } }),
  )!;
  assert.equal(triangle.shape, "gable");
  assert.equal(triangle.mode, "side-gable");
  assert.equal(triangle.profile.length, 3);
  assert.equal(triangle.wallHeight, 3);
  assert.equal(triangle.gableArea, 8 * 2.4 / 2);

  const broken = getGableGeometry(
    input,
    sanitizeTestFacade({ mode: "side-gable", sideGable: { shape: "broken", height: 2.4, breakHeight: 1.4, breakInset: 0.8 } }),
  )!;
  assert.equal(broken.shape, "broken");
  assert.equal(broken.mode, "side-gable");
  assert.equal(broken.profile.length, 5);
  assert.equal(broken.wallHeight, 3);
  assert.equal(broken.breakHeight, 1.4);
  assert.equal(broken.breakInset, 0.8);
  assert.ok(broken.gableArea > triangle.gableArea, "ломаный фронтон больше треугольного");
  assert.ok(broken.slopeLength > triangle.slopeLength);
});

test("gable type block offers five options with the requested labels", () => {
  assert.deepEqual(
    GABLE_TYPE_OPTIONS.map((option) => option.label),
    ["Без фронтона", "С фронтоном", "С ломаным фронтоном", "Фронтон", "Ломаный фронтон"],
  );
  assert.deepEqual(GABLE_TYPE_OPTIONS.map((option) => option.id), ["none", "with-gable", "with-broken", "gable", "broken-gable"]);
});

test("applyGableType maps each option to the right mode and shape", () => {
  const base = sanitizeTestFacade({ mode: "side-gable" });
  const cases: [GableType, string, string | null][] = [
    ["none", "side-gable", "none"],
    ["with-gable", "side-gable", "gable"],
    ["with-broken", "side-gable", "broken"],
    ["gable", "gable", null],
    ["broken-gable", "broken-gable", null],
  ];
  for (const [type, mode, shape] of cases) {
    const next = applyGableType(base, type);
    assert.equal(next.mode, mode, `${type}: mode`);
    if (shape) assert.equal(next.sideGable.shape, shape, `${type}: shape`);
    assert.equal(getGableType(next), type, `${type}: round trip`);
    assert.deepEqual(sanitizeTestFacade(JSON.parse(JSON.stringify(next))), next, `${type}: persists`);
  }
  assert.equal(getGableType(sanitizeTestFacade({ mode: "side" })), "none", "старый сохранённый режим «side» отображается как «Без фронтона»");
  // Переключение не теряет параметры соседних режимов
  const tuned = sanitizeTestFacade({ mode: "gable", gable: { width: 9, height: 3.5 }, sideGable: { shape: "broken", breakHeight: 1.1 } });
  const back = applyGableType(applyGableType(tuned, "none"), "with-broken");
  assert.equal(back.gable.width, 9);
  assert.equal(back.sideGable.breakHeight, 1.1);
});

test("«Без фронтона» keeps the wall without any gable geometry", () => {
  const settings = sanitizeTestFacade({ mode: "side-gable", sideGable: { shape: "none", height: 4 } });
  assert.equal(getGableGeometry(DEFAULT_SIDING, settings), null);
  const plain = { ...DEFAULT_SIDING, sparePct: 0 };
  assert.deepEqual(calcTestFacade(plain, getGableGeometry(plain, settings)), calcTestFacade(plain, null));
  const result = calcTestFacade(plain, null);
  assert.equal(result.openings.length, DEFAULT_SIDING.openings.length, "проёмы остаются");
  assert.ok(result.table.find((item) => item.key === "finish")!.qty > 0, "верх стены закрывает финишная планка");
  assert.equal(result.table.find((item) => item.key === "j")!.qty, calcSiding(plain).table.find((item) => item.key === "j")!.qty);
  assert.equal(sanitizeTestFacade({ sideGable: { shape: "none" } }).sideGable.shape, "none");
});

test("side gable keeps facade openings in both shapes", () => {
  for (const shape of ["gable", "broken"] as const) {
    const g = getGableGeometry(DEFAULT_SIDING, sanitizeTestFacade({ mode: "side-gable", sideGable: { shape } }))!;
    const result = calcTestFacade(DEFAULT_SIDING, g);
    assert.equal(result.openings.length, DEFAULT_SIDING.openings.length);
    assert.ok(result.table.find((item) => item.key === "jamb")!.qty > 0);
    assert.ok(result.table.find((item) => item.key === "finish")!.qty > 0, "околооконная планка даёт финишную");
    assert.ok(result.facadeArea > g.gableArea);
    verifyPacking(g);
  }
});

test("standalone gable modes keep their own shape", () => {
  assert.equal(getGableGeometry(input, sanitizeTestFacade({ mode: "gable" }))!.shape, "gable");
  assert.equal(getGableGeometry(input, sanitizeTestFacade({ mode: "broken-gable" }))!.shape, "broken");
  // Даже если в настройках фронтона над фасадом стоит ломаный тип, отдельный «Фронтон» остаётся треугольным.
  assert.equal(getGableGeometry(input, sanitizeTestFacade({ mode: "gable", sideGable: { shape: "broken" } }))!.shape, "gable");
});

test("side gable shape and break parameters survive a save/load round trip", () => {
  const saved = sanitizeTestFacade({
    mode: "side-gable",
    sideGable: { shape: "broken", height: 3.2, breakHeight: 1.1, breakInset: 0.6, apexOffset: 0.4 },
  });
  assert.deepEqual(sanitizeTestFacade(JSON.parse(JSON.stringify(saved))), saved);
  assert.equal(saved.sideGable.shape, "broken");
  assert.equal(saved.sideGable.height, 3.2);
  assert.equal(saved.sideGable.breakHeight, 1.1);
  assert.equal(saved.sideGable.breakInset, 0.6);
  assert.equal(sanitizeTestFacade({ sideGable: { shape: "broken" } }).sideGable.shape, "broken");
  assert.equal(sanitizeTestFacade({ sideGable: { shape: "bogus" } }).sideGable.shape, "gable");
});

test("broken gable settings survive a save/load round trip", () => {
  const saved = sanitizeTestFacade({ mode: "broken-gable", brokenGable: { width: 7.5, height: 4, breakHeight: 2.2, breakInset: 1.4, apexOffset: -0.6 } });
  const restored = sanitizeTestFacade(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(restored, saved);
  assert.equal(restored.mode, "broken-gable");
  assert.equal(restored.brokenGable.breakHeight, 2.2);
  assert.equal(restored.brokenGable.breakInset, 1.4);
  assert.equal(restored.brokenGable.apexOffset, -0.6);
});

test("broken gable rows are cut along both slopes for every seam layout", () => {
  for (const placement of ["optimal", "symmetric", "left", "right"] as HProfilePlacement[]) {
    for (const width of [3, 6.5, 9]) {
      for (const height of [0.3, 2.4, 6]) {
        for (const breakInset of [0.05, 1.2, 99]) {
          for (const apexOffset of [-99, 0, 99]) {
            const g = brokenGeometry({ width, height, breakInset, apexOffset, breakHeight: height * 0.55 });
            verifyPacking(g, placement);
          }
        }
      }
    }
  }
});