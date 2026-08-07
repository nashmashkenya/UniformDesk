"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, type ActionState } from "@/app/actions/auth";

const initial: ActionState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  const searchParams = useSearchParams();
  const ssoError = searchParams.get("error") === "sso";
  const next = searchParams.get("next") ?? "";

  return (
    <form action={action} className="space-y-4">
      {next.startsWith("/") && !next.startsWith("//") && (
        <input type="hidden" name="next" value={next} />
      )}
      {ssoError && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--line))] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          School Master SSO link was invalid or expired. Sign in below.
        </p>
      )}
      <label className="block text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue="store@greenfield.school"
          className="field mt-1.5"
        />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          defaultValue="desk1234"
          className="field mt-1.5"
        />
      </label>
      {state.error && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--line))] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full min-h-8">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
