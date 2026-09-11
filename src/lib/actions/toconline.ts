"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth-guard";
import {
  CONNECTION_ID,
  getFreshAccessToken,
  TocNotConfiguredError,
  TocNotConnectedError,
} from "@/lib/toconline/connection";
import {
  probeConnection,
  createCustomer,
  createSalesDocumentHeader,
  addSalesDocumentLine,
  finalizeSalesDocument,
  deleteSalesDocument,
  getSalesDocumentPdfUrl,
  getSalesDocument,
  resolveFiscalExtras,
} from "@/lib/toconline/client";
import {
  mapClientToCustomer,
  mapInvoiceToDocumentHeader,
  mapInvoiceLineToDocLine,
} from "@/lib/toconline/mappers";
import { TocApiError, type TocConfig } from "@/lib/toconline/types";

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

/**
 * Re-fetch an issued document from TOConline and refresh its stored fiscal
 * fields (official number, ATCUD, QR, PDF url). Also returns the response's
 * attribute keys, to pin down the (undocumented) fiscal field names.
 */
export async function refreshInvoiceFiscalDataAction(
  invoiceId: string,
): Promise<{ ok?: string; error?: string }> {
  await requireAuth();

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { error: "Fatura não encontrada." };
  if (!invoice.toconlineDocumentId) {
    return { error: "Esta fatura não tem documento TOConline associado." };
  }

  const conn = await connectOrMessage();
  if ("error" in conn) return conn;

  try {
    const doc = await getSalesDocument(
      conn.config,
      conn.accessToken,
      invoice.toconlineDocumentId,
    );
    const extras = await resolveFiscalExtras(conn.config, conn.accessToken, doc.raw);
    const pdfUrl =
      doc.pdfUrl ??
      extras.pdfUrl ??
      (await getSalesDocumentPdfUrl(conn.config, conn.accessToken, invoice.toconlineDocumentId));

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        toconlineOfficialNumber: doc.officialNumber ?? invoice.toconlineOfficialNumber,
        toconlineAtcud: doc.atcud ?? extras.atcud,
        toconlineQrCodeData: doc.qrCodeData,
        toconlinePdfUrl: pdfUrl,
        toconlineRawResponse: JSON.stringify(doc.raw),
      },
    });
    revalidatePath(`/invoices/${invoiceId}`);
    return {
      ok: `ATCUD ${doc.atcud ?? extras.atcud ?? "—"} · PDF ${pdfUrl ? "ok" : "—"} · ${extras.diag}`,
    };
  } catch (err) {
    if (err instanceof TocApiError) {
      return { error: `Erro da API (${err.status}). ${summarize(err.body)}` };
    }
    return { error: "Falha ao atualizar os dados fiscais." };
  }
}

// --- Invoice issuance -------------------------------------------------------

/** Resolve config+token, translating the connection errors into user messages. */
async function connectOrMessage(): Promise<
  { config: TocConfig; accessToken: string } | { error: string }
> {
  try {
    return await getFreshAccessToken();
  } catch (err) {
    if (err instanceof TocNotConfiguredError)
      return { error: "TOConline não está configurado (Definições → Integrações)." };
    if (err instanceof TocNotConnectedError)
      return { error: "TOConline não está ligado. Ligue em Definições → Integrações." };
    return { error: "Não foi possível obter um token válido do TOConline." };
  }
}

/**
 * Non-fiscal preflight: ensure the invoice's client exists as a TOConline
 * customer, storing its id. Safe to run repeatedly — it's a good way to confirm
 * the write path works before the irreversible issuance.
 */
export async function syncInvoiceClientAction(
  invoiceId: string,
): Promise<{ ok?: string; error?: string }> {
  await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true },
  });
  if (!invoice) return { error: "Fatura não encontrada." };
  if (invoice.client.toconlineCustomerId) {
    return { ok: `Cliente já sincronizado (${invoice.client.toconlineCustomerId}).` };
  }

  const conn = await connectOrMessage();
  if ("error" in conn) return conn;

  try {
    const created = await createCustomer(
      conn.config,
      conn.accessToken,
      mapClientToCustomer(invoice.client),
    );
    if (created.id) {
      await prisma.client.update({
        where: { id: invoice.client.id },
        data: { toconlineCustomerId: created.id },
      });
      revalidatePath(`/invoices/${invoiceId}`);
      return { ok: `Cliente criado no TOConline (id ${created.id}).` };
    }
    return { ok: "Cliente enviado, mas o TOConline não devolveu um id." };
  } catch (err) {
    if (err instanceof TocApiError) {
      return { error: `Erro da API (${err.status}). ${summarize(err.body)}` };
    }
    return { error: "Falha ao sincronizar o cliente." };
  }
}

