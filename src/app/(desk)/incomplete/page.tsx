import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { ReportPrintBanner } from "@/components/report-print-banner";
import { StillOwedList } from "@/components/still-owed-list";
import { requireSchoolUser } from "@/lib/auth";
import { listStudentsStillOwed } from "@/modules/issue/outstanding";

export default async function IncompleteUniformsPage() {
  const user = await requireSchoolUser();
  const rows = await listStudentsStillOwed(user.schoolId, 150);

  return (
    <div className="page-stack">
      <header className="page-header animate-rise no-print">
        <div className="page-header-main">
          <h1 className="page-title">Still to receive</h1>
          <p className="page-sub">
            Students who have not yet received their full uniform set. Open
            issue and finish what is left when stock is available.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-warn">{rows.length}</span>
          <PrintButton label="Print list" />
        </div>
      </header>

      <div className="print-report print-sheet print-doc">
        <ReportPrintBanner
          title="Still to receive"
          subtitle={`${user.schoolName ?? "School"} · incomplete uniforms`}
        />
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Incomplete uniforms</h2>
              <p className="card-subtitle">
                Created automatically when a kit is issued and some items are
                short or skipped
              </p>
            </div>
            <Link href="/issue" className="btn btn-ghost no-print">
              Issue desk
            </Link>
          </div>
          <div className="card-body">
            <StillOwedList
              rows={rows}
              issueHref={(studentId) => `/issue?studentId=${studentId}`}
              emptyHint="No students are waiting on uniforms right now."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
