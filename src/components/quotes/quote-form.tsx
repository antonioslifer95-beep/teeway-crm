"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Quote } from "@/generated/prisma/client";

type Action = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

type ClientOption = { id: string; companyName: string };

function toDateInputValue(date?: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function QuoteForm({
  action,
  clients,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  clients: ClientOption[];
  defaultValues?: Partial<Quote>;
  submitLabel: string;
}) {
  const [error, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="clientId">Cliente</Label>
        <Select name="clientId" defaultValue={defaultValues?.clientId ?? undefined}>
          <SelectTrigger id="clientId" className="w-full">
            <SelectValue placeholder="Escolher cliente">
              {(value: string) => {
                if (!value) return "Escolher cliente";
                return clients.find((c) => c.id === value)?.companyName ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="validUntil">
          Válido até — vazio = 30 dias a partir de hoje
        </Label>
        <Input
          id="validUntil"
          name="validUntil"
          type="date"
          defaultValue={toDateInputValue(defaultValues?.validUntil)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="deliveryTerms">Condições de entrega</Label>
        <Textarea
          id="deliveryTerms"
          name="deliveryTerms"
          className="min-h-16"
          defaultValue={
            defaultValues?.deliveryTerms ??
            "Mercadoria entregue CIF Porto (Cost, Insurance & Freight). Prazo de entrega a confirmar."
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="paymentTerms">Condições de pagamento</Label>
        <Textarea
          id="paymentTerms"
          name="paymentTerms"
          className="min-h-16"
          defaultValue={
            defaultValues?.paymentTerms ??
            "A acordar. Dados bancários fornecidos na confirmação da encomenda."
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notas internas</Label>
        <Textarea
          id="notes"
          name="notes"
          className="min-h-16"
          defaultValue={defaultValues?.notes ?? ""}
        />
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
