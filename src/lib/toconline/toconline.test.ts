import { describe, expect, it } from "vitest";
import { buildAuthorizationUrl, isExpired } from "./oauth";
import {
  mapClientToCustomer,
  mapInvoiceToDocumentHeader,
  mapInvoiceLineToDocLine,
  round2,
} from "./mappers";
import type { TocConfig, TocTokens } from "./types";

const config: TocConfig = {
  baseUrl: "https://api10.toconline.pt",
  oauthBaseUrl: "https://app10.toconline.pt/oauth",
  clientId: "cid",
  clientSecret: "secret",
  redirectUri: "https://app.teeway.pt/api/toconline/callback",
  environment: "SANDBOX",
};

describe("buildAuthorizationUrl", () => {
  it("assembles the authorize URL with the documented params", () => {
    const url = new URL(buildAuthorizationUrl(config, "xyz-state"));
    expect(url.origin + url.pathname).toBe("https://app10.toconline.pt/oauth/auth");
    expect(url.searchParams.get("client_id")).toBe("cid");
    expect(url.searchParams.get("redirect_uri")).toBe(config.redirectUri);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("commercial");
    expect(url.searchParams.get("state")).toBe("xyz-state");
  });
});

describe("isExpired", () => {
  const base: TocTokens = {
    accessToken: "a",
    refreshToken: "r",
    scope: "commercial",
    expiresAt: null,
    obtainedAt: new Date(),
  };
  it("treats a null expiry as not expired", () => {
    expect(isExpired(base)).toBe(false);
  });
  it("flags a token within the skew window", () => {
    const soon = { ...base, expiresAt: new Date(Date.now() + 30_000) };
    expect(isExpired(soon, 60_000)).toBe(true);
  });
  it("accepts a token comfortably in the future", () => {
    const later = { ...base, expiresAt: new Date(Date.now() + 3_600_000) };
    expect(isExpired(later)).toBe(false);
  });
});

describe("mapClientToCustomer", () => {
  it("maps company + NIF and omits empty optionals", () => {
    expect(
      mapClientToCustomer({ companyName: " Eirarest, Lda ", nif: " 500100200 ", email: "" }),
    ).toEqual({ business_name: "Eirarest, Lda", tax_registration_number: "500100200" });
  });
});

describe("mapInvoiceToDocumentHeader", () => {
  it("builds a draft FT header referencing the numeric customer id", () => {
    const h = mapInvoiceToDocumentHeader(
      {
        issueDate: new Date("2026-09-11T10:00:00Z"),
        dueDate: new Date("2026-09-25T10:00:00Z"),
      },
      { toconlineId: "2" },
    );
    expect(h).toEqual({
      document_type: "FT",
      date: "2026-09-11",
      due_date: "2026-09-25",
      vat_included_prices: false,
      customer_id: 2,
    });
  });

  it("omits customer_id when no TOConline id is known", () => {
    const h = mapInvoiceToDocumentHeader({}, { toconlineId: null });
    expect(h.customer_id).toBeUndefined();
  });
});

describe("mapInvoiceLineToDocLine", () => {
  it("builds a TaxDescriptor line with document_id, rounded price and VAT code", () => {
    const line = mapInvoiceLineToDocLine(
      {
        name: "Teeway Grand 6",
        specText: "6 lugares · azul RAL 5013",
        quantity: 2,
        unitSellPriceExVat: 8130.081,
        vatRate: 23,
      },
      66,
    );
    expect(line).toEqual({
      document_id: 66,
      item_type: "TaxDescriptor",
      description: "Teeway Grand 6 — 6 lugares · azul RAL 5013",
      quantity: 2,
      unit_price: 8130.08,
      tax_code: "NOR",
      tax_percentage: 23,
      tax_country_region: "PT",
    });
  });
});

describe("round2", () => {
  it("rounds half up at the cent", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.344)).toBe(2.34);
  });
});
