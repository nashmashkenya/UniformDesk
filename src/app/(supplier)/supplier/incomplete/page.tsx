import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { ReportPrintBanner } from "@/components/report-print-banner";
import { StillOwedList } from "@/components/still-owed-list";
import { SupplierCampusEmptyState } from "@/components/supplier-campus-gate";
import { SupplierSchoolSelect } from "@/components/supplier-school-select";
import { canSupplierManage, requireSupplierUser } from "@/lib/auth";
import {
  listActorCampuses,
  pickCampus,
} from "@/modules/identity/supplier-campuses";
import { listStudentsStillOwed } from "@/modules/issue/outstanding";

export default async function SupplierIncompletePage({
  searchParams,
}: {
  searchParams: Promise<{ schoolId?: string }>;
}) {
  const user = await requireSupplierUser();
  const { schoolId: schoolIdParam } = await searchParams;
  const campuses = await listActorCampuses(user);
  const selected = pickCampus(campuses, schoolIdParam);
  const isAdmin = canSupplierManage(user.role);

  if (!selected) {
    return (
      <SupplierCampusEmptyState title="Still to receive" isAdmin={isAdmin} />
    );
  }

  const rows = await listStudentsStillOwed(selected.id, 150);

  return (
    <div className="page-stack">
      <header className="page-header animate-rise no-print">
        <div className="page-header-main">
          <h1 className="page-title">Still to receive</h1>
          <p className="page-sub">
            Incomplete admission kits at {selected.name}. Co-issue the remaining
            items when stock is ready.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-warn">{rows.length}</span>
          {campuses.length === 1 && (
            <span className="chip chip-accent">{selected.code}</span>
          )}
          <PrintButton label="Print list" />
        </div>
      </header>

      {campuses.length > 1 && (
        <section className="card national-panel no-print">
          <div className="card-body">
            <SupplierSchoolSelect
              basePath="/supplier/incomplete"
              value={selected.id}
              schools={campuses}
            />
          </div>
        </section>
      )}

      <div className="print-report print-sheet print-doc">
        <ReportPrintBanner
          title="Still to receive"
          subtitle={`${user.supplierName ?? "Supplier"} · ${selected.name} (${selected.code})`}
        />
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Incomplete uniforms</h2>
              <p className="card-subtitle">{selected.name}</p>
            </div>
            <Link
              href={`/supplier/issue?schoolId=${selected.id}`}
              className="btn btn-ghost no-print"
            >
              Co-issue desk
            </Link>
          </div>
          <div className="card-body">
            <StillOwedList
              rows={rows}
              issueHref={() => `/supplier/issue?schoolId=${selected.id}`}
              emptyHint="No students at this school are waiting on uniforms."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
