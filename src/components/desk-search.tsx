"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeskSearch({
  actionPath = "/search",
  placeholder = "Search desk…",
  inputId = "desk-search",
  label = "Search desk",
}: {
  actionPath?: string;
  placeholder?: string;
  inputId?: string;
  label?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      className="hidden min-w-0 md:block"
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        if (query.length < 2) return;
        router.push(`${actionPath}?q=${encodeURIComponent(query)}`);
      }}
    >
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="field h-8 min-w-[10rem] max-w-[14rem] py-1 text-sm lg:min-w-[12rem] lg:max-w-[18rem]"
      />
    </form>
  );
}
