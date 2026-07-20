import type { InvoiceStatus } from "@/generated/prisma/client";

// Only these two are user-selectable — ISSUED/ERROR are set programmatically
// once the TOConline integration lands (M7), never manually.
export const INVOICE_STATUS_SELECTABLE_VALUES: InvoiceStatus[] = [
  "PENDING_REVIEW",
  "READY_TO_ISSUE",
];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING_REVIEW: "Em revisão",
  READY_TO_ISSUE: "Pronta a emitir",
  ISSUED: "Emitida",
  ERROR: "Erro na emissão",
};
