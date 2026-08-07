"use client";

import { useActionState, useState } from "react";
import {
  receiveStockAction,
  type ReceiveState,
} from "@/app/actions/inventory";

type Item = {
  id: string;
  name: string;
  sku: string;
  sizes: { sizeLabel: string }[];
};

type Line = {
  itemId: string;
  sizeLabel: string;
  qty: number;
};

const initial: ReceiveState = {};

export function ReceiveForm({ items }: { items: Item[] }) {
  const [state, action, pending] = useActionState(receiveStockAction, initial);
  const [lines, setLines] = useState<Line[]>([
    {
      itemId: items[0]?.id ?? "",
      sizeLabel: items[0]?.sizes[0]?.sizeLabel ?? "",
      qty: 10,
    },
  ]);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />

      <label className="block text-sm font-medium">
        Supplier name
        <input
          name="supplierName"
          defaultValue="UniformDesk Supply"
          required
          className="field mt-1.5"
        />
      </label>

      <label className="block text-sm font-medium">
        Note
        <input
          name="note"
          placeholder="Delivery note / invoice ref"
          className="field mt-1.5"
        />
      </label>

      <div className="space-y-3">
        <div className="section-label">Stock lines</div>
        {lines.map((line, index) => {
          const item = items.find((i) => i.id === line.itemId);
          return (
            <div key={index} className="card-inset grid gap-2">
              <select
                value={line.itemId}
                onChange={(e) => {
                  const next = items.find((i) => i.id === e.target.value);
                  updateLine(index, {
                    itemId: e.target.value,
                    sizeLabel: next?.sizes[0]?.sizeLabel ?? "",
                  });
                }}
                className="field"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.sku})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={line.sizeLabel}
                  onChange={(e) =>
                    updateLine(index, { sizeLabel: e.target.value })
                  }
                  className="field"
                >
                  {(item?.sizes ?? []).map((s) => (
                    <option key={s.sizeLabel} value={s.sizeLabel}>
                      Size {s.sizeLabel}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={line.qty}
                  onChange={(e) =>
                    updateLine(index, { qty: Number(e.target.value) || 1 })
                  }
                  className="field"
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() =>
          setLines((prev) => [
            ...prev,
            {
              itemId: items[0]?.id ?? "",
              sizeLabel: items[0]?.sizes[0]?.sizeLabel ?? "",
              qty: 1,
            },
          ])
        }
        className="btn btn-ghost px-4 text-sm"
      >
        + Add line
      </button>

      {state.error && (
        <p className="card-inset border-[color-mix(in_srgb,var(--danger)_35%,var(--line))] bg-[var(--danger-soft)] text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}

      <div className="sticky-actions no-print">
        <button
          type="submit"
          disabled={pending || !items.length}
          className="btn btn-primary w-full"
        >
          {pending ? "Saving…" : "Receive into stock"}
        </button>
      </div>
    </form>
  );
}
