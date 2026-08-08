import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveIssueAccess } from "@/modules/issue/access";
import { issueKit } from "@/modules/issue/issue";
import { parseIssuePayload } from "@/modules/issue/issue-input";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let payload;
  try {
    payload = parseIssuePayload(json);
  } catch {
    return NextResponse.json({ error: "Invalid issue payload" }, { status: 400 });
  }

  let access;
  try {
    access = await resolveIssueAccess(user, payload.schoolId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No permission to issue";
    const status =
      message === "Unauthorized" || message.startsWith("No permission")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const slip = await issueKit({
      schoolId: access.schoolId,
      actorUserId: access.actorUserId,
      studentId: payload.studentId,
      lines: payload.lines,
      kitId: payload.kitId,
      paymentMethod: payload.paymentMethod,
      paymentReference: payload.paymentReference,
    });

    revalidatePath("/");
    revalidatePath("/issue");
    revalidatePath("/stock");
    revalidatePath("/reports");
    revalidatePath("/supplier/issue");
    revalidatePath("/supplier/activity");
    revalidatePath("/incomplete");
    revalidatePath("/supplier/incomplete");
    revalidatePath("/students");

    return NextResponse.json({
      ok: true,
      slipId: slip.id,
      slipNo: slip.slipNo,
      mode: access.mode,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not issue kit",
      },
      { status: 400 },
    );
  }
}
