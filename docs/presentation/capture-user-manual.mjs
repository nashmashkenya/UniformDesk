/**
 * Live screenshots for UniformDesk User Manual (supplier-first product).
 * Requires app on APP_URL (default http://localhost:3000) with seed data.
 */
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
  await page.waitForTimeout(500);
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", name);
}

async function login(page, email, password) {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 25000,
    }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(700);
}

async function gotoShot(page, route, name) {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  await shot(page, name);
}

async function clickFirst(page, selector) {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) return false;
  await el.click();
  await page.waitForLoadState("networkidle");
  return true;
}

/**
 * Prefer an existing slip link; otherwise create one via POST /api/v1/issue.
 * Payload matches parseIssuePayload + the successful UD-2026-00001 capture:
 * { studentId, kitId, paymentMethod: "cash", paymentReference, lines: [{itemId,sizeLabel,qtyRequested}] }
 * IDs/sizes are resolved from GET /api/v1/issue-desk (not hardcoded seed ids).
 */
async function ensureSchoolSlipShot(page) {
  await page.goto(`${base}/search?q=UD`, { waitUntil: "networkidle" });
  if (await clickFirst(page, 'a[href*="/slips/"]')) {
    await shot(page, "um-22-school-slip");
    return;
  }
  await page.goto(`${base}/reports`, { waitUntil: "networkidle" });
  if (await clickFirst(page, 'a[href*="/slips/"]')) {
    await shot(page, "um-22-school-slip");
    return;
  }

  const deskRes = await page.request.get(`${base}/api/v1/issue-desk`);
  if (!deskRes.ok()) {
    console.warn("um-22: issue-desk failed", deskRes.status());
    return;
  }
  const desk = await deskRes.json();
  const student =
    desk.students?.find((s) => s.admissionNo === "GFS-001") ||
    desk.students?.[0];
  const kit = desk.kits?.[0];
  if (!student || !kit?.lines?.length) {
    console.warn("um-22: no student/kit on issue desk");
    return;
  }

  const stocked = new Set(
    (desk.balances || [])
      .filter((b) => b.qtyOnHand > 0)
      .map((b) => `${b.itemId}::${b.sizeLabel}`),
  );

  const lines = [];
  for (const kl of kit.lines) {
    const sizes = kl.item?.sizes?.map((s) => s.sizeLabel) || [];
    const sizeLabel =
      sizes.find((sz) => stocked.has(`${kl.itemId}::${sz}`)) || sizes[0];
    if (!sizeLabel) continue;
    lines.push({ itemId: kl.itemId, sizeLabel, qtyRequested: 1 });
  }
  if (!lines.length) {
    console.warn("um-22: could not build issue lines");
    return;
  }

  const issueRes = await page.request.post(`${base}/api/v1/issue`, {
    data: {
      studentId: student.id,
      kitId: kit.id,
      paymentMethod: "cash",
      paymentReference: "CAPTURE-SLIP",
      lines,
    },
  });
  const body = await issueRes.json().catch(() => ({}));
  if (!issueRes.ok()) {
    console.warn("um-22: issue API failed", issueRes.status(), body);
    return;
  }
  const slipId = body.slipId;
  if (!slipId) {
    console.warn("um-22: no slipId in response", body);
    return;
  }
  await page.goto(`${base}/slips/${slipId}`, { waitUntil: "networkidle" });
  await shot(page, "um-22-school-slip");
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

  // --- Login ---
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await shot(page, "um-01-login");

  // --- School reporter ---
  await login(page, "report@greenfield.school", "desk1234");
  await shot(page, "um-10-school-home");

  for (const [route, name] of [
    ["/issue", "um-11-school-issue"],
    ["/incomplete", "um-12-school-still-owed"],
    ["/stock", "um-13-school-stock"],
    ["/reports", "um-14-school-reports"],
    ["/students", "um-15-school-students"],
    ["/deliveries", "um-16-school-deliveries"],
    ["/receive", "um-17-school-receive"],
    ["/activity", "um-18-school-activity"],
    ["/notifications", "um-19-school-notifications"],
    ["/search?q=Brian", "um-20-school-search"],
  ]) {
    await gotoShot(page, route, name);
  }

  await page.goto(`${base}/students`, { waitUntil: "networkidle" });
  if (await clickFirst(page, 'a[href^="/students/"]')) {
    await shot(page, "um-21-school-student-history");
  }

  await ensureSchoolSlipShot(page);

  await page.goto(`${base}/deliveries`, { waitUntil: "networkidle" });
  if (await clickFirst(page, 'a[href^="/deliveries/"]')) {
    await shot(page, "um-23-school-delivery-detail");
  }

  // --- Supplier admin ---
  await context.clearCookies();
  await login(page, "supply@uniformdesk.co", "desk1234");
  await shot(page, "um-30-supplier-home");

  for (const [route, name] of [
    ["/supplier/schools", "um-31-supplier-schools"],
    ["/supplier/catalog", "um-32-supplier-catalog"],
    ["/supplier/issue", "um-33-supplier-coissue"],
    ["/supplier/incomplete", "um-34-supplier-still-owed"],
    ["/supplier/reports", "um-35-supplier-reports"],
    ["/supplier/reports?view=stock", "um-36-supplier-reports-stock"],
    ["/supplier/orders", "um-37-supplier-orders"],
    ["/supplier/deliveries", "um-38-supplier-deliveries"],
    ["/supplier/invoices", "um-39-supplier-invoices"],
    ["/supplier/activity", "um-40-supplier-activity"],
    ["/supplier/notifications", "um-41-supplier-notifications"],
    ["/supplier/search?q=GFS", "um-42-supplier-search"],
    ["/supplier/branding", "um-43-supplier-branding"],
  ]) {
    await gotoShot(page, route, name);
  }

  await page.goto(`${base}/supplier/deliveries`, { waitUntil: "networkidle" });
  if (await clickFirst(page, 'a[href^="/supplier/deliveries/"]')) {
    await shot(page, "um-44-supplier-delivery-detail");
  }

  await page.goto(`${base}/supplier/invoices`, { waitUntil: "networkidle" });
  if (await clickFirst(page, 'a[href^="/supplier/invoices/"]')) {
    await shot(page, "um-45-supplier-invoice-detail");
  }

  await page.goto(`${base}/supplier/orders`, { waitUntil: "networkidle" });
  if (await clickFirst(page, 'a[href^="/supplier/orders/"]')) {
    await shot(page, "um-46-supplier-order-detail");
  }

  // Supplier staff view (same portal, no branding)
  await context.clearCookies();
  await login(page, "staff@uniformdesk.co", "desk1234");
  await shot(page, "um-50-supplier-staff-home");
  await gotoShot(page, "/supplier/issue", "um-51-supplier-staff-coissue");

  await browser.close();
  console.log("Done. Screenshots in", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
