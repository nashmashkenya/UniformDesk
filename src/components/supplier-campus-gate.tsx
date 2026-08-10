import Link from "next/link";

/** Empty state when staff has no campus assignments. */
export function SupplierCampusEmptyState({
  title,
  isAdmin,
}: {
  title: string;
  isAdmin: boolean;
}) {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">
            {isAdmin
              ? "Link a school to your organisation first, then return here."
              : "You are not assigned to any campus yet. Ask a supplier admin to grant school access on Team."}
          </p>
        </div>
      </header>
      <section className="card national-panel">
        <div className="card-body">
          {isAdmin ? (
            <Link href="/supplier/schools" className="btn btn-primary">
              Schools portfolio
            </Link>
          ) : (
            <p className="national-note" style={{ margin: 0 }}>
              <strong>Need access?</strong>
              Admins assign one or more campuses per staff member. Once assigned,
              you can issue, clear still owed, and view reports for those schools
              only.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
