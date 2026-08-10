"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createSupplierTeamUserAction,
  resetSupplierTeamPasswordAction,
  setStaffCampusesAction,
  toggleSupplierTeamActiveAction,
  type TeamState,
} from "@/app/actions/supplier-team";

const initial: TeamState = {};

type CampusOption = { id: string; name: string; code: string };

function CampusChecklist({
  campuses,
  name = "schoolIds",
  selectedIds,
  idPrefix,
}: {
  campuses: CampusOption[];
  name?: string;
  selectedIds?: string[];
  idPrefix: string;
}) {
  if (!campuses.length) {
    return (
      <p className="field-hint">
        No linked schools yet — create or link a school first.
      </p>
    );
  }

  const selected = new Set(selectedIds ?? []);

  return (
    <div className="campus-check-grid" role="group" aria-label="Campuses">
      {campuses.map((campus) => {
        const inputId = `${idPrefix}-${campus.id}`;
        return (
          <label key={campus.id} className="campus-check" htmlFor={inputId}>
            <input
              id={inputId}
              type="checkbox"
              name={name}
              value={campus.id}
              defaultChecked={selected.has(campus.id)}
            />
            <span>
              <span className="campus-check-title">{campus.name}</span>
              <span className="campus-check-code">{campus.code}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function CreateSupplierTeamUserForm({
  campuses,
}: {
  campuses: CampusOption[];
}) {
  const [state, action, pending] = useActionState(
    createSupplierTeamUserAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<"supplier_staff" | "supplier_admin">(
    "supplier_staff",
  );

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setRole("supplier_staff");
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="form-stack form-flush">
      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">New account</h3>
          <p className="form-section-sub">
            Admins manage the system; staff run the issue desk on assigned campuses
          </p>
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor="team-name">
              Full name
            </label>
            <input id="team-name" name="name" required className="field" />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="team-email">
              Email
            </label>
            <input
              id="team-email"
              name="email"
              type="email"
              required
              className="field"
              autoComplete="off"
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="team-role">
              Role
            </label>
            <select
              id="team-role"
              name="role"
              className="field"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "supplier_staff" | "supplier_admin")
              }
            >
              <option value="supplier_staff">Staff — issue &amp; basics</option>
              <option value="supplier_admin">Admin — super user</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="team-password">
              Temporary password
            </label>
            <input
              id="team-password"
              name="password"
              type="password"
              required
              minLength={8}
              className="field"
              autoComplete="new-password"
            />
            <p className="field-hint">At least 8 characters · share securely</p>
          </div>
        </div>
      </div>

      {role === "supplier_staff" && (
        <div className="form-section">
          <div className="form-section-head">
            <h3 className="form-section-title">Campus access</h3>
            <p className="form-section-sub">
              Staff may only issue and report at the schools you tick. Choose one
              or several.
            </p>
          </div>
          <CampusChecklist campuses={campuses} idPrefix="create-campus" />
        </div>
      )}

      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="field-ok">{state.message ?? "Team member created."}</p>
      )}
      <div className="form-actions">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Create user"}
        </button>
      </div>
    </form>
  );
}

export function AssignStaffCampusesForm({
  userId,
  campuses,
  selectedIds,
}: {
  userId: string;
  campuses: CampusOption[];
  selectedIds: string[];
}) {
  const [state, action, pending] = useActionState(
    setStaffCampusesAction,
    initial,
  );

  return (
    <form action={action} className="form-stack form-flush campus-assign-form">
      <input type="hidden" name="userId" value={userId} />
      <div className="form-section-head">
        <h3 className="form-section-title">Campus access</h3>
        <p className="form-section-sub">
          {selectedIds.length
            ? `${selectedIds.length} campus${selectedIds.length === 1 ? "" : "es"} assigned`
            : "No campuses — staff cannot issue until assigned"}
        </p>
      </div>
      <CampusChecklist
        campuses={campuses}
        selectedIds={selectedIds}
        idPrefix={`assign-${userId}`}
      />
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="field-ok">{state.message ?? "Campus access updated"}</p>
      )}
      <div className="form-actions form-actions-inline">
        <button type="submit" disabled={pending} className="btn btn-secondary">
          {pending ? "Saving…" : "Save campuses"}
        </button>
      </div>
    </form>
  );
}

export function ResetSupplierPasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(
    resetSupplierTeamPasswordAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="form-inline">
      <input type="hidden" name="userId" value={userId} />
      <div className="field-group">
        <label className="field-label" htmlFor={`pwd-${userId}`}>
          New password
        </label>
        <input
          id={`pwd-${userId}`}
          name="password"
          type="password"
          required
          minLength={8}
          className="field"
          autoComplete="new-password"
        />
      </div>
      <button type="submit" disabled={pending} className="btn btn-secondary">
        {pending ? "…" : "Reset"}
      </button>
      {state.error && (
        <p className="field-error form-inline-msg" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="field-ok form-inline-msg">
          {state.message ?? "Password updated"}
        </p>
      )}
    </form>
  );
}

export function ToggleSupplierTeamActiveForm({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const [state, action, pending] = useActionState(
    toggleSupplierTeamActiveAction,
    initial,
  );

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className={active ? "btn btn-ghost" : "btn btn-secondary"}
      >
        {pending ? "…" : active ? "Deactivate" : "Activate"}
      </button>
      {state.error && (
        <p className="mt-1 text-xs text-[var(--danger)]">{state.error}</p>
      )}
    </form>
  );
}
