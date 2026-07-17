import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === "" || val === null ? undefined : val;

export const orderFormSchema = z.object({
  supplierName: z.string().trim().optional().or(z.literal("")),
  orderDate: z.string().min(1, "Obrigatório"),
  originalCurrency: z.string().trim().min(1).default("EUR"),
  totalCostOriginal: z.coerce.number().min(0),
  exchangeRateToEUR: z.coerce.number().positive(),
  discountType: z.enum(["NONE", "FLAT", "PERCENT"]),
  discountValue: z.coerce.number().min(0),
  customsDutyPercent: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0).max(100).optional(),
  ),
  flatClearanceFee: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0).optional(),
  ),
  status: z.enum(["PLANNED", "IN_TRANSIT", "CLEARED", "RECEIVED"]),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const orderItemFormSchema = z.object({
  cartModelId: z.string().min(1, "Obrigatório"),
  quantity: z.coerce.number().int().positive(),
  unitGoodsCostOriginal: z.coerce.number().min(0),
});

export type OrderItemFormValues = z.infer<typeof orderItemFormSchema>;
