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
import { PageHeader, SectionLabel } from "@/components/page-header";
import { InvoiceStatusBadge } from "@/components/status-badge";
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
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {invoice.internalRef}
            <InvoiceStatusBadge value={invoice.status} />
          </span>
        }
        description={
          <>
            <Link
              href={`/clients/${invoice.client.id}`}
              className="hover:text-foreground hover:underline"
            >
              {invoice.client.companyName}
            </Link>
            {invoice.quote && (
              <>
                {" · a partir do orçamento "}
                <Link href={`/quotes/${invoice.quote.id}`} className="underline">
                  {invoice.quote.quoteNumber}
                </Link>
              </>
            )}
          </>
        }
      >
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
      </PageHeader>

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 text-sm">
        <div>
          <SectionLabel>Estado</SectionLabel>
          <div className="mt-2">
            <InvoiceStatusSelect invoiceId={invoice.id} value={invoice.status} />
          </div>
        </div>
        <div>
          <SectionLabel>Data de emissão</SectionLabel>
          <div className="mt-2 text-foreground tabular-nums">
            {invoice.issueDate ? formatDatePT(invoice.issueDate) : "—"}
          </div>
        </div>
        <div>
          <SectionLabel>Data de vencimento</SectionLabel>
          <div className="mt-2 text-foreground tabular-nums">
            {invoice.dueDate ? formatDatePT(invoice.dueDate) : "—"}
          </div>
        </div>
      </div>

      {invoice.paymentTerms && (
        <p className="mt-6 max-w-xl text-sm text-muted-foreground">
          {invoice.paymentTerms}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Fatura interna, ainda não emitida fiscalmente. A emissão através do
        TOConline (número oficial, ATCUD, código QR) fica disponível numa
        fase posterior do projeto — até lá, o PDF é apenas uma
        pré-visualização.
      </div>

      <SectionLabel className="mt-12">Linhas da fatura</SectionLabel>
      <div className="mt-3">
        <AddInvoiceLineForm
          invoiceId={invoice.id}
          defaultVatRate={settings.vatRate.toString()}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Preço unit. s/IVA</TableHead>
              <TableHead className="text-right">IVA</TableHead>
              <TableHead className="text-right">Total s/IVA</TableHead>
              <TableHead className="text-right">Total c/IVA</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.lines.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
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
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {Number(line.vatRate)}%
                </TableCell>
                <TableCell className="text-right text-foreground tabular-nums">
                  {formatEUR(line.lineTotalExVat)}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground tabular-nums">
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
        <div className="mt-5 flex justify-end">
          <div className="w-72 text-sm">
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>Subtotal s/IVA</span>
              <span className="tabular-nums">
                {formatEUR(invoice.subtotalExVat)}
              </span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>IVA</span>
              <span className="tabular-nums">
                {formatEUR(invoice.vatAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-foreground px-4 py-3 font-semibold text-background">
              <span className="text-xs uppercase tracking-wider text-background/70">
                Total a pagar
              </span>
              <span className="text-lg tabular-nums">
                {formatEUR(invoice.totalIncVat)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
