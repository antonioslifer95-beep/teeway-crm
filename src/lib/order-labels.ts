import type { DiscountType, OrderStatus } from "@/generated/prisma/client";

export const ORDER_STATUS_VALUES: OrderStatus[] = [
  "PLANNED",
  "IN_TRANSIT",
  "CLEARED",
  "RECEIVED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLANNED: "Planeada",
  IN_TRANSIT: "Em trânsito",
  CLEARED: "Desalfandegada",
  RECEIVED: "Recebida",
};

export const DISCOUNT_TYPE_VALUES: DiscountType[] = ["NONE", "FLAT", "PERCENT"];

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  NONE: "Sem desconto",
  FLAT: "Valor fixo (€)",
  PERCENT: "Percentagem (%)",
};
