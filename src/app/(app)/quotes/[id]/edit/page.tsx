import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuoteForm } from "@/components/quotes/quote-form";
import { updateQuoteAction } from "@/lib/actions/quotes";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [quote, clients] = await Promise.all([
    prisma.quote.findUnique({ where: { id } }),
    prisma.client.findMany({
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
  ]);

  if (!quote) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        Editar orçamento {quote.quoteNumber}
      </h1>
      <div className="mt-6">
        <QuoteForm
          action={updateQuoteAction.bind(null, quote.id)}
          clients={clients}
          defaultValues={quote}
          submitLabel="Guardar alterações"
        />
      </div>
    </div>
  );
}
