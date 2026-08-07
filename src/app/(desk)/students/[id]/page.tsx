import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { requireSchoolUser } from "@/lib/auth";
import {
  getSchoolStudent,
  studentHistory,
} from "@/modules/reports/reports";

export default async function StudentHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSchoolUser();
  const { id } = await params;
  const student = await getSchoolStudent(user.schoolId, id);
  if (!student) notFound();

  const slips = await studentHistory(user.schoolId, student.id);

  return (
    <div className="page-stack">
      <section>
        <p className="text-xs text-[var(--muted)]">
          <Link href="/students" className="text-[var(--accent)]">
            Students
          </Link>
        </p>
        <h1 className="page-title mt-1">{student.fullName}</h1>
        <p className="page-sub">
          {student.admissionNo}
          {student.className ? ` · ${student.className}` : ""}
          {!student.active ? " · inactive" : ""}
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">Issue history</h2>
            <p className="card-subtitle">
              Every signed slip for this student — proof and voids
            </p>
          </div>
          <span className="chip">{slips.length}</span>
        </div>
        <div className="card-body space-y-3">
          {slips.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No issues recorded for this student yet.
            </p>
          ) : (
            slips.map((slip) => (
              <Link
                key={slip.id}
                href={`/slips/${slip.id}`}
                className="block rounded-[4px] bg-[var(--surface-2)] px-3 py-3 no-underline text-inherit"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-[var(--accent)]">
                      {slip.slipNo}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {format(slip.issuedAt, "dd MMM yyyy HH:mm")} ·{" "}
                      {slip.issuedBy.name}
                    </div>
                  </div>
                  <StatusPill status={slip.status} />
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {slip.lines.map((line) => (
                    <li key={line.id} className="text-[var(--muted)]">
                      {line.item.name} / {line.sizeLabel} · issued{" "}
                      {line.qtyIssued}
                      {line.shortageQty > 0
                        ? ` · short ${line.shortageQty}`
                        : ""}
                    </li>
                  ))}
                </ul>
                {slip.status === "voided" && slip.voidReason && (
                  <p className="mt-2 text-xs text-[var(--warn)]">
                    Void: {slip.voidReason}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
