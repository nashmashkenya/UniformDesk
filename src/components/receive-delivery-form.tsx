"use client";

import { useActionState } from "react";
import {
  receiveDeliveryAction,
  type SupplyState,
} from "@/app/actions/supply";

const initial: SupplyState = {};

export function ReceiveDeliveryForm({ deliveryId }: { deliveryId: string }) {
  const [state, action, pending] = useActionState(receiveDeliveryAction, initial);

  return (
    <form action={action} className="form-stack">
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
        <p className="field-hint">Posted with the stock ledger receipt</p>
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Receiving…" : "Receive into stock"}
        </button>
      </div>
    </form>
  );
}
