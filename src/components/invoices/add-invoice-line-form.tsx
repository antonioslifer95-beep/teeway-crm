"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { DecimalInput, IntegerInput } from "@/components/ui/numeric-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addInvoiceLineAction } from "@/lib/actions/invoices";

export function AddInvoiceLineForm({
  invoiceId,
  defaultVatRate,
}: {
  invoiceId: string;
  defaultVatRate: string;
}) {
  const boundAction = addInvoiceLineAction.bind(null, invoiceId);
  const [error, formAction, isPending] = useActionState(boundAction, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Descrição</Label>
        <Input id="name" name="name" className="w-56" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="specText">Especificações</Label>
        <Input id="specText" name="specText" className="w-64" />
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
        <Label htmlFor="unitSellPriceExVat">Preço unit. s/IVA</Label>
        <DecimalInput
          id="unitSellPriceExVat"
          name="unitSellPriceExVat"
          className="w-32"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="vatRate">IVA %</Label>
        <DecimalInput
          id="vatRate"
          name="vatRate"
          defaultValue={defaultVatRate}
          className="w-20"
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
