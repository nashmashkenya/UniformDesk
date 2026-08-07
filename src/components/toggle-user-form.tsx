"use client";

import { useActionState } from "react";
import { toggleUserActiveAction, type UserState } from "@/app/actions/users";

const initial: UserState = {};

export function ToggleUserForm({
  userId,
  active,
  disabled,
}: {
  userId: string;
  active: boolean;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(
    toggleUserActiveAction,
    initial,
  );

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending || disabled}
        className="btn btn-secondary"
      >
        {pending ? "…" : active ? "Deactivate" : "Activate"}
      </button>
      {state.error && (
        <p className="max-w-[12rem] text-right text-xs text-[var(--danger)]">
          {state.error}
        </p>
      )}
    </form>
  );
}
