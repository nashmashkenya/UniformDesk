import Link from "next/link";
import { OfflineIssueCta } from "@/components/offline-issue-cta";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-16">
      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="card-title text-base">You’re offline</h1>
            <p className="card-subtitle">
              UniformDesk can queue issue slips until the connection returns.
            </p>
          </div>
        </div>
        <div className="card-body space-y-3 text-sm">
          <p>
            If this device already cached a roster (desk home or issue while
            online), open the cached issue desk and keep signing slips. Queued
            issues sync when you’re back online.
          </p>
          <div className="flex flex-wrap gap-2">
            <OfflineIssueCta />
            <Link href="/" className="btn btn-ghost">
              Desk home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
