import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CartModelForm } from "@/components/cart-models/cart-model-form";
import { updateCartModelAction } from "@/lib/actions/cart-models";

export default async function EditCartModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const model = await prisma.cartModel.findUnique({ where: { id } });
  if (!model) notFound();

  const boundAction = updateCartModelAction.bind(null, model.id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Editar modelo</h1>
      <div className="mt-6">
        <CartModelForm
          action={boundAction}
          defaultValues={model}
          submitLabel="Guardar alterações"
        />
      </div>
    </div>
  );
}
