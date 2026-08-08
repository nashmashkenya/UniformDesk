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
    <form ref={formRef} action={action} className="form-stack">
      <div className="form-grid cols-3">
        <div className="field-group">
          <label className="field-label" htmlFor="student-admission">
            Admission no
          </label>
          <input
            id="student-admission"
            name="admissionNo"
            required
            autoComplete="off"
            className="field"
            placeholder="e.g. GF-2026-0142"
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="student-name">
            Full name
          </label>
          <input
            id="student-name"
            name="fullName"
            required
            autoComplete="name"
            className="field"
            placeholder="Student full name"
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="student-class">
            Class
          </label>
          <input
            id="student-class"
            name="className"
            autoComplete="off"
            className="field"
            placeholder="e.g. Form 1A"
          />
        </div>
      </div>

      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="field-ok">{state.message ?? "Student added."}</p>
      )}

      <div>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Add student"}
        </button>
      </div>
    </form>
  );
}
