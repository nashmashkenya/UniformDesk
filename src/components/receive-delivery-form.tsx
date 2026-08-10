"use client";

import { useActionState } from "react";
import {
  receiveDeliveryAction,
  type SupplyState,
} from "@/app/actions/supply";

const initial: SupplyState = {};

type ReceiveAction = (
  prev: SupplyState,
  formData: FormData,
) => Promise<SupplyState>;

export function ReceiveDeliveryForm({
  deliveryId,
  action = receiveDeliveryAction,
  submitLabel = "Receive into stock",
  pendingLabel = "Receiving…",
  hint = "Posted with the stock ledger receipt",
}: {
  deliveryId: string;
  action?: ReceiveAction;
  submitLabel?: string;
  pendingLabel?: string;
  hint?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="deliveryId" value={deliveryId} />
      <div className="field-group">
        <label className="field-label" htmlFor="receive-note">
          Receive note
        </label>
        <input
          id="receive-note"
          name="note"
          className="field"
          placeholder="Optional note for the inbound receipt"
        />
        <p className="field-hint">{hint}</p>
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
