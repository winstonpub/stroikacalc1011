import assert from "node:assert/strict";
import {
  ROOF_PROFILES,
  profileFragment,
  profilePeriod,
  type RoofProfile,
} from "../src/data/roofProfiles";

const expected: [RoofProfile["id"], number, number][] = [
  ["c20", 18, 137.5],
  ["c8", 8, 115],
  ["monterrey", 25, 183.3],
  ["ondulin", 38, 95],
];

const near = (actual: number, target: number) => {
  assert.ok(Math.abs(actual - target) < 0.00001, `${actual} != ${target}`);
};

for (const [id, height, pitch] of expected) {
  const profile = ROOF_PROFILES[id];
  const period = profilePeriod(profile);
  near(profile.heightMm, height);
  near(profile.pitchMm, pitch);
  near(period[0].x, 0);
  near(period[period.length - 1].x, pitch);
  near(period[0].y, 0);
  near(period[period.length - 1].y, 0);
  near(Math.max(...period.map((point) => point.y)), height);
  near(Math.min(...period.map((point) => point.y)), 0);

  if (profile.shape === "trapezoid") {
    near(period[3].x - period[2].x, profile.crestMm!);
    near(2 * period[1].x, profile.troughMm!);
    near((period[2].x + period[3].x) / 2, pitch / 2);
  }

  for (const span of [50, 95, 115, 137.5, 183.3, 300, 600]) {
    const fragment = profileFragment(profile, span);
    near(fragment[0].x, 0);
    near(fragment[fragment.length - 1].x, span);
    fragment.forEach((point, index) => {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
      assert.ok(point.x >= 0 && point.x <= span);
      assert.ok(point.y >= 0 && point.y <= height);
      if (index) assert.ok(point.x > fragment[index - 1].x);
    });
  }
  console.log(`${id}: h=${height} mm, p=${pitch} mm; period and seven fragments verified`);
}

assert.equal(ROOF_PROFILES.monterrey.stepHeightMm, 14);
assert.equal(ROOF_PROFILES.monterrey.longitudinalPitchMm, 350);
assert.equal(ROOF_PROFILES.monterrey.heightMm + ROOF_PROFILES.monterrey.stepHeightMm!, 39);
assert.equal(ROOF_PROFILES.ondulin.pitchMm * 8, 760);
console.log("All roof profile geometry checks passed.");