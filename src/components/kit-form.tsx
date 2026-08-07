"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createKitAction,
  type CatalogState,
} from "@/app/actions/catalog";

type Item = {
  id: string;
  name: string;
  sku: string;
  active: boolean;
};

type Line = {
  itemId: string;
  qtyDefault: number;
};

const initial: CatalogState = {};

export function KitForm({ items }: { items: Item[] }) {
  const activeItems = items.filter((item) => item.active);
  const [state, action, pending] = useActionState(createKitAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [lines, setLines] = useState<Line[]>(
    activeItems[0]
      ? [{ itemId: activeItems[0].id, qtyDefault: 1 }]
      : [],
  );

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    const firstId = activeItems[0]?.id;
    setLines(firstId ? [{ itemId: firstId, qtyDefault: 1 }] : []);
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Kit name
          <input
            name="name"
            required
            placeholder="Form 1 Starter Kit"
            className="field mt-1.5"
          />
        </label>
        <label className="block text-sm font-semibold">
          Academic year
          <input
            name="academicYear"
            required
            defaultValue={String(new Date().getFullYear())}
            className="field mt-1.5"
          />
        </label>
      </div>

      <div className="space-y-3">
        <div className="section-label">Kit lines</div>
        {lines.map((line, index) => (
          <div key={index} className="card-inset grid gap-2 sm:grid-cols-[1fr_7rem_auto]">
            <select
              value={line.itemId}
              onChange={(e) => updateLine(index, { itemId: e.target.value })}
              className="field"
            >
              {activeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={line.qtyDefault}
              onChange={(e) =>
                updateLine(index, {
                  qtyDefault: Number(e.target.value) || 1,
                })
              }
              className="field"
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                setLines((prev) => prev.filter((_, i) => i !== index))
              }
              disabled={lines.length <= 1}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-secondary"
        disabled={!activeItems.length}
        onClick={() =>
          setLines((prev) => [
            ...prev,
            {
              itemId: activeItems[0]?.id ?? "",
              qtyDefault: 1,
            },
          ])
        }
      >
        + Add line
      </button>

      {state.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state.ok && <p className="text-sm text-[var(--ok)]">Kit created.</p>}

      <button
        type="submit"
        disabled={pending || !activeItems.length || !lines.length}
        className="btn btn-primary"
      >
        {pending ? "Saving…" : "Create kit"}
      </button>
    </form>
  );
}
