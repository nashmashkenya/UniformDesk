import Link from "next/link";
import type { DeskNotice, NoticeSeverity } from "@/modules/reports/notifications";

const severityChip: Record<NoticeSeverity, string> = {
  warn: "chip chip-warn",
  accent: "chip chip-accent",
  info: "chip",
};

const kindLabel: Record<DeskNotice["kind"], string> = {
  low_stock: "Stock",
  unpaid_invoice: "Invoice",
  delivery_receive: "Delivery",
  open_order: "Order",
  delivery_dispatch: "Dispatch",
  collect_payment: "Collect",
};

export function NoticesList({ notices }: { notices: DeskNotice[] }) {
  if (notices.length === 0) {
    return (
      <p className="px-3.5 py-8 text-sm text-[var(--muted)]">
        Nothing needs attention right now.
      </p>
    );
  }

  return (
    <>
      {notices.map((notice) => (
        <Link key={notice.id} href={notice.href} className="list-row !items-start">
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className={severityChip[notice.severity]}>
                {kindLabel[notice.kind]}
              </span>
              <span className="font-semibold text-[var(--accent)]">
                {notice.title}
              </span>
            </span>
            <span className="mt-1 block text-sm text-[var(--muted)]">
              {notice.detail}
            </span>
          </span>
        </Link>
      ))}
    </>
  );
}
