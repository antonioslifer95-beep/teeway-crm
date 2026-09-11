/**
 * Map the CRM's own records onto TOConline API payloads.
 *
 * Pure and Prisma-agnostic: inputs are minimal structural shapes (money as
 * `number`, already converted from `Prisma.Decimal` at the call site), so these
 * are trivially unit-testable without a DB or live API. Field names are the
 * verified ones from the docs + reference library.
 */

import {
  type TocCustomerRequest,
  type TocSalesDocumentRequest,
  type TocSalesLine,
  type TocDocumentType,
} from "./types";

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

function mapLine(line: InvoiceLineInput): TocSalesLine {
  // Cart/accessory lines are goods; everything is billed as a Product. The
  // description carries the spec text so the fiscal document reads like the
  // CRM's own invoice PDF.
  const description = line.specText?.trim()
    ? `${line.name.trim()} — ${line.specText.trim()}`
    : line.name.trim();
  return {
    item_type: "Product",
    description,
    quantity: line.quantity,
    unit_price: round2(line.unitSellPriceExVat),
    tax_code: vatRateToTaxCode(line.vatRate),
  };
}

/** Map a VAT percentage to TOConline's incidence code (mainland PT rates). */
export function vatRateToTaxCode(rate: number): string {
  if (rate <= 0) return "ISE"; // isento
  if (rate <= 6) return "RED"; // reduzida
  if (rate <= 13) return "INT"; // intermédia
  return "NOR"; // normal (23%)
}

export function mapInvoiceToSalesDocument(
  invoice: InvoiceInput,
  customer: { businessName: string; nif?: string | null; toconlineId?: string | null },
): TocSalesDocumentRequest {
  const doc: TocSalesDocumentRequest = {
    document_type: invoice.documentType ?? "FT",
    date: isoDate(invoice.issueDate ?? new Date()),
    customer_business_name: customer.businessName.trim(),
    // Prices are entered ex-VAT in the CRM; let TOConline add VAT per line.
    vat_included_prices: false,
    lines: invoice.lines.map(mapLine),
  };
  if (invoice.dueDate) doc.due_date = isoDate(invoice.dueDate);
  if (customer.toconlineId) doc.customer_id = customer.toconlineId;
  if (customer.nif?.trim()) doc.customer_tax_registration_number = customer.nif.trim();
  return doc;
}

/** Round to cents, avoiding binary float drift (e.g. 1.005 -> 1.01). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
