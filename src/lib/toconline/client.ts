/**
 * TOConline REST client — JSON:API calls under `/api/<resource>`.
 *
 * Sales documents use a THREE-STEP flow (confirmed from TOConline's own Postman
 * collection), not a single POST:
 *   1. POST /api/commercial_sales_documents        → create a DRAFT header
 *   2. POST /api/commercial_sales_document_lines    → add each line (document_id)
 *   3. PATCH /api/commercial_sales_documents {status:1} → FINALIZE (irreversible)
 * The draft (steps 1–2) is reversible — DELETE /api/commercial_sales_documents/:id —
 * so only the finalize is permanent. Bodies are JSON:API `{data:{type,[id,]attributes}}`.
 */

import {
  type TocConfig,
  type TocCustomerRequest,
  type TocIssuedDocument,
  TocApiError,
} from "./types";

async function apiRequest<T = unknown>(
  config: TocConfig,
  accessToken: string,
  resource: string,
  init: {
    method: string;
    type?: string;
    id?: string | number;
    attributes?: unknown;
    query?: string;
  },
): Promise<T> {
  const body =
    init.attributes === undefined
      ? undefined
      : JSON.stringify({
          data: {
            type: init.type,
            ...(init.id !== undefined ? { id: String(init.id) } : {}),
            attributes: init.attributes,
          },
        });

  const res = await fetch(`${config.baseUrl}/api/${resource}${init.query ?? ""}`, {
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

/** Read-only probe (harmless GET) for the "test connection" button. */
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

// ---- Sales document (multi-step) -------------------------------------------

/** Step 1 — create a draft sales-document header. Returns its numeric id. */
export async function createSalesDocumentHeader(
  config: TocConfig,
  accessToken: string,
  attributes: Record<string, unknown>,
): Promise<{ id: string | null; raw: unknown }> {
  const raw = await apiRequest(config, accessToken, "commercial_sales_documents", {
    method: "POST",
    type: "commercial_sales_documents",
    attributes,
  });
  return { id: extractId(raw), raw };
}

/** Step 2 — add one line to a draft document (attributes carry document_id). */
export async function addSalesDocumentLine(
  config: TocConfig,
  accessToken: string,
  attributes: Record<string, unknown>,
): Promise<unknown> {
  return apiRequest(config, accessToken, "commercial_sales_document_lines", {
    method: "POST",
    type: "commercial_sales_document_lines",
    attributes,
  });
}

/**
 * Step 3 — FINALIZE the document (status → 1). IRREVERSIBLE: assigns the fiscal
 * number/ATCUD and locks it. Returns the finalized document.
 */
export async function finalizeSalesDocument(
  config: TocConfig,
  accessToken: string,
  documentId: string | number,
): Promise<TocIssuedDocument> {
  const raw = await apiRequest(config, accessToken, "commercial_sales_documents", {
    method: "PATCH",
    type: "commercial_sales_documents",
    id: documentId,
    attributes: { status: 1 },
  });
  return extractIssued(raw);
}

/** Re-fetch a document (e.g. after finalize) to read its fiscal fields. */
export async function getSalesDocument(
  config: TocConfig,
  accessToken: string,
  documentId: string | number,
): Promise<TocIssuedDocument> {
  const raw = await apiRequest(config, accessToken, `commercial_sales_documents/${documentId}`, {
    method: "GET",
  });
  return extractIssued(raw);
}

/** Delete a DRAFT document — cleanup when line-adding/finalize fails. Never call
 *  on a finalized (fiscal) document. Best-effort. */
export async function deleteSalesDocument(
  config: TocConfig,
  accessToken: string,
  documentId: string | number,
): Promise<void> {
  await fetch(`${config.baseUrl}/api/commercial_sales_documents/${documentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
}

/** Fetch the printable PDF URL for a finalized document. Best-effort. */
export async function getSalesDocumentPdfUrl(
  config: TocConfig,
  accessToken: string,
  documentId: string | number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${config.baseUrl}/api/url_for_print/${documentId}?filter[type]=Document`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
    const text = await res.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : text;
    } catch {
      body = text;
    }
    return findUrl(body);
  } catch {
    return null;
  }
}

// ---- Response extraction ----------------------------------------------------

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
    documentId: pick(o, ["id"]),
    officialNumber: pick(o, [
      "document_no",
      "company_document_no",
      "document_number",
      "number",
    ]),
    atcud: pick(o, ["atcud", "at_cud", "atcud_code", "at_document_code"]),
    qrCodeData: pick(o, [
      "qr_code_data",
      "qr_code",
      "qrcode",
      "qr",
      "qr_code_str",
      "qr_code_string",
      "qrcode_data",
      "saft_hash",
    ]),
    pdfUrl: pick(o, ["pdf_url", "public_pdf_url", "download_url", "pdf"]),
    raw,
  };
}

/** All top-level attribute keys of a document response — used to discover the
 *  real (undocumented) fiscal field names during setup. */
export function documentAttributeKeys(raw: unknown): string[] {
  const o = unwrap(raw);
  return Object.keys(o);
}

function findUrl(body: unknown): string | null {
  if (typeof body === "string" && /^https?:\/\//.test(body)) return body;
  if (body && typeof body === "object") {
    for (const v of Object.values(body as Record<string, unknown>)) {
      const u = findUrl(v);
      if (u) return u;
    }
  }
  return null;
}
