import { OrderForm } from "@/components/orders/order-form";
import { createOrderAction } from "@/lib/actions/orders";

export default function NewOrderPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Nova encomenda</h1>
      <div className="mt-6">
        <OrderForm action={createOrderAction} submitLabel="Criar encomenda" />
      </div>
    </div>
  );
}
