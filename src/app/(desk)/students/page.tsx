import Link from "next/link";
import { AddStudentForm } from "@/components/add-student-form";
import { StudentImportForm } from "@/components/student-import-form";
import { requireSchoolUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StudentsPage() {
  const user = await requireSchoolUser();
  const students = await prisma.student.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { admissionNo: "asc" },
  });

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Students</h1>
          <p className="page-sub">
            Admission roster for co-issue. New students can be keyed in at the
            issue desk (admission no, name, class).
          </p>
        </div>
        <span className="chip">{students.length} students</span>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Add student</h2>
              <p className="card-subtitle">Single roster entry</p>
            </div>
          </div>
          <div className="card-body">
            <AddStudentForm />
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Import CSV</h2>
              <p className="card-subtitle">Bulk create or update students</p>
            </div>
          </div>
          <div className="card-body">
            <StudentImportForm />
          </div>
        </section>
      </div>

      <section className="section sm:hidden">
        <div className="section-label">Roster</div>
        <div className="grid gap-3">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/students/${student.id}`}
              className="card card-quiet block p-3.5 no-underline text-inherit"
            >
              <div className="font-semibold text-[var(--accent)]">
                {student.fullName}
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                {student.admissionNo}
                {student.className ? ` · ${student.className}` : ""}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="card hidden sm:block">
        <div className="card-header">
          <div>
            <h2 className="card-title">School roster</h2>
            <p className="card-subtitle">Admission number, name, and class</p>
          </div>
        </div>
        <div className="card-body-flush table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Admission</th>
                <th>Name</th>
                <th>Class</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.admissionNo}</td>
                  <td className="font-medium">{student.fullName}</td>
                  <td className="text-[var(--muted)]">
                    {student.className ?? "—"}
                  </td>
                  <td>
                    <Link
                      href={`/students/${student.id}`}
                      className="font-semibold text-[var(--accent)]"
                    >
                      History
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
