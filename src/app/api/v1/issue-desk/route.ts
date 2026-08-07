import { NextResponse } from "next/server";
import { canWrite, getSessionUser } from "@/lib/auth";
import {
  loadIssueDeskData,
  toIssueDeskSnapshot,
} from "@/modules/issue/issue-desk";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.tenant !== "school" || !user.schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canWrite(user.role)) {
    return NextResponse.json({ error: "No permission" }, { status: 403 });
  }

  const data = await loadIssueDeskData(user.schoolId);
  return NextResponse.json(toIssueDeskSnapshot(data));
}
