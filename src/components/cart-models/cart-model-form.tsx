"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DecimalInput, IntegerInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CartModel } from "@/generated/prisma/client";

type Action = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

export function CartModelForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  defaultValues?: Partial<CartModel>;
  submitLabel: string;
}) {
  const [error, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            name="code"
            placeholder="VY-A2"
            defaultValue={defaultValues?.code ?? ""}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="seats">Lugares</Label>
          <IntegerInput
            id="seats"
            name="seats"
            defaultValue={defaultValues?.seats ?? ""}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            name="name"
            placeholder="Carrinho de golfe elétrico VY-A2 — 2 lugares"
            defaultValue={defaultValues?.name ?? ""}
            required
          />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="defaultDescription">Especificações (texto)</Label>
          <Textarea
            id="defaultDescription"
            name="defaultDescription"
            className="min-h-24"
            placeholder="Motor 3,5 kW · bateria de lítio 48 V/150 A · pneus 10'' relva…"
            defaultValue={defaultValues?.defaultDescription ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="defaultGoodsCostOriginal">Custo de referência</Label>
          <DecimalInput
            id="defaultGoodsCostOriginal"
            name="defaultGoodsCostOriginal"
            defaultValue={defaultValues?.defaultGoodsCostOriginal?.toString() ?? ""}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="defaultCurrency">Moeda</Label>
          <Input
            id="defaultCurrency"
            name="defaultCurrency"
            defaultValue={defaultValues?.defaultCurrency ?? "EUR"}
            required
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "A guardar…" : submitLabel}
      </Button>
    </form>
  );
}
