/**
 * TOConline API — shared types.
 *
 * M5 (fiscal-invoicing integration). Grounded in the public docs
 * (api-docs.toconline.pt) plus the dmp593/django-toconline reference library.
 * Everything the docs leave as a placeholder — base URLs, client_id/secret,
 * redirect_uri — is per-install and supplied at runtime via {@link TocConfig},
 * so this module never hard-codes an environment and can target a test tenant
 * or production purely by the config it's handed.
 *
 * VERIFIED (docs + reference lib):
 *  - OAuth: authorization-code flow, `<oauth>/auth` + `<oauth>/token`,
 *    client_id:secret via HTTP Basic, access token ~4h, refresh token issued.
 *  - Sales doc: POST `/api/v1/commercial_sales_documents`, document_type
 *    FT|FS|FR, lines[] of {item_type, description, quantity, unit_price}.
 *  - Customer: business_name + tax_registration_number (address created empty,
 *    then updated).
 *
 * UNVERIFIED (no public sample — must be confirmed on the first real call,
 * see the marked spots in client.ts): the exact response field names carrying
 * the official number / ATCUD / QR / PDF, and the PDF-retrieval endpoint.
 */

export type TocEnvironment = "SANDBOX" | "PRODUCTION";

/** Per-install connection config. None of this is committed to the repo. */
export interface TocConfig {
  /** API host, no trailing `/api` — e.g. `https://api10.toconline.pt`. */
  baseUrl: string;
  /** OAuth host — e.g. `https://app10.toconline.pt/oauth`. Test tenants can
   *  expose OAuth on a different host than the API, so it is separate. */
  oauthBaseUrl: string;
  clientId: string;
  clientSecret: string;
  /** Must exactly match a redirect URI registered on the TOConline API app. */
  redirectUri: string;
  /** Labels which tenant this config points at; gates irreversible issuance. */
  environment: TocEnvironment;
}

/** OAuth scope — only `commercial` is documented. */
export const TOC_SCOPE = "commercial";

/** Raw token payload returned by `<oauth>/token`. */
export interface TocTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  /** Seconds until expiry; docs state ~4h (14400). */
  expires_in?: number;
  scope?: string;
}

/** Normalized token set for persistence in `ToconlineConnection`. */
export interface TocTokens {
  accessToken: string;
  refreshToken: string | null;
  scope: string | null;
  /** Absolute expiry, derived from `expires_in` at acquisition time. */
  expiresAt: Date | null;
  obtainedAt: Date;
}

export type TocDocumentType = "FT" | "FS" | "FR";
export type TocItemType = "Service" | "Product" | "TaxDescriptor";

export interface TocSalesLine {
  item_type: TocItemType;
  description: string;
  quantity: number;
  unit_price: number;
  /** VAT percent, e.g. 23. Omitted when an exemption reason is used. */
  tax_percentage?: number;
  tax_exemption_reason_id?: string;
}

export interface TocSalesDocumentRequest {
  document_type: TocDocumentType;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  due_date?: string;
  customer_business_name: string;
  customer_tax_registration_number?: string;
  /** TOConline customer id, when the client is already synced. */
  customer_id?: string;
  /** true => unit_price already includes VAT. */
  vat_included_prices?: boolean;
  lines: TocSalesLine[];
}

export interface TocCustomerRequest {
  business_name: string;
  tax_registration_number?: string;
  email?: string;
  phone?: string;
}

/**
 * Fiscal data extracted (best-effort) from an issuance response. Fields are
 * optional because the exact response shape is unverified until the first real
 * issuance; the raw response is always kept alongside so nothing is lost.
 */
export interface TocIssuedDocument {
  documentId: string | null;
  officialNumber: string | null;
  atcud: string | null;
  qrCodeData: string | null;
  pdfUrl: string | null;
  /** The untouched response body, for auditing + filling gaps in the mapping. */
  raw: unknown;
}

/** Typed error so callers can distinguish auth / validation / transport. */
export class TocApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "TocApiError";
  }
}
