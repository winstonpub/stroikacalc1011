import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

// Run after npm run build, with Playwright and Chromium installed.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = "http://127.0.0.1:5189";
const server = spawn(process.execPath, [
  "node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "5189", "--strictPort",
], { stdio: "ignore" });
let browser;

const sameLevel = (values, tolerance = 1) =>
  values.every((value) => Math.abs(value - values[0]) <= tolerance);

try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      ready = (await fetch(origin)).ok;
      if (ready) break;
    } catch { /* wait for the local preview server */ }
    await sleep(100);
  }
  assert.ok(ready, "The preview server must start");

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await context.route("https://docs.google.com/**", (route) => route.fulfill({ contentType: "text/csv", body: "" }));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`${origin}/#/`);
  const catalog = page.locator("#systems");
  await catalog.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);

  assert.equal(await catalog.getByText("Калькулятор доступен").count(), 0);

  // every card's icon, eyebrow, heading, description, tags and action sit on one level
  const rows = await catalog.locator("a").evaluateAll((cards) =>
    cards.map((card) => {
      const [icon, eyebrow, heading, description, tags, action] = Array.from(card.querySelector("div.relative").children);
      const top = (el) => el.getBoundingClientRect().top;
      const bottom = (el) => el.getBoundingClientRect().bottom;
      return {
        card: top(card), icon: top(icon), eyebrow: top(eyebrow), heading: top(heading),
        description: top(description), tags: top(tags), action: top(action), actionBottom: bottom(action), cardBottom: bottom(card),
      };
    }),
  );
  assert.equal(rows.length, 4);
  for (const key of ["card", "icon", "eyebrow", "heading", "description", "tags", "action", "cardBottom"]) {
    assert.ok(sameLevel(rows.map((row) => row[key])), `${key} must be aligned across cards: ${rows.map((row) => row[key].toFixed(1)).join(", ")}`);
  }
  // the action link hugs the bottom padding of every card
  for (const row of rows) assert.ok(row.cardBottom - row.actionBottom < 40);

  // icons: house for roof, three rows for siding
  assert.equal(await catalog.locator('a[href="#/roof"] svg.lucide-house').count(), 1);
  assert.equal(await catalog.locator('a[href="#/siding"] svg.lucide-rows-3').count(), 1);

  // every card photo must actually load (a broken image shows alt text over a flat background)
  const photos = await catalog.locator("a img").evaluateAll((images) =>
    images.map((img) => ({ src: img.getAttribute("src"), ok: img.complete && img.naturalWidth > 0 })),
  );
  assert.equal(photos.length, 4);
  for (const photo of photos) assert.ok(photo.ok, `card image failed to load: ${photo.src}`);

  if (process.env.SCREENSHOT_PATH) {
    await catalog.screenshot({ path: process.env.SCREENSHOT_PATH, animations: "disabled" });
  }

  // Armstrong hero: both buttons side by side, link scrolls to the system block
  await page.goto(`${origin}/#/armstrong`);
  const hero = page.locator("main > section").first();
  const calc = hero.getByRole("link", { name: "Калькулятор" });
  const about = hero.getByRole("link", { name: "О системе Армстронг" });
  await about.waitFor();
  // let the hero entrance animation finish before measuring geometry
  await page.waitForTimeout(1100);
  const calcBox = await calc.boundingBox();
  const aboutBox = await about.boundingBox();
  assert.ok(Math.abs(calcBox.y - aboutBox.y) < 1, "buttons share one row");
  assert.ok(Math.abs(calcBox.height - aboutBox.height) < 1, "buttons share one height");
  assert.ok(aboutBox.x > calcBox.x + calcBox.width, "system link is to the right of the calculator button");
  await about.click();
  await page.waitForURL("**/#/armstrong#features");
  await page.waitForTimeout(900);
  const featuresTop = await page.locator("#features").evaluate((el) => el.getBoundingClientRect().top);
  assert.ok(featuresTop >= 0 && featuresTop < 200, `page scrolled to the system block (top=${featuresTop.toFixed(0)})`);

  if (process.env.HERO_SCREENSHOT_PATH) {
    await page.goto(`${origin}/#/armstrong`);
    await hero.getByRole("link", { name: "О системе Армстронг" }).waitFor();
    await page.waitForTimeout(1100);
    await hero.screenshot({ path: process.env.HERO_SCREENSHOT_PATH, animations: "disabled" });
  }

  assert.deepEqual(errors, []);
  console.log("Main cards aligned, badge removed, icons swapped, Armstrong system button verified");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
