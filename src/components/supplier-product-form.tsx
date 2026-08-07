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
    <form ref={formRef} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          SKU
          <input
            name="sku"
            required
            placeholder="SHIRT-WHT"
            className="field mt-1.5"
          />
        </label>
        <label className="block text-sm font-medium">
          Unit price (KES)
          <input
            name="unitPrice"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={850}
            className="field mt-1.5"
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Name
        <input name="name" required className="field mt-1.5" />
      </label>
      <label className="block text-sm font-medium">
        Category
        <input
          name="category"
          defaultValue="shirt"
          required
          className="field mt-1.5"
        />
      </label>
      <label className="block text-sm font-medium">
        Sizes (comma-separated)
        <input
          name="sizes"
          required
          defaultValue="S, M, L"
          className="field mt-1.5"
        />
      </label>
      {state.error && (
        <p className="rounded-[4px] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-[4px] bg-[var(--ok-soft)] px-3 py-2 text-sm text-[var(--ok)]">
          Product added
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Add product"}
      </button>
    </form>
  );
}
