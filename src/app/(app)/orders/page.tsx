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
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";
import { formatDatePT } from "@/lib/format";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { orderDate: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Encomendas</h1>
        <Button nativeButton={false} render={<Link href="/orders/new" />}>
          Nova encomenda
        </Button>
      </div>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referência</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Itens</TableHead>
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
                <TableCell className="text-muted-foreground">
                  {formatDatePT(order.orderDate)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {order._count.items}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {ORDER_STATUS_LABELS[order.status]}
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
