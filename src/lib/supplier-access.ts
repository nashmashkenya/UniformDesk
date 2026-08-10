import { notFound, redirect } from "next/navigation";
import {
  canSupplierIssue,
  canSupplierManage,
  requireSupplierUser,
  type SessionUser,
} from "@/lib/auth";

export async function requireSupplierAdmin() {
  const user = await requireSupplierUser();
  if (!canSupplierManage(user.role)) notFound();
  return user;
}

export async function requireSupplierIssuer() {
  const user = await requireSupplierUser();
  if (!canSupplierIssue(user.role)) redirect("/supplier");
  return user;
}

const STAFF_ALLOWED_PREFIXES = [
  "/supplier",
  "/supplier/issue",
  "/supplier/incomplete",
  "/supplier/reports",
  "/supplier/activity",
  "/supplier/notifications",
  "/supplier/search",
  "/supplier/slips",
] as const;

/** Staff may only use issue-path routes; admin may use all. */
export function isSupplierStaffAllowedPath(
  user: SessionUser,
  pathname: string,
) {
  if (canSupplierManage(user.role)) return true;
  return STAFF_ALLOWED_PREFIXES.some(
    (p) => pathname === p || (p !== "/supplier" && pathname.startsWith(`${p}/`)),
  );
}

export function assertSupplierStaffAllowedPath(
  user: SessionUser,
  pathname: string,
) {
  if (!isSupplierStaffAllowedPath(user, pathname)) notFound();
}
