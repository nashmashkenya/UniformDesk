"use client";

import { useRouter } from "next/navigation";

export function SupplierSchoolSelect({
  schools,
  value,
  basePath,
}: {
  schools: { id: string; name: string; code: string }[];
  value: string;
  basePath: string;
}) {
  const router = useRouter();
  return (
    <div className="field-group max-w-md">
      <label className="field-label" htmlFor="supplier-school">
        School
      </label>
      <select
        id="supplier-school"
        value={value}
        onChange={(e) => {
          const url = new URL(basePath, window.location.origin);
          url.searchParams.set("schoolId", e.target.value);
          const current = new URL(window.location.href);
          const view = current.searchParams.get("view");
          if (view) url.searchParams.set("view", view);
          router.push(`${url.pathname}?${url.searchParams.toString()}`);
        }}
        className="field"
      >
        {schools.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.code})
          </option>
        ))}
      </select>
    </div>
  );
}
