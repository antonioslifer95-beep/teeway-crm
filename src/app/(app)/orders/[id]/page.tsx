import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { calculateLandedCostsForOrder, calculateSellPrice } from "@/lib/pricing";
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
import { AddOrderItemForm } from "@/components/orders/add-order-item-form";
import { RemoveOrderItemButton } from "@/components/orders/remove-order-item-button";
import {
  DISCOUNT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
} from "@/lib/order-labels";
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {order.reference}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.supplierName || "Sem fornecedor definido"}
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/orders/${order.id}/edit`} />}
        >
          Editar
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Estado</div>
          <Badge variant="outline" className="mt-1">
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Data</div>
          <div className="mt-1 text-foreground">{formatDatePT(order.orderDate)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Moeda / câmbio</div>
          <div className="mt-1 text-foreground">
            {order.originalCurrency} · 1 {order.originalCurrency} = {Number(order.exchangeRateToEUR)} EUR
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Total do fornecedor</div>
          <div className="mt-1 text-foreground">
            {Number(order.totalCostOriginal).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{" "}
            {order.originalCurrency}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Desconto</div>
          <div className="mt-1 text-foreground">
            {order.discountType === "NONE"
              ? "—"
              : `${DISCOUNT_TYPE_LABELS[order.discountType]}: ${Number(order.discountValue)}`}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Direitos aduaneiros</div>
          <div className="mt-1 text-foreground">
            {Number(dutyPercent)}%
            {order.customsDutyPercent == null && (
              <span className="text-muted-foreground"> (defeito)</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Desalfandegamento</div>
          <div className="mt-1 text-foreground">
            {formatEUR(clearanceFee)}
            {order.flatClearanceFee == null && (
              <span className="text-muted-foreground"> (defeito)</span>
            )}
          </div>
        </div>
      </div>

      {order.notes && (
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          {order.notes}
        </p>
      )}

      <h2 className="mt-10 text-sm font-medium text-foreground">
        Itens da encomenda
      </h2>
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

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Custo/un.</TableHead>
              <TableHead>Custo pousado (EUR)</TableHead>
              <TableHead>Custo total</TableHead>
              <TableHead>Preço venda s/IVA</TableHead>
              <TableHead>Preço venda c/IVA</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Sem itens ainda.
                </TableCell>
              </TableRow>
            )}
            {rows.map(({ item, landedCostEUR, totalCost, sellPriceExVat, sellPriceIncVat }) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-foreground">
                  {item.cartModel.code}
                  <div className="text-xs text-muted-foreground">
                    {item.cartModel.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {Number(item.unitGoodsCostOriginal).toLocaleString("pt-PT", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {order.originalCurrency}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatEUR(landedCostEUR)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatEUR(totalCost)}
                </TableCell>
                <TableCell className="text-foreground">
                  {formatEUR(sellPriceExVat)}
                </TableCell>
                <TableCell className="font-medium text-foreground">
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
