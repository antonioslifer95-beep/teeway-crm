import type { QuoteStatus } from "@/generated/prisma/client";

export const QUOTE_STATUS_VALUES: QuoteStatus[] = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviado",
  ACCEPTED: "Aceite",
  REJECTED: "Rejeitado",
  EXPIRED: "Expirado",
};
