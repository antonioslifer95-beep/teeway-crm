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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {quote.quoteNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/clients/${quote.client.id}`}
              className="hover:text-foreground hover:underline"
            >
              {quote.client.companyName}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Estado</div>
          <div className="mt-1.5">
            <QuoteStatusSelect quoteId={quote.id} value={quote.status} />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Data</div>
          <div className="mt-1 text-foreground">{formatDatePT(quote.issueDate)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Válido até</div>
          <div className="mt-1 text-foreground">
            {quote.validUntil ? formatDatePT(quote.validUntil) : "—"}
          </div>
        </div>
      </div>

      {quote.notes && (
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          {quote.notes}
        </p>
      )}

      <h2 className="mt-10 text-sm font-medium text-foreground">
        Linhas do orçamento
      </h2>
      <div className="mt-3">
        <AddQuoteLineForm quoteId={quote.id} orderItems={orderItems} />
      </div>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Preço unit. s/IVA</TableHead>
              <TableHead>Total s/IVA</TableHead>
              <TableHead>Total c/IVA</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quote.lines.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
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
                    <div className="text-xs text-muted-foreground">
                      {line.specText}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {line.quantity}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatEUR(line.unitSellPriceExVat)}
                </TableCell>
                <TableCell className="text-foreground">
                  {formatEUR(line.lineTotalExVat)}
                </TableCell>
                <TableCell className="font-medium text-foreground">
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
        <div className="mt-4 flex justify-end">
          <div className="w-72 text-sm">
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>Subtotal s/IVA</span>
              <span>{formatEUR(quote.subtotalExVat)}</span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>IVA</span>
              <span>{formatEUR(quote.vatAmount)}</span>
            </div>
            <div className="mt-1 flex justify-between rounded-lg bg-foreground px-3 py-2 font-semibold text-background">
              <span>Total c/IVA</span>
              <span>{formatEUR(quote.totalIncVat)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
