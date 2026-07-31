import { z } from "zod";

export const userFormSchema = z.object({
  name: z.string().trim().min(1, "Obrigatório"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
  role: z.enum(["ADMIN", "STAFF"]),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Obrigatório"),
    newPassword: z.string().min(8, "Mínimo de 8 caracteres"),
    confirmPassword: z.string().min(1, "Obrigatório"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "A nova palavra-passe tem de ser diferente da atual",
    path: ["newPassword"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
