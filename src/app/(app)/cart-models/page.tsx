import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleCartModelActiveButton } from "@/components/cart-models/toggle-cart-model-active-button";
import { formatEUR } from "@/lib/format";

export default async function CartModelsPage() {
  const models = await prisma.cartModel.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Modelos de carrinho"
        description="Catálogo reutilizável de carrinhos, com custo de referência."
      >
        <Button nativeButton={false} render={<Link href="/cart-models/new" />}>
          Novo modelo
        </Button>
      </PageHeader>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Lugares</TableHead>
              <TableHead className="text-right">Custo de referência</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Sem modelos ainda.
                </TableCell>
              </TableRow>
            )}
            {models.map((model) => (
              <TableRow key={model.id}>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/cart-models/${model.id}/edit`} className="hover:underline">
                    {model.code}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {model.name}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {model.seats ?? "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {formatEUR(model.defaultGoodsCostOriginal)}{" "}
                  {model.defaultCurrency !== "EUR" ? model.defaultCurrency : ""}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={model.isActive ? "solid" : "muted"}>
                    {model.isActive ? "Ativo" : "Inativo"}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  <ToggleCartModelActiveButton
                    cartModelId={model.id}
                    isActive={model.isActive}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
