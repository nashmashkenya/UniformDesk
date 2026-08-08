import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "screenshots");
const base = "http://localhost:3000";

async function shot(page, name) {
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(out, `${name}.png`),
    fullPage: true,
  });
  console.log("saved", name, page.url());
}

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.25,
});
const page = await ctx.newPage();

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "supply@uniformdesk.co");
await page.fill('input[name="password"]', "desk1234");
await Promise.all([
  page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 }),
  page.click('button[type="submit"]'),
]);

for (const [listPath, detailPrefix, name] of [
  ["/supplier/deliveries", "/supplier/deliveries/", "31-supplier-delivery-detail"],
  ["/supplier/invoices", "/supplier/invoices/", "32-supplier-invoice-detail"],
  ["/supplier/orders", "/supplier/orders/", "33-supplier-order-detail"],
]) {
  await page.goto(`${base}${listPath}`, { waitUntil: "networkidle" });
  const href = await page.evaluate((prefix) => {
    const anchors = [...document.querySelectorAll("a[href]")];
    const hit = anchors.find((a) => {
      const h = a.getAttribute("href") || "";
      return h.startsWith(prefix) && h.length > prefix.length;
    });
    return hit?.getAttribute("href") || null;
  }, detailPrefix);
  console.log(listPath, "->", href);
  if (!href) {
    // dump page text snippet for debugging
    const text = await page.locator("main, body").first().innerText();
    console.log("no detail link; page snippet:", text.slice(0, 400));
    continue;
  }
  await page.goto(href.startsWith("http") ? href : `${base}${href}`, {
    waitUntil: "networkidle",
  });
  await shot(page, name);
}

await browser.close();
console.log("supplier details done");
