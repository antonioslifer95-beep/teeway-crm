import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { InvoiceStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDatePT, formatEUR } from "@/lib/format";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { companyName: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Faturas"
        description="Documentos de faturação — pré-visualização interna até à emissão fiscal."
      >
        <Button nativeButton={false} render={<Link href="/invoices/new" />}>
          Nova fatura
        </Button>
      </PageHeader>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref. interna</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Total c/IVA</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Sem faturas ainda.
                </TableCell>
              </TableRow>
            )}
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                    {invoice.internalRef}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invoice.client.companyName}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {invoice.issueDate ? formatDatePT(invoice.issueDate) : "—"}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground tabular-nums">
                  {formatEUR(invoice.totalIncVat)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge value={invoice.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
