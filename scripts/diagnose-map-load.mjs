import { chromium } from "playwright-core";

const url = process.env.TRIPWISE_URL || "https://3000-il39stmgdbt20qgvrc9x3-21b76c98.us3.manus.computer/explore/goa";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const responses = [];
const failures = [];
const consoleMessages = [];

page.on("response", (response) => {
  if (response.url().includes("/v1/maps/proxy")) responses.push({ url: response.url(), status: response.status(), headers: response.headers() });
});
page.on("requestfailed", (request) => {
  if (request.url().includes("/v1/maps/proxy")) failures.push({ url: request.url(), failure: request.failure() });
});
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") consoleMessages.push({ type: message.type(), text: message.text() });
});

try {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const state = await page.evaluate(() => ({
    googleReady: Boolean(window.google?.maps),
    mapFallbackVisible: Boolean(document.querySelector(".map-fallback")),
    mapCanvasCount: document.querySelectorAll(".gm-style").length,
  }));
  console.log(JSON.stringify({ responses, failures, consoleMessages, state }, null, 2));
} finally {
  await browser.close();
}
