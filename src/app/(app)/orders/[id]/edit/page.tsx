import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderForm } from "@/components/orders/order-form";
import { updateOrderAction } from "@/lib/actions/orders";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  const boundAction = updateOrderAction.bind(null, order.id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        Editar encomenda {order.reference}
      </h1>
      <div className="mt-6">
        <OrderForm
          action={boundAction}
          defaultValues={order}
          submitLabel="Guardar alterações"
        />
      </div>
    </div>
  );
}
