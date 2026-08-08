"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManage, requireSchoolUser } from "@/lib/auth";
import type { Role } from "@/generated/prisma/client";
import { createUser, setUserActive } from "@/modules/identity/users";

export type UserState = { error?: string; ok?: boolean };

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["school_reporter"]),
  password: z.string().min(8),
});

async function requireAdmin() {
  const user = await requireSchoolUser();
  if (!canManage(user.role)) {
    throw new Error("Only school admins can manage users");
  }
  return user;
}

export async function createUserAction(
  _prev: UserState,
  formData: FormData,
): Promise<UserState> {
  try {
    const user = await requireAdmin();
    const parsed = createSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return {
        error: "Enter name, valid email, role, and password (8+ chars)",
      };
    }

    await createUser({
      schoolId: user.schoolId,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role as Role,
      password: parsed.data.password,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create user",
    };
  }

  revalidatePath("/users");
  return { ok: true };
}

export async function toggleUserActiveAction(
  _prev: UserState,
  formData: FormData,
): Promise<UserState> {
  try {
    const actor = await requireAdmin();
    await setUserActive({
      schoolId: actor.schoolId,
      actorUserId: actor.id,
      userId: String(formData.get("userId") ?? ""),
      active: String(formData.get("active") ?? "") === "true",
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update user",
    };
  }

  revalidatePath("/users");
  return { ok: true };
}
