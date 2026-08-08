"use client";

import { useActionState } from "react";
import { voidIssueAction, type VoidState } from "@/app/actions/issue";

const initial: VoidState = {};

export function VoidForm({ slipId }: { slipId: string }) {
  const [state, action, pending] = useActionState(voidIssueAction, initial);

  return (
    <form action={action} className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Void this issue</h3>
          <p className="card-subtitle">
            Stock restores; the original slip stays in the audit trail.
          </p>
        </div>
      </div>
      <div className="card-body form-stack">
        <input type="hidden" name="slipId" value={slipId} />
        <div className="field-group">
          <label className="field-label" htmlFor="void-reason">
            Reason
          </label>
          <textarea
            id="void-reason"
            name="reason"
            required
            rows={3}
            placeholder="Why this issue is being voided"
            className="field"
            aria-invalid={state.error ? true : undefined}
          />
          <p className="field-hint">Shown on the audit trail for this slip</p>
        </div>
        {state.error && (
          <p className="field-error" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <div className="card-footer">
        <button type="submit" disabled={pending} className="btn btn-danger">
          {pending ? "Voiding…" : "Void slip"}
        </button>
      </div>
    </form>
  );
}
