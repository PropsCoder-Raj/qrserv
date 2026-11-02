import { roundTo2 } from './formatCurrency.js';

/**
 * Splits a single line's gross amount into taxable net base and tax amounts.
 * - Inclusive tax is extracted: base = gross / (1 + sum(rates)/100).
 * - Exclusive tax is added on top of the base.
 * Ensures that base + taxes sum exactly to gross for inclusive, without floating-point error.
 */
const splitLineItem = (gross, parts) => {
  const active = parts.filter((p) => p.rate > 0);
  const inclusiveParts = active.filter((p) => p.inclusive);
  const inclusiveRate = inclusiveParts.reduce((sum, p) => sum + p.rate, 0);
  const base = inclusiveRate > 0 ? roundTo2(gross / (1 + inclusiveRate / 100)) : gross;
  const amounts = { gst: 0, vat: 0 };

  const inclusiveTotal = roundTo2(gross - base);
  let allocated = 0;
  inclusiveParts.forEach((p, idx) => {
    const isLast = idx === inclusiveParts.length - 1;
    const amount = isLast
      ? roundTo2(inclusiveTotal - allocated)
      : roundTo2((base * p.rate) / 100);
    amounts[p.key] = amount;
    allocated = roundTo2(allocated + amount);
  });

  active
    .filter((p) => !p.inclusive)
    .forEach((p) => {
      amounts[p.key] = roundTo2((base * p.rate) / 100);
    });

  return { base, gstAmount: amounts.gst, vatAmount: amounts.vat };
};

/**
 * Resolves item-level tax rates matching backend orders.service.ts logic.
 * If the item has explicit tax rates, use them.
 * Otherwise, fall back by item type (liquor -> vatRate, other -> taxRate/gst).
 */
export const resolveItemTaxRates = (item, fallback = {}) => {
  const hasExplicitGst = item?.gstRate != null && Number(item.gstRate) >= 0;
  const hasExplicitVat = item?.vatRate != null && Number(item.vatRate) >= 0;

  let gstRate = 0;
  let vatRate = 0;

  // Resolve GST rate
  if (hasExplicitGst) {
    gstRate = Number(item.gstRate);
  } else if (fallback.taxEnabled) {
    gstRate = item?.itemType === 'liquor' ? 0 : Number(fallback.taxRate) || 0;
  }

  // Resolve VAT rate
  if (hasExplicitVat) {
    vatRate = Number(item.vatRate);
  } else if (fallback.vatEnabled) {
    vatRate = Number(fallback.vatRate) || 0;
  }

  return { gstRate, vatRate };
};

/**
 * Groups lines by tax rate for itemized tax reporting.
 */
const groupTaxByRate = (lines, rateKey, amountKey, taxType) => {
  const groups = new Map();
  for (const line of lines) {
    const rate = line[rateKey];
    if (!(rate > 0)) continue;
    const group = groups.get(rate) || {
      rate,
      taxType,
      base: 0,
      taxAmount: 0,
      items: [],
    };
    group.base = roundTo2(group.base + line.taxableBase);
    group.taxAmount = roundTo2(group.taxAmount + line[amountKey]);
    if (line.name && !group.items.includes(line.name)) {
      group.items.push(line.name);
    }
    groups.set(rate, group);
  }

  return Array.from(groups.values())
    .sort((a, b) => a.rate - b.rate)
    .map((g) => ({
      ...g,
      base: roundTo2(g.base),
      taxAmount: roundTo2(g.taxAmount),
      cgstRate: roundTo2(g.rate / 2),
      sgstRate: roundTo2(g.rate / 2),
      cgstAmount: roundTo2(g.taxAmount / 2),
      sgstAmount: roundTo2(g.taxAmount - roundTo2(g.taxAmount / 2)),
    }));
};

/**
 * Calculates a complete, mathematically consistent bill breakdown down to 2 decimal places.
 *
 * @param {Object} params
 * @param {Array} params.items - Array of order or cart items
 * @param {Object} [params.taxSettings] - Tax configuration (taxEnabled, taxRate, taxType, vatEnabled, vatRate, vatType)
 * @param {Object} [params.coupon] - Applied coupon { couponCode, discountAmount }
 * @param {Object} [params.manualDiscount] - Manual discount { type, value, amount, reason }
 * @param {Object} [params.fees] - Delivery and platform fees { deliveryFee, platformFee, isDelivery }
 * @param {string} [params.orderType] - 'dine_in' | 'takeaway' | 'delivery'
 * @param {string} [params.splitMode] - 'cgst_sgst' | 'igst' (default 'cgst_sgst')
 *
 * @returns {Object} Complete bill breakdown object
 */
