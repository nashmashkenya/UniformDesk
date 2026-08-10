import { format } from "date-fns";
import {
  AssignStaffCampusesForm,
  CreateSupplierTeamUserForm,
  ResetSupplierPasswordForm,
  ToggleSupplierTeamActiveForm,
} from "@/components/supplier-team-forms";
import { requireSupplierAdmin } from "@/lib/supplier-access";
import { listActorCampuses } from "@/modules/identity/supplier-campuses";
import { listSupplierTeam } from "@/modules/identity/supplier-team";

function roleLabel(role: string) {
  if (role === "supplier_admin") return "Admin";
  if (role === "supplier_staff") return "Staff";
  return role;
}

export default async function SupplierTeamPage() {
  const user = await requireSupplierAdmin();

  const [team, campuses] = await Promise.all([
    listSupplierTeam(user.supplierId),
    listActorCampuses(user),
  ]);
  const activeCount = team.filter((m) => m.active).length;

  return (
    <div className="page-stack">
      <header className="page-header national-page-header animate-rise">
        <div className="page-header-main">
          <p className="national-kicker">Organisation</p>
          <h1 className="page-title">Team</h1>
          <p className="page-sub">
            Create users, reset passwords, and assign staff to one or more
            campuses. Staff only see schools they are assigned to.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip">{activeCount} active</span>
          <span className="chip">{team.length} total</span>
          <span className="chip">{campuses.length} campuses</span>
        </div>
      </header>

      <section className="card national-panel">
        <div className="card-header">
          <div>
            <h2 className="card-title">Add team member</h2>
            <p className="card-subtitle">
              Staff need at least one campus · admins access all linked schools
            </p>
          </div>
        </div>
        <div className="card-body">
          <CreateSupplierTeamUserForm campuses={campuses} />
        </div>
      </section>

      <section className="card national-panel">
        <div className="card-header">
          <div>
            <h2 className="card-title">Directory</h2>
            <p className="card-subtitle">Accounts and campus access</p>
          </div>
        </div>
        <div className="card-body space-y-4">
          {!team.length && (
            <p className="text-sm text-[var(--muted)]">No team members yet.</p>
          )}
          {team.map((member) => {
            const assigned = member.staffCampuses.map((c) => c.school);
            return (
              <article
                key={member.id}
                className={`national-person ${!member.active ? "is-inactive" : ""}`}
              >
                <div className="national-person-main">
                  <div className="national-avatar" aria-hidden>
                    {member.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                      {member.name}
                      {member.id === user.id ? (
                        <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                          (you)
                        </span>
                      ) : null}
                    </div>
                    <div className="truncate text-sm text-[var(--muted)]">
                      {member.email}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span
                        className={
                          member.role === "supplier_admin"
                            ? "chip chip-accent"
                            : "chip"
                        }
                      >
                        {roleLabel(member.role)}
                      </span>
                      <span
                        className={
                          member.active ? "chip chip-ok" : "chip chip-warn"
                        }
                      >
                        {member.active ? "Active" : "Inactive"}
                      </span>
                      {member.role === "supplier_admin" ? (
                        <span className="chip">All linked campuses</span>
                      ) : assigned.length ? (
                        assigned.map((school) => (
                          <span key={school.id} className="chip chip-accent">
                            {school.code}
                          </span>
                        ))
                      ) : (
                        <span className="chip chip-warn">No campuses</span>
                      )}
                      <span className="text-xs text-[var(--muted)]">
                        Added {format(member.createdAt, "dd MMM yyyy")}
                      </span>
                    </div>

                    {member.role === "supplier_staff" && (
                      <div className="mt-3">
                        <AssignStaffCampusesForm
                          userId={member.id}
                          campuses={campuses}
                          selectedIds={assigned.map((s) => s.id)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="national-person-actions">
                  <ResetSupplierPasswordForm userId={member.id} />
                  <ToggleSupplierTeamActiveForm
                    userId={member.id}
                    active={member.active}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="national-note">
        <strong>Access model</strong>
        <ul>
          <li>
            <b>Admin</b> — all linked schools; team, products, supply docs,
            branding
          </li>
          <li>
            <b>Staff · one campus</b> — lands on that school; no picker
          </li>
          <li>
            <b>Staff · several campuses</b> — picker shows only their schools
          </li>
          <li>
            <b>Staff · none</b> — cannot issue until an admin assigns campuses
          </li>
        </ul>
      </section>
    </div>
  );
}
