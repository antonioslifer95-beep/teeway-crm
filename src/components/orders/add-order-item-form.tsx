"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { DecimalInput, IntegerInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addOrderItemAction } from "@/lib/actions/orders";

type CartModelOption = {
  id: string;
  code: string;
  name: string;
  defaultGoodsCostOriginal: string;
};

export function AddOrderItemForm({
  orderId,
  cartModels,
}: {
  orderId: string;
  cartModels: CartModelOption[];
}) {
  const boundAction = addOrderItemAction.bind(null, orderId);
  const [error, formAction, isPending] = useActionState(
    boundAction,
    undefined,
  );
  const [cost, setCost] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="cartModelId">Modelo</Label>
        <Select
          name="cartModelId"
          value={selectedModelId}
          onValueChange={(value) => {
            setSelectedModelId(value ?? "");
            const model = cartModels.find((m) => m.id === value);
            if (model) setCost(model.defaultGoodsCostOriginal);
          }}
        >
          <SelectTrigger id="cartModelId" className="w-56">
            <SelectValue placeholder="Escolher modelo">
              {(value: string) => {
                const model = cartModels.find((m) => m.id === value);
                return model ? `${model.code} — ${model.name}` : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {cartModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.code} — {model.name}
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
        <Label htmlFor="unitGoodsCostOriginal">Custo por unidade</Label>
        <DecimalInput
          id="unitGoodsCostOriginal"
          name="unitGoodsCostOriginal"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="w-32"
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "A adicionar…" : "Adicionar item"}
      </Button>
      {error && (
        <p className="w-full text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
