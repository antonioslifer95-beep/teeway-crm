/**
 * Portuguese fiscal QR-code string (Portaria 195/2020), built from TOConline's
 * own finalized-document values so it matches the certified document byte-for-byte.
 *
 * Fields are `Key:Value` joined by `*`. We include only the fields that apply.
 * Amounts use a dot decimal separator with 2 places. The document hash (Q) and
 * the VAT bases/amounts come straight from TOConline's document response; the
 * software-certificate number (R) is TOConline's, printed on every certified
 * document as "Processado por programa certificado nº 1662/AT".
 */

/** Issuer NIF — Credible Legion Unipessoal Lda (Teeway). Per-install constant. */
export const ISSUER_NIF = "519512561";
/** TOConline's AT software-certificate number (the QR "R" field). */
export const TOCONLINE_AT_CERT = "1662";

function toAmount(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function toStr(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() || undefined;
  if (v != null) return String(v);
  return undefined;
}

/**
 * Build the AT QR string from a finalized document's attributes (the object
 * inside `data.attributes` of the sales-document GET) plus the ATCUD. Returns
 * null if the document isn't finalized enough to have a hash/number yet.
 */
export function buildFiscalQrFromDocument(
  attrs: Record<string, unknown>,
  atcud: string | null,
): string | null {
  const docNo = toStr(attrs.document_no);
  const hash = toStr(attrs.hash_control);
  const date = toStr(attrs.date);
  if (!docNo || !hash || !date) return null;

  const f = (n: number | undefined) => (n ?? 0).toFixed(2);
  const yyyymmdd = date.replace(/-/g, "").slice(0, 8);

  const exemptBase = toAmount(attrs.vat_incidence_ise);
  const redBase = toAmount(attrs.vat_incidence_red);
  const redVat = toAmount(attrs.vat_total_red);
  const intBase = toAmount(attrs.vat_incidence_int);
  const intVat = toAmount(attrs.vat_total_int);
  const norBase = toAmount(attrs.vat_incidence_nor);
  const norVat = toAmount(attrs.vat_total_nor);
  const totalTaxes = toAmount(attrs.tax_payable) ?? 0;
  const totalWithTax = toAmount(attrs.gross_total) ?? 0;

  const parts: string[] = [
    `A:${ISSUER_NIF}`,
    `B:${toStr(attrs.customer_tax_registration_number) || "999999990"}`,
    `C:${toStr(attrs.customer_country) || "PT"}`,
    `D:${toStr(attrs.document_type) || "FT"}`,
    `E:N`,
    `F:${yyyymmdd}`,
    `G:${docNo}`,
    `H:${atcud || "0"}`,
    // Tax space: PT mainland unless the document says otherwise.
    `I1:${toStr(attrs.customer_tax_country_region) || "PT"}`,
  ];
  if (exemptBase) parts.push(`I2:${f(exemptBase)}`);
  if (redBase) {
    parts.push(`I3:${f(redBase)}`, `I4:${f(redVat)}`);
  }
  if (intBase) {
    parts.push(`I5:${f(intBase)}`, `I6:${f(intVat)}`);
  }
  if (norBase) {
    parts.push(`I7:${f(norBase)}`, `I8:${f(norVat)}`);
  }
  parts.push(
    `N:${f(totalTaxes)}`,
    `O:${f(totalWithTax)}`,
    `Q:${hash}`,
    `R:${TOCONLINE_AT_CERT}`,
  );
  return parts.join("*");
}