export function calculateBillBreakdown({
  items = [],
  taxSettings = {},
  coupon = null,
  manualDiscount = null,
  fees = {},
  orderType = 'takeaway',
  splitMode = 'cgst_sgst',
} = {}) {
  const taxEnabled = !!taxSettings?.taxEnabled;
  const taxRate = Number(taxSettings?.taxRate) || 0;
  const taxType = taxSettings?.taxType || 'inclusive';

  const vatEnabled = !!taxSettings?.vatEnabled;
  const vatRate = Number(taxSettings?.vatRate) || 0;
  const vatType = taxSettings?.vatType || 'inclusive';

  const lines = [];
  let itemGrossTotal = 0;
  let taxableSubtotal = 0;
  let gstBase = 0;
  let vatBase = 0;
  let totalGstAmount = 0;
  let totalVatAmount = 0;
  let totalItemCount = 0;

  for (const item of items) {
    const rawQty = Number(item.quantity || 0);
    const cancelledQty = Number(item.cancelledQuantity || 0);
    const effectiveQty = Math.max(0, rawQty - cancelledQty);

    if (effectiveQty <= 0 && rawQty > 0) {
      // Fully cancelled item
      continue;
    }

    const unitPrice = roundTo2(Number(item.price) || 0);
    const grossAmount = roundTo2(unitPrice * effectiveQty);
    totalItemCount += effectiveQty;
    itemGrossTotal = roundTo2(itemGrossTotal + grossAmount);

    const rates = resolveItemTaxRates(item, {
      taxEnabled,
      taxRate,
      vatEnabled,
      vatRate,
    });
    const gstItemRate = taxEnabled ? rates.gstRate : 0;
    const vatItemRate = vatEnabled ? rates.vatRate : 0;

    const split = splitLineItem(grossAmount, [
      { key: 'gst', rate: gstItemRate, inclusive: taxType === 'inclusive' },
      { key: 'vat', rate: vatItemRate, inclusive: vatType === 'inclusive' },
    ]);

    const base = split.base;
    const gst = split.gstAmount;
    const vat = split.vatAmount;
    const cgst = roundTo2(gst / 2);
    const sgst = roundTo2(gst - cgst);
    const lineTax = roundTo2(gst + vat);
    const lineTotal = roundTo2(base + lineTax);

    if (gstItemRate > 0) gstBase = roundTo2(gstBase + base);
    if (vatItemRate > 0) vatBase = roundTo2(vatBase + base);
    taxableSubtotal = roundTo2(taxableSubtotal + base);
    totalGstAmount = roundTo2(totalGstAmount + gst);
    totalVatAmount = roundTo2(totalVatAmount + vat);

    lines.push({
      menuItemId: item.menuItemId || item._id,
      name: item.name,
      quantity: effectiveQty,
      originalQuantity: rawQty,
      cancelledQuantity: cancelledQty,
      unitPrice,
      grossAmount,
      taxableBase: base,
      gstRate: gstItemRate,
      vatRate: vatItemRate,
      gstAmount: gst,
      cgstAmount: cgst,
      sgstAmount: sgst,
      vatAmount: vat,
      taxAmount: lineTax,
      lineTotal,
      itemType: item.itemType || 'food',
      spiceLevel: item.spiceLevel,
      addOns: item.addOns,
      cookingNote: item.cookingNote || item.specialInstructions || '',
    });
  }

  const gstBreakdown = groupTaxByRate(lines, 'gstRate', 'gstAmount', taxType);
  const vatBreakdown = groupTaxByRate(lines, 'vatRate', 'vatAmount', vatType);

  const totalCgstAmount = roundTo2(totalGstAmount / 2);
  const totalSgstAmount = roundTo2(totalGstAmount - totalCgstAmount);
  const totalIgstAmount = totalGstAmount;
  const totalTaxAmount = roundTo2(totalGstAmount + totalVatAmount);

  // Discounts
  const couponDiscount = roundTo2(coupon?.discountAmount || coupon?.amount || 0);
  const couponCode = coupon?.couponCode || coupon?.code || '';

  const manualDiscountAmt = roundTo2(
    manualDiscount?.amount || manualDiscount?.manualDiscountAmount || 0,
  );
  const manualDiscountType = manualDiscount?.type || manualDiscount?.manualDiscountType || '';
  const manualDiscountValue = Number(manualDiscount?.value || manualDiscount?.manualDiscountValue || 0);
  const manualDiscountReason = manualDiscount?.reason || manualDiscount?.manualDiscountReason || '';

  const totalDiscount = roundTo2(couponDiscount + manualDiscountAmt);

  // Fees
  const isDelivery = orderType === 'delivery';
  const rawDeliveryFee = Number(fees?.deliveryFee ?? 0);
  const deliveryFee = rawDeliveryFee > 0 ? roundTo2(rawDeliveryFee) : 0;
  const isDeliveryFree = isDelivery && deliveryFee === 0;

  const rawPlatformFee = Number(fees?.platformFee ?? 0);
  const platformFee = rawPlatformFee > 0 ? roundTo2(rawPlatformFee) : 0;
  const totalFees = roundTo2(deliveryFee + platformFee);

  // Pre-discount total: taxable base + all taxes (or itemGrossTotal + exclusive taxes)
  const preDiscountTotal = roundTo2(taxableSubtotal + totalTaxAmount);
  const grandTotal = Math.max(0, roundTo2(preDiscountTotal - totalDiscount + totalFees));
  const savingsAmount = totalDiscount;

  // Items subject to VAT
  const vatApplicableItems = Array.from(
    new Set(lines.filter((l) => l.vatRate > 0).map((l) => l.name)),
  );

  return {
    itemGrossTotal,
    taxableSubtotal,
    totalItemCount,
    orderType,
    lines,

    discounts: {
      hasDiscount: totalDiscount > 0,
      totalDiscount,
      coupon: couponDiscount > 0
        ? {
            code: couponCode,
            amount: couponDiscount,
          }
        : null,
      manualDiscount: manualDiscountAmt > 0
        ? {
            type: manualDiscountType,
            value: manualDiscountValue,
            amount: manualDiscountAmt,
            reason: manualDiscountReason,
          }
        : null,
    },

    taxes: {
      hasTax: totalTaxAmount > 0,
      totalTaxAmount,
      taxMode: taxType === vatType ? taxType : 'mixed',
      gst: {
        enabled: taxEnabled,
        totalAmount: totalGstAmount,
        taxableBase: gstBase,
        splitMode,
        totalCgst: totalCgstAmount,
        totalSgst: totalSgstAmount,
        totalIgst: totalIgstAmount,
        groups: gstBreakdown,
        defaultRate: taxRate,
        taxType,
      },
      vat: {
        enabled: vatEnabled,
        totalAmount: totalVatAmount,
        taxableBase: vatBase,
        groups: vatBreakdown,
        applicableItems: vatApplicableItems,
        defaultRate: vatRate,
        taxType: vatType,
      },
    },

    fees: {
      hasFees: totalFees > 0 || isDelivery,
      deliveryFee,
      isDelivery,
      isDeliveryFree,
      platformFee,
      totalFees,
    },

    preDiscountTotal,
    grandTotal,
    savingsAmount,
  };
}

