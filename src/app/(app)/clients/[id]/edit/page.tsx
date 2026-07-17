import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientForm } from "@/components/clients/client-form";
import { updateClientAction } from "@/lib/actions/clients";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const boundAction = updateClientAction.bind(null, client.id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        Editar cliente
      </h1>
      <div className="mt-6">
        <ClientForm
          action={boundAction}
          defaultValues={client}
          submitLabel="Guardar alterações"
        />
      </div>
    </div>
  );
}
