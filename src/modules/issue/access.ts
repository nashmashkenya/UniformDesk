import type { SessionUser } from "@/lib/auth";
import { canSupplierWrite, canWrite } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertSupplierSchoolLink } from "@/modules/supply/orders";

export type IssueAccess = {
  schoolId: string;
  actorUserId: string;
  mode: "school" | "supplier_coissue";
};

/**
 * Resolve which school stock/roster an actor may issue against.
 * School users: their own school.
 * Supplier users: a linked school (co-issue during admission).
 */
export async function resolveIssueAccess(
  user: SessionUser,
  schoolIdFromClient?: string | null,
): Promise<IssueAccess> {
  if (user.tenant === "school" && user.schoolId) {
    if (!canWrite(user.role)) {
      throw new Error("No permission to issue");
    }
    if (
      schoolIdFromClient &&
      schoolIdFromClient !== user.schoolId
    ) {
      throw new Error("Cannot issue for another school");
    }
    return {
      schoolId: user.schoolId,
      actorUserId: user.id,
      mode: "school",
    };
  }

  if (user.tenant === "supplier" && user.supplierId) {
    if (!canSupplierWrite(user.role)) {
      throw new Error("No permission to issue");
    }
    const schoolId = schoolIdFromClient?.trim();
    if (!schoolId) {
      throw new Error("Select a linked school to issue at");
    }
    await assertSupplierSchoolLink(user.supplierId, schoolId);
    return {
      schoolId,
      actorUserId: user.id,
      mode: "supplier_coissue",
    };
  }

  throw new Error("Unauthorized");
}

export async function assertCanViewSchoolSlip(
  user: SessionUser,
  schoolId: string,
) {
  if (user.tenant === "school" && user.schoolId === schoolId) return;
  if (user.tenant === "supplier" && user.supplierId) {
    await assertSupplierSchoolLink(user.supplierId, schoolId);
    return;
  }
  throw new Error("Unauthorized");
}

export function issuerAffiliation(user: {
  name: string;
  role: string;
  supplier?: { brandName: string | null; name: string } | null;
  school?: { name: string } | null;
}) {
  if (user.role === "supplier_admin" || user.role === "supplier_staff") {
    const brand =
      user.supplier?.brandName || user.supplier?.name || "Supplier";
    return `${user.name} · ${brand} (co-issue)`;
  }
  return `${user.name} · school desk`;
}

export async function getSlipForViewer(slipId: string) {
  return prisma.issueSlip.findFirst({
    where: { id: slipId },
    include: {
      lines: { include: { item: true } },
      student: true,
      issuedBy: { include: { supplier: true, school: true } },
      voidedBy: true,
      school: true,
    },
  });
}
