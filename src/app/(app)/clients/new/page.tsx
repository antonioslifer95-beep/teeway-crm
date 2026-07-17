import { ClientForm } from "@/components/clients/client-form";
import { createClientAction } from "@/lib/actions/clients";

export default function NewClientPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Novo cliente</h1>
      <div className="mt-6">
        <ClientForm action={createClientAction} submitLabel="Criar cliente" />
      </div>
    </div>
  );
}
