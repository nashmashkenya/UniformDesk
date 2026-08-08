import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { resolveIssueAccess } from "@/modules/issue/access";
import { issueKit } from "@/modules/issue/issue";
import { supplierActivityFeed } from "@/modules/reports/activity";
import { seedSupplyChain } from "./helpers/fixtures";
import type { SessionUser } from "@/lib/auth";

function asSupplierSession(user: {
  id: string;
  email: string;
  name: string;
  role: "supplier_admin" | "supplier_staff";
  supplierId: string | null;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: null,
    supplierId: user.supplierId,
    schoolName: null,
    supplierName: "Test Supply",
    tenant: "supplier",
  };
}

describe("supplier co-issue at linked schools", () => {
  it("allows linked supplier staff to issue against school stock", async () => {
    const chain = await seedSupplyChain();
    const staff = chain.supplierStaff;

    const access = await resolveIssueAccess(
      asSupplierSession(staff),
      chain.school.id,
    );
    expect(access.mode).toBe("supplier_coissue");
    expect(access.schoolId).toBe(chain.school.id);

    const before = await prisma.stockBalance.findUniqueOrThrow({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: chain.school.id,
          itemId: chain.item.id,
          sizeLabel: "M",
        },
      },
    });

    const slip = await issueKit({
      schoolId: access.schoolId,
      actorUserId: access.actorUserId,
      studentId: chain.student.id,
      paymentMethod: "cash",
      lines: [
        { itemId: chain.item.id, sizeLabel: "M", qtyRequested: 2 },
      ],
    });

    expect(slip.issuedById).toBe(staff.id);
    expect(slip.schoolId).toBe(chain.school.id);

    const after = await prisma.stockBalance.findUniqueOrThrow({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: chain.school.id,
          itemId: chain.item.id,
          sizeLabel: "M",
        },
      },
    });
    expect(after.qtyOnHand).toBe(before.qtyOnHand - 2);

    const feed = await supplierActivityFeed(chain.supplier.id, 20);
    expect(feed.some((e) => e.kind === "co_issue" && e.correlationId === slip.slipNo)).toBe(
      true,
    );
  });

  it("rejects co-issue for an unlinked school", async () => {
    const chain = await seedSupplyChain();
    const other = await prisma.school.create({
      data: { name: "Other School", code: `O${Date.now().toString(36)}` },
    });

    await expect(
      resolveIssueAccess(asSupplierSession(chain.supplierUser), other.id),
    ).rejects.toThrow(/not linked/i);
  });

  it("rejects supplier access without schoolId", async () => {
    const chain = await seedSupplyChain();
    await expect(
      resolveIssueAccess(asSupplierSession(chain.supplierUser), null),
    ).rejects.toThrow(/select a linked school/i);
  });
});
