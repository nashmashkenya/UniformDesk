import { format } from "date-fns";
import { notFound } from "next/navigation";
import {
  ApiKeyPanel,
  SchoolMasterIdForm,
} from "@/components/integration-forms";
import { canManage, requireSchoolUser } from "@/lib/auth";
import { appBaseUrl } from "@/lib/url";
import { getSchoolIntegration } from "@/modules/integrations/school-master";

export default async function IntegrationsPage() {
  const user = await requireSchoolUser();
  if (!canManage(user.role)) notFound();

  const school = await getSchoolIntegration(user.schoolId);
  if (!school) notFound();

  const base = appBaseUrl();

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">Integrations</h1>
        <p className="page-sub">
          School Master roster sync and SSO into UniformDesk.
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">School Master ID</h2>
            <p className="card-subtitle">
              Optional external identifier for the SIS
            </p>
          </div>
        </div>
        <div className="card-body">
          <SchoolMasterIdForm
            defaultValue={school.schoolMasterExternalId ?? ""}
          />
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">API key</h2>
            <p className="card-subtitle">
              Bearer token for School Master → UniformDesk calls
            </p>
          </div>
        </div>
        <div className="card-body">
          <ApiKeyPanel
            hasKey={Boolean(school.apiKeyHash)}
            prefix={school.apiKeyPrefix}
          />
          {(school.lastRosterSyncAt || school.lastRosterSyncNote) && (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Last roster sync
              {school.lastRosterSyncAt
                ? ` · ${format(school.lastRosterSyncAt, "dd MMM yyyy HH:mm")}`
                : ""}
              {school.lastRosterSyncNote
                ? ` · ${school.lastRosterSyncNote}`
                : ""}
            </p>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">API endpoints</h2>
            <p className="card-subtitle">Hexagonal ports for School Master</p>
          </div>
        </div>
        <div className="card-body space-y-4 text-sm">
          <div>
            <div className="font-semibold">Roster sync</div>
            <code className="mt-1 block break-all rounded-[4px] bg-[var(--surface-2)] px-2 py-1 text-xs">
              POST {base}/api/v1/roster/sync
            </code>
            <pre className="mt-2 overflow-x-auto rounded-[4px] bg-[var(--surface-2)] p-3 text-xs">
{`Authorization: Bearer udsk_…
Content-Type: application/json

{
  "source": "school_master",
  "students": [
    { "admissionNo": "GFS-010", "fullName": "Ann Wambui", "className": "Form 1A" }
  ]
}`}
            </pre>
          </div>
          <div>
            <div className="font-semibold">SSO exchange</div>
            <code className="mt-1 block break-all rounded-[4px] bg-[var(--surface-2)] px-2 py-1 text-xs">
              POST {base}/api/v1/sso/exchange
            </code>
            <pre className="mt-2 overflow-x-auto rounded-[4px] bg-[var(--surface-2)] p-3 text-xs">
{`Authorization: Bearer udsk_…
Content-Type: application/json

{
  "email": "store@greenfield.school",
  "name": "John Kamau",
  "role": "storekeeper"
}

→ { "loginUrl": "${base}/sso?token=…" }`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
