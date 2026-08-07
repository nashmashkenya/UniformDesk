import { z } from "zod";

export const issueLineSchema = z.object({
  itemId: z.string().min(1),
  sizeLabel: z.string().min(1),
  qtyRequested: z.coerce.number().int().positive(),
});

export const issuePayloadSchema = z.object({
  studentId: z.string().min(1),
  acknowledgmentName: z.string().min(1),
  acknowledgmentSignature: z.string().min(1),
  lines: z.array(issueLineSchema).min(1),
});

export type IssuePayload = z.infer<typeof issuePayloadSchema>;

export function parseIssuePayload(input: unknown) {
  return issuePayloadSchema.parse(input);
}
