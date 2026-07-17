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
import { ToggleCartModelActiveButton } from "@/components/cart-models/toggle-cart-model-active-button";
import { formatEUR } from "@/lib/format";

export default async function CartModelsPage() {
  const models = await prisma.cartModel.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">
          Modelos de carrinho
        </h1>
        <Button nativeButton={false} render={<Link href="/cart-models/new" />}>
          Novo modelo
        </Button>
      </div>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Lugares</TableHead>
              <TableHead>Custo de referência</TableHead>
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
                <TableCell className="text-muted-foreground">
                  {model.seats ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatEUR(model.defaultGoodsCostOriginal)}{" "}
                  {model.defaultCurrency !== "EUR" ? model.defaultCurrency : ""}
                </TableCell>
                <TableCell>
                  {model.isActive ? (
                    <Badge variant="outline">Ativo</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inativo
                    </Badge>
                  )}
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
