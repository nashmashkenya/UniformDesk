/**
 * Live smoke: supplier staff co-issues at linked Greenfield school.
 */
import { chromium } from "playwright";

const base = "http://localhost:3000";
const SIG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const ctx = await browser.newContext();
const page = await ctx.newPage();

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "staff@uniformdesk.co");
await page.fill('input[name="password"]', "desk1234");
await Promise.all([
  page.waitForURL((u) => !u.pathname.includes("/login")),
  page.click('button[type="submit"]'),
]);

await page.goto(`${base}/supplier/issue`, { waitUntil: "networkidle" });
const title = await page.locator("h1").first().innerText();
const schoolId = await page.locator("[data-school-id]").getAttribute("data-school-id");
console.log("page:", title, "schoolId:", schoolId);

if (!schoolId) {
  console.error("No school selected on co-issue page");
  process.exit(1);
}

const result = await page.evaluate(
  async ({ schoolId, SIG }) => {
    const deskRes = await fetch(
      `/api/v1/issue-desk?schoolId=${encodeURIComponent(schoolId)}`,
    );
    const deskJson = await deskRes.json();
    const student = deskJson.students?.[0];
    const item = deskJson.items?.[0];
    const size = item?.sizes?.[0]?.sizeLabel || "M";
    if (!student || !item) {
      return { error: "missing desk data", deskStatus: deskRes.status, deskJson };
    }
    const issueRes = await fetch("/api/v1/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId,
        studentId: student.id,
        acknowledgmentName: "Co-issue Parent",
        acknowledgmentSignature: SIG,
        lines: [{ itemId: item.id, sizeLabel: size, qtyRequested: 1 }],
      }),
    });
    return {
      deskStatus: deskRes.status,
      issueStatus: issueRes.status,
      issue: await issueRes.json(),
    };
  },
  { schoolId, SIG },
);

console.log("co-issue result:", JSON.stringify(result, null, 2));

if (result.issue?.slipId) {
  await page.goto(`${base}/supplier/slips/${result.issue.slipId}`, {
    waitUntil: "networkidle",
  });
  console.log(
    "slip page:",
    page.url(),
    await page.locator("h1").first().innerText(),
  );
  const issuer = await page.locator("text=co-issue").first().innerText().catch(() => "");
  console.log("issuer label snippet:", issuer || "(see page)");
  await page.goto(`${base}/supplier/activity`, { waitUntil: "networkidle" });
  const text = await page.locator("body").innerText();
  console.log("activity has co-issue:", /Co-issue|Co-issued/i.test(text));
}

await browser.close();
const ok = Boolean(result.issue?.ok);
console.log(ok ? "VERIFY_OK" : "VERIFY_FAIL");
process.exit(ok ? 0 : 1);
