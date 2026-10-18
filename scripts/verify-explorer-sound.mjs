import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env.TRIPWISE_URL || "https://3000-il39stmgdbt20qgvrc9x3-21b76c98.us3.manus.computer";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const report = { baseUrl, explorer: {}, sound: {}, mobile: {} };

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => {
    const starts = [];
    class MockOscillator {
      frequency = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
      connect(next) { return next; }
      start() { starts.push(Date.now()); }
      stop() {}
    }
    class MockGain {
      gain = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
      connect(next) { return next; }
    }
    class MockAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator() { return new MockOscillator(); }
      createGain() { return new MockGain(); }
      resume() { return Promise.resolve(); }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: MockAudioContext });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: MockAudioContext });
    window.__tripwiseSelectionStarts = starts;
  });
  await page.goto(`${baseUrl}/explore`, { waitUntil: "networkidle" });
  report.explorer.initialGatewayCount = await page.locator(".atlas-count").textContent();
  await page.getByRole("textbox", { name: "Search destinations" }).fill("Kohima");
  report.explorer.searchGatewayCount = await page.locator(".atlas-count").textContent();
  report.explorer.matchVisible = await page.getByText("Kohima", { exact: true }).first().isVisible();

  await page.getByRole("textbox", { name: "Search destinations" }).fill("");
  await page.getByRole("button", { name: "South", exact: true }).click();
  report.explorer.southGatewayCount = await page.locator(".atlas-count").textContent();
  await page.getByRole("button", { name: "Coast", exact: true }).click();
  report.explorer.southCoastGatewayCount = await page.locator(".atlas-count").textContent();

  const soundToggle = page.locator("[data-sound-control]");
  report.sound.initiallyEnabled = await soundToggle.getAttribute("aria-pressed");
  await page.getByRole("button", { name: "All", exact: true }).last().click();
  report.sound.selectionEventsWhenEnabled = await page.evaluate(() => window.__tripwiseSelectionStarts.length);
  await soundToggle.click();
  report.sound.afterOptOut = await page.evaluate(() => window.localStorage.getItem("tripwise-selection-sound"));
  await page.getByRole("button", { name: "Nature", exact: true }).click();
  report.sound.selectionEventsAfterOptOut = await page.evaluate(() => window.__tripwiseSelectionStarts.length);
  await soundToggle.click();
  report.sound.afterOptIn = await page.evaluate(() => window.localStorage.getItem("tripwise-selection-sound"));
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await mobile.addInitScript(() => {
    window.localStorage.setItem("tripwise-selection-sound", "on");
    const starts = [];
    class MockOscillator {
      frequency = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
      connect(next) { return next; }
      start() { starts.push(Date.now()); }
      stop() {}
    }
    class MockGain {
      gain = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
      connect(next) { return next; }
    }
    class MockAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator() { return new MockOscillator(); }
      createGain() { return new MockGain(); }
      resume() { return Promise.resolve(); }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: MockAudioContext });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: MockAudioContext });
    window.__tripwiseSelectionStarts = starts;
  });
  await mobile.goto(`${baseUrl}/explore`, { waitUntil: "networkidle" });
  await mobile.getByRole("button", { name: "Nature", exact: true }).click();
  report.mobile.selectionEventsWhenEnabled = await mobile.evaluate(() => window.__tripwiseSelectionStarts.length);
  const mobileToggle = mobile.locator("[data-sound-control]");
  await mobileToggle.focus();
  await mobile.keyboard.press("Enter");
  report.mobile.soundToggleAfterKeyboard = await mobileToggle.getAttribute("aria-pressed");
  await mobile.getByRole("button", { name: "Coast", exact: true }).click();
  report.mobile.selectionEventsAfterOptOut = await mobile.evaluate(() => window.__tripwiseSelectionStarts.length);
  await mobileToggle.focus();
  await mobile.keyboard.press("Space");
  report.mobile.soundToggleAfterSecondKeyboard = await mobileToggle.getAttribute("aria-pressed");
  await mobile.close();
} finally {
  await browser.close();
}

await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/explorer-sound-verification.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
