import { z } from "zod";

export const issueLineSchema = z.object({
  itemId: z.string().min(1),
  sizeLabel: z.string().min(1),
  qtyRequested: z.coerce.number().int().positive(),
  /** true = issue from stock now; false = hold on still owed */
  fulfil: z.boolean().default(true),
});

export const paymentMethodSchema = z.enum(["cash", "bank", "mpesa", "other"]);

export const planMoneyStatusSchema = z.enum([
  "unpaid",
  "paid",
  "deposit",
  "waived",
]);

export const issuePayloadSchema = z.object({
  studentId: z.string().min(1),
  lines: z.array(issueLineSchema).min(1),
  /** Required for supplier co-issue; ignored for school sessions. */
  schoolId: z.string().min(1).optional(),
  /** Kit used for this issue — tracks “still to receive”. */
  kitId: z.string().min(1).optional(),
  /**
   * How the parent paid at the desk.
   * Optional for hold-only (no stock issued, no payment amount).
   */
  paymentMethod: paymentMethodSchema.optional(),
  /** Receipt / M-Pesa / bank reference */
  paymentReference: z.string().optional(),
  /** Optional amount in KES (whole shillings) */
  paymentAmountKes: z.coerce.number().int().nonnegative().optional(),
  /** Plan line money state for lines touched by this issue */
  moneyStatus: planMoneyStatusSchema.optional(),
  /** Legacy optional — not required for desk issue */
  acknowledgmentName: z.string().optional(),
  acknowledgmentSignature: z.string().optional(),
});

export type IssuePayload = z.infer<typeof issuePayloadSchema>;

export function parseIssuePayload(input: unknown) {
  return issuePayloadSchema.parse(input);
}
