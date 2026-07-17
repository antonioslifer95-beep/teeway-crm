"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { clientFormSchema } from "@/lib/validations/client";
import type { PipelineStage } from "@/generated/prisma/client";
import { PIPELINE_STAGE_LABELS } from "@/lib/pipeline";

function readClientForm(formData: FormData) {
  return clientFormSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    nif: formData.get("nif"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    addressLine: formData.get("addressLine"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    pipelineStage: formData.get("pipelineStage"),
  });
}

export async function createClientAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const session = await requireAuth();
  const parsed = readClientForm(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const data = parsed.data;
  let client;
  try {
    client = await prisma.client.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName || null,
        nif: data.nif || null,
        email: data.email || null,
        phone: data.phone || null,
        addressLine: data.addressLine || null,
        postalCode: data.postalCode || null,
        city: data.city || null,
        pipelineStage: data.pipelineStage as PipelineStage,
        ownerUserId: session.user.id,
        activities: {
          create: {
            type: "SYSTEM",
            body: `Cliente criado por ${session.user.name}.`,
            authorUserId: session.user.id,
          },
        },
      },
    });
  } catch {
    return "Não foi possível criar o cliente.";
  }

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClientAction(
  clientId: string,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAuth();
  const parsed = readClientForm(formData);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const data = parsed.data;
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        companyName: data.companyName,
        contactName: data.contactName || null,
        nif: data.nif || null,
        email: data.email || null,
        phone: data.phone || null,
        addressLine: data.addressLine || null,
        postalCode: data.postalCode || null,
        city: data.city || null,
        pipelineStage: data.pipelineStage as PipelineStage,
      },
    });
  } catch {
    return "Não foi possível guardar as alterações.";
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function updateClientStageAction(
  clientId: string,
  newStage: PipelineStage,
): Promise<{ error?: string }> {
  const session = await requireAuth();

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        pipelineStage: newStage,
        activities: {
          create: {
            type: "STAGE_CHANGE",
            body: `Fase alterada para "${PIPELINE_STAGE_LABELS[newStage]}" por ${session.user.name}.`,
            authorUserId: session.user.id,
          },
        },
      },
    });
  } catch {
    return { error: "Não foi possível atualizar a fase." };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return {};
}
