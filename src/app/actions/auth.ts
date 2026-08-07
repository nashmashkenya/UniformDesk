"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSession,
  destroySession,
  getSessionUser,
  homePathForUser,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type ActionState = {
  error?: string;
};

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !user.active) {
    return { error: "Invalid email or password" };
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "Invalid email or password" };
  }

  await createSession(user.id);
  const session = await getSessionUser();
  const home = session ? homePathForUser(session) : "/";
  const nextRaw = formData.get("next");
  const next =
    typeof nextRaw === "string" &&
    nextRaw.startsWith("/") &&
    !nextRaw.startsWith("//") &&
    !nextRaw.startsWith("/login")
      ? nextRaw
      : home;
  redirect(next);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
