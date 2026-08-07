"use client";

import { useActionState, useState } from "react";
import {
  linkSchoolAction,
  updateBrandingAction,
  type BrandState,
} from "@/app/actions/branding";
import type { SupplierBrand } from "@/modules/supply/branding";

const initial: BrandState = {};

export function BrandingForm({ brand }: { brand: SupplierBrand }) {
  const [state, action, pending] = useActionState(updateBrandingAction, initial);
  const [primary, setPrimary] = useState(brand.brandPrimary);

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Brand name
          <input
            name="brandName"
            required
            defaultValue={brand.brandName}
            className="field mt-1.5"
          />
        </label>
        <label className="block text-sm font-medium">
          Mark (1–3 letters)
          <input
            name="brandMark"
            required
            maxLength={3}
            defaultValue={brand.brandMark}
            className="field mt-1.5"
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Primary color
        <div className="mt-1.5 flex gap-2">
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-[4px] border border-[var(--line)] bg-transparent p-1"
          />
          <input
            name="brandPrimary"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="field font-mono"
            required
          />
        </div>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Support email
          <input
            name="supportEmail"
            type="email"
            defaultValue={brand.supportEmail ?? ""}
            className="field mt-1.5"
          />
        </label>
        <label className="block text-sm font-medium">
          Support phone
          <input
            name="supportPhone"
            defaultValue={brand.supportPhone ?? ""}
            className="field mt-1.5"
          />
        </label>
      </div>
      {state.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state.message && (
        <p className="text-sm text-[var(--ok)]">{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Save branding"}
      </button>
    </form>
  );
}

export function LinkSchoolForm() {
  const [state, action, pending] = useActionState(linkSchoolAction, initial);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label className="block min-w-[12rem] flex-1 text-sm font-medium">
        School code
        <input
          name="schoolCode"
          required
          placeholder="RVA"
          className="field mt-1.5"
        />
      </label>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Linking…" : "Link school"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state.message && (
        <p className="w-full text-sm text-[var(--ok)]">{state.message}</p>
      )}
    </form>
  );
}
