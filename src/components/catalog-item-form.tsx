"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createItemAction,
  type CatalogState,
} from "@/app/actions/catalog";

const initial: CatalogState = {};
const categories = [
  "shirt",
  "blouse",
  "trouser",
  "skirt",
  "sweater",
  "tunic",
  "dress",
  "shoes",
  "socks",
  "tie",
  "other",
] as const;

export function CatalogItemForm() {
  const [state, action, pending] = useActionState(createItemAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-semibold">
        SKU
        <input
          name="sku"
          required
          placeholder="SHIRT-WHT"
          className="field mt-1.5"
        />
      </label>
      <label className="block text-sm font-semibold">
        Name
        <input
          name="name"
          required
          placeholder="White Shirt"
          className="field mt-1.5"
        />
      </label>
      <label className="block text-sm font-semibold">
        Category
        <select name="category" className="field mt-1.5" defaultValue="shirt">
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Sizes
        <input
          name="sizes"
          required
          placeholder="S, M, L or 28, 30, 32"
          className="field mt-1.5"
        />
      </label>
      {state.error && (
        <p className="text-sm text-[var(--danger)] sm:col-span-2">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-[var(--ok)] sm:col-span-2">Item added.</p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Add item"}
        </button>
      </div>
    </form>
  );
}
