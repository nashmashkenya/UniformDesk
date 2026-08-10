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
    <form action={action} className="form-stack form-flush">
      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Identity</h3>
          <p className="form-section-sub">How your organisation appears on the portal</p>
        </div>
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
          <span className="field-label" id="brand-color-label">
            Primary color
          </span>
          <div className="field-color-row" role="group" aria-labelledby="brand-color-label">
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="field field-color"
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
      </div>

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Support contacts</h3>
          <p className="form-section-sub">Shown on slips and invoices when set</p>
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
      </div>

      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <p className="field-ok">{state.message}</p>}
      <div className="form-actions">
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
    <form action={action} className="form-stack form-flush">
      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">New school</h3>
          <p className="form-section-sub">
            Creates a campus code and links it to your organisation
          </p>
        </div>
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
            <p className="field-hint">
              2–12 letters or numbers · your team operates the desk
            </p>
          </div>
        </div>
      </div>

      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <p className="field-ok">{state.message}</p>}

      <div className="form-actions">
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
    <form action={action} className="form-stack form-flush">
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
      <div className="form-actions">
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
