"use client";

import { formatMoney } from "@/lib/money";
import { holdReasonLabel, moneyStatusLabel } from "@/modules/issue/plan-labels";
import type { StandardUniformRow } from "@/modules/issue/uniform-set";

export type UniformCardRow = StandardUniformRow;

export function StudentUniformCard({
  title,
  rows,
  onToggleGive,
  onSizeChange,
  selectedCents,
}: {
  title: string;
  rows: UniformCardRow[];
  onToggleGive: (itemId: string, give: boolean) => void;
  onSizeChange: (itemId: string, sizeLabel: string) => void;
  selectedCents: number;
}) {
  if (!rows.length) return null;

  const givenCount = rows.filter((r) => r.qtyLeft <= 0).length;
  const leftCount = rows.filter((r) => r.qtyLeft > 0).length;

  return (
    <div className="form-stack">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-[var(--muted)]">
          {givenCount} given · {leftCount} not given. Tick Give now and the
          price fills in.
        </p>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => {
          const done = row.qtyLeft <= 0;
          const partial = row.qtyReceived > 0 && row.qtyLeft > 0;
          const unitLabel =
            row.unitPriceCents > 0 ? formatMoney(row.unitPriceCents) : null;
          const lineTotal =
            row.unitPriceCents > 0
              ? formatMoney(row.unitPriceCents * row.qtyLeft)
              : null;
          return (
            <li key={row.itemId} className="card-inset">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold">{row.itemName}</div>
                  <div className="text-xs text-[var(--muted)]">
                    Kit {row.qtyNeeded} · given {row.qtyReceived} · left{" "}
                    {row.qtyLeft}
                    {row.sizeLabel ? ` · ${row.sizeLabel}` : ""}
                    {unitLabel ? ` · ${unitLabel} each` : ""}
                  </div>
                </div>
                {done ? (
                  <span className="chip chip-ok">Given</span>
                ) : partial ? (
                  <span className="chip chip-warn">Partial</span>
                ) : (
                  <span className="chip chip-warn">Not given</span>
                )}
              </div>
              {!done && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {row.sizes.length > 0 && (
                    <select
                      value={row.sizeLabel}
                      onChange={(e) => onSizeChange(row.itemId, e.target.value)}
                      className="field max-w-[9rem]"
                      aria-label={`Size for ${row.itemName}`}
                    >
                      {row.sizes.map((s) => (
                        <option key={s.sizeLabel} value={s.sizeLabel}>
                          Size {s.sizeLabel}
                        </option>
                      ))}
                    </select>
                  )}
                  <label className="field-check">
                    <input
                      type="checkbox"
                      checked={row.fulfil}
                      onChange={(e) =>
                        onToggleGive(row.itemId, e.target.checked)
                      }
                    />
                    <span>
                      <span className="field-check-title">Give now</span>
                    </span>
                  </label>
                  <span className={`chip ${row.fulfil ? "chip-accent" : ""}`}>
                    {row.fulfil && lineTotal
                      ? lineTotal
                      : unitLabel ?? "—"}
                  </span>
                  {row.fulfil && row.onHand < row.qtyLeft && (
                    <span className="chip chip-warn">No stock</span>
                  )}
                  {row.holdReason && (
                    <span className="chip chip-warn">
                      {holdReasonLabel(row.holdReason)}
                    </span>
                  )}
                  {row.moneyStatus && (
                    <span className="chip">
                      {moneyStatusLabel(row.moneyStatus)}
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-[var(--muted)]">Selected now</span>
        <span className="font-semibold">{formatMoney(selectedCents)}</span>
      </div>
    </div>
  );
}
