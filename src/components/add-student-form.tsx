"use client";

import { useActionState, useEffect, useRef } from "react";
import { addStudentAction, type StudentState } from "@/app/actions/students";

const initial: StudentState = {};

export function AddStudentForm() {
  const [state, action, pending] = useActionState(addStudentAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <input
        name="admissionNo"
        placeholder="Admission no"
        required
        className="field"
      />
      <input
        name="fullName"
        placeholder="Full name"
        required
        className="field"
      />
      <input
        name="className"
        placeholder="Class"
        className="field"
      />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Add student"}
      </button>
      {state.error && (
        <p className="text-sm text-[var(--danger)] sm:col-span-2 lg:col-span-4">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-[var(--ok)] sm:col-span-2 lg:col-span-4">
          Student added.
        </p>
      )}
    </form>
  );
}
