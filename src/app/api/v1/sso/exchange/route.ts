import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateSchoolApiKey,
  issueSchoolMasterSso,
} from "@/modules/integrations/school-master";

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z
    .enum(["school_reporter", "school_admin", "storekeeper", "auditor"])
    .optional(),
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
    const sso = await issueSchoolMasterSso({
      schoolId: school.id,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
    });
    return NextResponse.json({ ok: true, ...sso });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "SSO exchange failed",
      },
      { status: 400 },
    );
  }
}
