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
    <form action={action} className="space-y-3">
      <input type="hidden" name="deliveryId" value={deliveryId} />
      <label className="block text-sm font-medium">
        Receive note
        <input
          name="note"
          className="field mt-1.5"
          placeholder="Optional note for the inbound receipt"
        />
      </label>
      {state.error && (
        <p className="rounded-[4px] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Receiving…" : "Receive into stock"}
      </button>
    </form>
  );
}
