import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddQuoteLineForm } from "@/components/quotes/add-quote-line-form";
import { RemoveQuoteLineButton } from "@/components/quotes/remove-quote-line-button";
import { RecalculateQuoteLineButton } from "@/components/quotes/recalculate-quote-line-button";
import { QuoteStatusSelect } from "@/components/quotes/quote-status-select";
import { CreateInvoiceButton } from "@/components/quotes/create-invoice-button";
import { PageHeader, SectionLabel } from "@/components/page-header";
import { QuoteStatusBadge } from "@/components/status-badge";
import { formatDatePT, formatEUR } from "@/lib/format";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [quote, orders] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        lines: { orderBy: { position: "asc" } },
        invoices: {
          orderBy: { createdAt: "desc" },
          select: { id: true, internalRef: true },
        },
      },
    }),
    prisma.order.findMany({
      orderBy: { orderDate: "desc" },
      include: { items: { include: { cartModel: true }, orderBy: { createdAt: "asc" } } },
    }),
  ]);

  if (!quote) notFound();

  const orderItems = orders.flatMap((order) =>
    order.items.map((item) => ({
      id: item.id,
      orderReference: order.reference,
      cartModelCode: item.cartModel.code,
      cartModelName: item.cartModel.name,
    })),
  );

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {quote.quoteNumber}
            <QuoteStatusBadge value={quote.status} />
          </span>
        }
        description={
          <Link
            href={`/clients/${quote.client.id}`}
            className="hover:text-foreground hover:underline"
          >
            {quote.client.companyName}
          </Link>
        }
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/quotes/${quote.id}/edit`} />}
        >
          Editar
        </Button>
        <Button
          nativeButton={false}
          render={<Link href={`/quotes/${quote.id}/pdf`} target="_blank" />}
        >
          Ver / Exportar PDF
        </Button>
        {quote.invoices.length > 0 ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/invoices/${quote.invoices[0].id}`} />}
          >
            Ver fatura {quote.invoices[0].internalRef}
          </Button>
        ) : (
          quote.lines.length > 0 && <CreateInvoiceButton quoteId={quote.id} />
        )}
      </PageHeader>

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 text-sm">
        <div>
          <SectionLabel>Estado</SectionLabel>
          <div className="mt-2">
            <QuoteStatusSelect quoteId={quote.id} value={quote.status} />
          </div>
        </div>
        <div>
          <SectionLabel>Data</SectionLabel>
          <div className="mt-2 text-foreground tabular-nums">
            {formatDatePT(quote.issueDate)}
          </div>
        </div>
        <div>
          <SectionLabel>Válido até</SectionLabel>
          <div className="mt-2 text-foreground tabular-nums">
            {quote.validUntil ? formatDatePT(quote.validUntil) : "—"}
          </div>
        </div>
      </div>

      {quote.notes && (
        <p className="mt-6 max-w-xl text-sm text-muted-foreground">
          {quote.notes}
        </p>
      )}

      <SectionLabel className="mt-12">Linhas do orçamento</SectionLabel>
      <div className="mt-3">
        <AddQuoteLineForm quoteId={quote.id} orderItems={orderItems} />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Preço unit. s/IVA</TableHead>
              <TableHead className="text-right">Total s/IVA</TableHead>
              <TableHead className="text-right">Total c/IVA</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quote.lines.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Sem linhas ainda.
                </TableCell>
              </TableRow>
            )}
            {quote.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-medium text-foreground">
                  {line.name}
                  {line.specText && (
                    <div className="text-xs font-normal text-muted-foreground">
                      {line.specText}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {line.quantity}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {formatEUR(line.unitSellPriceExVat)}
                </TableCell>
                <TableCell className="text-right text-foreground tabular-nums">
                  {formatEUR(line.lineTotalExVat)}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground tabular-nums">
                  {formatEUR(line.lineTotalIncVat)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {line.orderCartItemId && (
                      <RecalculateQuoteLineButton
                        lineId={line.id}
                        quoteId={quote.id}
                      />
                    )}
                    <RemoveQuoteLineButton lineId={line.id} quoteId={quote.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {quote.lines.length > 0 && (
        <div className="mt-5 flex justify-end">
          <div className="w-72 text-sm">
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>Subtotal s/IVA</span>
              <span className="tabular-nums">
                {formatEUR(quote.subtotalExVat)}
              </span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>IVA</span>
              <span className="tabular-nums">{formatEUR(quote.vatAmount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-foreground px-4 py-3 font-semibold text-background">
              <span className="text-xs uppercase tracking-wider text-background/70">
                Total c/IVA
              </span>
              <span className="text-lg tabular-nums">
                {formatEUR(quote.totalIncVat)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
