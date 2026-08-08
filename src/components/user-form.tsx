"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUserAction, type UserState } from "@/app/actions/users";

const initial: UserState = {};

export function UserForm() {
  const [state, action, pending] = useActionState(createUserAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="form-stack">
      <div className="form-grid cols-2">
        <div className="field-group">
          <label className="field-label" htmlFor="user-name">
            Full name
          </label>
          <input id="user-name" name="name" required className="field" />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="user-email">
            Email
          </label>
          <input
            id="user-email"
            name="email"
            type="email"
            required
            className="field"
            autoComplete="off"
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="user-role">
            Role
          </label>
          <select
            id="user-role"
            name="role"
            className="field"
            defaultValue="school_reporter"
          >
            <option value="school_reporter">School reporter</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="user-password">
            Temporary password
          </label>
          <input
            id="user-password"
            name="password"
            type="password"
            required
            minLength={8}
            className="field"
            autoComplete="new-password"
          />
          <p className="field-hint">At least 8 characters</p>
        </div>
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && <p className="field-ok">User created.</p>}
      <div>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Add user"}
        </button>
      </div>
    </form>
  );
}
