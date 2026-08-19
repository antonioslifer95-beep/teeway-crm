import { Prisma } from "@/generated/prisma/client";

const D = Prisma.Decimal;
export type Decimal = Prisma.Decimal;
type DecimalInput = Decimal | number | string;

export interface OrderForPricing {
  exchangeRateToEUR: DecimalInput;
  discountType: "NONE" | "FLAT" | "PERCENT";
  discountValue: DecimalInput;
  // Total shipment transport in the supplier's currency; split evenly per cart.
  // Optional so older callers/tests without transport still behave (treated 0).
  transportCostOriginal?: DecimalInput;
}

export interface OrderItemForPricing {
  unitGoodsCostOriginal: DecimalInput;
  // Optional per-cart accessory cost in the supplier's currency (default 0).
  extraCostOriginal?: DecimalInput;
  quantity: number;
}

/**
 * CIF landed cost per unit in EUR for every item in an order, matching the
 * "Cálculo Interno" spreadsheet: goods + extra accessory + a per-cart share of
 * the shipment's transport = the CIF value customs duty is charged on.
 *
 * Steps (all in the supplier's currency, converted to EUR at the very end):
 *   merchandise_line   = (goods + extra) × quantity
 *   discount is distributed across items by their merchandise-value share
 *   transport_per_unit = total_transport / total_carts   (even split by cart)
 *   cif_per_unit       = discounted_merchandise_per_unit + transport_per_unit
 *
 * Returned array is index-aligned with `items`. Duty is then applied to this
 * value in calculateSellPrice, so duty lands on CIF, not on the goods alone.
 */
export function calculateLandedCostsForOrder(
  order: OrderForPricing,
  items: OrderItemForPricing[],
): Decimal[] {
  // Merchandise = goods + optional extra accessory, per line (× quantity).
  const lineValues = items.map((item) =>
    new D(item.unitGoodsCostOriginal)
      .add(new D(item.extraCostOriginal ?? 0))
      .mul(item.quantity),
  );
  const totalMerchValue = lineValues.reduce((sum, v) => sum.add(v), new D(0));

  let totalDiscount = new D(0);
  if (order.discountType === "FLAT") {
    totalDiscount = new D(order.discountValue);
  } else if (order.discountType === "PERCENT") {
    totalDiscount = totalMerchValue.mul(new D(order.discountValue)).div(100);
  }

  const totalCarts = items.reduce((sum, item) => sum + item.quantity, 0);
  const transportPerUnit =
    totalCarts > 0
      ? new D(order.transportCostOriginal ?? 0).div(totalCarts)
      : new D(0);

  const exchangeRate = new D(order.exchangeRateToEUR);

  return items.map((item, i) => {
    const lineValue = lineValues[i];
    const discountShare = totalMerchValue.isZero()
      ? new D(0)
      : lineValue.div(totalMerchValue).mul(totalDiscount);
    const discountedMerchPerUnit = lineValue.sub(discountShare).div(item.quantity);
    const cifPerUnitOriginal = discountedMerchPerUnit.add(transportPerUnit);
    return cifPerUnitOriginal.mul(exchangeRate).toDecimalPlaces(2);
  });
}

export interface OrderItemCostBreakdown {
  /** Goods + this cart's transport share, post-discount, in EUR. */
  baseLandedEUR: Decimal;
  /** The per-cart extra/accessory, post-discount, in EUR (0 if none). */
  extraLandedEUR: Decimal;
}

/**
 * Same landed-cost logic as calculateLandedCostsForOrder, but split into the
 * base cart (goods + transport) and the extra accessory separately, so a quote
 * can bill the accessory on its own line while the base cart keeps the price it
 * would have with no extra. `baseLandedEUR + extraLandedEUR` equals the item's
 * CIF (to the cent). Index-aligned with `items`.
 */
export function calculateOrderItemCostBreakdown(
  order: OrderForPricing,
  items: OrderItemForPricing[],
): OrderItemCostBreakdown[] {
  const lineValues = items.map((item) =>
    new D(item.unitGoodsCostOriginal)
      .add(new D(item.extraCostOriginal ?? 0))
      .mul(item.quantity),
  );
  const totalMerchValue = lineValues.reduce((sum, v) => sum.add(v), new D(0));

  let totalDiscount = new D(0);
  if (order.discountType === "FLAT") {
    totalDiscount = new D(order.discountValue);
  } else if (order.discountType === "PERCENT") {
    totalDiscount = totalMerchValue.mul(new D(order.discountValue)).div(100);
  }

  const totalCarts = items.reduce((sum, item) => sum + item.quantity, 0);
  const transportPerUnit =
    totalCarts > 0
      ? new D(order.transportCostOriginal ?? 0).div(totalCarts)
      : new D(0);

  const exchangeRate = new D(order.exchangeRateToEUR);

  return items.map((item, i) => {
    const goods = new D(item.unitGoodsCostOriginal);
    const extra = new D(item.extraCostOriginal ?? 0);
    const merchPerUnit = goods.add(extra);

    // The discount reduces this item's merchandise proportionally; apply the
    // same ratio to goods and extra so the split still sums to the discounted CIF.
    const discountShare = totalMerchValue.isZero()
      ? new D(0)
      : lineValues[i].div(totalMerchValue).mul(totalDiscount);
    const discountedMerchPerUnit = lineValues[i]
      .sub(discountShare)
      .div(item.quantity);
    const ratio = merchPerUnit.isZero()
      ? new D(0)
      : discountedMerchPerUnit.div(merchPerUnit);

    const baseLandedEUR = goods
      .mul(ratio)
      .add(transportPerUnit)
      .mul(exchangeRate)
      .toDecimalPlaces(2);
    const extraLandedEUR = extra
      .mul(ratio)
      .mul(exchangeRate)
      .toDecimalPlaces(2);

    return { baseLandedEUR, extraLandedEUR };
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
