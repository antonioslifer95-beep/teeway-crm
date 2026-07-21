import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { QuoteStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDatePT, formatEUR } from "@/lib/format";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { issueDate: "desc" },
    include: { client: { select: { companyName: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Propostas de preço enviadas aos clientes."
      >
        <Button nativeButton={false} render={<Link href="/quotes/new" />}>
          Novo orçamento
        </Button>
      </PageHeader>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N.º</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Total c/IVA</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Sem orçamentos ainda.
                </TableCell>
              </TableRow>
            )}
            {quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/quotes/${quote.id}`} className="hover:underline">
                    {quote.quoteNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {quote.client.companyName}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatDatePT(quote.issueDate)}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground tabular-nums">
                  {formatEUR(quote.totalIncVat)}
                </TableCell>
                <TableCell>
                  <QuoteStatusBadge value={quote.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
