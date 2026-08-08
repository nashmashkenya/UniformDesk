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

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  return (
    <form action={action} className="form-stack form-flush">
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Delivery details</h3>
          <p className="form-section-sub">Who delivered and any reference note</p>
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor="receive-supplier">
              Supplier name
            </label>
            <input
              id="receive-supplier"
              name="supplierName"
              defaultValue="UniformDesk Supply"
              required
              className="field"
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="receive-note">
              Delivery / invoice note
            </label>
            <input
              id="receive-note"
              name="note"
              placeholder="DN-… or invoice reference"
              className="field"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Stock lines</h3>
          <p className="form-section-sub">
            Each line posts to the ledger and updates on-hand balances
          </p>
        </div>

        <div className="receive-lines">
          {lines.map((line, index) => {
            const item = items.find((i) => i.id === line.itemId);
            return (
              <div key={index} className="receive-line">
                <div className="receive-line-index" aria-hidden>
                  {index + 1}
                </div>
                <div className="receive-line-fields">
                  <div className="field-group">
                    <label className="field-label" htmlFor={`receive-item-${index}`}>
                      Item
                    </label>
                    <select
                      id={`receive-item-${index}`}
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
                  </div>
                  <div className="form-grid cols-2">
                    <div className="field-group">
                      <label
                        className="field-label"
                        htmlFor={`receive-size-${index}`}
                      >
                        Size
                      </label>
                      <select
                        id={`receive-size-${index}`}
                        value={line.sizeLabel}
                        onChange={(e) =>
                          updateLine(index, { sizeLabel: e.target.value })
                        }
                        className="field"
                      >
                        {(item?.sizes ?? []).map((s) => (
                          <option key={s.sizeLabel} value={s.sizeLabel}>
                            {s.sizeLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field-group">
                      <label
                        className="field-label"
                        htmlFor={`receive-qty-${index}`}
                      >
                        Quantity
                      </label>
                      <input
                        id={`receive-qty-${index}`}
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={line.qty}
                        onChange={(e) =>
                          updateLine(index, {
                            qty: Number(e.target.value) || 1,
                          })
                        }
                        className="field"
                      />
                    </div>
                  </div>
                </div>
                {lines.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost receive-line-remove"
                    onClick={() => removeLine(index)}
                    aria-label={`Remove line ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="form-actions form-actions-inline">
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
            className="btn btn-secondary"
          >
            Add line
          </button>
        </div>
      </div>

      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="form-actions sticky-actions no-print">
        <button
          type="submit"
          disabled={pending || !items.length}
          className="btn btn-primary w-full sm:w-auto"
        >
          {pending ? "Saving…" : "Receive into stock"}
        </button>
      </div>
    </form>
  );
}
