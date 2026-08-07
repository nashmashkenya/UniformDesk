"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  adjustStockAction,
  type AdjustState,
} from "@/app/actions/inventory";

type Item = {
  id: string;
  name: string;
  sku: string;
  sizes: { sizeLabel: string }[];
};

const initial: AdjustState = {};

export function AdjustStockForm({
  items,
  defaultItemId,
  defaultSizeLabel,
}: {
  items: Item[];
  defaultItemId?: string;
  defaultSizeLabel?: string;
}) {
  const [state, action, pending] = useActionState(adjustStockAction, initial);
  const [itemId, setItemId] = useState(
    defaultItemId || items[0]?.id || "",
  );
  const selected = useMemo(
    () => items.find((i) => i.id === itemId),
    [items, itemId],
  );
  const [sizeLabel, setSizeLabel] = useState(
    defaultSizeLabel || selected?.sizes[0]?.sizeLabel || "",
  );

  useEffect(() => {
    if (!selected?.sizes.some((s) => s.sizeLabel === sizeLabel)) {
      setSizeLabel(selected?.sizes[0]?.sizeLabel || "");
    }
  }, [selected, sizeLabel]);

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-medium">
        Item
        <select
          name="itemId"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="field mt-1.5"
          required
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.sku})
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-medium">
          Size
          <select
            name="sizeLabel"
            value={sizeLabel}
            onChange={(e) => setSizeLabel(e.target.value)}
            className="field mt-1.5"
            required
          >
            {(selected?.sizes ?? []).map((s) => (
              <option key={s.sizeLabel} value={s.sizeLabel}>
                {s.sizeLabel}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Direction
          <select name="direction" defaultValue="increase" className="field mt-1.5">
            <option value="increase">Increase (+)</option>
            <option value="decrease">Decrease (−)</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Quantity
          <input
            name="qty"
            type="number"
            min={1}
            step={1}
            defaultValue={1}
            required
            className="field mt-1.5"
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Reason
        <input
          name="reasonNote"
          required
          placeholder="Count correction, damaged, found stock…"
          className="field mt-1.5"
        />
      </label>

      {state.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state.message && (
        <p className="text-sm text-[var(--ok)]">{state.message}</p>
      )}

      <button type="submit" disabled={pending || !items.length} className="btn btn-primary">
        {pending ? "Saving…" : "Post adjustment"}
      </button>
    </form>
  );
}
