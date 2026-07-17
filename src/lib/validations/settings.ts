import { z } from "zod";

export const settingsFormSchema = z.object({
  defaultCustomsDutyPercent: z.coerce.number().min(0).max(100),
  defaultClearanceFee: z.coerce.number().min(0),
  defaultMarkupPercent: z.coerce.number().min(0),
  vatRate: z.coerce.number().min(0).max(100),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
