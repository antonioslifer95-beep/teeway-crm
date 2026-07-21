import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QuoteForm } from "@/components/quotes/quote-form";
import { createQuoteAction } from "@/lib/actions/quotes";

export default async function NewQuotePage({
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
      <h1 className="text-xl font-semibold text-foreground">Novo orçamento</h1>
      <div className="mt-6">
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cria primeiro um{" "}
            <Link href="/clients/new" className="underline">
              cliente
            </Link>{" "}
            para poderes criar um orçamento.
          </p>
        ) : (
          <QuoteForm
            action={createQuoteAction}
            clients={clients}
            defaultValues={clientId ? { clientId } : undefined}
            submitLabel="Criar orçamento"
          />
        )}
      </div>
    </div>
  );
}
