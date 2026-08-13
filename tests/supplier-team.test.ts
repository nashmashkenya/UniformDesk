import { describe, expect, it } from "vitest";
import {
  createSupplierTeamUser,
  listSupplierTeam,
  resetSupplierTeamPassword,
  setSupplierTeamActive,
} from "@/modules/identity/supplier-team";
import { isSupplierStaffAllowedPath } from "@/lib/supplier-access";
import type { SessionUser } from "@/lib/auth";
import { seedSupplyChain } from "./helpers/fixtures";

function sessionFor(
  chain: Awaited<ReturnType<typeof seedSupplyChain>>,
  role: "supplier_admin" | "supplier_staff",
): SessionUser {
  const u = role === "supplier_admin" ? chain.supplierUser : chain.supplierStaff;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role,
    schoolId: null,
    supplierId: chain.supplier.id,
    schoolName: null,
    supplierName: chain.supplier.name,
    tenant: "supplier",
  };
}

describe("supplier team", () => {
  it("creates staff and lists the directory", async () => {
    const chain = await seedSupplyChain();
    const created = await createSupplierTeamUser({
      supplierId: chain.supplier.id,
      name: "Desk Clerk",
      email: `clerk-${chain.supplier.id}@test.co`,
      role: "supplier_staff",
      password: "desk1234x",
      schoolIds: [chain.school.id],
    });

    expect(created.role).toBe("supplier_staff");
    expect(created.active).toBe(true);

    const team = await listSupplierTeam(chain.supplier.id);
    expect(team.some((m) => m.id === created.id)).toBe(true);
  });

  it("resets password and refuses deactivating the last admin", async () => {
    const chain = await seedSupplyChain();
    await resetSupplierTeamPassword({
      supplierId: chain.supplier.id,
      actorUserId: chain.supplierUser.id,
      userId: chain.supplierStaff.id,
      password: "newpass99",
    });

    await expect(
      setSupplierTeamActive({
        supplierId: chain.supplier.id,
        actorUserId: chain.supplierStaff.id,
        userId: chain.supplierUser.id,
        active: false,
      }),
    ).rejects.toThrow(/at least one active supplier admin/i);
  });
});

describe("supplier staff path matrix", () => {
  it("allows issue paths and blocks admin routes", () => {
    const staff: SessionUser = {
      id: "s1",
      email: "staff@test.co",
      name: "Staff",
      role: "supplier_staff",
      schoolId: null,
      supplierId: "sup1",
      schoolName: null,
      supplierName: "Co",
      tenant: "supplier",
    };

    expect(isSupplierStaffAllowedPath(staff, "/supplier")).toBe(true);
    expect(isSupplierStaffAllowedPath(staff, "/supplier/issue")).toBe(true);
    expect(isSupplierStaffAllowedPath(staff, "/supplier/incomplete")).toBe(
      true,
    );
    expect(isSupplierStaffAllowedPath(staff, "/supplier/reports")).toBe(true);
    expect(isSupplierStaffAllowedPath(staff, "/supplier/slips/abc")).toBe(
      true,
    );

    expect(isSupplierStaffAllowedPath(staff, "/supplier/schools")).toBe(false);
    expect(isSupplierStaffAllowedPath(staff, "/supplier/orders")).toBe(false);
    expect(isSupplierStaffAllowedPath(staff, "/supplier/team")).toBe(false);
    expect(isSupplierStaffAllowedPath(staff, "/supplier/catalog")).toBe(false);
    expect(isSupplierStaffAllowedPath(staff, "/supplier/deliveries")).toBe(
      false,
    );
    expect(isSupplierStaffAllowedPath(staff, "/supplier/invoices")).toBe(
      false,
    );
  });

  it("lets admins use all supplier paths", async () => {
    const chain = await seedSupplyChain();
    const admin = sessionFor(chain, "supplier_admin");
    expect(isSupplierStaffAllowedPath(admin, "/supplier/team")).toBe(true);
    expect(isSupplierStaffAllowedPath(admin, "/supplier/invoices/x")).toBe(
      true,
    );
  });
});
