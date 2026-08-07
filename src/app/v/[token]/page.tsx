import { format } from "date-fns";
import { notFound } from "next/navigation";
import { ThemeMenu } from "@/components/theme-menu";
import {
  getSlipByPublicToken,
  qrDataUrlForToken,
} from "@/modules/issue/proof";

export default async function PublicProofPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const slip = await getSlipByPublicToken(token);
  if (!slip) notFound();

  const qr = await qrDataUrlForToken(slip.publicToken);
  const voided = slip.status === "voided";

  return (
    <main className="min-h-full bg-[var(--paper)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-[4px] bg-[var(--accent)] text-xs font-bold text-white">
              UD
            </span>
            <div>
              <div className="text-sm font-semibold">UniformDesk</div>
              <div className="text-xs text-[var(--muted)]">Issue proof</div>
            </div>
          </div>
          <ThemeMenu />
        </div>

        <article className="card animate-rise">
          <div className="card-header">
            <div>
              <h1 className="card-title text-base">{slip.school.name}</h1>
              <p className="card-subtitle">{slip.slipNo}</p>
            </div>
            <span className={voided ? "chip chip-warn" : "chip chip-ok"}>
              {slip.status}
            </span>
          </div>

          <div className="card-body space-y-4">
            <p className="text-sm text-[var(--muted)]">
              This page verifies that a uniform issue was recorded for the
              student below. It is read-only proof for guardians and auditors.
            </p>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="card-inset">
                <div className="section-label">Student</div>
                <div className="mt-1 font-semibold">{slip.student.fullName}</div>
                <div className="text-[var(--muted)]">
                  {slip.student.admissionNo}
                </div>
                {slip.student.className && (
                  <div className="text-[var(--muted)]">
                    {slip.student.className}
                  </div>
                )}
              </div>
              <div className="card-inset">
                <div className="section-label">Issued</div>
                <div className="mt-1 font-semibold">
                  {format(slip.issuedAt, "dd MMM yyyy HH:mm")}
                </div>
                <div className="text-[var(--muted)]">
                  By {slip.issuedBy.name}
                </div>
                <div className="text-[var(--muted)]">
                  Ack: {slip.acknowledgmentName}
                </div>
              </div>
            </div>

            {voided && (
              <div className="rounded-[4px] bg-[var(--warn-soft)] px-3 py-2 text-sm text-[var(--warn)]">
                Voided
                {slip.voidedAt
                  ? ` ${format(slip.voidedAt, "dd MMM yyyy HH:mm")}`
                  : ""}
                {slip.voidedBy ? ` by ${slip.voidedBy.name}` : ""}
                {slip.voidReason ? ` — ${slip.voidReason}` : ""}
              </div>
            )}

            <div>
              <div className="section-label mb-2">Items</div>
              <ul className="space-y-2">
                {slip.lines.map((line) => (
                  <li key={line.id} className="card-inset text-sm">
                    <div className="font-semibold">
                      {line.item.name} · {line.sizeLabel}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="chip">Req {line.qtyRequested}</span>
                      <span className="chip chip-ok">
                        Issued {line.qtyIssued}
                      </span>
                      {line.shortageQty > 0 && (
                        <span className="chip chip-warn">
                          Short {line.shortageQty}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-center gap-2 border-t border-[var(--line)] pt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt="QR code for this proof link"
                className="h-[140px] w-[140px] rounded-[4px] border border-[var(--line)] bg-white p-1"
              />
              <p className="text-center text-xs text-[var(--muted)]">
                Scan to reopen this proof
              </p>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
