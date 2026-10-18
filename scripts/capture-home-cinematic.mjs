import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env.TRIPWISE_URL || "https://3000-il39stmgdbt20qgvrc9x3-21b76c98.us3.manus.computer";
const targets = [
  ["hero", ".hero-section"],
  ["method", ".section-dark"],
  ["destinations", ".destination-section"],
  ["cta", ".final-cta"],
  ["footer", ".site-footer"],
];
const viewports = [
  ["desktop", { width: 1280, height: 720 }],
  ["mobile", { width: 375, height: 812 }],
];

await mkdir("artifacts/home-cinematic", { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const report = { baseUrl, captures: [] };

try {
  for (const [breakpoint, viewport] of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    for (const [section, selector] of targets) {
      const target = page.locator(selector).first();
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(220);
      const path = `artifacts/home-cinematic/${breakpoint}-${section}.png`;
      await page.screenshot({ path, fullPage: false });
      const layers = await page.evaluate((sectionSelector) => {
        const details = (selector) => {
          const element = document.querySelector(selector);
          const style = element ? getComputedStyle(element) : null;
          return { found: Boolean(element), zIndex: style?.zIndex ?? null, backgroundImage: style?.backgroundImage ?? null, color: style?.color ?? null };
        };
        return { section: details(sectionSelector), beach: details(".home-beach-cinematic"), main: details(".home-page > main"), footer: details(".site-footer") };
      }, selector);
      report.captures.push({ breakpoint, section, path, layers });
    }
    await page.close();
  }
} finally {
  await browser.close();
}

await writeFile("artifacts/home-cinematic/report.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
