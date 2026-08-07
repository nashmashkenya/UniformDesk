import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

const COOKIE_NAME = "ud_session";

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

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = payload.sub;
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

export function canWrite(role: Role) {
  return role === "school_admin" || role === "storekeeper";
}

export function canManage(role: Role) {
  return role === "school_admin";
}

export function canSupplierWrite(role: Role) {
  return role === "supplier_admin" || role === "supplier_staff";
}

export function homePathForUser(user: SessionUser) {
  return user.tenant === "supplier" ? "/supplier" : "/";
}
