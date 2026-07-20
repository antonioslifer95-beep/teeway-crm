import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === "" || val === null ? undefined : val;

export const quoteFormSchema = z.object({
  clientId: z.string().min(1, "Obrigatório"),
  validUntil: z.string().optional().or(z.literal("")),
  deliveryTerms: z.string().trim().optional().or(z.literal("")),
  paymentTerms: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const quoteLineFromOrderSchema = z.object({
  orderCartItemId: z.string().min(1, "Obrigatório"),
  quantity: z.coerce.number().int().positive(),
  markupPercent: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0).optional(),
  ),
});

export type QuoteLineFromOrderValues = z.infer<typeof quoteLineFromOrderSchema>;

export const quoteLineCustomSchema = z.object({
  name: z.string().trim().min(1, "Obrigatório"),
  specText: z.string().trim().optional().or(z.literal("")),
  quantity: z.coerce.number().int().positive(),
  unitSellPriceExVat: z.coerce.number().min(0),
});

export type QuoteLineCustomValues = z.infer<typeof quoteLineCustomSchema>;
