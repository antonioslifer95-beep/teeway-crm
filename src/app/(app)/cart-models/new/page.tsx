import { CartModelForm } from "@/components/cart-models/cart-model-form";
import { createCartModelAction } from "@/lib/actions/cart-models";

export default function NewCartModelPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Novo modelo</h1>
      <div className="mt-6">
        <CartModelForm action={createCartModelAction} submitLabel="Criar modelo" />
      </div>
    </div>
  );
}
