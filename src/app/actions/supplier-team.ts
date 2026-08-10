"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  canSupplierManage,
  requireSupplierUser,
} from "@/lib/auth";
import type { Role } from "@/generated/prisma/client";
import { setStaffCampuses } from "@/modules/identity/supplier-campuses";
import {
  createSupplierTeamUser,
  resetSupplierTeamPassword,
  setSupplierTeamActive,
} from "@/modules/identity/supplier-team";

export type TeamState = { error?: string; ok?: boolean; message?: string };

async function requireAdmin() {
  const user = await requireSupplierUser();
  if (!canSupplierManage(user.role)) {
    throw new Error("Only the supplier admin can manage the team");
  }
  return user;
}

function schoolIdsFromForm(formData: FormData) {
  return formData
    .getAll("schoolIds")
    .map((v) => String(v))
    .filter(Boolean);
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["supplier_admin", "supplier_staff"]),
  password: z.string().min(8),
});

export async function createSupplierTeamUserAction(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  try {
    const actor = await requireAdmin();
    const parsed = createSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return {
        error: "Enter name, valid email, role, and password (8+ characters)",
      };
    }

    const schoolIds = schoolIdsFromForm(formData);
    if (parsed.data.role === "supplier_staff" && schoolIds.length === 0) {
      return {
        error: "Assign at least one campus for staff before creating the account",
      };
    }

    await createSupplierTeamUser({
      supplierId: actor.supplierId,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role as Role,
      password: parsed.data.password,
      schoolIds,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create user",
    };
  }

  revalidatePath("/supplier/team");
  revalidatePath("/supplier/issue");
  return { ok: true, message: "Team member created" };
}

export async function resetSupplierTeamPasswordAction(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  try {
    const actor = await requireAdmin();
    const password = String(formData.get("password") ?? "");
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }
    await resetSupplierTeamPassword({
      supplierId: actor.supplierId,
      actorUserId: actor.id,
      userId: String(formData.get("userId") ?? ""),
      password,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not reset password",
    };
  }

  revalidatePath("/supplier/team");
  return { ok: true, message: "Password updated" };
}

export async function toggleSupplierTeamActiveAction(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  try {
    const actor = await requireAdmin();
    await setSupplierTeamActive({
      supplierId: actor.supplierId,
      actorUserId: actor.id,
      userId: String(formData.get("userId") ?? ""),
      active: String(formData.get("active") ?? "") === "true",
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update account",
    };
  }

  revalidatePath("/supplier/team");
  return { ok: true, message: "Account updated" };
}

export async function setStaffCampusesAction(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  try {
    const actor = await requireAdmin();
    const userId = String(formData.get("userId") ?? "");
    const schoolIds = schoolIdsFromForm(formData);
    if (!userId) return { error: "Missing team member" };

    await setStaffCampuses({
      supplierId: actor.supplierId,
      userId,
      schoolIds,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update campuses",
    };
  }

  revalidatePath("/supplier/team");
  revalidatePath("/supplier/issue");
  revalidatePath("/supplier/incomplete");
  revalidatePath("/supplier/reports");
  return { ok: true, message: "Campus access updated" };
}
