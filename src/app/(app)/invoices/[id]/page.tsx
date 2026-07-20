import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddInvoiceLineForm } from "@/components/invoices/add-invoice-line-form";
import { RemoveInvoiceLineButton } from "@/components/invoices/remove-invoice-line-button";
import { InvoiceStatusSelect } from "@/components/invoices/invoice-status-select";
import { formatDatePT, formatEUR } from "@/lib/format";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        quote: { select: { id: true, quoteNumber: true } },
        lines: { orderBy: { position: "asc" } },
      },
    }),
    getSettings(),
  ]);

  if (!invoice) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {invoice.internalRef}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoice.client.companyName}
            {invoice.quote && (
              <>
                {" · a partir do orçamento "}
                <Link href={`/quotes/${invoice.quote.id}`} className="underline">
                  {invoice.quote.quoteNumber}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/invoices/${invoice.id}/edit`} />}
          >
            Editar
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={`/invoices/${invoice.id}/pdf`} target="_blank" />}
          >
            Ver / Exportar PDF
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Estado</div>
          <div className="mt-1.5">
            <InvoiceStatusSelect invoiceId={invoice.id} value={invoice.status} />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Data de emissão</div>
          <div className="mt-1 text-foreground">
            {invoice.issueDate ? formatDatePT(invoice.issueDate) : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Data de vencimento</div>
          <div className="mt-1 text-foreground">
            {invoice.dueDate ? formatDatePT(invoice.dueDate) : "—"}
          </div>
        </div>
      </div>

      {invoice.paymentTerms && (
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          {invoice.paymentTerms}
        </p>
      )}

      <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Fatura interna, ainda não emitida fiscalmente. A emissão através do
        TOConline (número oficial, ATCUD, código QR) fica disponível numa
        fase posterior do projeto — até lá, o PDF é apenas uma
        pré-visualização.
      </div>

      <h2 className="mt-10 text-sm font-medium text-foreground">
        Linhas da fatura
      </h2>
      <div className="mt-3">
        <AddInvoiceLineForm
          invoiceId={invoice.id}
          defaultVatRate={settings.vatRate.toString()}
        />
      </div>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Preço unit. s/IVA</TableHead>
              <TableHead>IVA</TableHead>
              <TableHead>Total s/IVA</TableHead>
              <TableHead>Total c/IVA</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.lines.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Sem linhas ainda.
                </TableCell>
              </TableRow>
            )}
            {invoice.lines.map((line) => (
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
                <TableCell className="text-muted-foreground">
                  {Number(line.vatRate)}%
                </TableCell>
                <TableCell className="text-foreground">
                  {formatEUR(line.lineTotalExVat)}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {formatEUR(line.lineTotalIncVat)}
                </TableCell>
                <TableCell className="text-right">
                  <RemoveInvoiceLineButton lineId={line.id} invoiceId={invoice.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {invoice.lines.length > 0 && (
        <div className="mt-4 flex justify-end">
          <div className="w-72 text-sm">
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>Subtotal s/IVA</span>
              <span>{formatEUR(invoice.subtotalExVat)}</span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>IVA</span>
              <span>{formatEUR(invoice.vatAmount)}</span>
            </div>
            <div className="mt-1 flex justify-between rounded-lg bg-foreground px-3 py-2 font-semibold text-background">
              <span>Total a pagar</span>
              <span>{formatEUR(invoice.totalIncVat)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
