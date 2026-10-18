import { SignJWT } from "jose";
import { chromium } from "playwright-core";

const baseUrl = process.env.TRIPWISE_URL || "https://3000-il39stmgdbt20qgvrc9x3-21b76c98.us3.manus.computer";
const cookieSecret = process.env.JWT_SECRET;
const appId = process.env.VITE_APP_ID;
const openId = process.env.OWNER_OPEN_ID;
const name = process.env.OWNER_NAME || "TripWise owner";

if (!cookieSecret || !appId || !openId) throw new Error("The project session variables are unavailable for planner verification.");

const token = await new SignJWT({ openId, appId, name })
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setExpirationTime(Math.floor(Date.now() / 1000) + 300)
  .sign(new TextEncoder().encode(cookieSecret));

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await context.addCookies([{ name: "app_session_id", value: token, url: baseUrl, httpOnly: true, secure: true, sameSite: "None" }]);
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/planner`, { waitUntil: "networkidle" });
  const generate = page.getByRole("button", { name: /generate my itinerary/i });
  await generate.waitFor({ state: "visible" });
  await page.waitForFunction(button => !button.disabled, await generate.elementHandle());
  const startedAt = Date.now();
  const generationResponse = page.waitForResponse(response => response.request().method() === "POST" && response.url().includes("travel.generateItinerary"));
  await generate.click();
  const apiResponse = await generationResponse;
  const apiPayload = await apiResponse.json();
  const itinerary = apiPayload?.[0]?.result?.data?.json;
  if (!Array.isArray(itinerary?.days) || itinerary.days.length === 0 || itinerary.days.some(day => !Array.isArray(day.stops) || day.stops.length === 0)) {
    throw new Error("The planner response did not include a complete itinerary payload.");
  }
  if (itinerary.generatedByAI !== true) throw new Error("The planner returned a fallback route rather than verified AI itinerary content.");
  await page.waitForURL(/\/trip\/current$/, { timeout: 35000 });
  await page.getByRole("heading", { name: /itinerary/i }).waitFor({ state: "visible", timeout: 5000 });
  const renderedDayCount = await page.locator(".itinerary-day").count();
  const renderedStopCount = await page.locator(".trip-stop").count();
  if (renderedDayCount === 0 || renderedStopCount === 0) throw new Error("The itinerary page did not render day and stop content.");
  const report = { reachedItinerary: true, generatedByAI: itinerary.generatedByAI, elapsedMilliseconds: Date.now() - startedAt, apiDayCount: itinerary.days.length, apiStopCount: itinerary.days.reduce((sum, day) => sum + day.stops.length, 0), renderedDayCount, renderedStopCount, url: page.url() };
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
