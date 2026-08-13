import { redirect } from "next/navigation";
import { IssueDeskShell } from "@/components/issue-desk-shell";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { loadIssueDeskData } from "@/modules/issue/issue-desk";

export default async function IssuePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; from?: string }>;
}) {
  const user = await requireSchoolUser();
  if (!canWrite(user.role)) redirect("/");

  const { studentId, from } = await searchParams;
  const desk = await loadIssueDeskData(user.schoolId);
  const finishMode = from === "finish" && Boolean(studentId);

  return (
    <div className="page-stack mx-auto max-w-3xl">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">
            {finishMode ? "Finish uniform" : "Issue desk"}
          </h1>
          <p className="page-sub">
            {finishMode
              ? "Give the remaining items, then you return to the To finish list."
              : "Student, items, then payment. Leftover items stay on To finish."}
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
        finishMode={finishMode}
        returnTo={finishMode ? "/incomplete" : undefined}
      />
    </div>
  );
}
