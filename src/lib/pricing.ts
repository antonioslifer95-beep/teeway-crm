import { Prisma } from "@/generated/prisma/client";

const D = Prisma.Decimal;
export type Decimal = Prisma.Decimal;
type DecimalInput = Decimal | number | string;

export interface OrderForPricing {
  exchangeRateToEUR: DecimalInput;
  discountType: "NONE" | "FLAT" | "PERCENT";
  discountValue: DecimalInput;
}

export interface OrderItemForPricing {
  unitGoodsCostOriginal: DecimalInput;
  quantity: number;
}

/**
 * Landed cost per unit in EUR for every item in an order: the producer's
 * order-level discount (if any) is distributed proportionally across items
 * by their share of the total order value, then converted to EUR using the
 * order's exchange rate. Returned array is index-aligned with `items`.
 *
 * The producer's proforma already bundles goods + shipping into one cost
 * per item — this function does NOT add freight, only discount + FX.
 */
export function calculateLandedCostsForOrder(
  order: OrderForPricing,
  items: OrderItemForPricing[],
): Decimal[] {
  const lineValues = items.map((item) =>
    new D(item.unitGoodsCostOriginal).mul(item.quantity),
  );
  const totalOrderValue = lineValues.reduce(
    (sum, v) => sum.add(v),
    new D(0),
  );

  let totalDiscount = new D(0);
  if (order.discountType === "FLAT") {
    totalDiscount = new D(order.discountValue);
  } else if (order.discountType === "PERCENT") {
    totalDiscount = totalOrderValue.mul(new D(order.discountValue)).div(100);
  }

  const exchangeRate = new D(order.exchangeRateToEUR);

  return items.map((item, i) => {
    const lineValue = lineValues[i];
    const discountShare = totalOrderValue.isZero()
      ? new D(0)
      : lineValue.div(totalOrderValue).mul(totalDiscount);
    const discountedLineValue = lineValue.sub(discountShare);
    const discountedUnitCost = discountedLineValue.div(item.quantity);
    return discountedUnitCost.mul(exchangeRate).toDecimalPlaces(2);
  });
}

export interface SellPriceInputs {
  landedCostEUR: DecimalInput;
  customsDutyPercent: DecimalInput;
  clearanceFee: DecimalInput;
  markupPercent: DecimalInput;
  vatRate: DecimalInput;
}

export interface SellPriceResult {
  duty: Decimal;
  totalCost: Decimal;
  sellPriceExVat: Decimal;
  sellPriceIncVat: Decimal;
}

/**
 * landed_cost + duty% + flat_clearance_fee = total_cost
 * total_cost * (1 + markup%)               = sell_price_ex_vat
 * sell_price_ex_vat * (1 + vat_rate)        = sell_price_inc_vat
 */
export function calculateSellPrice(inputs: SellPriceInputs): SellPriceResult {
  const landedCost = new D(inputs.landedCostEUR);
  const duty = landedCost
    .mul(new D(inputs.customsDutyPercent))
    .div(100)
    .toDecimalPlaces(2);
  const clearance = new D(inputs.clearanceFee);
  const totalCost = landedCost.add(duty).add(clearance).toDecimalPlaces(2);

  const sellPriceExVat = totalCost
    .mul(new D(1).add(new D(inputs.markupPercent).div(100)))
    .toDecimalPlaces(2);

  const sellPriceIncVat = sellPriceExVat
    .mul(new D(1).add(new D(inputs.vatRate).div(100)))
    .toDecimalPlaces(2);

  return { duty, totalCost, sellPriceExVat, sellPriceIncVat };
}
