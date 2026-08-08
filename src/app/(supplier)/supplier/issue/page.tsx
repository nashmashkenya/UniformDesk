import Link from "next/link";
import { IssueDeskShell } from "@/components/issue-desk-shell";
import { SupplierSchoolSelect } from "@/components/supplier-school-select";
import { canSupplierWrite, requireSupplierUser } from "@/lib/auth";
import { loadIssueDeskData } from "@/modules/issue/issue-desk";
import { listLinkedSchools } from "@/modules/supply/products";

export default async function SupplierIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ schoolId?: string }>;
}) {
  const user = await requireSupplierUser();
  if (!canSupplierWrite(user.role)) {
    return (
      <div className="page-stack">
        <h1 className="page-title">Co-issue</h1>
        <p className="page-sub">No permission to issue uniforms.</p>
      </div>
    );
  }

  const { schoolId: schoolIdParam } = await searchParams;
  const links = await listLinkedSchools(user.supplierId);
  const selected =
    links.find((l) => l.schoolId === schoolIdParam)?.school ??
    links[0]?.school ??
    null;

  if (!selected) {
    return (
      <div className="page-stack">
        <header className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">Co-issue</h1>
            <p className="page-sub">
              Issue uniforms at a linked school during admission, alongside
              school staff.
            </p>
          </div>
        </header>
        <section className="card">
          <div className="card-body">
            <p className="text-sm text-[var(--muted)]">
              Link a school first, then return here to issue.
            </p>
            <Link href="/supplier/schools" className="btn btn-primary mt-3">
              Schools portfolio
            </Link>
          </div>
        </section>
      </div>
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
            Admission-day issue with school staff — student, items, payment
            method and reference. No parent slip. Stock comes from the school
            ledger.
          </p>
        </div>
      </header>

      {links.length > 1 && (
        <section className="card no-print">
          <div className="card-body">
            <SupplierSchoolSelect
              basePath="/supplier/issue"
              value={selected.id}
              schools={links.map((l) => ({
                id: l.school.id,
                name: l.school.name,
                code: l.school.code,
              }))}
            />
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
      />
    </div>
  );
}
