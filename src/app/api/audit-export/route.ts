import { NextResponse } from "next/server";
import { canWrite, getSessionUser } from "@/lib/auth";
import {
  auditExportRows,
  slipsToAuditCsv,
} from "@/modules/reports/reports";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || user.tenant !== "school" || !user.schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canWrite(user.role) && user.role !== "auditor") {
    return NextResponse.json({ error: "No permission" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  if (!fromRaw || !toRaw) {
    return NextResponse.json(
      { error: "from and to dates are required" },
      { status: 400 },
    );
  }

  const from = new Date(`${fromRaw}T00:00:00`);
  const to = new Date(`${toRaw}T23:59:59.999`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json(
      { error: "from must be before to" },
      { status: 400 },
    );
  }

  const rows = await auditExportRows(user.schoolId, from, to);
  const csv = slipsToAuditCsv(rows);
  const filename = `uniformdesk-audit-${fromRaw}-to-${toRaw}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
