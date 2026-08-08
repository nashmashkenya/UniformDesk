import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "screenshots");
const base = process.env.APP_URL || "http://localhost:3000";

fs.mkdirSync(outDir, { recursive: true });

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", name);
}

async function login(page, email, password) {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(800);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.25,
  });
  const page = await context.newPage();

  // Public / login
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await shot(page, "01-login");

  // School desk tour
  await login(page, "store@greenfield.school", "desk1234");
  await shot(page, "02-school-home");

  for (const [route, name] of [
    ["/issue", "03-school-issue"],
    ["/stock", "04-school-stock"],
    ["/activity", "05-school-activity"],
    ["/notifications", "06-school-notifications"],
    ["/deliveries", "07-school-deliveries"],
    ["/orders", "08-school-orders"],
    ["/invoices", "09-school-invoices"],
    ["/reorder", "10-school-reorder"],
    ["/students", "11-school-students"],
    ["/search?q=UD", "12-school-search"],
    ["/reports", "13-school-reports"],
  ]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await shot(page, name);
  }

  // School admin pages
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  // logout via cookie clear
  await context.clearCookies();
  await login(page, "admin@greenfield.school", "desk1234");
  for (const [route, name] of [
    ["/catalog", "14-school-catalog"],
    ["/kits", "15-school-kits"],
    ["/users", "16-school-users"],
    ["/integrations", "17-school-integrations"],
  ]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await shot(page, name);
  }

  // Try open first slip if any from home recent - go students first student
  await page.goto(`${base}/students`, { waitUntil: "networkidle" });
  const studentLink = page.locator('a[href^="/students/"]').first();
  if (await studentLink.count()) {
    await studentLink.click();
    await page.waitForLoadState("networkidle");
    await shot(page, "18-school-student-history");
  }

  await page.goto(`${base}/slips`, { waitUntil: "domcontentloaded" }).catch(() => {});
  // Find a slip via search
  await page.goto(`${base}/search?q=UD`, { waitUntil: "networkidle" });
  const slipLink = page.locator('a[href^="/slips/"]').first();
  if (await slipLink.count()) {
    await slipLink.click();
    await page.waitForLoadState("networkidle");
    await shot(page, "19-school-slip");
    const proof = page.locator('a[href^="/v/"]').first();
    // get public token from share or navigate via page content
  }

  // Public proof - extract from any slip page link containing /v/
  const proofHref = await page.locator('a[href*="/v/"]').first().getAttribute("href").catch(() => null);
  if (proofHref) {
    await context.clearCookies();
    await page.goto(proofHref.startsWith("http") ? proofHref : `${base}${proofHref}`, {
      waitUntil: "networkidle",
    });
    await shot(page, "20-public-proof");
  } else {
    // fallback offline page
    await page.goto(`${base}/offline`, { waitUntil: "networkidle" });
    await shot(page, "20-offline");
  }

  // Supplier portal
  await context.clearCookies();
  await login(page, "supply@uniformdesk.co", "desk1234");
  await shot(page, "21-supplier-home");

  for (const [route, name] of [
    ["/supplier/orders", "22-supplier-orders"],
    ["/supplier/deliveries", "23-supplier-deliveries"],
    ["/supplier/invoices", "24-supplier-invoices"],
    ["/supplier/catalog", "25-supplier-catalog"],
    ["/supplier/schools", "26-supplier-schools"],
    ["/supplier/activity", "27-supplier-activity"],
    ["/supplier/notifications", "28-supplier-notifications"],
    ["/supplier/search?q=DN", "29-supplier-search"],
    ["/supplier/branding", "30-supplier-branding"],
  ]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await shot(page, name);
  }

  // Delivery detail if available
  await page.goto(`${base}/supplier/deliveries`, { waitUntil: "networkidle" });
  const dn = page.locator('a[href^="/supplier/deliveries/"]').first();
  if (await dn.count()) {
    await dn.click();
    await page.waitForLoadState("networkidle");
    await shot(page, "31-supplier-delivery-detail");
  }

  await page.goto(`${base}/supplier/invoices`, { waitUntil: "networkidle" });
  const inv = page.locator('a[href^="/supplier/invoices/"]').first();
  if (await inv.count()) {
    await inv.click();
    await page.waitForLoadState("networkidle");
    await shot(page, "32-supplier-invoice-detail");
  }

  await browser.close();
  console.log("Done. Screenshots in", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
