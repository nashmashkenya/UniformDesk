"use client";

import { useActionState, useState } from "react";
import {
  revokeApiKeyAction,
  rotateApiKeyAction,
  saveSchoolMasterIdAction,
  type IntegrationState,
} from "@/app/actions/integrations";

const initial: IntegrationState = {};

export function SchoolMasterIdForm({
  defaultValue,
}: {
  defaultValue: string;
}) {
  const [state, action, pending] = useActionState(
    saveSchoolMasterIdAction,
    initial,
  );

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-medium">
        School Master external ID
        <input
          name="schoolMasterExternalId"
          defaultValue={defaultValue}
          placeholder="sm-school-123"
          className="field mt-1.5"
        />
      </label>
      {state.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state.message && (
        <p className="text-sm text-[var(--ok)]">{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

export function ApiKeyPanel({ hasKey, prefix }: { hasKey: boolean; prefix: string | null }) {
  const [state, setState] = useState<IntegrationState>({});
  const [pending, setPending] = useState(false);

  async function rotate() {
    setPending(true);
    const next = await rotateApiKeyAction();
    setState(next);
    setPending(false);
  }

  async function revoke() {
    setPending(true);
    const next = await revokeApiKeyAction();
    setState(next);
    setPending(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">
        {hasKey
          ? `Active key prefix · udsk_${prefix}_…`
          : "No API key yet. Generate one for School Master to call UniformDesk."}
      </p>
      {state.apiKey && (
        <div className="rounded-[4px] bg-[var(--ok-soft)] px-3 py-2">
          <div className="text-xs font-semibold text-[var(--ok)]">
            {state.message}
          </div>
          <code className="mt-1 block break-all text-xs">{state.apiKey}</code>
        </div>
      )}
      {state.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state.message && !state.apiKey && (
        <p className="text-sm text-[var(--ok)]">{state.message}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={rotate}
        >
          {hasKey ? "Rotate key" : "Generate key"}
        </button>
        {hasKey && (
          <button
            type="button"
            className="btn btn-ghost text-[var(--danger)]"
            disabled={pending}
            onClick={revoke}
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}
