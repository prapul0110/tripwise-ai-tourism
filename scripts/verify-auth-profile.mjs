import { SignJWT } from "jose";
import { chromium } from "playwright-core";

const baseUrl = process.env.TRIPWISE_URL || "https://3000-il39stmgdbt20qgvrc9x3-21b76c98.us3.manus.computer";
const cookieSecret = process.env.JWT_SECRET;
const appId = process.env.VITE_APP_ID;
const openId = process.env.OWNER_OPEN_ID;
const name = process.env.OWNER_NAME || "TripWise owner";

if (!cookieSecret || !appId || !openId) throw new Error("The project session variables are unavailable for the authenticated UI audit.");

const token = await new SignJWT({ openId, appId, name })
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setExpirationTime(Math.floor(Date.now() / 1000) + 300)
  .sign(new TextEncoder().encode(cookieSecret));

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await context.addCookies([{ name: "app_session_id", value: token, url: baseUrl, httpOnly: true, secure: true, sameSite: "None" }]);
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/profile`, { waitUntil: "networkidle" });
  const profileVisible = await page.locator("main").innerText().then(text => /travel profile|preferences/i.test(text));
  const focusOrder = [];
  for (let index = 0; index < 9; index += 1) {
    await page.keyboard.press("Tab");
    focusOrder.push(await page.evaluate(() => {
      const active = document.activeElement;
      return active?.getAttribute("aria-label") || active?.textContent?.trim() || active?.tagName || "";
    }));
  }
  const controls = await page.locator("input, button, [role='combobox']").evaluateAll(nodes => nodes.map(node => ({
    tag: node.tagName,
    label: node.getAttribute("aria-label") || node.textContent?.trim() || "",
    disabled: node.hasAttribute("disabled"),
  })).filter(control => !control.disabled));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotion = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  console.log(JSON.stringify({ profileVisible, interactiveControlCount: controls.length, reducedMotion, focusOrder, controls: controls.slice(0, 12) }, null, 2));
} finally {
  await browser.close();
}
