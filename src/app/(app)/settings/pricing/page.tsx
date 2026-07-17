import { requireAdmin } from "@/lib/auth-guard";
import { getSettings } from "@/lib/settings";
import { PricingForm } from "@/components/settings/pricing-form";

export default async function PricingSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        Definições de preços
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Estes valores são os defaults usados no cálculo de preços de venda.
        Podem ser substituídos por encomenda ou por linha de orçamento.
      </p>
      <div className="mt-6">
        <PricingForm
          key={settings.updatedAt.toISOString()}
          defaultValues={{
            defaultCustomsDutyPercent:
              settings.defaultCustomsDutyPercent.toString(),
            defaultClearanceFee: settings.defaultClearanceFee.toString(),
            defaultMarkupPercent: settings.defaultMarkupPercent.toString(),
            vatRate: settings.vatRate.toString(),
          }}
        />
      </div>
    </div>
  );
}
