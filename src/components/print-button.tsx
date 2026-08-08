"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-primary no-print px-4"
    >
      {label}
    </button>
  );
}
