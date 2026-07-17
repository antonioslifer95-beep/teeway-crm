"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { updateSettingsAction } from "@/lib/actions/settings";

export function PricingForm({
  defaultValues,
}: {
  defaultValues: {
    defaultCustomsDutyPercent: string;
    defaultClearanceFee: string;
    defaultMarkupPercent: string;
    vatRate: string;
  };
}) {
  const [error, formAction, isPending] = useActionState(
    updateSettingsAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="defaultCustomsDutyPercent">
          Taxa de direitos aduaneiros por defeito (%)
        </Label>
        <DecimalInput
          id="defaultCustomsDutyPercent"
          name="defaultCustomsDutyPercent"
          defaultValue={defaultValues.defaultCustomsDutyPercent}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="defaultClearanceFee">
          Desalfandegamento por unidade por defeito (€)
        </Label>
        <DecimalInput
          id="defaultClearanceFee"
          name="defaultClearanceFee"
          defaultValue={defaultValues.defaultClearanceFee}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="defaultMarkupPercent">Margem por defeito (%)</Label>
        <DecimalInput
          id="defaultMarkupPercent"
          name="defaultMarkupPercent"
          defaultValue={defaultValues.defaultMarkupPercent}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="vatRate">Taxa de IVA (%)</Label>
        <DecimalInput
          id="vatRate"
          name="vatRate"
          defaultValue={defaultValues.vatRate}
          required
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "A guardar…" : "Guardar definições"}
      </Button>
    </form>
  );
}
