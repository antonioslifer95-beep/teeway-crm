"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { cartModelFormSchema } from "@/lib/validations/cart-model";

function readCartModelForm(formData: FormData) {
  return cartModelFormSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    seats: formData.get("seats"),
    defaultDescription: formData.get("defaultDescription"),
    defaultGoodsCostOriginal: formData.get("defaultGoodsCostOriginal"),
    defaultCurrency: formData.get("defaultCurrency"),
  });
}

export async function createCartModelAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();
  const parsed = readCartModelForm(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const existing = await prisma.cartModel.findUnique({
    where: { code: parsed.data.code },
  });
  if (existing) return "Já existe um modelo com este código.";

  try {
    await prisma.cartModel.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        seats: parsed.data.seats ?? null,
        defaultDescription: parsed.data.defaultDescription || null,
        defaultGoodsCostOriginal: parsed.data.defaultGoodsCostOriginal,
        defaultCurrency: parsed.data.defaultCurrency,
      },
    });
  } catch {
    return "Não foi possível criar o modelo.";
  }

  revalidatePath("/cart-models");
  redirect("/cart-models");
}

export async function updateCartModelAction(
  cartModelId: string,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();
  const parsed = readCartModelForm(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const existing = await prisma.cartModel.findUnique({
    where: { code: parsed.data.code },
  });
  if (existing && existing.id !== cartModelId) {
    return "Já existe um modelo com este código.";
  }

  try {
    await prisma.cartModel.update({
      where: { id: cartModelId },
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        seats: parsed.data.seats ?? null,
        defaultDescription: parsed.data.defaultDescription || null,
        defaultGoodsCostOriginal: parsed.data.defaultGoodsCostOriginal,
        defaultCurrency: parsed.data.defaultCurrency,
      },
    });
  } catch {
    return "Não foi possível guardar as alterações.";
  }

  revalidatePath("/cart-models");
  redirect("/cart-models");
}

export async function toggleCartModelActiveAction(
  cartModelId: string,
): Promise<{ error?: string }> {
  await requireAuth();

  const model = await prisma.cartModel.findUnique({
    where: { id: cartModelId },
  });
  if (!model) return { error: "Modelo não encontrado." };

  try {
    await prisma.cartModel.update({
      where: { id: cartModelId },
      data: { isActive: !model.isActive },
    });
  } catch {
    return { error: "Não foi possível atualizar o modelo." };
  }

  revalidatePath("/cart-models");
  return {};
}
