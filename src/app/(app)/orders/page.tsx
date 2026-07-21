import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { OrderStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDatePT } from "@/lib/format";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { orderDate: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Encomendas"
        description="Lotes de compra ao produtor — base do custo de importação."
      >
        <Button nativeButton={false} render={<Link href="/orders/new" />}>
          Nova encomenda
        </Button>
      </PageHeader>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referência</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Itens</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Sem encomendas ainda.
                </TableCell>
              </TableRow>
            )}
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/orders/${order.id}`} className="hover:underline">
                    {order.reference}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {order.supplierName || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatDatePT(order.orderDate)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {order._count.items}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge value={order.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
