import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env.TRIPWISE_URL || "https://3000-il39stmgdbt20qgvrc9x3-21b76c98.us3.manus.computer";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const report = { baseUrl, keyboard: {}, reducedMotion: {}, homeCinematic: {}, mapFallback: {}, deleteDialog: {} };

async function captureFocusSequence(page, count = 12) {
  const sequence = [];
  for (let index = 0; index < count; index += 1) {
    await page.keyboard.press("Tab");
    sequence.push(await page.evaluate(() => {
      const active = document.activeElement;
      const style = active instanceof HTMLElement ? getComputedStyle(active) : null;
      return {
        tag: active?.tagName ?? null,
        text: (active?.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
        ariaLabel: active?.getAttribute("aria-label") ?? null,
        outline: style?.outline ?? null,
      };
    }));
  }
  return sequence;
}

async function motionSnapshot(path, selectors) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  const result = await page.evaluate((requestedSelectors) => ({
    mediaMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    styles: requestedSelectors.map((selector) => {
      const element = document.querySelector(selector);
      const style = element ? getComputedStyle(element) : null;
      return { selector, found: Boolean(element), transitionDuration: style?.transitionDuration ?? null, animationDuration: style?.animationDuration ?? null };
    }),
  }), selectors);
  await page.close();
  return result;
}

async function homeCinematicSnapshot(name, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const snapshot = await page.evaluate(() => {
    const elementDetails = (selector) => {
      const element = document.querySelector(selector);
      const style = element ? getComputedStyle(element) : null;
      const rect = element instanceof HTMLElement ? element.getBoundingClientRect() : null;
      return {
        found: Boolean(element),
        zIndex: style?.zIndex ?? null,
        position: style?.position ?? null,
        backgroundImage: style?.backgroundImage ?? null,
        opacity: style?.opacity ?? null,
        coversViewport: Boolean(rect && rect.width >= window.innerWidth && rect.height >= window.innerHeight),
      };
    };

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      beachLayer: elementDetails(".home-beach-cinematic"),
      beachImage: elementDetails(".home-beach-cinematic > img"),
      nav: elementDetails(".site-nav"),
      main: elementDetails(".home-page > main"),
      heroCopy: elementDetails(".hero-copy"),
      methodSection: elementDetails(".section-dark"),
      destinationSection: elementDetails(".destination-section"),
      finalCta: elementDetails(".final-cta"),
      footer: elementDetails(".site-footer"),
    };
  });
  await page.close();

  if (!snapshot.beachLayer.found || !snapshot.beachImage.found || !snapshot.beachLayer.coversViewport || snapshot.beachLayer.position !== "fixed") {
    throw new Error(`Home beach cinematic is unavailable or does not cover the ${name} viewport.`);
  }
  if (Number(snapshot.nav.zIndex) <= Number(snapshot.beachLayer.zIndex) || Number(snapshot.main.zIndex) <= Number(snapshot.beachLayer.zIndex)) {
    throw new Error(`Home content is not layered above the beach cinematic at the ${name} breakpoint.`);
  }
  return snapshot;
}

try {
  const landing = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await landing.goto(baseUrl, { waitUntil: "networkidle" });
  report.keyboard.landing = await captureFocusSequence(landing, 10);
  await landing.close();

  const planner = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await planner.goto(`${baseUrl}/planner`, { waitUntil: "networkidle" });
  report.keyboard.planner = await captureFocusSequence(planner, 18);
  await planner.close();

  const profile = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await profile.goto(`${baseUrl}/profile`, { waitUntil: "networkidle" });
  report.keyboard.profile = await captureFocusSequence(profile, 18);
  await profile.close();

  const trips = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await trips.goto(`${baseUrl}/trips`, { waitUntil: "networkidle" });
  const trigger = trips.locator('[aria-label="Delete saved trip"], button:has-text("Delete trip")').first();
  if (await trigger.count()) {
    await trigger.focus();
    await trips.keyboard.press("Enter");
    await trips.waitForTimeout(150);
    report.deleteDialog = await trips.evaluate(() => ({
      rendered: Boolean(document.querySelector('[role="alertdialog"]')),
      activeElement: (document.activeElement?.textContent ?? "").trim(),
      buttons: Array.from(document.querySelectorAll('[role="alertdialog"] button')).map((button) => button.textContent?.trim() ?? ""),
    }));
    await trips.keyboard.press("Escape");
    report.deleteDialog.closedWithEscape = !(await trips.locator('[role="alertdialog"]').count());
  } else {
    report.deleteDialog = { rendered: false, reason: "No saved trip is available in this user session." };
  }
  await trips.close();

  report.reducedMotion.navigation = await motionSnapshot("/", [".top-nav a", ".button-teal", ".three-background canvas", ".nature-backdrop", ".nature-ridge-near", ".nature-fireflies span", ".home-beach-cinematic > img", ".beach-sun-haze", ".beach-surf", ".beach-glints i", ".beach-palm"]);
  report.reducedMotion.planner = await motionSnapshot("/planner", [".planner-card", ".button-teal", ".three-background canvas", ".nature-backdrop", ".nature-mist", ".nature-aurora"]);
  report.reducedMotion.explorer = await motionSnapshot("/explore", [".explore-filters", ".explore-card", ".three-background canvas", ".nature-backdrop", ".nature-forest-near", ".nature-fireflies span"]);
  report.reducedMotion.destinationDetail = await motionSnapshot("/explore/goa", [".explore-detail-link", ".button-teal", ".three-background canvas"]);
  report.reducedMotion.profile = await motionSnapshot("/profile", [".preference-editor button", ".button-teal", ".three-background canvas"]);
  report.homeCinematic.desktop = await homeCinematicSnapshot("desktop", { width: 1280, height: 720 });
  report.homeCinematic.mobile = await homeCinematicSnapshot("mobile", { width: 375, height: 812 });

  const fallbackPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await fallbackPage.goto(`${baseUrl}/explore/goa`, { waitUntil: "networkidle" });
  await fallbackPage.waitForTimeout(1500);
  report.mapFallback = await fallbackPage.evaluate(() => {
    const fallback = document.querySelector(".map-fallback");
    const link = fallback?.querySelector("a");
    return { visible: Boolean(fallback), linkText: link?.textContent?.trim() ?? null, linkHref: link?.getAttribute("href") ?? null };
  });
  await fallbackPage.close();
} finally {
  await browser.close();
}

await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/ui-verification.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
