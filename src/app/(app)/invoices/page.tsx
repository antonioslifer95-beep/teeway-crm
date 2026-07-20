import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INVOICE_STATUS_LABELS } from "@/lib/invoice-labels";
import { formatDatePT, formatEUR } from "@/lib/format";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { companyName: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Faturas</h1>
        <Button nativeButton={false} render={<Link href="/invoices/new" />}>
          Nova fatura
        </Button>
      </div>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref. interna</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Total c/IVA</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
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
                <TableCell className="text-muted-foreground">
                  {invoice.issueDate ? formatDatePT(invoice.issueDate) : "—"}
                </TableCell>
                <TableCell className="text-foreground">
                  {formatEUR(invoice.totalIncVat)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {INVOICE_STATUS_LABELS[invoice.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
