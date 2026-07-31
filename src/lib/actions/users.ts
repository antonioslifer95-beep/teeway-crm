"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth-guard";
import { changePasswordSchema, userFormSchema } from "@/lib/validations/user";

export async function createUserAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAdmin();

  const parsed = userFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return "Já existe um utilizador com este email.";
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
      },
    });
  } catch {
    return "Não foi possível criar o utilizador.";
  }

  revalidatePath("/settings/users");
}

export async function toggleUserActiveAction(
  userId: string,
): Promise<{ error?: string }> {
  const session = await requireAdmin();

  if (session.user.id === userId) {
    return { error: "Não podes desativar a tua própria conta." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Utilizador não encontrado." };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  } catch {
    return { error: "Não foi possível atualizar o utilizador." };
  }

  revalidatePath("/settings/users");
  return {};
}

export async function changePasswordAction(
  _prevState: { ok: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  // Any authenticated user can change their OWN password — the session id is
  // the only account this can ever touch, so there's no target-user parameter.
  const session = await requireAuth();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { ok: false, error: "Utilizador não encontrado." };
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "A palavra-passe atual está incorreta." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  } catch {
    return { ok: false, error: "Não foi possível atualizar a palavra-passe." };
  }

  return { ok: true };
}