/**
 * Builds a bill breakdown for an existing backend Order document.
 * Matches Cart calculations down to 2 decimal places.
 *
 * @param {Object} order - Order document from backend API
 * @param {Object} [options] - Additional options or fee overrides
 * @returns {Object} Complete bill breakdown object
 */
export function getOrderBillBreakdown(order = {}, options = {}) {
  if (!order || !order.items) {
    return calculateBillBreakdown({});
  }

  const taxSettings = {
    taxEnabled: (order.taxRate || 0) > 0 || (order.cgstAmount || 0) > 0 || (order.gstBreakdown?.length || 0) > 0,
    taxRate: order.taxRate || 0,
    taxType: order.taxType || 'inclusive',
    vatEnabled: (order.vatRate || 0) > 0 || (order.vatAmount || 0) > 0 || (order.vatBreakdown?.length || 0) > 0,
    vatRate: order.vatRate || 0,
    vatType: order.vatType || 'inclusive',
  };

  const coupon = order.couponCode || order.discountAmount > 0
    ? {
        couponCode: order.couponCode || '',
        discountAmount: roundTo2(order.discountAmount || 0),
      }
    : null;

  const manualDiscount = (order.manualDiscountAmount || order.manual_discount_amount) > 0
    ? {
        type: order.manualDiscountType || order.manual_discount_type,
        value: order.manualDiscountValue ?? order.manual_discount_value,
        amount: roundTo2(order.manualDiscountAmount || order.manual_discount_amount || 0),
        reason: order.manualDiscountReason || order.manual_discount_reason || '',
      }
    : null;

  const fees = {
    deliveryFee: order.deliveryFee ?? options.deliveryFee ?? 0,
    platformFee: order.platformFee ?? options.platformFee ?? 0,
    isDelivery: order.orderType === 'delivery',
  };

  return calculateBillBreakdown({
    items: order.items,
    taxSettings,
    coupon,
    manualDiscount,
    fees,
    orderType: order.orderType || 'dine_in',
    splitMode: options.splitMode || 'cgst_sgst',
  });
}
