"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { activityFormSchema } from "@/lib/validations/client-activity";

export async function addActivityAction(
  clientId: string,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await requireAuth();

  const parsed = activityFormSchema.safeParse({
    body: formData.get("body"),
    reminderDueAt: formData.get("reminderDueAt"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  try {
    await prisma.clientActivity.create({
      data: {
        clientId,
        authorUserId: session.user.id,
        type: parsed.data.reminderDueAt ? "REMINDER" : "NOTE",
        body: parsed.data.body,
        reminderDueAt: parsed.data.reminderDueAt,
      },
    });
  } catch {
    return "Não foi possível guardar a nota.";
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}

export async function toggleReminderDoneAction(
  activityId: string,
  clientId: string,
): Promise<{ error?: string }> {
  await requireAuth();

  const activity = await prisma.clientActivity.findUnique({
    where: { id: activityId },
  });
  if (!activity) return { error: "Lembrete não encontrado." };

  try {
    await prisma.clientActivity.update({
      where: { id: activityId },
      data: { reminderDone: !activity.reminderDone },
    });
  } catch {
    return { error: "Não foi possível atualizar o lembrete." };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  return {};
}
