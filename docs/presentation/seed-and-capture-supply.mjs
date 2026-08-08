import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "screenshots");
const base = "http://localhost:3000";

async function login(page, email) {
  await page.context().clearCookies();
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "desk1234");
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function shot(page, name) {
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(out, `${name}.png`),
    fullPage: true,
  });
  console.log("saved", name, "->", page.url());
}

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.25,
});
const page = await ctx.newPage();

await login(page, "supply@uniformdesk.co");

// Create order if none exist with detail links
await page.goto(`${base}/supplier/orders`, { waitUntil: "networkidle" });
let orderHref = await page.evaluate(() => {
  const a = [...document.querySelectorAll("a[href]")].find((el) => {
    const h = el.getAttribute("href") || "";
    return /^\/supplier\/orders\/[^/]+$/.test(h);
  });
  return a?.getAttribute("href") || null;
});
if (!orderHref) {
  const createBtn = page.getByRole("button", { name: /Create order/i });
  if (await createBtn.count()) {
    await Promise.all([
      page.waitForURL(/\/supplier\/orders\//, { timeout: 30000 }),
      createBtn.click(),
    ]);
    orderHref = page.url().replace(base, "");
    console.log("created order", orderHref);
  }
} else {
  await page.goto(`${base}${orderHref}`, { waitUntil: "networkidle" });
}
if (page.url().includes("/supplier/orders/")) {
  await shot(page, "33-supplier-order-detail");
}

// Create delivery
await page.goto(`${base}/supplier/deliveries`, { waitUntil: "networkidle" });
let dnHref = await page.evaluate(() => {
  const a = [...document.querySelectorAll("a[href]")].find((el) => {
    const h = el.getAttribute("href") || "";
    return /^\/supplier\/deliveries\/[^/]+$/.test(h);
  });
  return a?.getAttribute("href") || null;
});
if (!dnHref) {
  const createBtn = page.getByRole("button", { name: /Create delivery/i });
  await Promise.all([
    page.waitForURL(/\/supplier\/deliveries\//, { timeout: 30000 }),
    createBtn.click(),
  ]);
  dnHref = page.url().replace(base, "");
  console.log("created delivery", dnHref);
} else {
  await page.goto(`${base}${dnHref}`, { waitUntil: "networkidle" });
}
await shot(page, "31-supplier-delivery-detail");

// Create invoice from delivery detail
const invBtn = page.getByRole("button", { name: /Create invoice/i });
if (await invBtn.count()) {
  await Promise.all([
    page.waitForURL(/\/supplier\/invoices\//, { timeout: 30000 }),
    invBtn.click(),
  ]);
  console.log("created invoice", page.url());
  await shot(page, "32-supplier-invoice-detail");
} else {
  await page.goto(`${base}/supplier/invoices`, { waitUntil: "networkidle" });
  const invHref = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a[href]")].find((el) => {
      const h = el.getAttribute("href") || "";
      return /^\/supplier\/invoices\/[^/]+$/.test(h);
    });
    return a?.getAttribute("href") || null;
  });
  if (invHref) {
    await page.goto(`${base}${invHref}`, { waitUntil: "networkidle" });
    await shot(page, "32-supplier-invoice-detail");
  } else {
    console.log("no invoice available");
  }
}

await browser.close();
console.log("done");
