import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateSchoolApiKey,
  syncRosterFromSchoolMaster,
} from "@/modules/integrations/school-master";

const bodySchema = z.object({
  students: z
    .array(
      z.object({
        admissionNo: z.string().min(1),
        fullName: z.string().min(1),
        className: z.string().optional(),
      }),
    )
    .min(1),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  const school = await authenticateSchoolApiKey(
    request.headers.get("authorization"),
  );
  if (!school) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await syncRosterFromSchoolMaster({
      schoolId: school.id,
      students: parsed.data.students,
      source: parsed.data.source ?? "school_master",
    });
    return NextResponse.json({
      ok: true,
      schoolId: school.id,
      schoolCode: school.code,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 400 },
    );
  }
}
