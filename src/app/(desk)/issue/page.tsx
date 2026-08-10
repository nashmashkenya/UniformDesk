import { redirect } from "next/navigation";
import { IssueDeskShell } from "@/components/issue-desk-shell";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { loadIssueDeskData } from "@/modules/issue/issue-desk";

export default async function IssuePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await requireSchoolUser();
  if (!canWrite(user.role)) redirect("/");

  const { studentId } = await searchParams;
  const desk = await loadIssueDeskData(user.schoolId);

  return (
    <div className="page-stack mx-auto max-w-3xl">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Issue desk</h1>
          <p className="page-sub">
            Co-issue at admission — student, items, then payment method and
            reference. No parent slip needed. Shortages stay on Still to receive.
          </p>
        </div>
      </header>
      <IssueDeskShell
        schoolId={desk.schoolId}
        schoolName={desk.schoolName}
        students={desk.students}
        kits={desk.kits}
        items={desk.items}
        balances={desk.balances}
        initialStudentId={studentId}
      />
    </div>
  );
}
