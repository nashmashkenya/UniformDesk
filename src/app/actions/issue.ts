"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { issueKit } from "@/modules/issue/issue";
import {
  issueLineSchema,
  parseIssuePayload,
} from "@/modules/issue/issue-input";
import { voidIssue } from "@/modules/issue/void";
import { z } from "zod";

export type IssueState = { error?: string };

export async function issueKitAction(
  _prev: IssueState,
  formData: FormData,
): Promise<IssueState> {
  const user = await requireSchoolUser();
  if (!canWrite(user.role)) {
    return { error: "You do not have permission to issue uniforms" };
  }

  let payload;
  try {
    payload = parseIssuePayload({
      studentId: String(formData.get("studentId") ?? ""),
      acknowledgmentName: String(formData.get("acknowledgmentName") ?? ""),
      acknowledgmentSignature: String(
        formData.get("acknowledgmentSignature") ?? "",
      ),
      lines: z
        .array(issueLineSchema)
        .parse(JSON.parse(String(formData.get("linesJson") ?? "[]"))),
    });
  } catch {
    return { error: "Invalid issue lines" };
  }

  let slipId: string;
  try {
    const slip = await issueKit({
      schoolId: user.schoolId,
      actorUserId: user.id,
      studentId: payload.studentId,
      acknowledgmentName: payload.acknowledgmentName,
      acknowledgmentSignature: payload.acknowledgmentSignature,
      lines: payload.lines,
    });
    slipId = slip.id;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not issue kit",
    };
  }

  revalidatePath("/");
  revalidatePath("/issue");
  revalidatePath("/stock");
  revalidatePath("/reports");
  redirect(`/slips/${slipId}`);
}

export type VoidState = { error?: string };

export async function voidIssueAction(
  _prev: VoidState,
  formData: FormData,
): Promise<VoidState> {
  const user = await requireSchoolUser();
  if (!canWrite(user.role)) {
    return { error: "You do not have permission to void issues" };
  }

  const slipId = String(formData.get("slipId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  try {
    await voidIssue({
      schoolId: user.schoolId,
      actorUserId: user.id,
      slipId,
      reason,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not void slip",
    };
  }

  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath(`/slips/${slipId}`);
  redirect(`/slips/${slipId}`);
}

