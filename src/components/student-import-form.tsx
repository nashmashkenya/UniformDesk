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
    <form ref={formRef} action={action} className="form-stack">
      <p className="field-hint">
        CSV header required:{" "}
        <code className="rounded bg-[var(--wash)] px-1">admission_no</code>,{" "}
        <code className="rounded bg-[var(--wash)] px-1">full_name</code>,
        optional{" "}
        <code className="rounded bg-[var(--wash)] px-1">class_name</code>.
        Existing admission numbers are updated.
      </p>
      <div className="field-group">
        <label className="field-label" htmlFor="student-csv">
          CSV file
        </label>
        <input
          id="student-csv"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="field"
        />
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="field-ok">{state.message}</p>
      )}
      <div>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Importing…" : "Import students"}
        </button>
      </div>
    </form>
  );
}
