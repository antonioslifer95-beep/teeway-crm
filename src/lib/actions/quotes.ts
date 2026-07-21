"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { getSettings } from "@/lib/settings";
import { PIPELINE_STAGE_LABELS } from "@/lib/pipeline";
import { QUOTE_STATUS_LABELS } from "@/lib/quote-labels";
import { calculateLandedCostsForOrder, calculateSellPrice } from "@/lib/pricing";
import {
  Prisma,
  type PipelineStage,
  type QuoteStatus,
} from "@/generated/prisma/client";
import {
  quoteFormSchema,
  quoteLineCustomSchema,
  quoteLineFromOrderSchema,
} from "@/lib/validations/quote";

const D = Prisma.Decimal;

async function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({
    where: { quoteNumber: { startsWith: `ORC-${year}-` } },
  });
  return `ORC-${year}-${String(count + 1).padStart(3, "0")}`;
}

async function recalcQuoteTotals(quoteId: string) {
  const lines = await prisma.quoteLine.findMany({
    where: { quoteId },
    select: { lineTotalExVat: true, lineTotalIncVat: true },
  });

  const subtotalExVat = lines.reduce(
    (sum, l) => sum.add(l.lineTotalExVat),
    new D(0),
  );
  const totalIncVat = lines.reduce(
    (sum, l) => sum.add(l.lineTotalIncVat),
    new D(0),
  );

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      subtotalExVat,
      totalIncVat,
      vatAmount: totalIncVat.sub(subtotalExVat),
    },
  });
}

async function computeOrderItemPricing(
  orderCartItemId: string,
  markupOverride: number | undefined,
) {
  const orderCartItem = await prisma.orderCartItem.findUnique({
    where: { id: orderCartItemId },
    include: { order: { include: { items: true } }, cartModel: true },
  });
  if (!orderCartItem) return null;

  const settings = await getSettings();
  const { order } = orderCartItem;
  const index = order.items.findIndex((i) => i.id === orderCartItemId);
  const landedCostEUR = calculateLandedCostsForOrder(order, order.items)[index];

  const customsDutyPercent = order.customsDutyPercent ?? settings.defaultCustomsDutyPercent;
  const clearanceFee = order.flatClearanceFee ?? settings.defaultClearanceFee;
  const markupPercent = markupOverride ?? settings.defaultMarkupPercent;
  const vatRate = settings.vatRate;

  const pricing = calculateSellPrice({
    landedCostEUR,
    customsDutyPercent,
    clearanceFee,
    markupPercent,
    vatRate,
  });

  return {
    orderCartItem,
    landedCostEUR,
    customsDutyPercent,
    clearanceFee,
    markupPercent,
    vatRate,
    ...pricing,
  };
}

function readQuoteForm(formData: FormData) {
  return quoteFormSchema.safeParse({
    clientId: formData.get("clientId"),
    validUntil: formData.get("validUntil"),
    deliveryTerms: formData.get("deliveryTerms"),
    paymentTerms: formData.get("paymentTerms"),
    notes: formData.get("notes"),
  });
}

export async function createQuoteAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await requireAuth();
  const parsed = readQuoteForm(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const data = parsed.data;
  const issueDate = new Date();
  const validUntil = data.validUntil
    ? new Date(data.validUntil)
    : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  let quote;
  try {
    quote = await prisma.quote.create({
      data: {
        quoteNumber: await generateQuoteNumber(),
        clientId: data.clientId,
        issueDate,
        validUntil,
        deliveryTerms: data.deliveryTerms || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
        createdByUserId: session.user.id,
      },
    });
  } catch {
    return "Não foi possível criar o orçamento.";
  }

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuoteAction(
  quoteId: string,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();
  const parsed = readQuoteForm(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const data = parsed.data;
  try {
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        clientId: data.clientId,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        deliveryTerms: data.deliveryTerms || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
      },
    });
  } catch {
    return "Não foi possível guardar as alterações.";
  }

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  redirect(`/quotes/${quoteId}`);
}

/**
 * When a quote's status changes, nudge the client's pipeline stage forward to
 * keep the CRM in sync — but only ever forward, never back (a rejected quote
 * doesn't undo a client that's already Won). Returns the target stage, or null
 * if this status shouldn't move the client from its current stage.
 */
function pipelineStageForQuoteStatus(
  status: QuoteStatus,
  currentStage: PipelineStage,
): PipelineStage | null {
  if (status === "SENT") {
    return currentStage === "LEAD" || currentStage === "CONTACTED"
      ? "BUDGET_SENT"
      : null;
  }
  if (status === "ACCEPTED") {
    return currentStage === "WON" ? null : "WON";
  }
  return null;
}

export async function updateQuoteStatusAction(
  quoteId: string,
  status: QuoteStatus,
): Promise<{ error?: string }> {
  const session = await requireAuth();

  try {
    const quote = await prisma.quote.update({
      where: { id: quoteId },
      data: { status },
      include: { client: { select: { id: true, pipelineStage: true } } },
    });

    const nextStage = pipelineStageForQuoteStatus(
      status,
      quote.client.pipelineStage,
    );
    if (nextStage) {
      await prisma.client.update({
        where: { id: quote.client.id },
        data: {
          pipelineStage: nextStage,
          activities: {
            create: {
              type: "SYSTEM",
              body: `Fase movida para "${PIPELINE_STAGE_LABELS[nextStage]}" — orçamento ${quote.quoteNumber} marcado como "${QUOTE_STATUS_LABELS[status]}".`,
              authorUserId: session.user.id,
            },
          },
        },
      });
      revalidatePath("/clients");
      revalidatePath(`/clients/${quote.client.id}`);
    }
  } catch {
    return { error: "Não foi possível atualizar o estado." };
  }

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  return {};
}

