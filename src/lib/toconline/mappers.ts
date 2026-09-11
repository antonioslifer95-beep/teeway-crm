/**
 * Map the CRM's own records onto TOConline API payloads.
 *
 * Pure and Prisma-agnostic: inputs are minimal structural shapes (money as
 * `number`, already converted from `Prisma.Decimal` at the call site), so these
 * are trivially unit-testable without a DB or live API. Field names are the
 * verified ones from the docs + reference library.
 */

import { type TocCustomerRequest, type TocDocumentType } from "./types";

export interface ClientInput {
  companyName: string;
  contactName?: string | null;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface InvoiceLineInput {
  name: string;
  specText?: string | null;
  quantity: number;
  /** Unit price EXCLUDING VAT, in EUR. */
  unitSellPriceExVat: number;
  /** VAT percent, e.g. 23. */
  vatRate: number;
}

export interface InvoiceInput {
  documentType?: TocDocumentType;
  /** Invoice issue date; defaults to today if absent. */
  issueDate?: Date | null;
  dueDate?: Date | null;
  lines: InvoiceLineInput[];
}

/** ISO `YYYY-MM-DD` in UTC — TOConline expects a plain calendar date. */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function mapClientToCustomer(client: ClientInput): TocCustomerRequest {
  const req: TocCustomerRequest = { business_name: client.companyName.trim() };
  if (client.nif?.trim()) req.tax_registration_number = client.nif.trim();
  if (client.contactName?.trim()) req.contact_name = client.contactName.trim();
  if (client.email?.trim()) req.email = client.email.trim();
  if (client.phone?.trim()) req.phone_number = client.phone.trim();
  return req;
}

/** Map a VAT percentage to TOConline's incidence code (mainland PT rates). */
export function vatRateToTaxCode(rate: number): string {
  if (rate <= 0) return "ISE"; // isento
  if (rate <= 6) return "RED"; // reduzida
  if (rate <= 13) return "INT"; // intermédia
  return "NOR"; // normal (23%)
}

/**
 * Step 1 payload — the draft document HEADER (no lines). The customer is
 * referenced by its numeric TOConline id (created beforehand via /api/customers).
 */
export function mapInvoiceToDocumentHeader(
  invoice: Omit<InvoiceInput, "lines">,
  customer: { toconlineId?: string | null },
): Record<string, unknown> {
  const header: Record<string, unknown> = {
    document_type: invoice.documentType ?? "FT",
    date: isoDate(invoice.issueDate ?? new Date()),
    // Prices are entered ex-VAT in the CRM; TOConline adds VAT per line.
    vat_included_prices: false,
  };
  if (invoice.dueDate) header.due_date = isoDate(invoice.dueDate);
  const id = customer.toconlineId ? Number(customer.toconlineId) : NaN;
  if (Number.isFinite(id)) header.customer_id = id;
  return header;
}

/**
 * Step 2 payload — one free-text line attached to a draft document. Billed as a
 * TaxDescriptor (free description, no catalog item), VAT by incidence code +
 * percentage + region, matching TOConline's own line records.
 */
export function mapInvoiceLineToDocLine(
  line: InvoiceLineInput,
  documentId: string | number,
): Record<string, unknown> {
  const description = line.specText?.trim()
    ? `${line.name.trim()} — ${line.specText.trim()}`
    : line.name.trim();
  return {
    document_id: Number(documentId),
    item_type: "TaxDescriptor",
    description,
    quantity: line.quantity,
    unit_price: round2(line.unitSellPriceExVat),
    tax_code: vatRateToTaxCode(line.vatRate),
    tax_percentage: line.vatRate,
    tax_country_region: "PT",
  };
}

/** Round to cents, avoiding binary float drift (e.g. 1.005 -> 1.01). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
