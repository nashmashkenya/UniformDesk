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
    <form action={action} className="form-stack">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="form-grid cols-2">
        <div className="field-group">
          <label className="field-label" htmlFor="pay-method">
            Method
          </label>
          <select
            id="pay-method"
            name="method"
            defaultValue="cash"
            className="field"
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="pay-amount">
            Amount (KES)
          </label>
          <input
            id="pay-amount"
            name="amount"
            type="number"
            min={1}
            step="1"
            defaultValue={remainingKes}
            className="field"
          />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="pay-reference">
          Reference
        </label>
        <input
          id="pay-reference"
          name="reference"
          placeholder="Receipt / bank ref"
          className="field"
        />
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="pay-note">
          Note
        </label>
        <input id="pay-note" name="note" className="field" />
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <p className="field-ok">{state.message}</p>}
      <div>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Record payment"}
        </button>
      </div>
    </form>
  );
}

export function MpesaPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, action, pending] = useActionState(initiateMpesaAction, initial);

  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="field-group">
        <label className="field-label" htmlFor="mpesa-phone">
          Payer phone
        </label>
        <input
          id="mpesa-phone"
          name="phone"
          required
          placeholder="07XXXXXXXX"
          className="field"
          inputMode="tel"
        />
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="mpesa-note">
          Note
        </label>
        <input id="mpesa-note" name="note" className="field" />
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <p className="field-ok">{state.message}</p>}
      {state.sandboxCompleteUrl && (
        <p className="field-hint">
          Sandbox ·{" "}
          <a
            href={state.sandboxCompleteUrl}
            className="font-semibold text-[var(--accent)] underline"
          >
            Complete STK callback
          </a>
        </p>
      )}
      <div>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Sending…" : "Send M-Pesa prompt"}
        </button>
      </div>
    </form>
  );
}