export async function addQuoteLineFromOrderAction(
  quoteId: string,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();

  const parsed = quoteLineFromOrderSchema.safeParse({
    orderCartItemId: formData.get("orderCartItemId"),
    quantity: formData.get("quantity"),
    markupPercent: formData.get("markupPercent"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const computed = await computeOrderItemPricing(
    parsed.data.orderCartItemId,
    parsed.data.markupPercent,
  );
  if (!computed) return "Item de encomenda não encontrado.";

  const { orderCartItem } = computed;
  const { cartModel } = orderCartItem;
  const quantity = parsed.data.quantity;
  const lineTotalExVat = computed.sellPriceExVat.mul(quantity).toDecimalPlaces(2);
  const lineTotalIncVat = computed.sellPriceIncVat.mul(quantity).toDecimalPlaces(2);

  const maxPosition = await prisma.quoteLine.aggregate({
    where: { quoteId },
    _max: { position: true },
  });

  try {
    await prisma.quoteLine.create({
      data: {
        quoteId,
        position: (maxPosition._max.position ?? 0) + 1,
        cartModelId: cartModel.id,
        orderId: orderCartItem.orderId,
        orderCartItemId: orderCartItem.id,
        name: `${cartModel.code} — ${cartModel.name}`,
        specText: cartModel.defaultDescription,
        quantity,
        unitLandedCostEUR: computed.landedCostEUR,
        customsDutyPercentSnapshot: computed.customsDutyPercent,
        clearanceFeeSnapshot: computed.clearanceFee,
        markupPercentSnapshot: computed.markupPercent,
        vatRateSnapshot: computed.vatRate,
        unitSellPriceExVat: computed.sellPriceExVat,
        unitSellPriceIncVat: computed.sellPriceIncVat,
        lineTotalExVat,
        lineTotalIncVat,
      },
    });
  } catch {
    return "Não foi possível adicionar a linha.";
  }

  await recalcQuoteTotals(quoteId);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function addQuoteLineCustomAction(
  quoteId: string,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();

  const parsed = quoteLineCustomSchema.safeParse({
    name: formData.get("name"),
    specText: formData.get("specText"),
    quantity: formData.get("quantity"),
    unitSellPriceExVat: formData.get("unitSellPriceExVat"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const settings = await getSettings();
  const { name, specText, quantity } = parsed.data;
  const unitSellPriceExVat = new D(parsed.data.unitSellPriceExVat).toDecimalPlaces(2);
  const vatRate = settings.vatRate;
  const unitSellPriceIncVat = unitSellPriceExVat
    .mul(new D(1).add(new D(vatRate).div(100)))
    .toDecimalPlaces(2);
  const lineTotalExVat = unitSellPriceExVat.mul(quantity).toDecimalPlaces(2);
  const lineTotalIncVat = unitSellPriceIncVat.mul(quantity).toDecimalPlaces(2);

  const maxPosition = await prisma.quoteLine.aggregate({
    where: { quoteId },
    _max: { position: true },
  });

  try {
    await prisma.quoteLine.create({
      data: {
        quoteId,
        position: (maxPosition._max.position ?? 0) + 1,
        name,
        specText: specText || null,
        quantity,
        unitLandedCostEUR: 0,
        customsDutyPercentSnapshot: 0,
        clearanceFeeSnapshot: 0,
        markupPercentSnapshot: 0,
        vatRateSnapshot: vatRate,
        unitSellPriceExVat,
        unitSellPriceIncVat,
        lineTotalExVat,
        lineTotalIncVat,
      },
    });
  } catch {
    return "Não foi possível adicionar a linha.";
  }

  await recalcQuoteTotals(quoteId);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function removeQuoteLineAction(
  lineId: string,
  quoteId: string,
): Promise<{ error?: string }> {
  await requireAuth();

  try {
    await prisma.quoteLine.delete({ where: { id: lineId } });
  } catch {
    return { error: "Não foi possível remover a linha." };
  }

  await recalcQuoteTotals(quoteId);
  revalidatePath(`/quotes/${quoteId}`);
  return {};
}

export async function recalculateQuoteLineAction(
  lineId: string,
  quoteId: string,
): Promise<{ error?: string }> {
  await requireAuth();

  const line = await prisma.quoteLine.findUnique({ where: { id: lineId } });
  if (!line) return { error: "Linha não encontrada." };
  if (!line.orderCartItemId) {
    return { error: "Linha personalizada, sem origem para recalcular." };
  }

  const computed = await computeOrderItemPricing(
    line.orderCartItemId,
    Number(line.markupPercentSnapshot),
  );
  if (!computed) return { error: "Item de encomenda de origem já não existe." };

  const lineTotalExVat = computed.sellPriceExVat.mul(line.quantity).toDecimalPlaces(2);
  const lineTotalIncVat = computed.sellPriceIncVat.mul(line.quantity).toDecimalPlaces(2);

  try {
    await prisma.quoteLine.update({
      where: { id: lineId },
      data: {
        unitLandedCostEUR: computed.landedCostEUR,
        customsDutyPercentSnapshot: computed.customsDutyPercent,
        clearanceFeeSnapshot: computed.clearanceFee,
        markupPercentSnapshot: computed.markupPercent,
        vatRateSnapshot: computed.vatRate,
        unitSellPriceExVat: computed.sellPriceExVat,
        unitSellPriceIncVat: computed.sellPriceIncVat,
        lineTotalExVat,
        lineTotalIncVat,
      },
    });
  } catch {
    return { error: "Não foi possível recalcular a linha." };
  }

  await recalcQuoteTotals(quoteId);
  revalidatePath(`/quotes/${quoteId}`);
  return {};
}
