"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadIssueSnapshot } from "@/lib/offline-issue-snapshot";

export function OfflineIssueCta() {
  const [hasCache, setHasCache] = useState(false);

  useEffect(() => {
    void loadIssueSnapshot().then((row) => setHasCache(Boolean(row)));
  }, []);

  if (!hasCache) {
    return (
      <Link href="/issue" className="btn btn-primary">
        Try issue desk
      </Link>
    );
  }

  return (
    <Link href="/issue-offline" className="btn btn-primary">
      Open cached issue desk
    </Link>
  );
}
