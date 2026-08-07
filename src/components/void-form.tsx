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
      <div className="card-body space-y-3">
        <input type="hidden" name="slipId" value={slipId} />
        <textarea
          name="reason"
          required
          rows={3}
          placeholder="Reason for void"
          className="field min-h-24"
        />
        {state.error && (
          <p className="text-sm text-[var(--danger)]">{state.error}</p>
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
