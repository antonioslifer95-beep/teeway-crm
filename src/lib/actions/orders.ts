"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { orderFormSchema, orderItemFormSchema } from "@/lib/validations/order";

async function generateOrderReference() {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { reference: { startsWith: `ENC-${year}-` } },
  });
  return `ENC-${year}-${String(count + 1).padStart(3, "0")}`;
}

function readOrderForm(formData: FormData) {
  return orderFormSchema.safeParse({
    supplierName: formData.get("supplierName"),
    orderDate: formData.get("orderDate"),
    originalCurrency: formData.get("originalCurrency"),
    totalCostOriginal: formData.get("totalCostOriginal"),
    exchangeRateToEUR: formData.get("exchangeRateToEUR"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    customsDutyPercent: formData.get("customsDutyPercent"),
    flatClearanceFee: formData.get("flatClearanceFee"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
}

export async function createOrderAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();
  const parsed = readOrderForm(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const data = parsed.data;
  let order;
  try {
    order = await prisma.order.create({
      data: {
        reference: await generateOrderReference(),
        supplierName: data.supplierName || null,
        orderDate: new Date(data.orderDate),
        originalCurrency: data.originalCurrency,
        totalCostOriginal: data.totalCostOriginal,
        exchangeRateToEUR: data.exchangeRateToEUR,
        discountType: data.discountType,
        discountValue: data.discountValue,
        customsDutyPercent: data.customsDutyPercent ?? null,
        flatClearanceFee: data.flatClearanceFee ?? null,
        status: data.status,
        notes: data.notes || null,
      },
    });
  } catch {
    return "Não foi possível criar a encomenda.";
  }

  revalidatePath("/orders");
  redirect(`/orders/${order.id}`);
}

export async function updateOrderAction(
  orderId: string,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();
  const parsed = readOrderForm(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const data = parsed.data;
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        supplierName: data.supplierName || null,
        orderDate: new Date(data.orderDate),
        originalCurrency: data.originalCurrency,
        totalCostOriginal: data.totalCostOriginal,
        exchangeRateToEUR: data.exchangeRateToEUR,
        discountType: data.discountType,
        discountValue: data.discountValue,
        customsDutyPercent: data.customsDutyPercent ?? null,
        flatClearanceFee: data.flatClearanceFee ?? null,
        status: data.status,
        notes: data.notes || null,
      },
    });
  } catch {
    return "Não foi possível guardar as alterações.";
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}`);
}

export async function addOrderItemAction(
  orderId: string,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();

  const parsed = orderItemFormSchema.safeParse({
    cartModelId: formData.get("cartModelId"),
    quantity: formData.get("quantity"),
    unitGoodsCostOriginal: formData.get("unitGoodsCostOriginal"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  try {
    await prisma.orderCartItem.create({
      data: {
        orderId,
        cartModelId: parsed.data.cartModelId,
        quantity: parsed.data.quantity,
        unitGoodsCostOriginal: parsed.data.unitGoodsCostOriginal,
      },
    });
  } catch {
    return "Não foi possível adicionar o item.";
  }

  revalidatePath(`/orders/${orderId}`);
}

export async function removeOrderItemAction(
  itemId: string,
  orderId: string,
): Promise<{ error?: string }> {
  await requireAuth();

  try {
    await prisma.orderCartItem.delete({ where: { id: itemId } });
  } catch {
    return { error: "Não foi possível remover o item." };
  }

  revalidatePath(`/orders/${orderId}`);
  return {};
}
