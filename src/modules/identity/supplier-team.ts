import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";
import { setStaffCampuses } from "@/modules/identity/supplier-campuses";

const TEAM_ROLES: Role[] = ["supplier_admin", "supplier_staff"];

export function listSupplierTeamRoles() {
  return TEAM_ROLES;
}

export async function listSupplierTeam(supplierId: string) {
  return prisma.user.findMany({
    where: {
      supplierId,
      role: { in: TEAM_ROLES },
    },
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      staffCampuses: {
        where: {
          school: {
            supplierLinks: { some: { supplierId } },
          },
        },
        include: {
          school: { select: { id: true, name: true, code: true } },
        },
        orderBy: { school: { name: "asc" } },
      },
    },
  });
}

export async function createSupplierTeamUser(input: {
  supplierId: string;
  name: string;
  email: string;
  role: Role;
  password: string;
  /** Required for useful staff accounts; ignored for admins. */
  schoolIds?: string[];
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || !email) throw new Error("Name and email are required");
  if (!TEAM_ROLES.includes(input.role)) {
    throw new Error("Role must be supplier admin or staff");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const passwordHash = await hashPassword(password);

  let created;
  try {
    created = await prisma.user.create({
      data: {
        supplierId: input.supplierId,
        schoolId: null,
        name,
        email,
        role: input.role,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });
  } catch {
    throw new Error("A user with this email already exists");
  }

  if (created.role === "supplier_staff") {
    await setStaffCampuses({
      supplierId: input.supplierId,
      userId: created.id,
      schoolIds: input.schoolIds ?? [],
    });
  }

  return created;
}

export async function resetSupplierTeamPassword(input: {
  supplierId: string;
  actorUserId: string;
  userId: string;
  password: string;
}) {
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: input.userId,
      supplierId: input.supplierId,
      role: { in: TEAM_ROLES },
    },
  });
  if (!user) throw new Error("Team member not found");

  const passwordHash = await hashPassword(input.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
}

export async function setSupplierTeamActive(input: {
  supplierId: string;
  actorUserId: string;
  userId: string;
  active: boolean;
}) {
  if (input.actorUserId === input.userId && !input.active) {
    throw new Error("You cannot deactivate your own account");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: input.userId,
      supplierId: input.supplierId,
      role: { in: TEAM_ROLES },
    },
  });
  if (!user) throw new Error("Team member not found");

  if (!input.active && user.role === "supplier_admin") {
    const adminCount = await prisma.user.count({
      where: {
        supplierId: input.supplierId,
        role: "supplier_admin",
        active: true,
      },
    });
    if (adminCount <= 1) {
      throw new Error("Keep at least one active supplier admin");
    }
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { active: input.active },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });
}
