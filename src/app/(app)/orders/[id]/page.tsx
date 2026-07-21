import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { calculateLandedCostsForOrder, calculateSellPrice } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionLabel } from "@/components/page-header";
import { OrderStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddOrderItemForm } from "@/components/orders/add-order-item-form";
import { RemoveOrderItemButton } from "@/components/orders/remove-order-item-button";
import { DISCOUNT_TYPE_LABELS } from "@/lib/order-labels";
import { formatDatePT, formatEUR } from "@/lib/format";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [order, cartModels, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: { include: { cartModel: true }, orderBy: { createdAt: "asc" } } },
    }),
    prisma.cartModel.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    getSettings(),
  ]);

  if (!order) notFound();

  const dutyPercent = order.customsDutyPercent ?? settings.defaultCustomsDutyPercent;
  const clearanceFee = order.flatClearanceFee ?? settings.defaultClearanceFee;

  const landedCosts = calculateLandedCostsForOrder(order, order.items);
  const rows = order.items.map((item, i) => {
    const landedCostEUR = landedCosts[i];
    const pricing = calculateSellPrice({
      landedCostEUR,
      customsDutyPercent: dutyPercent,
      clearanceFee,
      markupPercent: settings.defaultMarkupPercent,
      vatRate: settings.vatRate,
    });
    return { item, landedCostEUR, ...pricing };
  });

  const itemsValueOriginal = order.items.reduce(
    (sum, item) => sum + Number(item.unitGoodsCostOriginal) * item.quantity,
    0,
  );

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {order.reference}
            <OrderStatusBadge value={order.status} />
          </span>
        }
        description={order.supplierName || "Sem fornecedor definido"}
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/orders/${order.id}/edit`} />}
        >
          Editar
        </Button>
      </PageHeader>

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 text-sm">
        <div>
          <SectionLabel>Data</SectionLabel>
          <div className="mt-2 text-foreground tabular-nums">
            {formatDatePT(order.orderDate)}
          </div>
        </div>
        <div>
          <SectionLabel>Moeda / câmbio</SectionLabel>
          <div className="mt-2 text-foreground tabular-nums">
            {order.originalCurrency} · 1 {order.originalCurrency} = {Number(order.exchangeRateToEUR)} EUR
          </div>
        </div>
        <div>
          <SectionLabel>Total do fornecedor</SectionLabel>
          <div className="mt-2 text-foreground tabular-nums">
            {Number(order.totalCostOriginal).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{" "}
            {order.originalCurrency}
          </div>
        </div>
        <div>
          <SectionLabel>Desconto</SectionLabel>
          <div className="mt-2 text-foreground tabular-nums">
            {order.discountType === "NONE"
              ? "—"
              : `${DISCOUNT_TYPE_LABELS[order.discountType]}: ${Number(order.discountValue)}`}
          </div>
        </div>
        <div>
          <SectionLabel>Direitos aduaneiros</SectionLabel>
          <div className="mt-2 text-foreground tabular-nums">
            {Number(dutyPercent)}%
            {order.customsDutyPercent == null && (
              <span className="text-muted-foreground"> (defeito)</span>
            )}
          </div>
        </div>
        <div>
          <SectionLabel>Desalfandegamento</SectionLabel>
          <div className="mt-2 text-foreground tabular-nums">
            {formatEUR(clearanceFee)}
            {order.flatClearanceFee == null && (
              <span className="text-muted-foreground"> (defeito)</span>
            )}
          </div>
        </div>
      </div>

      {order.notes && (
        <p className="mt-6 max-w-xl text-sm text-muted-foreground">
          {order.notes}
        </p>
      )}

      <SectionLabel className="mt-12">Itens da encomenda</SectionLabel>
      <div className="mt-3">
        {cartModels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cria primeiro um{" "}
            <Link href="/cart-models/new" className="underline">
              modelo de carrinho
            </Link>{" "}
            para poderes adicionar itens.
          </p>
        ) : (
          <AddOrderItemForm
            orderId={order.id}
            cartModels={cartModels.map((m) => ({
              id: m.id,
              code: m.code,
              name: m.name,
              defaultGoodsCostOriginal: m.defaultGoodsCostOriginal.toString(),
            }))}
          />
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Custo/un.</TableHead>
              <TableHead className="text-right">Custo pousado (EUR)</TableHead>
              <TableHead className="text-right">Custo total</TableHead>
              <TableHead className="text-right">Preço venda s/IVA</TableHead>
              <TableHead className="text-right">Preço venda c/IVA</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Sem itens ainda.
                </TableCell>
              </TableRow>
            )}
            {rows.map(({ item, landedCostEUR, totalCost, sellPriceExVat, sellPriceIncVat }) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-foreground">
                  {item.cartModel.code}
                  <div className="text-xs font-normal text-muted-foreground">
                    {item.cartModel.name}
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {Number(item.unitGoodsCostOriginal).toLocaleString("pt-PT", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {order.originalCurrency}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {formatEUR(landedCostEUR)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {formatEUR(totalCost)}
                </TableCell>
                <TableCell className="text-right text-foreground tabular-nums">
                  {formatEUR(sellPriceExVat)}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground tabular-nums">
                  {formatEUR(sellPriceIncVat)}
                </TableCell>
                <TableCell className="text-right">
                  <RemoveOrderItemButton itemId={item.id} orderId={order.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {order.items.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Soma dos itens: {itemsValueOriginal.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{" "}
          {order.originalCurrency} · Total dado pelo fornecedor:{" "}
          {Number(order.totalCostOriginal).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{" "}
          {order.originalCurrency}
          {Math.abs(itemsValueOriginal - Number(order.totalCostOriginal)) > 0.01 && (
            <span className="text-foreground"> — valores não coincidem, confirma os itens.</span>
          )}
        </p>
      )}
    </div>
  );
}
