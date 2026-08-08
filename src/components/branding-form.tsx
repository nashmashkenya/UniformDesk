"use client";

import { useActionState, useState } from "react";
import {
  createSchoolAction,
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
    <form action={action} className="form-stack">
      <div className="form-grid cols-2">
        <div className="field-group">
          <label className="field-label" htmlFor="brand-name">
            Brand name
          </label>
          <input
            id="brand-name"
            name="brandName"
            required
            defaultValue={brand.brandName}
            className="field"
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="brand-mark">
            Mark (1–3 letters)
          </label>
          <input
            id="brand-mark"
            name="brandMark"
            required
            maxLength={3}
            defaultValue={brand.brandMark}
            className="field"
          />
        </div>
      </div>
      <div className="field-group">
        <span className="field-label">Primary color</span>
        <div className="flex gap-2">
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="field w-14 shrink-0"
            aria-label="Pick brand color"
          />
          <input
            name="brandPrimary"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="field font-mono"
            required
          />
        </div>
      </div>
      <div className="form-grid cols-2">
        <div className="field-group">
          <label className="field-label" htmlFor="brand-email">
            Support email
          </label>
          <input
            id="brand-email"
            name="supportEmail"
            type="email"
            defaultValue={brand.supportEmail ?? ""}
            className="field"
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="brand-phone">
            Support phone
          </label>
          <input
            id="brand-phone"
            name="supportPhone"
            defaultValue={brand.supportPhone ?? ""}
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
      <div>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save branding"}
        </button>
      </div>
    </form>
  );
}

export function CreateSchoolForm() {
  const [state, action, pending] = useActionState(createSchoolAction, initial);

  return (
    <form action={action} className="form-stack">
      <div className="form-grid cols-2">
        <div className="field-group">
          <label className="field-label" htmlFor="create-school-name">
            School name
          </label>
          <input
            id="create-school-name"
            name="name"
            required
            placeholder="e.g. Nyeri High School"
            className="field"
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="create-school-code">
            School code
          </label>
          <input
            id="create-school-code"
            name="code"
            required
            placeholder="e.g. NHS"
            className="field"
            autoComplete="off"
          />
          <p className="field-hint">2–12 letters or numbers · used to link & filter</p>
        </div>
      </div>

      <div className="section-label">School reporter login</div>
      <div className="form-grid cols-2">
        <div className="field-group">
          <label className="field-label" htmlFor="create-reporter-name">
            Reporter name
          </label>
          <input
            id="create-reporter-name"
            name="reporterName"
            required
            placeholder="Desk contact"
            className="field"
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="create-reporter-email">
            Reporter email
          </label>
          <input
            id="create-reporter-email"
            name="reporterEmail"
            type="email"
            required
            placeholder="report@school.ac.ke"
            className="field"
            autoComplete="off"
          />
        </div>
        <div className="field-group sm:col-span-2">
          <label className="field-label" htmlFor="create-reporter-password">
            Temporary password
          </label>
          <input
            id="create-reporter-password"
            name="reporterPassword"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="field"
            autoComplete="new-password"
          />
        </div>
      </div>

      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <p className="field-ok">{state.message}</p>}

      <div>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Creating…" : "Create school"}
        </button>
      </div>
    </form>
  );
}

export function LinkSchoolForm() {
  const [state, action, pending] = useActionState(linkSchoolAction, initial);

  return (
    <form action={action} className="form-stack">
      <div className="field-group max-w-md">
        <label className="field-label" htmlFor="link-school-code">
          Existing school code
        </label>
        <input
          id="link-school-code"
          name="schoolCode"
          required
          placeholder="RVA"
          className="field"
        />
        <p className="field-hint">
          Only for schools that already exist in UniformDesk
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-secondary">
          {pending ? "Linking…" : "Link school"}
        </button>
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <p className="field-ok">{state.message}</p>}
    </form>
  );
}
