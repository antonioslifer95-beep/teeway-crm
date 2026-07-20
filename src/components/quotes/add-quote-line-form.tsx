"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { DecimalInput, IntegerInput } from "@/components/ui/numeric-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addQuoteLineCustomAction,
  addQuoteLineFromOrderAction,
} from "@/lib/actions/quotes";

type OrderItemOption = {
  id: string;
  orderReference: string;
  cartModelCode: string;
  cartModelName: string;
};

export function AddQuoteLineForm({
  quoteId,
  orderItems,
}: {
  quoteId: string;
  orderItems: OrderItemOption[];
}) {
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "catalog" ? "default" : "outline"}
          onClick={() => setMode("catalog")}
        >
          Do catálogo
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "custom" ? "default" : "outline"}
          onClick={() => setMode("custom")}
        >
          Linha personalizada
        </Button>
      </div>
      <div className="mt-4">
        {mode === "catalog" ? (
          <FromOrderForm quoteId={quoteId} orderItems={orderItems} />
        ) : (
          <CustomLineForm quoteId={quoteId} />
        )}
      </div>
    </div>
  );
}

function FromOrderForm({
  quoteId,
  orderItems,
}: {
  quoteId: string;
  orderItems: OrderItemOption[];
}) {
  const boundAction = addQuoteLineFromOrderAction.bind(null, quoteId);
  const [error, formAction, isPending] = useActionState(boundAction, undefined);
  const [selectedItemId, setSelectedItemId] = useState("");

  if (orderItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda não existem itens em nenhuma encomenda para escolher.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="orderCartItemId">Item de encomenda</Label>
        <Select
          name="orderCartItemId"
          value={selectedItemId}
          onValueChange={(value) => setSelectedItemId(value ?? "")}
        >
          <SelectTrigger id="orderCartItemId" className="w-72">
            <SelectValue placeholder="Escolher item">
              {(value: string) => {
                if (!value) return "Escolher item";
                const item = orderItems.find((i) => i.id === value);
                return item
                  ? `${item.orderReference} · ${item.cartModelCode} — ${item.cartModelName}`
                  : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {orderItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.orderReference} · {item.cartModelCode} — {item.cartModelName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="quantity">Qtd</Label>
        <IntegerInput
          id="quantity"
          name="quantity"
          defaultValue="1"
          className="w-20"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="markupPercent">Markup % — vazio = defeito</Label>
        <DecimalInput id="markupPercent" name="markupPercent" className="w-28" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "A adicionar…" : "Adicionar linha"}
      </Button>
      {error && (
        <p className="w-full text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function CustomLineForm({ quoteId }: { quoteId: string }) {
  const boundAction = addQuoteLineCustomAction.bind(null, quoteId);
  const [error, formAction, isPending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Descrição</Label>
        <Input id="name" name="name" className="w-56" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="specText">Especificações</Label>
        <Input id="specText" name="specText" className="w-64" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="customQuantity">Qtd</Label>
        <IntegerInput
          id="customQuantity"
          name="quantity"
          defaultValue="1"
          className="w-20"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="unitSellPriceExVat">Preço unit. s/IVA</Label>
        <DecimalInput
          id="unitSellPriceExVat"
          name="unitSellPriceExVat"
          className="w-32"
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "A adicionar…" : "Adicionar linha"}
      </Button>
      {error && (
        <p className="w-full text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
