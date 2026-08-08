"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, type ActionState } from "@/app/actions/auth";

const initial: ActionState = {};

export function LoginForm({
  variant = "default",
}: {
  variant?: "default" | "glass";
}) {
  const [state, action, pending] = useActionState(loginAction, initial);
  const searchParams = useSearchParams();
  const ssoError = searchParams.get("error") === "sso";
  const next = searchParams.get("next") ?? "";
  const glass = variant === "glass";

  return (
    <form action={action} className="form-stack">
      {next.startsWith("/") && !next.startsWith("//") && (
        <input type="hidden" name="next" value={next} />
      )}
      {ssoError && (
        <p className="field-error" role="alert">
          School Master SSO link was invalid or expired. Sign in below.
        </p>
      )}
      <div className="field-group">
        <label
          className={`field-label ${glass ? "login-glass-label" : ""}`}
          htmlFor="login-email"
        >
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue="supply@uniformdesk.co"
          className={`field ${glass ? "login-glass-field" : ""}`}
          aria-invalid={state.error ? true : undefined}
        />
      </div>
      <div className="field-group">
        <label
          className={`field-label ${glass ? "login-glass-label" : ""}`}
          htmlFor="login-password"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          defaultValue="desk1234"
          className={`field ${glass ? "login-glass-field" : ""}`}
          aria-invalid={state.error ? true : undefined}
        />
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`btn btn-block ${glass ? "login-glass-submit" : "btn-primary"}`}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
