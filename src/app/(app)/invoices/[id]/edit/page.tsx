import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { updateInvoiceAction } from "@/lib/actions/invoices";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [invoice, clients] = await Promise.all([
    prisma.invoice.findUnique({ where: { id } }),
    prisma.client.findMany({
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
  ]);

  if (!invoice) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        Editar fatura {invoice.internalRef}
      </h1>
      <div className="mt-6">
        <InvoiceForm
          action={updateInvoiceAction.bind(null, invoice.id)}
          clients={clients}
          defaultValues={invoice}
          submitLabel="Guardar alterações"
        />
      </div>
    </div>
  );
}
