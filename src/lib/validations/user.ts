import { z } from "zod";

export const userFormSchema = z.object({
  name: z.string().trim().min(1, "Obrigatório"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
  role: z.enum(["ADMIN", "STAFF"]),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
