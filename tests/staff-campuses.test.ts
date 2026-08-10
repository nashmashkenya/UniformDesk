import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import {
  assertActorCampusAccess,
  listActorCampuses,
  pickCampus,
  setStaffCampuses,
} from "@/modules/identity/supplier-campuses";
import { resolveIssueAccess } from "@/modules/issue/access";
import { seedSupplyChain } from "./helpers/fixtures";

function asSession(
  user: { id: string; email: string; name: string; role: "supplier_admin" | "supplier_staff"; supplierId: string | null },
  supplierName = "Test Supply",
): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: null,
    supplierId: user.supplierId,
    schoolName: null,
    supplierName,
    tenant: "supplier",
  };
}

describe("staff campus assignments", () => {
  it("gives admins all linked schools and staff only assigned ones", async () => {
    const chain = await seedSupplyChain();
    const riverside = await prisma.school.create({
      data: { name: "Riverside Test", code: `R${Date.now().toString(36).toUpperCase().slice(-6)}` },
    });
    await prisma.supplierSchool.create({
      data: { supplierId: chain.supplier.id, schoolId: riverside.id },
    });

    const adminCampuses = await listActorCampuses(
      asSession(chain.supplierUser) as SessionUser & { supplierId: string },
    );
    expect(adminCampuses.map((c) => c.id).sort()).toEqual(
      [chain.school.id, riverside.id].sort(),
    );

    const staffCampuses = await listActorCampuses(
      asSession(chain.supplierStaff) as SessionUser & { supplierId: string },
    );
    expect(staffCampuses).toHaveLength(1);
    expect(staffCampuses[0]?.id).toBe(chain.school.id);

    await setStaffCampuses({
      supplierId: chain.supplier.id,
      userId: chain.supplierStaff.id,
      schoolIds: [chain.school.id, riverside.id],
    });

    const multi = await listActorCampuses(
      asSession(chain.supplierStaff) as SessionUser & { supplierId: string },
    );
    expect(multi).toHaveLength(2);
    expect(pickCampus(multi, riverside.id)?.id).toBe(riverside.id);
    expect(pickCampus(multi, "missing")?.id).toBe(multi[0]?.id);
  });

  it("blocks staff issue on unassigned linked schools", async () => {
    const chain = await seedSupplyChain();
    const other = await prisma.school.create({
      data: {
        name: "Unassigned Campus",
        code: `U${Date.now().toString(36).toUpperCase().slice(-6)}`,
      },
    });
    await prisma.supplierSchool.create({
      data: { supplierId: chain.supplier.id, schoolId: other.id },
    });

    await expect(
      resolveIssueAccess(asSession(chain.supplierStaff), other.id),
    ).rejects.toThrow(/not assigned/i);

    await expect(
      assertActorCampusAccess(
        asSession(chain.supplierStaff) as SessionUser & { supplierId: string },
        other.id,
      ),
    ).rejects.toThrow(/not assigned/i);

    // Admin may still issue there
    await expect(
      resolveIssueAccess(asSession(chain.supplierUser), other.id),
    ).resolves.toMatchObject({
      schoolId: other.id,
      mode: "supplier_coissue",
    });
  });

  it("rejects assigning campuses that are not linked", async () => {
    const chain = await seedSupplyChain();
    const orphan = await prisma.school.create({
      data: {
        name: "Orphan",
        code: `X${Date.now().toString(36).toUpperCase().slice(-6)}`,
      },
    });

    await expect(
      setStaffCampuses({
        supplierId: chain.supplier.id,
        userId: chain.supplierStaff.id,
        schoolIds: [orphan.id],
      }),
    ).rejects.toThrow(/already linked/i);
  });

  it("allows clearing staff campuses (blocks issue until reassigned)", async () => {
    const chain = await seedSupplyChain();
    await setStaffCampuses({
      supplierId: chain.supplier.id,
      userId: chain.supplierStaff.id,
      schoolIds: [],
    });

    const campuses = await listActorCampuses(
      asSession(chain.supplierStaff) as SessionUser & { supplierId: string },
    );
    expect(campuses).toHaveLength(0);

    await expect(
      resolveIssueAccess(asSession(chain.supplierStaff), chain.school.id),
    ).rejects.toThrow(/not assigned/i);
  });
});
