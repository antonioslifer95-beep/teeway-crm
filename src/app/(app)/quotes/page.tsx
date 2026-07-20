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
import { QUOTE_STATUS_LABELS } from "@/lib/quote-labels";
import { formatDatePT, formatEUR } from "@/lib/format";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { issueDate: "desc" },
    include: { client: { select: { companyName: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Orçamentos</h1>
        <Button nativeButton={false} render={<Link href="/quotes/new" />}>
          Novo orçamento
        </Button>
      </div>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N.º</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Total c/IVA</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
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
                <TableCell className="text-muted-foreground">
                  {formatDatePT(quote.issueDate)}
                </TableCell>
                <TableCell className="text-foreground">
                  {formatEUR(quote.totalIncVat)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {QUOTE_STATUS_LABELS[quote.status]}
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
