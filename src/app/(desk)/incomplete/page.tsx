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
          <h1 className="page-title">To finish</h1>
          <p className="page-sub">
            Students who have not received their full uniform. Search, then tap
            Finish to give the remaining items.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-warn">{rows.length}</span>
          <PrintButton label="Print list" />
        </div>
      </header>

      <div className="print-report print-sheet print-doc">
        <ReportPrintBanner
          title="To finish"
          subtitle={`${user.schoolName ?? "School"} · incomplete uniforms`}
        />
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Not fully given</h2>
              <p className="card-subtitle">
                Created when some items were held back or there was no stock
              </p>
            </div>
          </div>
          <div className="card-body">
            <StillOwedList
              rows={rows}
              issueHrefTemplate="/issue?studentId={studentId}&from=finish"
              emptyHint="No students are waiting for uniforms right now."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
