import { describe, expect, it } from "vitest";
import { calculateLandedCostsForOrder, calculateSellPrice } from "./pricing";

describe("calculateLandedCostsForOrder", () => {
  it("converts a single item to EUR with no discount", () => {
    const order = {
      exchangeRateToEUR: 1,
      discountType: "NONE" as const,
      discountValue: 0,
    };
    const items = [{ unitGoodsCostOriginal: 2452, quantity: 1 }];
    const [landed] = calculateLandedCostsForOrder(order, items);
    expect(landed.toFixed(2)).toBe("2452.00");
  });

  it("applies the exchange rate", () => {
    const order = {
      exchangeRateToEUR: 0.92,
      discountType: "NONE" as const,
      discountValue: 0,
    };
    const items = [{ unitGoodsCostOriginal: 1000, quantity: 1 }];
    const [landed] = calculateLandedCostsForOrder(order, items);
    expect(landed.toFixed(2)).toBe("920.00");
  });

  it("distributes a flat discount proportionally across items by value", () => {
    const order = {
      exchangeRateToEUR: 1,
      discountType: "FLAT" as const,
      discountValue: 192,
    };
    // Matches the spreadsheet's real example: a 192€ discount on a mixed order.
    const items = [
      { unitGoodsCostOriginal: 2452, quantity: 1 }, // 2452 of 10605 total
      { unitGoodsCostOriginal: 2561, quantity: 1 },
      { unitGoodsCostOriginal: 2860, quantity: 1 },
      { unitGoodsCostOriginal: 2732, quantity: 1 },
    ];
    const totalValue = 2452 + 2561 + 2860 + 2732;
    const landed = calculateLandedCostsForOrder(order, items);

    // Each item's discount share is proportional to its value share of the total.
    items.forEach((item, i) => {
      const expectedShare = (item.unitGoodsCostOriginal / totalValue) * 192;
      const expected = item.unitGoodsCostOriginal - expectedShare;
      expect(Number(landed[i].toFixed(2))).toBeCloseTo(expected, 1);
    });

    // Discount is fully distributed: sum of landed costs = total value - discount.
    const sumLanded = landed.reduce((s, v) => s + Number(v), 0);
    expect(sumLanded).toBeCloseTo(totalValue - 192, 1);
  });

  it("applies a percent discount", () => {
    const order = {
      exchangeRateToEUR: 1,
      discountType: "PERCENT" as const,
      discountValue: 10,
    };
    const items = [{ unitGoodsCostOriginal: 1000, quantity: 2 }];
    const [landed] = calculateLandedCostsForOrder(order, items);
    // 2000 total - 10% = 1800, per unit = 900
    expect(landed.toFixed(2)).toBe("900.00");
  });

  it("handles a zero-value order without dividing by zero", () => {
    const order = {
      exchangeRateToEUR: 1,
      discountType: "NONE" as const,
      discountValue: 0,
    };
    const items = [{ unitGoodsCostOriginal: 0, quantity: 1 }];
    const [landed] = calculateLandedCostsForOrder(order, items);
    expect(landed.toFixed(2)).toBe("0.00");
  });
});

describe("calculateSellPrice", () => {
  it("chains duty, clearance, markup and VAT correctly", () => {
    const result = calculateSellPrice({
      landedCostEUR: 2452,
      customsDutyPercent: 12.3,
      clearanceFee: 150,
      markupPercent: 100,
      vatRate: 23,
    });
    // duty = 2452 * 0.123 = 301.596 -> 301.60
    expect(result.duty.toFixed(2)).toBe("301.60");
    // totalCost = 2452 + 301.60 + 150 = 2903.60
    expect(result.totalCost.toFixed(2)).toBe("2903.60");
    // sellPriceExVat = 2903.60 * 2 = 5807.20
    expect(result.sellPriceExVat.toFixed(2)).toBe("5807.20");
    // sellPriceIncVat = 5807.20 * 1.23 = 7142.856 -> 7142.86
    expect(result.sellPriceIncVat.toFixed(2)).toBe("7142.86");
  });

  it("supports a zero markup (straight cost-through pricing)", () => {
    const result = calculateSellPrice({
      landedCostEUR: 1000,
      customsDutyPercent: 0,
      clearanceFee: 0,
      markupPercent: 0,
      vatRate: 23,
    });
    expect(result.sellPriceExVat.toFixed(2)).toBe("1000.00");
    expect(result.sellPriceIncVat.toFixed(2)).toBe("1230.00");
  });
});
