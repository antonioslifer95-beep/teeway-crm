"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import {
  CONNECTION_ID,
  getFreshAccessToken,
  TocNotConfiguredError,
  TocNotConnectedError,
} from "@/lib/toconline/connection";
import { probeConnection } from "@/lib/toconline/client";
import { TocApiError } from "@/lib/toconline/types";

const SETTINGS_PATH = "/settings/integracoes";

const configSchema = z.object({
  apiBaseUrl: z.string().url("URL da API inválida.").trim(),
  oauthBaseUrl: z.string().url("URL de OAuth inválida.").trim(),
  clientId: z.string().min(1, "client_id em falta.").trim(),
  // Optional so re-saving other fields doesn't require re-typing the secret.
  clientSecret: z.string().trim().optional(),
  redirectUri: z.string().url("redirect_uri inválido.").trim(),
  environment: z.enum(["SANDBOX", "PRODUCTION"]),
});

/** Save the per-install app registration. Admin only. */
export async function saveConnectionConfigAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireAdmin();

  const parsed = configSchema.safeParse({
    apiBaseUrl: formData.get("apiBaseUrl"),
    oauthBaseUrl: formData.get("oauthBaseUrl"),
    clientId: formData.get("clientId"),
    clientSecret: formData.get("clientSecret") || undefined,
    redirectUri: formData.get("redirectUri"),
    environment: formData.get("environment"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos.";
  }

  const { clientSecret, ...rest } = parsed.data;
  // Only overwrite the secret when a new one is actually entered.
  const secretPatch =
    clientSecret && clientSecret.length > 0 ? { clientSecret } : {};

  try {
    await prisma.toconlineConnection.upsert({
      where: { id: CONNECTION_ID },
      update: { ...rest, ...secretPatch },
      create: { id: CONNECTION_ID, ...rest, ...secretPatch },
    });
  } catch {
    return "Não foi possível guardar a configuração.";
  }

  revalidatePath(SETTINGS_PATH);
}

/** Clear the OAuth session (keeps the app registration). Admin only. */
export async function disconnectAction(): Promise<void> {
  await requireAdmin();
  await prisma.toconlineConnection.update({
    where: { id: CONNECTION_ID },
    data: {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      scope: null,
      obtainedAt: null,
      authState: null,
    },
  });
  revalidatePath(SETTINGS_PATH);
}

/**
 * Diagnostic probe: refresh-if-needed, then a read-only GET. Returns a
 * human-readable status string (shown via useActionState). Never issues a
 * document.
 */
export async function testConnectionAction(): Promise<string> {
  await requireAdmin();
  try {
    const { config, accessToken } = await getFreshAccessToken();
    const res = await probeConnection(config, accessToken);
    if (res.ok) {
      return `OK — ligado a ${config.environment}. A API respondeu ${res.status}.`;
    }
    // Only 401 means the token was rejected. Any other status (e.g. a 404
    // "no rule found" from the gateway on the read-only probe endpoint) means
    // the token authenticated and the request reached the API — connection OK.
    if (res.status === 401) {
      return "Token recusado (401). Volte a ligar ao TOConline.";
    }
    return `Ligado — o token foi aceite (a API respondeu ${res.status} ao endpoint de teste).`;
  } catch (err) {
    if (err instanceof TocNotConfiguredError) {
      return "Configuração incompleta — preencha os URLs e as credenciais primeiro.";
    }
    if (err instanceof TocNotConnectedError) {
      return "Ainda não está ligado — clique em «Ligar ao TOConline».";
    }
    if (err instanceof TocApiError) {
      return `Erro da API (${err.status}). ${summarize(err.body)}`;
    }
    return "Falha ao contactar o TOConline.";
  }
}

function summarize(body: unknown): string {
  if (!body) return "";
  const s = typeof body === "string" ? body : JSON.stringify(body);
  return s.length > 160 ? `${s.slice(0, 160)}…` : s;
}
