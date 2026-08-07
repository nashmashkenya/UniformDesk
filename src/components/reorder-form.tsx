"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createReorderOrderAction,
  type ReorderState,
} from "@/app/actions/reorder";
import type { ReorderSuggestion } from "@/modules/supply/reorder";

type Supplier = { id: string; name: string };

const initial: ReorderState = {};

export function ReorderForm({
  suppliers,
  initialSupplierId,
  suggestions,
}: {
  suppliers: Supplier[];
  initialSupplierId: string;
  suggestions: ReorderSuggestion[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    createReorderOrderAction,
    initial,
  );
  const [supplierId, setSupplierId] = useState(
    initialSupplierId || suppliers[0]?.id || "",
  );
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const row of suggestions) {
      if (row.matched) map[keyFor(row)] = true;
    }
    return map;
  });
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const row of suggestions) {
      map[keyFor(row)] = row.suggestedQty;
    }
    return map;
  });

  useEffect(() => {
    // Reset selection when server suggestions change (supplier switch).
    const map: Record<string, boolean> = {};
    const qtys: Record<string, number> = {};
    for (const row of suggestions) {
      if (row.matched) map[keyFor(row)] = true;
      qtys[keyFor(row)] = row.suggestedQty;
    }
    setSelected(map);
    setQty(qtys);
  }, [suggestions]);

  const lines = useMemo(() => {
    return suggestions
      .filter((row) => row.matched && selected[keyFor(row)] && row.productId)
      .map((row) => ({
        productId: row.productId!,
        sizeLabel: row.sizeLabel,
        qty: Math.max(1, qty[keyFor(row)] || row.suggestedQty),
      }));
  }, [suggestions, selected, qty]);

  const unmatched = suggestions.filter((row) => !row.matched).length;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />
      <input type="hidden" name="supplierId" value={supplierId} />

      <label className="block text-sm font-medium">
        Supplier
        <select
          value={supplierId}
          onChange={(e) => {
            setSupplierId(e.target.value);
            router.push(`/reorder?supplierId=${encodeURIComponent(e.target.value)}`);
          }}
          className="field mt-1.5"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Note
        <input
          name="note"
          defaultValue="Low-stock reorder"
          className="field mt-1.5"
        />
      </label>

      <div className="space-y-2">
        <div className="section-label">Suggested lines</div>
        {suggestions.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            No low-stock sizes at the current threshold.
          </p>
        )}
        {suggestions.map((row) => {
          const key = keyFor(row);
          return (
            <div
              key={key}
              className={`card-inset grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center ${
                !row.matched ? "opacity-70" : ""
              }`}
            >
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(selected[key])}
                  disabled={!row.matched}
                  onChange={(e) =>
                    setSelected((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                />
                <span className="font-medium">{row.itemName}</span>
              </label>
              <div className="text-xs text-[var(--muted)]">
                {row.sku} · Size {row.sizeLabel} · on hand {row.qtyOnHand}
                {row.matched
                  ? ` · matches ${row.productName}`
                  : " · no supplier SKU/size match"}
              </div>
              <input
                type="number"
                min={1}
                disabled={!row.matched}
                value={qty[key] ?? row.suggestedQty}
                onChange={(e) =>
                  setQty((prev) => ({
                    ...prev,
                    [key]: Number(e.target.value) || 1,
                  }))
                }
                className="field max-w-[6rem]"
              />
            </div>
          );
        })}
      </div>

      {unmatched > 0 && (
        <p className="text-sm text-[var(--warn)]">
          {unmatched} line{unmatched === 1 ? "" : "s"} skipped — add matching
          supplier catalog SKUs/sizes first.
        </p>
      )}

      {state.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !lines.length}
        className="btn btn-primary"
      >
        {pending
          ? "Creating order…"
          : `Create order (${lines.length} line${lines.length === 1 ? "" : "s"})`}
      </button>
    </form>
  );
}

function keyFor(row: Pick<ReorderSuggestion, "itemId" | "sizeLabel">) {
  return `${row.itemId}:${row.sizeLabel}`;
}
