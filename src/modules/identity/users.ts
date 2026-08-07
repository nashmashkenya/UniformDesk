import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

const ROLES: Role[] = ["school_admin", "storekeeper", "auditor"];

export function listRoles() {
  return ROLES;
}

export async function listUsers(schoolId: string) {
  return prisma.user.findMany({
    where: { schoolId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function createUser(input: {
  schoolId: string;
  name: string;
  email: string;
  role: Role;
  password: string;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || !email) throw new Error("Name and email are required");
  if (!ROLES.includes(input.role)) throw new Error("Invalid role");
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const passwordHash = await hashPassword(password);

  try {
    return await prisma.user.create({
      data: {
        schoolId: input.schoolId,
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
}

export async function setUserActive(input: {
  schoolId: string;
  actorUserId: string;
  userId: string;
  active: boolean;
}) {
  if (input.actorUserId === input.userId && !input.active) {
    throw new Error("You cannot deactivate your own account");
  }

  const user = await prisma.user.findFirst({
    where: { id: input.userId, schoolId: input.schoolId },
  });
  if (!user) throw new Error("User not found");

  if (!input.active && user.role === "school_admin") {
    const adminCount = await prisma.user.count({
      where: {
        schoolId: input.schoolId,
        role: "school_admin",
        active: true,
      },
    });
    if (adminCount <= 1) {
      throw new Error("Keep at least one active school admin");
    }
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { active: input.active },
  });
}
