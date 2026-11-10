import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

// Run after npm run build, with Playwright and Chromium installed.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = "http://127.0.0.1:5188";
const server = spawn(process.execPath, [
  "node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "5188", "--strictPort",
], { stdio: "ignore" });
let browser;

async function expectDelivery(page, expected) {
  const delivery = page.locator("main > section").first()
    .getByText("доставка по Челябинску", { exact: true }).locator("..");
  let actual;
  for (let attempt = 0; attempt < 40; attempt++) {
    actual = (await delivery.innerText()).replace(/\s+/g, " ").trim();
    if (actual === `${expected} доставка по Челябинску`) return;
    await sleep(50);
  }
  assert.equal(actual, `${expected} доставка по Челябинску`);
}

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
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "America/New_York",
    reducedMotion: "reduce",
  });
  // No live spreadsheet reads or writes are needed for these UI checks.
  await context.route("https://docs.google.com/**", (route) =>
    route.fulfill({ contentType: "text/csv", body: "" }),
  );
  const errors = [];
  context.on("page", (page) => page.on("pageerror", (error) => errors.push(error.message)));

  for (const route of ["armstrong", "roof", "siding"]) {
    const page = await context.newPage();
    await page.clock.install({ time: new Date("2026-06-15T10:58:00Z") });
    await page.goto(`${origin}/#/${route}`, { waitUntil: "domcontentloaded" });
    await page.locator("main > section").first().waitFor({ state: "attached" });
    await page.clock.pauseAt(new Date("2026-06-15T10:59:58Z"));
    await expectDelivery(page, "Сегодня");
    await page.clock.runFor(2000);
    await expectDelivery(page, "Завтра");

    await page.clock.setSystemTime(new Date("2026-06-15T18:59:59Z"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expectDelivery(page, "Завтра");
    await page.clock.runFor(1000);
    await expectDelivery(page, "Сегодня");

    await page.clock.setSystemTime(new Date("2026-06-16T12:00:00Z"));
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expectDelivery(page, "Завтра");
    console.log(`${route}: cutoff, midnight and tab resume verified without reload`);
    await page.close();
  }

  const page = await context.newPage();
  await page.goto(`${origin}/#/`);
  const catalog = page.locator("#systems");
  await catalog.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  assert.deepEqual(await catalog.locator("h3").allTextContents(), ["Грильято", "Армстронг", "Кровля", "Сайдинг"]);
  const cards = await catalog.locator("a").evaluateAll((elements) => elements.map((element) => {
    const { top, width } = element.getBoundingClientRect();
    return { top, width };
  }));
  assert.equal(cards.length, 4);
  assert.ok(cards.every((card) => Math.abs(card.top - cards[0].top) < 1));
  assert.ok(cards.every((card) => Math.abs(card.width - cards[0].width) < 1));
  assert.ok(await catalog.locator("a img").evaluateAll((images) =>
    images.every((img) => img.complete && img.naturalWidth > 0),
  ));
  if (process.env.SCREENSHOT_PATH) {
    await catalog.screenshot({ path: process.env.SCREENSHOT_PATH, animations: "disabled" });
  }
  await catalog.locator('a[href="#/siding"]').click();
  await page.waitForURL("**/#/siding");
  await page.getByRole("heading", { name: "Обшивка Сайдинг" }).waitFor();
  const features = await page.locator("#features").textContent();
  assert.ok(!features.includes("Система Сайдинг"));
  assert.ok(!features.includes("Точный расчёт без переплат"));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/#/`);
  await catalog.scrollIntoViewIfNeeded();
  assert.ok(await catalog.evaluate((element) => element.scrollWidth <= element.clientWidth));
  assert.equal(await catalog.locator("a").count(), 4);
  await catalog.locator('a[href="#/siding"]').click();
  await page.waitForURL("**/#/siding");
  await page.getByRole("heading", { name: "Обшивка Сайдинг" }).waitFor();
  assert.deepEqual(errors, []);
  console.log("Homepage cards, siding navigation, removed callout and mobile layout verified");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}