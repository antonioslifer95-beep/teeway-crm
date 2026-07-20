import { z } from "zod";

export const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Obrigatório"),
  dueDate: z.string().optional().or(z.literal("")),
  paymentTerms: z.string().trim().optional().or(z.literal("")),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export const invoiceLineFormSchema = z.object({
  name: z.string().trim().min(1, "Obrigatório"),
  specText: z.string().trim().optional().or(z.literal("")),
  quantity: z.coerce.number().int().positive(),
  unitSellPriceExVat: z.coerce.number().min(0),
  vatRate: z.coerce.number().min(0).max(100),
});

export type InvoiceLineFormValues = z.infer<typeof invoiceLineFormSchema>;
