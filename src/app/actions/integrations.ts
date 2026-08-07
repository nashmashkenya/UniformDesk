"use server";

import { revalidatePath } from "next/cache";
import { canManage, requireSchoolUser } from "@/lib/auth";
import {
  clearSchoolApiKey,
  rotateSchoolApiKey,
  setSchoolMasterExternalId,
} from "@/modules/integrations/school-master";

export type IntegrationState = {
  error?: string;
  ok?: boolean;
  apiKey?: string;
  message?: string;
};

export async function saveSchoolMasterIdAction(
  _prev: IntegrationState,
  formData: FormData,
): Promise<IntegrationState> {
  try {
    const user = await requireSchoolUser();
    if (!canManage(user.role)) return { error: "No permission" };
    await setSchoolMasterExternalId(
      user.schoolId,
      String(formData.get("schoolMasterExternalId") ?? ""),
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save",
    };
  }
  revalidatePath("/integrations");
  return { ok: true, message: "School Master ID saved" };
}

export async function rotateApiKeyAction(): Promise<IntegrationState> {
  try {
    const user = await requireSchoolUser();
    if (!canManage(user.role)) return { error: "No permission" };
    const { apiKey } = await rotateSchoolApiKey(user.schoolId);
    revalidatePath("/integrations");
    return {
      ok: true,
      apiKey,
      message: "API key created. Copy it now — it will not be shown again.",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not rotate key",
    };
  }
}

export async function revokeApiKeyAction(): Promise<IntegrationState> {
  try {
    const user = await requireSchoolUser();
    if (!canManage(user.role)) return { error: "No permission" };
    await clearSchoolApiKey(user.schoolId);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not revoke key",
    };
  }
  revalidatePath("/integrations");
  return { ok: true, message: "API key revoked" };
}
