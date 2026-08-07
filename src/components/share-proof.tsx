"use client";

import { useState } from "react";

export function ShareProof({
  url,
  studentName,
  slipNo,
}: {
  url: string;
  studentName: string;
  slipNo: string;
}) {
  const [copied, setCopied] = useState(false);
  const message = `UniformDesk issue proof for ${studentName} (${slipNo}): ${url}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const smsHref = `sms:?&body=${encodeURIComponent(message)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="card no-print">
      <div className="card-header">
        <div>
          <h2 className="card-title text-base">Guardian proof</h2>
          <p className="card-subtitle">
            Share QR or link — no login required to view
          </p>
        </div>
      </div>
      <div className="card-body space-y-3">
        <input
          readOnly
          value={url}
          className="field font-mono text-xs"
          onFocus={(e) => e.currentTarget.select()}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={copy}>
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            WhatsApp
          </a>
          <a href={smsHref} className="btn btn-ghost">
            SMS
          </a>
        </div>
      </div>
    </div>
  );
}
