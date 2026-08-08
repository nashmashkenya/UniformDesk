"use client";

import { useMemo, useState } from "react";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoInput(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function AuditExportForm() {
  const [from, setFrom] = useState(() => daysAgoInput(30));
  const [to, setTo] = useState(() => todayInput());

  const href = useMemo(
    () =>
      `/api/audit-export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    [from, to],
  );

  return (
    <form className="form-grid cols-3 items-end">
      <div className="field-group">
        <label className="field-label" htmlFor="audit-from">
          From
        </label>
        <input
          id="audit-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="field"
          required
        />
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="audit-to">
          To
        </label>
        <input
          id="audit-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="field"
          required
        />
      </div>
      <a href={href} className="btn btn-primary">
        Download CSV
      </a>
    </form>
  );
}
