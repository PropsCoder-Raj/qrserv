import { computeTaxBreakdown } from './tax';

const inclusive = { taxEnabled: true, taxRate: 5, taxType: 'inclusive', vatEnabled: true, vatRate: 15, vatType: 'inclusive' };
const exclusive = { taxEnabled: true, taxRate: 5, taxType: 'exclusive', vatEnabled: true, vatRate: 15, vatType: 'exclusive' };

describe('computeTaxBreakdown', () => {
  it('extracts inclusive GST from a line and splits it into CGST/SGST', () => {
    const result = computeTaxBreakdown(
      { taxEnabled: true, taxRate: 5, taxType: 'inclusive' },
      [{ price: 105, quantity: 1, gstRate: 5 }],
    );

    expect(result.gstBase).toBe(100);
    expect(result.gstAmount).toBe(5);
    expect(result.cgstAmount + result.sgstAmount).toBe(5);
    expect(result.totalAmount).toBe(105);
  });

  it('adds exclusive VAT on top of a line', () => {
    const result = computeTaxBreakdown(
      { vatEnabled: true, vatRate: 15, vatType: 'exclusive' },
      [{ price: 100, quantity: 2, vatRate: 15 }],
    );

    expect(result.vatBase).toBe(200);
    expect(result.vatAmount).toBe(30);
    expect(result.totalAmount).toBe(230);
  });

  it('applies GST and VAT together when an item has both rates', () => {
    const result = computeTaxBreakdown(exclusive, [{ price: 100, quantity: 1, gstRate: 5, vatRate: 15 }]);

    expect(result.gstBase).toBe(100);
    expect(result.vatBase).toBe(100);
    expect(result.subtotalAmount).toBe(100);
    expect(result.gstAmount).toBe(5);
    expect(result.vatAmount).toBe(15);
    expect(result.totalAmount).toBe(120);
  });

  it('carves both inclusive taxes out of the gross without drift', () => {
    const result = computeTaxBreakdown(inclusive, [{ price: 120, quantity: 1, gstRate: 5, vatRate: 15 }]);

    const lineTax = result.lines[0];
    expect(lineTax.taxableBase + lineTax.taxAmount).toBeCloseTo(120, 3);
    expect(result.totalAmount).toBe(120);
    expect(result.gstAmount + result.vatAmount).toBeCloseTo(120 - result.subtotalAmount, 3);
  });

  it('taxes a mixed cart per item and only the items that carry each rate', () => {
    const result = computeTaxBreakdown(exclusive, [
      { price: 100, quantity: 1, gstRate: 5 },
      { price: 50, quantity: 2, vatRate: 15 },
    ]);

    expect(result.gstBase).toBe(100);
    expect(result.vatBase).toBe(100);
    expect(result.subtotalAmount).toBe(200);
    expect(result.gstAmount).toBe(5);
    expect(result.vatAmount).toBe(15);
    expect(result.totalAmount).toBe(220);
    expect(result.vatBreakdown).toEqual([{ rate: 15, taxType: 'exclusive', base: 100, taxAmount: 15 }]);
  });

  it('groups the breakdown by each item rate', () => {
    const result = computeTaxBreakdown(
      { vatEnabled: true, vatRate: 15, vatType: 'inclusive' },
      [
        { price: 118, quantity: 1, vatRate: 18 },
        { price: 115, quantity: 1, vatRate: 15 },
      ],
    );

    expect(result.vatBreakdown.map((b) => b.rate)).toEqual([15, 18]);
    expect(result.lines[0].vatRate).toBe(18);
    expect(result.lines[1].vatRate).toBe(15);
  });

  it('keeps totals equal to the sum of rounded lines (no rounding drift)', () => {
    const result = computeTaxBreakdown(inclusive, [
      { price: 10.333, quantity: 3, gstRate: 5, vatRate: 15 },
      { price: 7.777, quantity: 1, gstRate: 5 },
      { price: 3.333, quantity: 7, vatRate: 15 },
    ]);

    const lineTotal = result.lines.reduce((s, l) => s + l.lineTotal, 0);
    expect(result.totalAmount).toBeCloseTo(lineTotal, 3);
    expect(result.taxAmount).toBeCloseTo(result.gstAmount + result.vatAmount, 3);
    expect(result.totalAmount).toBeCloseTo(result.subtotalAmount + result.taxAmount, 3);
  });

  it('applies no tax when the restaurant has tax disabled', () => {
    const result = computeTaxBreakdown(
      { taxEnabled: false, vatEnabled: false },
      [{ price: 100, quantity: 1, gstRate: 5, vatRate: 15 }],
    );

    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(100);
    expect(result.vatBreakdown).toEqual([]);
  });

  it('applies no tax to an item with no rate set', () => {
    const result = computeTaxBreakdown(exclusive, [{ price: 100, quantity: 1 }]);

    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(100);
  });

  it('reflects a changed item rate only for newly computed calculations', () => {
    const before = computeTaxBreakdown(exclusive, [{ price: 100, quantity: 1, vatRate: 5 }]);
    const after = computeTaxBreakdown(exclusive, [{ price: 100, quantity: 1, vatRate: 18 }]);

    expect(before.vatAmount).toBe(5);
    expect(after.vatAmount).toBe(18);
  });
});
