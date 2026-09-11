import { describe, expect, it } from "vitest";
import { buildAuthorizationUrl, isExpired } from "./oauth";
import {
  mapClientToCustomer,
  mapInvoiceToSalesDocument,
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

describe("mapInvoiceToSalesDocument", () => {
  it("builds an FT with ex-VAT product lines and folds spec into the description", () => {
    const doc = mapInvoiceToSalesDocument(
      {
        issueDate: new Date("2026-09-11T10:00:00Z"),
        lines: [
          {
            name: "Teeway Grand 6",
            specText: "6 lugares · azul RAL 5013",
            quantity: 2,
            unitSellPriceExVat: 8130.081,
            vatRate: 23,
          },
        ],
      },
      { businessName: "Eirarest, Lda", nif: "500100200" },
    );

    expect(doc.document_type).toBe("FT");
    expect(doc.date).toBe("2026-09-11");
    expect(doc.vat_included_prices).toBe(false);
    expect(doc.customer_tax_registration_number).toBe("500100200");
    expect(doc.customer_id).toBeUndefined();
    expect(doc.lines).toEqual([
      {
        item_type: "Product",
        description: "Teeway Grand 6 — 6 lugares · azul RAL 5013",
        quantity: 2,
        unit_price: 8130.08,
        tax_code: "NOR",
      },
    ]);
  });

  it("prefers a known TOConline customer id when present", () => {
    const doc = mapInvoiceToSalesDocument(
      { lines: [] },
      { businessName: "X", toconlineId: "cust_42" },
    );
    expect(doc.customer_id).toBe("cust_42");
  });
});

describe("round2", () => {
  it("rounds half up at the cent", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.344)).toBe(2.34);
  });
});
