/**
 * TOConline REST client — authenticated calls against `/api/v1/*`.
 *
 * Given a valid access token + {@link TocConfig}, performs the two write calls
 * M5 needs: create/find a customer and issue a sales document. Token acquisition
 * and refresh live in oauth.ts; this layer assumes it is handed a live token
 * (the server-action layer refreshes-then-calls).
 */

import {
  type TocConfig,
  type TocCustomerRequest,
  type TocSalesDocumentRequest,
  type TocIssuedDocument,
  TocApiError,
} from "./types";

async function apiRequest<T = unknown>(
  config: TocConfig,
  accessToken: string,
  path: string,
  init: { method: string; body?: unknown },
): Promise<T> {
  const res = await fetch(`${config.baseUrl}/api/v1/${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  const text = await res.text();
  let payload: unknown = undefined;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    throw new TocApiError(
      `TOConline ${init.method} ${path} failed (${res.status})`,
      res.status,
      payload,
    );
  }
  return payload as T;
}

/**
 * Create a customer and return its TOConline id. NOTE: the docs say the API
 * auto-creates an empty main address that must then be PATCHed with the real
 * address; we store the id now and defer address enrichment to a follow-up
 * (the invoice only needs business_name + NIF to issue).
 */
export async function createCustomer(
  config: TocConfig,
  accessToken: string,
  customer: TocCustomerRequest,
): Promise<{ id: string | null; raw: unknown }> {
  const raw = await apiRequest(config, accessToken, "commercial_customers", {
    method: "POST",
    body: customer,
  });
  return { id: extractId(raw), raw };
}

/**
 * Issue a sales document (FT/FS/FR). This is IRREVERSIBLE on the TOConline side
 * — the document finalizes on submission with no API to edit or cancel it. The
 * caller must have had the user review the invoice first.
 */
export async function issueSalesDocument(
  config: TocConfig,
  accessToken: string,
  doc: TocSalesDocumentRequest,
): Promise<TocIssuedDocument> {
  const raw = await apiRequest(config, accessToken, "commercial_sales_documents", {
    method: "POST",
    body: doc,
  });
  return extractIssued(raw);
}

// ---- Defensive extraction ---------------------------------------------------
// The public docs don't publish the success-response schema, so we probe the
// field names the API is *likely* to use (JSON:API `data.attributes`, or a flat
// body) across a few spellings, and ALWAYS return the raw body so a first real
// issuance can confirm the true names — see the M5 spike notes. Adjust the
// candidate lists once verified rather than trusting them blindly.

function unwrap(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const data = obj.data;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      const attrs = d.attributes;
      if (attrs && typeof attrs === "object") {
        return { ...(attrs as Record<string, unknown>), id: d.id };
      }
      return d;
    }
    return obj;
  }
  return {};
}

function pick(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return null;
}

function extractId(raw: unknown): string | null {
  return pick(unwrap(raw), ["id", "document_id", "customer_id"]);
}

function extractIssued(raw: unknown): TocIssuedDocument {
  const o = unwrap(raw);
  return {
    documentId: pick(o, ["id", "document_id"]),
    officialNumber: pick(o, [
      "document_number",
      "document_no",
      "number",
      "official_number",
    ]),
    atcud: pick(o, ["atcud", "at_cud"]),
    qrCodeData: pick(o, ["qr_code_data", "qr_code", "qrcode", "qr"]),
    pdfUrl: pick(o, ["pdf_url", "public_pdf_url", "download_url", "pdf"]),
    raw,
  };
}
