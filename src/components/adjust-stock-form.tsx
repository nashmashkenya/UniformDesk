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

type BalanceHint = {
  itemId: string;
  sizeLabel: string;
  qtyOnHand: number;
};

const REASON_PRESETS = [
  "Stock take",
  "Damaged",
  "Found stock",
  "Correction",
] as const;

const initial: AdjustState = {};

export function AdjustStockForm({
  items,
  balances = [],
  defaultItemId,
  defaultSizeLabel,
}: {
  items: Item[];
  balances?: BalanceHint[];
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
  const [direction, setDirection] = useState<"increase" | "decrease">(
    "increase",
  );
  const [reasonNote, setReasonNote] = useState("");

  useEffect(() => {
    if (!selected?.sizes.some((s) => s.sizeLabel === sizeLabel)) {
      setSizeLabel(selected?.sizes[0]?.sizeLabel || "");
    }
  }, [selected, sizeLabel]);

  const onHand = useMemo(() => {
    const row = balances.find(
      (b) => b.itemId === itemId && b.sizeLabel === sizeLabel,
    );
    return row?.qtyOnHand;
  }, [balances, itemId, sizeLabel]);

  return (
    <form action={action} className="form-stack form-flush">
      <input type="hidden" name="direction" value={direction} />

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Product</h3>
          <p className="form-section-sub">Choose the item and size to adjust</p>
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor="adjust-item">
              Item
            </label>
            <select
              id="adjust-item"
              name="itemId"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="field"
              required
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="adjust-size">
              Size
            </label>
            <select
              id="adjust-size"
              name="sizeLabel"
              value={sizeLabel}
              onChange={(e) => setSizeLabel(e.target.value)}
              className="field"
              required
            >
              {(selected?.sizes ?? []).map((s) => (
                <option key={s.sizeLabel} value={s.sizeLabel}>
                  {s.sizeLabel}
                </option>
              ))}
            </select>
            {typeof onHand === "number" && (
              <p className="field-hint">
                Current on hand: <strong>{onHand}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Adjustment</h3>
          <p className="form-section-sub">
            Increase for found stock · decrease for damage or count short
          </p>
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <span className="field-label" id="adjust-direction-label">
              Direction
            </span>
            <div
              className="seg-control"
              role="group"
              aria-labelledby="adjust-direction-label"
            >
              <button
                type="button"
                className={`seg-control-item ${
                  direction === "increase" ? "is-active" : ""
                }`}
                onClick={() => setDirection("increase")}
              >
                Increase (+)
              </button>
              <button
                type="button"
                className={`seg-control-item ${
                  direction === "decrease" ? "is-active" : ""
                }`}
                onClick={() => setDirection("decrease")}
              >
                Decrease (−)
              </button>
            </div>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="adjust-qty">
              Quantity
            </label>
            <input
              id="adjust-qty"
              name="qty"
              type="number"
              min={1}
              step={1}
              defaultValue={1}
              required
              inputMode="numeric"
              className="field"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Audit reason</h3>
          <p className="form-section-sub">Required for the stock ledger</p>
        </div>
        <div className="field-group">
          <div className="reason-presets" role="group" aria-label="Quick reasons">
            {REASON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`reason-chip ${
                  reasonNote === preset ? "is-active" : ""
                }`}
                onClick={() => setReasonNote(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="adjust-reason">
            Reason note
          </label>
          <input
            id="adjust-reason"
            name="reasonNote"
            required
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            placeholder="e.g. Stock take — Form 1 cupboard"
            className="field"
          />
        </div>
      </div>

      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <p className="field-ok">{state.message}</p>}

      <div className="form-actions">
        <button
          type="submit"
          disabled={pending || !items.length}
          className="btn btn-primary"
        >
          {pending ? "Saving…" : "Post adjustment"}
        </button>
      </div>
    </form>
  );
}
