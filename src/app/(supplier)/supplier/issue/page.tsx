import { IssueDeskShell } from "@/components/issue-desk-shell";
import { SupplierCampusEmptyState } from "@/components/supplier-campus-gate";
import { SupplierSchoolSelect } from "@/components/supplier-school-select";
import {
  canSupplierIssue,
  canSupplierManage,
  requireSupplierUser,
} from "@/lib/auth";
import {
  listActorCampuses,
  pickCampus,
} from "@/modules/identity/supplier-campuses";
import { loadIssueDeskData } from "@/modules/issue/issue-desk";

export default async function SupplierIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ schoolId?: string; studentId?: string }>;
}) {
  const user = await requireSupplierUser();
  if (!canSupplierIssue(user.role)) {
    return (
      <div className="page-stack">
        <h1 className="page-title">Co-issue</h1>
        <p className="page-sub">No permission to issue uniforms.</p>
      </div>
    );
  }

  const { schoolId: schoolIdParam, studentId } = await searchParams;
  const campuses = await listActorCampuses(user);
  const selected = pickCampus(campuses, schoolIdParam);
  const isAdmin = canSupplierManage(user.role);

  if (!selected) {
    return (
      <SupplierCampusEmptyState title="Co-issue desk" isAdmin={isAdmin} />
    );
  }

  const desk = await loadIssueDeskData(selected.id);

  return (
    <div
      className="page-stack mx-auto max-w-3xl"
      data-school-id={selected.id}
      data-school-name={selected.name}
    >
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Co-issue desk</h1>
          <p className="page-sub">
            {campuses.length === 1
              ? `Issuing at ${selected.name} (${selected.code}).`
              : "Choose your campus, then issue — student, items, payment method and reference."}{" "}
            Stock comes from the school ledger.
          </p>
        </div>
        {campuses.length === 1 && (
          <span className="chip chip-accent">
            {selected.code}
          </span>
        )}
      </header>

      {campuses.length > 1 && (
        <section className="card national-panel no-print">
          <div className="card-body">
            <SupplierSchoolSelect
              basePath="/supplier/issue"
              value={selected.id}
              schools={campuses}
            />
            <p className="field-hint mt-2">
              {isAdmin
                ? "Admins can issue at every linked school."
                : "Only campuses assigned to you appear here."}
            </p>
          </div>
        </section>
      )}

      <IssueDeskShell
        schoolId={desk.schoolId}
        schoolName={desk.schoolName}
        students={desk.students}
        kits={desk.kits}
        items={desk.items}
        balances={desk.balances}
        slipPathPrefix="/supplier/slips"
        coIssue
        initialStudentId={studentId}
      />
    </div>
  );
}
