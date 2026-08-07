import { format } from "date-fns";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { ShareProof } from "@/components/share-proof";
import { VoidForm } from "@/components/void-form";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { proofUrl } from "@/lib/url";
import { getSlip } from "@/modules/issue/issue";
import { qrDataUrlForToken } from "@/modules/issue/proof";

export default async function SlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSchoolUser();
  const { id } = await params;
  const slip = await getSlip(user.schoolId, id);
  if (!slip) notFound();

  const verifyUrl = proofUrl(slip.publicToken);
  const qr = await qrDataUrlForToken(slip.publicToken);

  return (
    <div className="page-stack mx-auto max-w-3xl">
      <header className="page-header no-print">
        <div className="page-header-main">
          <h1 className="page-title">Issue slip</h1>
          <p className="page-sub">{slip.slipNo}</p>
        </div>
        <PrintButton label="Print slip" />
      </header>

      <ShareProof
        url={verifyUrl}
        studentName={slip.student.fullName}
        slipNo={slip.slipNo}
      />

      <article className="print-sheet card">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">UniformDesk</h2>
            <p className="card-subtitle">{slip.school.name}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{slip.slipNo}</div>
            <div className="text-xs text-[var(--muted)]">
              {format(slip.issuedAt, "dd MMM yyyy HH:mm")}
            </div>
            <div className="mt-2">
              <span
                className={
                  slip.status === "voided" ? "chip chip-warn" : "chip chip-ok"
                }
              >
                {slip.status}
              </span>
            </div>
          </div>
        </div>

        <div className="card-body space-y-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="card-inset">
              <div className="section-label">Student</div>
              <div className="mt-1 font-semibold">{slip.student.fullName}</div>
              <div className="text-[var(--muted)]">{slip.student.admissionNo}</div>
              <div className="text-[var(--muted)]">{slip.student.className}</div>
            </div>
            <div className="card-inset">
              <div className="section-label">Issued by</div>
              <div className="mt-1 font-semibold">{slip.issuedBy.name}</div>
              <div className="text-[var(--muted)]">
                Ack: {slip.acknowledgmentName}
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:hidden">
            {slip.lines.map((line) => (
              <div key={line.id} className="card-inset text-sm">
                <div className="font-semibold">
                  {line.item.name} · {line.sizeLabel}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip">Req {line.qtyRequested}</span>
                  <span className="chip chip-ok">Issued {line.qtyIssued}</span>
                  {line.shortageQty > 0 && (
                    <span className="chip chip-warn">
                      Short {line.shortageQty}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="table-wrap hidden overflow-hidden rounded-[6px] border border-[var(--line)] sm:block">
            <table className="data-table min-w-0">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Size</th>
                  <th>Requested</th>
                  <th>Issued</th>
                  <th>Shortage</th>
                </tr>
              </thead>
              <tbody>
                {slip.lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.item.name}</td>
                    <td>{line.sizeLabel}</td>
                    <td>{line.qtyRequested}</td>
                    <td>{line.qtyIssued}</td>
                    <td className="text-[var(--warn)]">{line.shortageQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div className="section-label">Signature</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slip.acknowledgmentSignature}
              alt="Acknowledgment signature"
              className="mt-2 h-28 w-full max-w-md rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] object-contain"
            />
          </div>

          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="section-label">Guardian verify</div>
              <p className="mt-1 max-w-sm text-xs text-[var(--muted)]">
                Scan or open the public proof link. No school login required.
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt="QR code linking to public issue proof"
              className="h-[120px] w-[120px] rounded-[4px] border border-[var(--line)] bg-white p-1"
            />
          </div>

          {slip.status === "voided" && (
            <div className="card-inset border-[color-mix(in_srgb,var(--warn)_40%,var(--line))] bg-[var(--warn-soft)] text-sm">
              Voided{" "}
              {slip.voidedAt ? format(slip.voidedAt, "dd MMM yyyy HH:mm") : ""}
              {slip.voidedBy ? ` by ${slip.voidedBy.name}` : ""}
              <div className="mt-1 font-medium">Reason: {slip.voidReason}</div>
            </div>
          )}
        </div>
      </article>

      {slip.status === "issued" && canWrite(user.role) && (
        <div className="no-print mx-auto w-full max-w-lg">
          <VoidForm slipId={slip.id} />
        </div>
      )}
    </div>
  );
}
