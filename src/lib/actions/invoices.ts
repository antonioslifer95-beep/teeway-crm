"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { getSettings } from "@/lib/settings";
import { Prisma, type InvoiceStatus } from "@/generated/prisma/client";
import { INVOICE_STATUS_SELECTABLE_VALUES } from "@/lib/invoice-labels";
import { invoiceFormSchema, invoiceLineFormSchema } from "@/lib/validations/invoice";

const D = Prisma.Decimal;

async function generateInternalRef() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { internalRef: { startsWith: `FAT-${year}-` } },
  });
  return `FAT-${year}-${String(count + 1).padStart(3, "0")}`;
}

async function recalcInvoiceTotals(invoiceId: string) {
  const lines = await prisma.invoiceLine.findMany({
    where: { invoiceId },
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

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotalExVat,
      totalIncVat,
      vatAmount: totalIncVat.sub(subtotalExVat),
    },
  });
}

function readInvoiceForm(formData: FormData) {
  return invoiceFormSchema.safeParse({
    clientId: formData.get("clientId"),
    dueDate: formData.get("dueDate"),
    paymentTerms: formData.get("paymentTerms"),
  });
}

export async function createInvoiceAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();
  const parsed = readInvoiceForm(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const data = parsed.data;
  const issueDate = new Date();
  const dueDate = data.dueDate
    ? new Date(data.dueDate)
    : new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

  let invoice;
  try {
    invoice = await prisma.invoice.create({
      data: {
        internalRef: await generateInternalRef(),
        clientId: data.clientId,
        issueDate,
        dueDate,
        paymentTerms: data.paymentTerms || null,
      },
    });
  } catch {
    return "Não foi possível criar a fatura.";
  }

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function createInvoiceFromQuoteAction(quoteId: string) {
  await requireAuth();

  // Idempotency: a quote maps to at most one invoice. If one already exists,
  // send the user there rather than silently creating a duplicate.
  const existing = await prisma.invoice.findFirst({
    where: { quoteId },
    select: { id: true },
  });
  if (existing) {
    redirect(`/invoices/${existing.id}`);
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { lines: { orderBy: { position: "asc" } } },
  });
  if (!quote) return;

  const issueDate = new Date();
  const dueDate = new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

  const invoice = await prisma.invoice.create({
    data: {
      internalRef: await generateInternalRef(),
      quoteId: quote.id,
      clientId: quote.clientId,
      issueDate,
      dueDate,
      paymentTerms: quote.paymentTerms,
      subtotalExVat: quote.subtotalExVat,
      vatAmount: quote.vatAmount,
      totalIncVat: quote.totalIncVat,
      lines: {
        create: quote.lines.map((line) => ({
          position: line.position,
          name: line.name,
          specText: line.specText,
          quantity: line.quantity,
          unitSellPriceExVat: line.unitSellPriceExVat,
          unitSellPriceIncVat: line.unitSellPriceIncVat,
          vatRate: line.vatRateSnapshot,
          lineTotalExVat: line.lineTotalExVat,
          lineTotalIncVat: line.lineTotalIncVat,
        })),
      },
    },
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoiceAction(
  invoiceId: string,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();
  const parsed = readInvoiceForm(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const data = parsed.data;
  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        clientId: data.clientId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paymentTerms: data.paymentTerms || null,
      },
    });
  } catch {
    return "Não foi possível guardar as alterações.";
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  redirect(`/invoices/${invoiceId}`);
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  status: InvoiceStatus,
): Promise<{ error?: string }> {
  await requireAuth();

  if (!INVOICE_STATUS_SELECTABLE_VALUES.includes(status)) {
    return { error: "Estado inválido." };
  }

  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
    });
  } catch {
    return { error: "Não foi possível atualizar o estado." };
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return {};
}

export async function addInvoiceLineAction(
  invoiceId: string,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();

  const settings = await getSettings();
  const parsed = invoiceLineFormSchema.safeParse({
    name: formData.get("name"),
    specText: formData.get("specText"),
    quantity: formData.get("quantity"),
    unitSellPriceExVat: formData.get("unitSellPriceExVat"),
    vatRate: formData.get("vatRate") || settings.vatRate.toString(),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const { name, specText, quantity, vatRate } = parsed.data;
  const unitSellPriceExVat = new D(parsed.data.unitSellPriceExVat).toDecimalPlaces(2);
  const unitSellPriceIncVat = unitSellPriceExVat
    .mul(new D(1).add(new D(vatRate).div(100)))
    .toDecimalPlaces(2);
  const lineTotalExVat = unitSellPriceExVat.mul(quantity).toDecimalPlaces(2);
  const lineTotalIncVat = unitSellPriceIncVat.mul(quantity).toDecimalPlaces(2);

  const maxPosition = await prisma.invoiceLine.aggregate({
    where: { invoiceId },
    _max: { position: true },
  });

  try {
    await prisma.invoiceLine.create({
      data: {
        invoiceId,
        position: (maxPosition._max.position ?? 0) + 1,
        name,
        specText: specText || null,
        quantity,
        unitSellPriceExVat,
        unitSellPriceIncVat,
        vatRate,
        lineTotalExVat,
        lineTotalIncVat,
      },
    });
  } catch {
    return "Não foi possível adicionar a linha.";
  }

  await recalcInvoiceTotals(invoiceId);
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function removeInvoiceLineAction(
  lineId: string,
  invoiceId: string,
): Promise<{ error?: string }> {
  await requireAuth();

  try {
    await prisma.invoiceLine.delete({ where: { id: lineId } });
  } catch {
    return { error: "Não foi possível remover a linha." };
  }

  await recalcInvoiceTotals(invoiceId);
  revalidatePath(`/invoices/${invoiceId}`);
  return {};
}
