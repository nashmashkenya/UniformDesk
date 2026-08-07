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
    () => `/api/audit-export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    [from, to],
  );

  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="block text-sm font-medium">
        From
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="field mt-1.5"
          required
        />
      </label>
      <label className="block text-sm font-medium">
        To
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="field mt-1.5"
          required
        />
      </label>
      <a href={href} className="btn btn-primary min-h-8">
        Download CSV
      </a>
    </form>
  );
}
