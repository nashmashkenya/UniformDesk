import { redirect } from "next/navigation";
import {
  createSession,
  getSessionUser,
  homePathForUser,
} from "@/lib/auth";
import { consumeSchoolMasterSsoToken } from "@/modules/integrations/school-master";

export default async function SsoConsumePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    redirect("/login");
  }

  try {
    const userId = await consumeSchoolMasterSsoToken(token);
    await createSession(userId);
  } catch {
    redirect("/login?error=sso");
  }

  const user = await getSessionUser();
  redirect(user ? homePathForUser(user) : "/");
}
