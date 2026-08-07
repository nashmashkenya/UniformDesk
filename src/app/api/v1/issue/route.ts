import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canWrite, getSessionUser } from "@/lib/auth";
import { issueKit } from "@/modules/issue/issue";
import { parseIssuePayload } from "@/modules/issue/issue-input";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.tenant !== "school" || !user.schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canWrite(user.role)) {
    return NextResponse.json({ error: "No permission" }, { status: 403 });
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

  if (!payload.acknowledgmentSignature.startsWith("data:image")) {
    return NextResponse.json({ error: "Signature is required" }, { status: 400 });
  }

  try {
    const slip = await issueKit({
      schoolId: user.schoolId,
      actorUserId: user.id,
      studentId: payload.studentId,
      acknowledgmentName: payload.acknowledgmentName,
      acknowledgmentSignature: payload.acknowledgmentSignature,
      lines: payload.lines,
    });

    revalidatePath("/");
    revalidatePath("/issue");
    revalidatePath("/stock");
    revalidatePath("/reports");

    return NextResponse.json({
      ok: true,
      slipId: slip.id,
      slipNo: slip.slipNo,
      publicToken: slip.publicToken,
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
