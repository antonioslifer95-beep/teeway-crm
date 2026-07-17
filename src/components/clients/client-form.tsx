"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_VALUES } from "@/lib/pipeline";
import type { Client } from "@/generated/prisma/client";

type Action = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

export function ClientForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  defaultValues?: Partial<Client>;
  submitLabel: string;
}) {
  const [error, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="companyName">Nome / Empresa</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={defaultValues?.companyName ?? ""}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactName">Pessoa de contacto</Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={defaultValues?.contactName ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nif">NIF</Label>
          <Input id="nif" name="nif" defaultValue={defaultValues?.nif ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={defaultValues?.phone ?? ""}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="addressLine">Morada</Label>
          <Input
            id="addressLine"
            name="addressLine"
            defaultValue={defaultValues?.addressLine ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="postalCode">Código-postal</Label>
          <Input
            id="postalCode"
            name="postalCode"
            defaultValue={defaultValues?.postalCode ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">Localidade</Label>
          <Input id="city" name="city" defaultValue={defaultValues?.city ?? ""} />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="pipelineStage">Fase</Label>
          <Select
            name="pipelineStage"
            defaultValue={defaultValues?.pipelineStage ?? "LEAD"}
          >
            <SelectTrigger id="pipelineStage" className="w-full">
              <SelectValue>
                {(value: string) =>
                  PIPELINE_STAGE_LABELS[value as keyof typeof PIPELINE_STAGE_LABELS]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGE_VALUES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {PIPELINE_STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
