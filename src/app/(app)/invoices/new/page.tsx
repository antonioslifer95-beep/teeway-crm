import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { createInvoiceAction } from "@/lib/actions/invoices";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const clients = await prisma.client.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Nova fatura</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Para faturar um orçamento existente, usa o botão &quot;Criar
        fatura&quot; na página do orçamento — isso copia as linhas
        automaticamente.
      </p>
      <div className="mt-6">
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cria primeiro um{" "}
            <Link href="/clients/new" className="underline">
              cliente
            </Link>{" "}
            para poderes criar uma fatura.
          </p>
        ) : (
          <InvoiceForm
            action={createInvoiceAction}
            clients={clients}
            defaultValues={clientId ? { clientId } : undefined}
            submitLabel="Criar fatura"
          />
        )}
      </div>
    </div>
  );
}
