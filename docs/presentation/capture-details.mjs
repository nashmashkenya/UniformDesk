import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "screenshots");
const base = "http://localhost:3000";

async function login(page, ctx, email) {
  await ctx.clearCookies();
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "desk1234");
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function shot(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
  console.log("saved", name);
}

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.25,
});
const page = await ctx.newPage();

await login(page, ctx, "store@greenfield.school");
const result = await page.evaluate(async () => {
  const res = await fetch("/api/v1/issue-desk");
  if (!res.ok) return { error: await res.text() };
  const desk = await res.json();
  const student = desk.students?.[0];
  const item = desk.items?.[0];
  const size = item?.sizes?.[0]?.sizeLabel || "M";
  if (!student || !item) return { error: "no student/item" };
  const issue = await fetch("/api/v1/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: student.id,
      acknowledgmentName: "Parent Demo",
      acknowledgmentSignature:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      lines: [{ itemId: item.id, sizeLabel: size, qtyRequested: 1 }],
    }),
  });
  return { ok: issue.ok, data: await issue.json() };
});
console.log("issue", result);

if (result?.data?.slipId) {
  await page.goto(`${base}/slips/${result.data.slipId}`, {
    waitUntil: "networkidle",
  });
  await shot(page, "19-school-slip");
  if (result.data.publicToken) {
    await ctx.clearCookies();
    await page.goto(`${base}/v/${result.data.publicToken}`, {
      waitUntil: "networkidle",
    });
    await shot(page, "20-public-proof");
  }
}

await login(page, ctx, "supply@uniformdesk.co");
await page.goto(`${base}/supplier/deliveries`, { waitUntil: "networkidle" });
const dn = page.locator('a[href*="/supplier/deliveries/"]').first();
if (await dn.count()) {
  await dn.click();
  await page.waitForLoadState("networkidle");
  await shot(page, "31-supplier-delivery-detail");
}

await page.goto(`${base}/supplier/invoices`, { waitUntil: "networkidle" });
const inv = page.locator('a[href*="/supplier/invoices/"]').first();
if (await inv.count()) {
  await inv.click();
  await page.waitForLoadState("networkidle");
  await shot(page, "32-supplier-invoice-detail");
}

await page.goto(`${base}/supplier/orders`, { waitUntil: "networkidle" });
const ord = page.locator('a[href*="/supplier/orders/"]').first();
if (await ord.count()) {
  await ord.click();
  await page.waitForLoadState("networkidle");
  await shot(page, "33-supplier-order-detail");
}

await browser.close();
console.log("details done");
