"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DecimalInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPE_VALUES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
} from "@/lib/order-labels";
import type { Order } from "@/generated/prisma/client";

type Action = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

function toDateInputValue(date?: Date | null) {
  if (!date) return new Date().toISOString().slice(0, 10);
  return new Date(date).toISOString().slice(0, 10);
}

export function OrderForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  defaultValues?: Partial<Order>;
  submitLabel: string;
}) {
  const [error, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="supplierName">Fornecedor</Label>
          <Input
            id="supplierName"
            name="supplierName"
            defaultValue={defaultValues?.supplierName ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="orderDate">Data da encomenda</Label>
          <Input
            id="orderDate"
            name="orderDate"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.orderDate)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Estado</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? "PLANNED"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue>
                {(value: string) =>
                  ORDER_STATUS_LABELS[value as keyof typeof ORDER_STATUS_LABELS]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_VALUES.map((status) => (
                <SelectItem key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="originalCurrency">Moeda do fornecedor</Label>
          <Input
            id="originalCurrency"
            name="originalCurrency"
            defaultValue={defaultValues?.originalCurrency ?? "EUR"}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="exchangeRateToEUR">Taxa de câmbio → EUR</Label>
          <DecimalInput
            id="exchangeRateToEUR"
            name="exchangeRateToEUR"
            defaultValue={defaultValues?.exchangeRateToEUR?.toString() ?? "1"}
            required
          />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="totalCostOriginal">
            Total da encomenda dado pelo fornecedor (informativo)
          </Label>
          <DecimalInput
            id="totalCostOriginal"
            name="totalCostOriginal"
            defaultValue={defaultValues?.totalCostOriginal?.toString() ?? ""}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="discountType">Desconto do fornecedor</Label>
          <Select
            name="discountType"
            defaultValue={defaultValues?.discountType ?? "NONE"}
          >
            <SelectTrigger id="discountType" className="w-full">
              <SelectValue>
                {(value: string) =>
                  DISCOUNT_TYPE_LABELS[
                    value as keyof typeof DISCOUNT_TYPE_LABELS
                  ]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DISCOUNT_TYPE_VALUES.map((type) => (
                <SelectItem key={type} value={type}>
                  {DISCOUNT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="discountValue">Valor do desconto</Label>
          <DecimalInput
            id="discountValue"
            name="discountValue"
            defaultValue={defaultValues?.discountValue?.toString() ?? "0"}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="customsDutyPercent">
            Direitos aduaneiros (%) — vazio = usar defeito
          </Label>
          <DecimalInput
            id="customsDutyPercent"
            name="customsDutyPercent"
            defaultValue={defaultValues?.customsDutyPercent?.toString() ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="flatClearanceFee">
            Desalfandegamento por unidade (€) — vazio = usar defeito
          </Label>
          <DecimalInput
            id="flatClearanceFee"
            name="flatClearanceFee"
            defaultValue={defaultValues?.flatClearanceFee?.toString() ?? ""}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            name="notes"
            className="min-h-20"
            defaultValue={defaultValues?.notes ?? ""}
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
