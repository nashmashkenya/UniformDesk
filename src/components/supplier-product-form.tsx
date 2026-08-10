"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createSupplierProductAction,
  type SupplyState,
} from "@/app/actions/supply";

const initial: SupplyState = {};

export function SupplierProductForm() {
  const [state, action, pending] = useActionState(
    createSupplierProductAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="form-stack form-flush">
      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Product</h3>
          <p className="form-section-sub">
            Master SKU used on orders, deliveries, and invoices
          </p>
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor="product-sku">
              SKU
            </label>
            <input
              id="product-sku"
              name="sku"
              required
              placeholder="SHIRT-WHT"
              className="field"
            />
            <p className="field-hint">Must match the school item SKU for receive</p>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="product-price">
              Unit price (KES)
            </label>
            <input
              id="product-price"
              name="unitPrice"
              type="number"
              min={0}
              step="1"
              required
              defaultValue={850}
              className="field"
            />
          </div>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="product-name">
            Name
          </label>
          <input id="product-name" name="name" required className="field" />
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor="product-category">
              Category
            </label>
            <input
              id="product-category"
              name="category"
              defaultValue="shirt"
              required
              className="field"
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="product-sizes">
              Sizes
            </label>
            <input
              id="product-sizes"
              name="sizes"
              required
              defaultValue="S, M, L"
              className="field"
            />
            <p className="field-hint">Comma-separated</p>
          </div>
        </div>
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && <p className="field-ok">Product added</p>}
      <div className="form-actions">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Add product"}
        </button>
      </div>
    </form>
  );
}
