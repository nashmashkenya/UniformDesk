const tones: Record<string, string> = {
  confirmed: "bg-[var(--accent-soft)] text-[var(--accent)]",
  packed: "bg-[var(--accent-soft)] text-[var(--accent)]",
  in_transit: "bg-[var(--warn-soft)] text-[var(--warn)]",
  delivered: "bg-[var(--ok-soft)] text-[var(--ok)]",
  fulfilled: "bg-[var(--ok-soft)] text-[var(--ok)]",
  issued: "bg-[var(--accent-soft)] text-[var(--accent)]",
  paid: "bg-[var(--ok-soft)] text-[var(--ok)]",
  completed: "bg-[var(--ok-soft)] text-[var(--ok)]",
  pending: "bg-[var(--warn-soft)] text-[var(--warn)]",
  failed: "bg-[var(--danger-soft)] text-[var(--danger)]",
  cancelled: "bg-[var(--danger-soft)] text-[var(--danger)]",
  void: "bg-[var(--danger-soft)] text-[var(--danger)]",
  voided: "bg-[var(--warn-soft)] text-[var(--warn)]",
  draft: "bg-[var(--wash)] text-[var(--muted)]",
};

export function StatusPill({ status }: { status: string }) {
  const tone = tones[status] ?? "bg-[var(--wash)] text-[var(--muted)]";
  return (
    <span
      className={`inline-flex rounded-[4px] px-2 py-0.5 text-xs font-semibold capitalize ${tone}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