/**
 * Issue the invoice as a fiscal document on TOConline. IRREVERSIBLE — the
 * document finalizes on submission and cannot be cancelled via the API. Hard
 * guards: only READY_TO_ISSUE or a prior ERROR (retry) may be issued, never one
 * that already carries a TOConline document id.
 */
export async function issueInvoiceAction(
  invoiceId: string,
): Promise<{ ok?: true; error?: string }> {
  const session = await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true, lines: { orderBy: { position: "asc" } } },
  });
  if (!invoice) return { error: "Fatura não encontrada." };

  if (invoice.toconlineDocumentId || invoice.status === "ISSUED") {
    return { error: "Esta fatura já foi emitida no TOConline." };
  }
  if (invoice.status !== "READY_TO_ISSUE" && invoice.status !== "ERROR") {
    return { error: 'A fatura tem de estar em "Pronta a emitir" antes de emitir.' };
  }
  if (invoice.lines.length === 0) {
    return { error: "A fatura não tem linhas." };
  }

  const conn = await connectOrMessage();
  if ("error" in conn) return conn;
  const { config, accessToken } = conn;

  // Track the draft so we can clean it up if a pre-finalize step fails.
  let draftId: string | null = null;
  let finalized = false;

  try {
    // 1) Ensure the customer exists on TOConline (non-fiscal), so the header
    //    can reference it by numeric id.
    let customerId = invoice.client.toconlineCustomerId;
    if (!customerId) {
      const created = await createCustomer(
        config,
        accessToken,
        mapClientToCustomer(invoice.client),
      );
      customerId = created.id;
      if (customerId) {
        await prisma.client.update({
          where: { id: invoice.client.id },
          data: { toconlineCustomerId: customerId },
        });
      }
    }
    if (!customerId) {
      return { error: "Não foi possível obter o cliente no TOConline." };
    }

    const lineInputs = invoice.lines.map((l) => ({
      name: l.name,
      specText: l.specText,
      quantity: l.quantity,
      unitSellPriceExVat: Number(l.unitSellPriceExVat),
      vatRate: Number(l.vatRate),
    }));

    // 2) Create the DRAFT header (reversible).
    const header = mapInvoiceToDocumentHeader(
      { issueDate: invoice.issueDate, dueDate: invoice.dueDate },
      { toconlineId: customerId },
    );
    const created = await createSalesDocumentHeader(config, accessToken, header);
    draftId = created.id;
    if (!draftId) {
      return { error: "O TOConline não devolveu um id de documento." };
    }

    // 3) Add each line to the draft (reversible).
    for (const line of lineInputs) {
      const lineAttrs = mapInvoiceLineToDocLine(line, draftId);
      await addSalesDocumentLine(config, accessToken, lineAttrs);
    }

    // 4) FINALIZE (irreversible). After this the document is a real FT.
    const issued = await finalizeSalesDocument(config, accessToken, draftId);
    finalized = true;

    let pdfUrl = issued.pdfUrl;
    if (!pdfUrl) {
      pdfUrl = await getSalesDocumentPdfUrl(config, accessToken, draftId);
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "ISSUED",
        toconlineDocumentId: issued.documentId ?? draftId,
        toconlineDocumentType: "FT",
        toconlineOfficialNumber: issued.officialNumber,
        toconlineAtcud: issued.atcud,
        toconlineQrCodeData: issued.qrCodeData,
        toconlinePdfUrl: pdfUrl,
        toconlineRawResponse: JSON.stringify(issued.raw),
        issuedAt: new Date(),
        issuedByUserId: session.user.id,
        lastSyncError: null,
      },
    });
  } catch (err) {
    // Clean up an unfinalized draft so no orphan documents linger. Never touch
    // a finalized (fiscal) document.
    if (draftId && !finalized) {
      await deleteSalesDocument(config, accessToken, draftId).catch(() => {});
    }
    const msg =
      err instanceof TocApiError
        ? `Erro da API (${err.status}). ${summarize(err.body)}`
        : "Falha ao emitir a fatura.";
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "ERROR", lastSyncError: msg },
    });
    revalidatePath(`/invoices/${invoiceId}`);
    return { error: msg };
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return { ok: true };
}
