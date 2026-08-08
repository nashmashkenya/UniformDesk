import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveIssueAccess } from "@/modules/issue/access";
import {
  loadIssueDeskData,
  toIssueDeskSnapshot,
} from "@/modules/issue/issue-desk";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolIdParam = new URL(request.url).searchParams.get("schoolId");

  let access;
  try {
    access = await resolveIssueAccess(user, schoolIdParam);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No permission";
    const status =
      message === "Unauthorized" || message.startsWith("No permission")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }

  const data = await loadIssueDeskData(access.schoolId);
  return NextResponse.json({
    ...toIssueDeskSnapshot(data),
    mode: access.mode,
  });
}
