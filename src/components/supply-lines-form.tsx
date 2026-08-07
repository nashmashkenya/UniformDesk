"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createDeliveryAction,
  createOrderAction,
  type SupplyState,
} from "@/app/actions/supply";

type Product = {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  sizes: { sizeLabel: string }[];
};

type Party = { id: string; name: string };

type Line = {
  productId: string;
  sizeLabel: string;
  qty: number;
};

const initial: SupplyState = {};

export function SupplyOrderForm({
  asSupplier,
  parties,
  products,
  productsBySupplier,
}: {
  asSupplier: boolean;
  parties: Party[];
  products?: Product[];
  productsBySupplier?: Record<string, Product[]>;
}) {
  const [state, action, pending] = useActionState(createOrderAction, initial);
  const [partyId, setPartyId] = useState(parties[0]?.id ?? "");
  const catalog = useMemo(() => {
    if (asSupplier) return products ?? [];
    return productsBySupplier?.[partyId] ?? [];
  }, [asSupplier, products, productsBySupplier, partyId]);
  const [lines, setLines] = useState<Line[]>(() => [
    {
      productId: catalog[0]?.id ?? "",
      sizeLabel: catalog[0]?.sizes[0]?.sizeLabel ?? "",
      qty: 10,
    },
  ]);

  function syncCatalog(nextParty: string) {
    setPartyId(nextParty);
    const next = asSupplier
      ? (products ?? [])
      : (productsBySupplier?.[nextParty] ?? []);
    setLines([
      {
        productId: next[0]?.id ?? "",
        sizeLabel: next[0]?.sizes[0]?.sizeLabel ?? "",
        qty: 10,
      },
    ]);
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="asSupplier" value={asSupplier ? "true" : "false"} />
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />
      {asSupplier ? (
        <input type="hidden" name="schoolId" value={partyId} />
      ) : (
        <input type="hidden" name="supplierId" value={partyId} />
      )}

      <label className="block text-sm font-medium">
        {asSupplier ? "School" : "Supplier"}
        <select
          value={partyId}
          onChange={(e) => syncCatalog(e.target.value)}
          className="field mt-1.5"
          required
        >
          {parties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Note
        <input name="note" className="field mt-1.5" placeholder="Optional" />
      </label>

      <LineEditor
        catalog={catalog}
        lines={lines}
        onChange={setLines}
      />

      {state.error && (
        <p className="rounded-[4px] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !catalog.length}
        className="btn btn-primary"
      >
        {pending ? "Creating…" : "Create order"}
      </button>
    </form>
  );
}

export function SupplyDeliveryForm({
  schools,
  products,
  defaultSchoolId,
  defaultOrderId,
  defaultLines,
}: {
  schools: Party[];
  products: Product[];
  defaultSchoolId?: string;
  defaultOrderId?: string;
  defaultLines?: Line[];
}) {
  const [state, action, pending] = useActionState(createDeliveryAction, initial);
  const [schoolId, setSchoolId] = useState(
    defaultSchoolId ?? schools[0]?.id ?? "",
  );
  const [lines, setLines] = useState<Line[]>(
    defaultLines?.length
      ? defaultLines
      : [
          {
            productId: products[0]?.id ?? "",
            sizeLabel: products[0]?.sizes[0]?.sizeLabel ?? "",
            qty: 10,
          },
        ],
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />
      <input type="hidden" name="schoolId" value={schoolId} />
      {defaultOrderId ? (
        <input type="hidden" name="orderId" value={defaultOrderId} />
      ) : null}

      <label className="block text-sm font-medium">
        School
        <select
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          className="field mt-1.5"
          required
          disabled={Boolean(defaultSchoolId)}
        >
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Note
        <input name="note" className="field mt-1.5" placeholder="Optional" />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="markInTransit" value="true" defaultChecked />
        Mark as in transit
      </label>

      <LineEditor catalog={products} lines={lines} onChange={setLines} />

      {state.error && (
        <p className="rounded-[4px] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !products.length}
        className="btn btn-primary"
      >
        {pending ? "Creating…" : "Create delivery"}
      </button>
    </form>
  );
}

function LineEditor({
  catalog,
  lines,
  onChange,
}: {
  catalog: Product[];
  lines: Line[];
  onChange: (lines: Line[]) => void;
}) {
  function updateLine(index: number, patch: Partial<Line>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  return (
    <div className="space-y-3">
      <div className="section-label">Lines</div>
      {!catalog.length && (
        <p className="text-sm text-[var(--muted)]">No products available.</p>
      )}
      {lines.map((line, index) => {
        const product = catalog.find((p) => p.id === line.productId);
        return (
          <div key={index} className="card-inset grid gap-2 sm:grid-cols-3">
            <select
              value={line.productId}
              onChange={(e) => {
                const next = catalog.find((p) => p.id === e.target.value);
                updateLine(index, {
                  productId: e.target.value,
                  sizeLabel: next?.sizes[0]?.sizeLabel ?? "",
                });
              }}
              className="field"
            >
              {catalog.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
            <select
              value={line.sizeLabel}
              onChange={(e) => updateLine(index, { sizeLabel: e.target.value })}
              className="field"
            >
              {(product?.sizes ?? []).map((s) => (
                <option key={s.sizeLabel} value={s.sizeLabel}>
                  {s.sizeLabel}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={line.qty}
                onChange={(e) =>
                  updateLine(index, { qty: Number(e.target.value) || 1 })
                }
                className="field"
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onChange(lines.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() =>
          onChange([
            ...lines,
            {
              productId: catalog[0]?.id ?? "",
              sizeLabel: catalog[0]?.sizes[0]?.sizeLabel ?? "",
              qty: 1,
            },
          ])
        }
        disabled={!catalog.length}
      >
        Add line
      </button>
    </div>
  );
}
