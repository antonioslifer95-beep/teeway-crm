import { z } from "zod";

export const cartModelFormSchema = z.object({
  code: z.string().trim().min(1, "Obrigatório"),
  name: z.string().trim().min(1, "Obrigatório"),
  seats: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number().int().positive().optional(),
  ),
  defaultDescription: z.string().trim().optional().or(z.literal("")),
  defaultGoodsCostOriginal: z.coerce.number().min(0),
  defaultCurrency: z.string().trim().min(1).default("EUR"),
});

export type CartModelFormValues = z.infer<typeof cartModelFormSchema>;
