"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addItemSizeAction,
  type CatalogState,
} from "@/app/actions/catalog";

const initial: CatalogState = {};

export function AddSizeForm({ itemId }: { itemId: string }) {
  const [state, action, pending] = useActionState(addItemSizeAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <label className="block min-w-[7rem] flex-1 text-xs font-semibold">
        Add size
        <input
          name="sizeLabel"
          required
          placeholder="XL"
          className="field mt-1"
        />
      </label>
      <button type="submit" disabled={pending} className="btn btn-secondary">
        {pending ? "…" : "Add"}
      </button>
      {state.error && (
        <p className="w-full text-xs text-[var(--danger)]">{state.error}</p>
      )}
    </form>
  );
}
