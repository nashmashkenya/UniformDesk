"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  importStudentsAction,
  type StudentState,
} from "@/app/actions/students";

const initial: StudentState = {};

export function StudentImportForm() {
  const [state, action, pending] = useActionState(
    importStudentsAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <p className="text-sm text-[var(--muted)]">
        CSV header required:{" "}
        <code className="rounded bg-[var(--wash)] px-1">admission_no</code>,{" "}
        <code className="rounded bg-[var(--wash)] px-1">full_name</code>,
        optional{" "}
        <code className="rounded bg-[var(--wash)] px-1">class_name</code>.
        Existing admission numbers are updated.
      </p>
      <label className="block text-sm font-semibold">
        CSV file
        <input
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="field mt-1.5 py-2"
        />
      </label>
      {state.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state.ok && state.message && (
        <p className="text-sm text-[var(--ok)]">{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Importing…" : "Import students"}
      </button>
    </form>
  );
}
