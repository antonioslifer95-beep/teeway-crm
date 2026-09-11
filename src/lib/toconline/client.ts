/**
 * TOConline REST client — JSON:API calls under `/api/<resource>`.
 *
 * Contract confirmed against the OpenAPI spec: write endpoints live at
 * `/api/customers` and `/api/commercial_sales_documents` (NO `/v1/`), and take
 * a JSON:API body `{ data: { type, attributes } }` with Content-Type
 * application/json. Given a valid access token + {@link TocConfig}, this layer
 * performs the two write calls M5 needs.
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
  resource: string,
  init: { method: string; type?: string; attributes?: unknown },
): Promise<T> {
  const body =
    init.attributes === undefined
      ? undefined
      : JSON.stringify({
          data: { type: init.type, attributes: init.attributes },
        });

  const res = await fetch(`${config.baseUrl}/api/${resource}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
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
      `TOConline ${init.method} /api/${resource} failed (${res.status})`,
      res.status,
      payload,
    );
  }
  return payload as T;
}

/**
 * Read-only probe used by the "test connection" button: a harmless GET that
 * proves the access token is accepted. Returns the HTTP status and body so the
 * UI can show what came back. Never issues anything.
 */
export async function probeConnection(
  config: TocConfig,
  accessToken: string,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(`${config.baseUrl}/api/customers`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

/** Create a customer and return its TOConline id. */
export async function createCustomer(
  config: TocConfig,
  accessToken: string,
  customer: TocCustomerRequest,
): Promise<{ id: string | null; raw: unknown }> {
  const raw = await apiRequest(config, accessToken, "customers", {
    method: "POST",
    type: "customers",
    attributes: customer,
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
    type: "commercial_sales_documents",
    attributes: doc,
  });
  return extractIssued(raw);
}

// ---- Defensive extraction ---------------------------------------------------
// Responses are JSON:API ({ data: { id, attributes } }). The success attributes
// carry the fiscal data, but the exact field names aren't published, so we
// probe likely spellings and ALWAYS return the raw body so a first real
// issuance can confirm the true names — see the M5 spike notes.

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
