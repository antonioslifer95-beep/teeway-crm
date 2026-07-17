"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { settingsFormSchema } from "@/lib/validations/settings";

export async function updateSettingsAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await requireAdmin();

  const parsed = settingsFormSchema.safeParse({
    defaultCustomsDutyPercent: formData.get("defaultCustomsDutyPercent"),
    defaultClearanceFee: formData.get("defaultClearanceFee"),
    defaultMarkupPercent: formData.get("defaultMarkupPercent"),
    vatRate: formData.get("vatRate"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  try {
    await prisma.settings.upsert({
      where: { id: 1 },
      update: { ...parsed.data, updatedByUserId: session.user.id },
      create: { id: 1, ...parsed.data, updatedByUserId: session.user.id },
    });
  } catch {
    return "Não foi possível guardar as definições.";
  }

  revalidatePath("/settings/pricing");
}
