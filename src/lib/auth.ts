import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session-token";
import type { Role } from "@/generated/prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  schoolId: string | null;
  supplierId: string | null;
  schoolName: string | null;
  supplierName: string | null;
  tenant: "school" | "supplier";
};

/** Active school campus role (+ legacy aliases still in DB). */
const SCHOOL_OPERATOR_ROLES: Role[] = [
  "school_reporter",
  "storekeeper",
  "school_admin",
  "auditor",
];

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await signSessionToken(userId);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const userId = await verifySessionToken(token);
    if (!userId) return null;

    const user = await prisma.user.findFirst({
      where: { id: userId, active: true },
      include: { school: true, supplier: true },
    });
    if (!user) return null;

    const isSupplier =
      Boolean(user.supplierId) &&
      (user.role === "supplier_admin" || user.role === "supplier_staff");

    if (isSupplier && user.supplier) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: null,
        supplierId: user.supplierId,
        schoolName: null,
        supplierName: user.supplier.name,
        tenant: "supplier",
      };
    }

    if (!user.schoolId || !user.school) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      supplierId: null,
      schoolName: user.school.name,
      supplierName: null,
      tenant: "school",
    };
  } catch {
    return null;
  }
}

export async function requireUser(roles?: Role[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) {
    redirect(user.tenant === "supplier" ? "/supplier" : "/");
  }
  return user;
}

export async function requireSchoolUser(roles?: Role[]) {
  const user = await requireUser(roles);
  if (user.tenant !== "school" || !user.schoolId) {
    redirect(user.tenant === "supplier" ? "/supplier" : "/login");
  }
  return user as SessionUser & { schoolId: string; schoolName: string };
}

export async function requireSupplierUser(roles?: Role[]) {
  const user = await requireUser(roles);
  if (user.tenant !== "supplier" || !user.supplierId) {
    redirect(user.tenant === "school" ? "/" : "/login");
  }
  return user as SessionUser & { supplierId: string; supplierName: string };
}

/** School campus: co-issue, stock receive/adjust, students. */
export function canWrite(role: Role) {
  return (
    role === "school_reporter" ||
    role === "storekeeper" ||
    role === "school_admin"
  );
}

/** Legacy school admin-only setup (catalog/users). Prefer supplier-owned setup. */
export function canManage(role: Role) {
  return role === "school_admin";
}

export function canSupplierWrite(role: Role) {
  return role === "supplier_admin" || role === "supplier_staff";
}

export function isSchoolOperator(role: Role) {
  return SCHOOL_OPERATOR_ROLES.includes(role);
}

/** Reports / audit export for campus reporters (+ legacy auditor/admin). */
export function canViewReports(role: Role) {
  return isSchoolOperator(role) || role === "supplier_admin" || role === "supplier_staff";
}

export function homePathForUser(user: SessionUser) {
  if (user.tenant === "supplier") return "/supplier";
  return "/";
}
