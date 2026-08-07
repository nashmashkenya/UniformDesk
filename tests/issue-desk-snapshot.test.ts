import { describe, expect, it } from "vitest";
import { applyIssueToBalances } from "@/lib/offline-issue-snapshot";
import { loadIssueDeskData } from "@/modules/issue/issue-desk";
import { seedSchoolDesk } from "./helpers/fixtures";

describe("issue desk snapshot", () => {
  it("loads students, kits catalog items, and balances for a school", async () => {
    const desk = await seedSchoolDesk();
    const snap = await loadIssueDeskData(desk.school.id);

    expect(snap.schoolId).toBe(desk.school.id);
    expect(snap.students.some((s) => s.id === desk.student.id)).toBe(true);
    expect(snap.items.some((i) => i.id === desk.item.id)).toBe(true);
    expect(
      snap.balances.some(
        (b) =>
          b.itemId === desk.item.id &&
          b.sizeLabel === "M" &&
          b.qtyOnHand === desk.openingQty,
      ),
    ).toBe(true);
  });

  it("applies queued issue deltas without going negative", () => {
    const next = applyIssueToBalances(
      [
        { itemId: "a", sizeLabel: "M", qtyOnHand: 3 },
        { itemId: "a", sizeLabel: "L", qtyOnHand: 1 },
      ],
      [
        { itemId: "a", sizeLabel: "M", qtyRequested: 5 },
        { itemId: "a", sizeLabel: "L", qtyRequested: 1 },
      ],
    );

    expect(next.find((b) => b.sizeLabel === "M")?.qtyOnHand).toBe(0);
    expect(next.find((b) => b.sizeLabel === "L")?.qtyOnHand).toBe(0);
  });
});
