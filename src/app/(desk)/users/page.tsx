import { format } from "date-fns";
import { redirect } from "next/navigation";
import { ToggleUserForm } from "@/components/toggle-user-form";
import { UserForm } from "@/components/user-form";
import { canManage, requireSchoolUser } from "@/lib/auth";
import { listUsers } from "@/modules/identity/users";

function roleLabel(role: string) {
  return role.replace("_", " ");
}

export default async function UsersPage() {
  const user = await requireSchoolUser();
  if (!canManage(user.role)) redirect("/");

  const users = await listUsers(user.schoolId);

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Users</h1>
          <p className="page-sub">
            School admins, storekeepers, and auditors for this desk.
          </p>
        </div>
        <span className="chip">{users.length} users</span>
      </header>

      <section className="card animate-rise animate-rise-delay-1">
        <div className="card-header">
          <div>
            <h2 className="card-title">Add user</h2>
            <p className="card-subtitle">
              Creates a login with a temporary password
            </p>
          </div>
        </div>
        <div className="card-body">
          <UserForm />
        </div>
      </section>

      <section className="section">
        <div className="section-label">School accounts</div>
        <div className="grid gap-3 sm:hidden">
          {users.map((row) => (
            <article key={row.id} className="card card-quiet p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {row.name}
                    {row.id === user.id && (
                      <span className="chip chip-accent ml-2">You</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {row.email}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="chip">{roleLabel(row.role)}</span>
                    <span className={row.active ? "chip chip-ok" : "chip chip-warn"}>
                      {row.active ? "active" : "inactive"}
                    </span>
                  </div>
                </div>
                <ToggleUserForm
                  userId={row.id}
                  active={row.active}
                  disabled={row.id === user.id}
                />
              </div>
            </article>
          ))}
        </div>

        <div className="card hidden sm:block">
          <div className="card-header">
            <div>
              <h2 className="card-title">Directory</h2>
              <p className="card-subtitle">Role and account status</p>
            </div>
          </div>
          <div className="card-body-flush table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium">
                      {row.name}
                      {row.id === user.id ? " (you)" : ""}
                    </td>
                    <td className="text-[var(--muted)]">{row.email}</td>
                    <td>{roleLabel(row.role)}</td>
                    <td>
                      <span
                        className={
                          row.active ? "chip chip-ok" : "chip chip-warn"
                        }
                      >
                        {row.active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="text-[var(--muted)]">
                      {format(row.createdAt, "dd MMM yyyy")}
                    </td>
                    <td className="text-right">
                      <ToggleUserForm
                        userId={row.id}
                        active={row.active}
                        disabled={row.id === user.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
