/** Desk labels — safe for client components (no database import). */

export function holdReasonLabel(reason: string | null | undefined) {
  if (reason === "held_by_desk") return "Collect later";
  if (reason === "stock_shortage") return "No stock";
  return null;
}

export function moneyStatusLabel(status: string | null | undefined) {
  if (status === "paid") return "Paid";
  if (status === "deposit") return "Deposit";
  if (status === "waived") return "Waived";
  return "Unpaid";
}
