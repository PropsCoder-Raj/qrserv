import { roundTo3 } from './formatCurrency.js';

// Mirrors backend/src/common/utils/tax.ts so the cart and invoice breakdowns match the server bill.
const splitLine = (gross, parts) => {
  const active = parts.filter((p) => p.rate > 0);
  const inclusiveParts = active.filter((p) => p.inclusive);
  const inclusiveRate = inclusiveParts.reduce((sum, p) => sum + p.rate, 0);
  const base = inclusiveRate > 0 ? roundTo3(gross / (1 + inclusiveRate / 100)) : gross;
  const amounts = { gst: 0, vat: 0 };

  const inclusiveTotal = roundTo3(gross - base);
  let allocated = 0;
  inclusiveParts.forEach((p, idx) => {
    const isLast = idx === inclusiveParts.length - 1;
    const amount = isLast
      ? roundTo3(inclusiveTotal - allocated)
      : roundTo3((base * p.rate) / 100);
    amounts[p.key] = amount;
    allocated = roundTo3(allocated + amount);
  });

  active
    .filter((p) => !p.inclusive)
    .forEach((p) => {
      amounts[p.key] = roundTo3((base * p.rate) / 100);
    });

  return { base, gstAmount: amounts.gst, vatAmount: amounts.vat };
};

const groupByRate = (lines, rateKey, amountKey, taxType) => {
  const groups = new Map();
  for (const line of lines) {
    const rate = line[rateKey];
    if (!(rate > 0)) continue;
    const group = groups.get(rate) || { rate, taxType, base: 0, taxAmount: 0 };
    group.base = roundTo3(group.base + line.taxableBase);
    group.taxAmount = roundTo3(group.taxAmount + line[amountKey]);
    groups.set(rate, group);
  }
  return Array.from(groups.values()).sort((a, b) => a.rate - b.rate);
};

export const computeTaxBreakdown = (settings, items) => {
  const taxEnabled = !!settings?.taxEnabled;
  const taxRate = Number(settings?.taxRate) || 0;
  const taxType = settings?.taxType || 'inclusive';
  const vatEnabled = !!settings?.vatEnabled;
  const vatRate = Number(settings?.vatRate) || 0;
  const vatType = settings?.vatType || 'inclusive';

  const lines = [];
  let subtotalAmount = 0;
  let gstBase = 0;
  let vatBase = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let gstAmount = 0;
  let vatAmount = 0;
  let totalAmount = 0;

  for (const item of items) {
    const grossAmount = roundTo3(Number(item.price) * Number(item.quantity));
    const gstItemRate = taxEnabled && Number(item.gstRate) > 0 ? Number(item.gstRate) : 0;
    const vatItemRate = vatEnabled && Number(item.vatRate) > 0 ? Number(item.vatRate) : 0;

    const split = splitLine(grossAmount, [
      { key: 'gst', rate: gstItemRate, inclusive: taxType === 'inclusive' },
      { key: 'vat', rate: vatItemRate, inclusive: vatType === 'inclusive' },
    ]);
    const base = split.base;
    const gst = split.gstAmount;
    const vat = split.vatAmount;
    const cgst = roundTo3(gst / 2);
    const sgst = roundTo3(gst - cgst);
    const lineTax = roundTo3(gst + vat);
    const lineTotal = roundTo3(base + lineTax);

    if (gstItemRate > 0) gstBase = roundTo3(gstBase + base);
    if (vatItemRate > 0) vatBase = roundTo3(vatBase + base);
    subtotalAmount = roundTo3(subtotalAmount + base);
    cgstAmount = roundTo3(cgstAmount + cgst);
    sgstAmount = roundTo3(sgstAmount + sgst);
    gstAmount = roundTo3(gstAmount + gst);
    vatAmount = roundTo3(vatAmount + vat);
    totalAmount = roundTo3(totalAmount + lineTotal);

    lines.push({
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: Number(item.quantity),
      grossAmount,
      gstRate: gstItemRate,
      vatRate: vatItemRate,
      taxableBase: base,
      cgstAmount: cgst,
      sgstAmount: sgst,
      gstAmount: gst,
      vatAmount: vat,
      taxAmount: lineTax,
      lineTotal,
    });
  }

  return {
    lines,
    subtotalAmount,
    gstBase,
    vatBase,
    cgstAmount,
    sgstAmount,
    gstAmount,
    vatAmount,
    taxAmount: roundTo3(gstAmount + vatAmount),
    totalAmount,
    taxRate: taxEnabled ? taxRate : 0,
    taxType,
    cgstRate: taxEnabled ? roundTo3(taxRate / 2) : 0,
    sgstRate: taxEnabled ? roundTo3(taxRate / 2) : 0,
    vatRate: vatEnabled ? vatRate : 0,
    vatType,
    gstBreakdown: groupByRate(lines, 'gstRate', 'gstAmount', taxType),
    vatBreakdown: groupByRate(lines, 'vatRate', 'vatAmount', vatType),
  };
};
