/**
 * Monetary and pricing precision utilities for standardizing to 3 decimal places.
 */

/**
 * Rounds a number or string to exactly 3 decimal places using precise arithmetic to avoid floating-point drift.
 * E.g., roundTo3(1) => 1
 *       roundTo3(0.006) => 0.006
 *       roundTo3(0.20000000000000004) => 0.2
 */
export function roundTo3(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return 0;
  }
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

/**
 * Formats a monetary amount to a fixed 3-decimal string with trailing zeros (e.g., "1.000", "0.200", "0.006").
 */
export function formatTo3Decimals(value: number | string | null | undefined): string {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return '0.000';
  }
  return num.toFixed(3);
}

/**
 * Mongoose setter for monetary fields to enforce 3 decimal places before persistence.
 */
export const mongoose3DecimalSetter = (v: number | null | undefined): number | null | undefined => {
  if (v === null || v === undefined) return v;
  return roundTo3(v);
};
