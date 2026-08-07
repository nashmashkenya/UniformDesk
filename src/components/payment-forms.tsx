"use client";

import { useActionState } from "react";
import {
  initiateMpesaAction,
  recordPaymentAction,
  type PaymentState,
} from "@/app/actions/payments";

const initial: PaymentState = {};

export function RecordPaymentForm({
  invoiceId,
  remainingKes,
}: {
  invoiceId: string;
  remainingKes: number;
}) {
  const [state, action, pending] = useActionState(recordPaymentAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Method
          <select name="method" defaultValue="cash" className="field mt-1.5">
            <option value="cash">Cash</option>
            <option value="bank">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Amount (KES)
          <input
            name="amount"
            type="number"
            min={1}
            step="1"
            defaultValue={remainingKes}
            className="field mt-1.5"
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Reference
        <input
          name="reference"
          placeholder="Receipt / bank ref"
          className="field mt-1.5"
        />
      </label>
      <label className="block text-sm font-medium">
        Note
        <input name="note" className="field mt-1.5" />
      </label>
      {state.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state.message && (
        <p className="text-sm text-[var(--ok)]">{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Record payment"}
      </button>
    </form>
  );
}

export function MpesaPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, action, pending] = useActionState(initiateMpesaAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <label className="block text-sm font-medium">
        Payer phone
        <input
          name="phone"
          required
          placeholder="07XXXXXXXX"
          className="field mt-1.5"
        />
      </label>
      <label className="block text-sm font-medium">
        Note
        <input name="note" className="field mt-1.5" />
      </label>
      {state.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state.message && (
        <p className="text-sm text-[var(--ok)]">{state.message}</p>
      )}
      {state.sandboxCompleteUrl && (
        <p className="text-sm">
          Sandbox ·{" "}
          <a
            href={state.sandboxCompleteUrl}
            className="font-semibold text-[var(--accent)] underline"
          >
            Simulate successful STK callback
          </a>
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Starting…" : "Send M-Pesa STK (sandbox)"}
      </button>
    </form>
  );
}
