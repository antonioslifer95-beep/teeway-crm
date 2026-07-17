import { z } from "zod";

export const activityFormSchema = z
  .object({
    body: z.string().trim().min(1, "Escreve uma nota"),
    reminderDueAt: z.string().optional().or(z.literal("")),
  })
  .transform((data) => ({
    body: data.body,
    reminderDueAt: data.reminderDueAt ? new Date(data.reminderDueAt) : null,
  }));

export type ActivityFormValues = z.infer<typeof activityFormSchema>;
