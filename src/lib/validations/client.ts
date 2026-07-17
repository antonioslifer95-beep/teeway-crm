import { z } from "zod";
import { PIPELINE_STAGE_VALUES } from "@/lib/pipeline";

export const clientFormSchema = z.object({
  companyName: z.string().trim().min(1, "Obrigatório"),
  contactName: z.string().trim().optional().or(z.literal("")),
  nif: z.string().trim().optional().or(z.literal("")),
  email: z.email("Email inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  addressLine: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  pipelineStage: z.enum(PIPELINE_STAGE_VALUES),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
