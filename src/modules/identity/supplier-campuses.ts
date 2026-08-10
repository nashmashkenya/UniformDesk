import {
  canSupplierManage,
  type SessionUser,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export type CampusSchool = {
  id: string;
  name: string;
  code: string;
};

/**
 * Campuses a supplier actor may use for issue / still owed / reports.
 * Admin → all linked schools. Staff → assigned campuses ∩ still-linked.
 */
export async function listActorCampuses(
  user: SessionUser & { supplierId: string },
): Promise<CampusSchool[]> {
  if (canSupplierManage(user.role)) {
    const links = await prisma.supplierSchool.findMany({
      where: { supplierId: user.supplierId },
      include: { school: true },
      orderBy: { school: { name: "asc" } },
    });
    return links.map((l) => ({
      id: l.school.id,
      name: l.school.name,
      code: l.school.code,
    }));
  }

  const rows = await prisma.supplierStaffCampus.findMany({
    where: {
      supplierId: user.supplierId,
      userId: user.id,
      school: {
        supplierLinks: {
          some: { supplierId: user.supplierId },
        },
      },
    },
    include: { school: true },
    orderBy: { school: { name: "asc" } },
  });

  return rows.map((r) => ({
    id: r.school.id,
    name: r.school.name,
    code: r.school.code,
  }));
}

export function pickCampus(
  campuses: CampusSchool[],
  schoolIdParam?: string | null,
): CampusSchool | null {
  if (!campuses.length) return null;
  return campuses.find((c) => c.id === schoolIdParam) ?? campuses[0] ?? null;
}

/** Server guard: staff may only touch assigned + linked campuses. */
export async function assertActorCampusAccess(
  user: SessionUser & { supplierId: string },
  schoolId: string,
) {
  const link = await prisma.supplierSchool.findUnique({
    where: {
      supplierId_schoolId: {
        supplierId: user.supplierId,
        schoolId,
      },
    },
  });
  if (!link) {
    throw new Error("School is not linked to this supplier");
  }

  if (canSupplierManage(user.role)) return;

  const assignment = await prisma.supplierStaffCampus.findUnique({
    where: {
      userId_schoolId: {
        userId: user.id,
        schoolId,
      },
    },
  });
  if (!assignment || assignment.supplierId !== user.supplierId) {
    throw new Error(
      "You are not assigned to this school. Ask a supplier admin to grant access.",
    );
  }
}

export async function listStaffCampusIds(
  supplierId: string,
  userId: string,
): Promise<string[]> {
  const rows = await prisma.supplierStaffCampus.findMany({
    where: { supplierId, userId },
    select: { schoolId: true },
  });
  return rows.map((r) => r.schoolId);
}

/**
 * Replace staff campus assignments. Admins clear to empty (they do not use this table).
 * schoolIds must be a subset of the supplier’s linked schools.
 */
export async function setStaffCampuses(input: {
  supplierId: string;
  userId: string;
  schoolIds: string[];
}) {
  const user = await prisma.user.findFirst({
    where: {
      id: input.userId,
      supplierId: input.supplierId,
      role: { in: ["supplier_admin", "supplier_staff"] },
    },
  });
  if (!user) throw new Error("Team member not found");

  const uniqueIds = [...new Set(input.schoolIds.map((id) => id.trim()).filter(Boolean))];

  if (user.role === "supplier_admin") {
    await prisma.supplierStaffCampus.deleteMany({
      where: { supplierId: input.supplierId, userId: input.userId },
    });
    return { schoolIds: [] as string[] };
  }

  if (uniqueIds.length) {
    const linked = await prisma.supplierSchool.findMany({
      where: {
        supplierId: input.supplierId,
        schoolId: { in: uniqueIds },
      },
      select: { schoolId: true },
    });
    if (linked.length !== uniqueIds.length) {
      throw new Error(
        "Campus assignments must be schools already linked to your organisation",
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.supplierStaffCampus.deleteMany({
      where: { supplierId: input.supplierId, userId: input.userId },
    });
    if (uniqueIds.length) {
      await tx.supplierStaffCampus.createMany({
        data: uniqueIds.map((schoolId) => ({
          supplierId: input.supplierId,
          userId: input.userId,
          schoolId,
        })),
      });
    }
  });

  return { schoolIds: uniqueIds };
}
