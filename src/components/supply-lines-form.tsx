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
    <form action={action} className="form-stack form-flush">
      <input type="hidden" name="asSupplier" value={asSupplier ? "true" : "false"} />
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />
      {asSupplier ? (
        <input type="hidden" name="schoolId" value={partyId} />
      ) : (
        <input type="hidden" name="supplierId" value={partyId} />
      )}

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Order details</h3>
          <p className="form-section-sub">
            Choose the campus and optional note before adding lines
          </p>
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor="order-party">
              {asSupplier ? "School" : "Supplier"}
            </label>
            <select
              id="order-party"
              value={partyId}
              onChange={(e) => syncCatalog(e.target.value)}
              className="field"
              required
            >
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="order-note">
              Note
            </label>
            <input
              id="order-note"
              name="note"
              className="field"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Lines</h3>
          <p className="form-section-sub">Product, size, and quantity</p>
        </div>
        <LineEditor catalog={catalog} lines={lines} onChange={setLines} />
      </div>

      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          disabled={pending || !catalog.length}
          className="btn btn-primary"
        >
          {pending ? "Creating…" : "Create order"}
        </button>
      </div>
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
    <form action={action} className="form-stack form-flush">
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />
      <input type="hidden" name="schoolId" value={schoolId} />
      {defaultOrderId ? (
        <input type="hidden" name="orderId" value={defaultOrderId} />
      ) : null}

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Delivery details</h3>
          <p className="form-section-sub">
            Campus destination and dispatch preference
          </p>
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor="dn-school">
              School
            </label>
            <select
              id="dn-school"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="field"
              required
              disabled={Boolean(defaultSchoolId)}
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="dn-note">
              Note
            </label>
            <input
              id="dn-note"
              name="note"
              className="field"
              placeholder="Optional"
            />
          </div>
        </div>
        <label className="field-check">
          <input
            type="checkbox"
            name="markInTransit"
            value="true"
            defaultChecked
          />
          <span>
            <span className="field-check-title">Mark as in transit</span>
            <span className="field-check-sub">
              Ready to post to campus stock from the DN
            </span>
          </span>
        </label>
      </div>

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Lines</h3>
          <p className="form-section-sub">What ships on this delivery note</p>
        </div>
        <LineEditor catalog={products} lines={lines} onChange={setLines} />
      </div>

      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          disabled={pending || !products.length}
          className="btn btn-primary"
        >
          {pending ? "Creating…" : "Create delivery"}
        </button>
      </div>
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
    <div className="receive-lines">
      {!catalog.length && (
        <p className="field-hint">No products available.</p>
      )}
      {lines.map((line, index) => {
        const product = catalog.find((p) => p.id === line.productId);
        return (
          <div key={index} className="receive-line">
            <span className="receive-line-index" aria-hidden>
              {index + 1}
            </span>
            <div className="receive-line-fields">
              <div className="form-grid cols-3">
                <div className="field-group">
                  <label
                    className="field-label"
                    htmlFor={`line-product-${index}`}
                  >
                    Product
                  </label>
                  <select
                    id={`line-product-${index}`}
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
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor={`line-size-${index}`}>
                    Size
                  </label>
                  <select
                    id={`line-size-${index}`}
                    value={line.sizeLabel}
                    onChange={(e) =>
                      updateLine(index, { sizeLabel: e.target.value })
                    }
                    className="field"
                  >
                    {(product?.sizes ?? []).map((s) => (
                      <option key={s.sizeLabel} value={s.sizeLabel}>
                        {s.sizeLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor={`line-qty-${index}`}>
                    Qty
                  </label>
                  <input
                    id={`line-qty-${index}`}
                    type="number"
                    min={1}
                    value={line.qty}
                    onChange={(e) =>
                      updateLine(index, { qty: Number(e.target.value) || 1 })
                    }
                    className="field"
                  />
                </div>
              </div>
            </div>
            {lines.length > 1 ? (
              <button
                type="button"
                className="btn btn-ghost receive-line-remove"
                onClick={() => onChange(lines.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            ) : (
              <span className="receive-line-remove" aria-hidden />
            )}
          </div>
        );
      })}
      <div className="form-actions form-actions-inline">
        <button
          type="button"
          className="btn btn-secondary"
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
    </div>
  );
}
