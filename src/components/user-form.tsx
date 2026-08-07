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
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-semibold">
        Full name
        <input name="name" required className="field mt-1.5" />
      </label>
      <label className="block text-sm font-semibold">
        Email
        <input
          name="email"
          type="email"
          required
          className="field mt-1.5"
          autoComplete="off"
        />
      </label>
      <label className="block text-sm font-semibold">
        Role
        <select name="role" className="field mt-1.5" defaultValue="storekeeper">
          <option value="storekeeper">Storekeeper</option>
          <option value="school_admin">School admin</option>
          <option value="auditor">Auditor</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Temporary password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="field mt-1.5"
          autoComplete="new-password"
        />
      </label>
      {state.error && (
        <p className="text-sm text-[var(--danger)] sm:col-span-2">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-[var(--ok)] sm:col-span-2">User created.</p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Add user"}
        </button>
      </div>
    </form>
  );
}
