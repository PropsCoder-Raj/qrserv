import { roundTo3, formatCurrency } from './formatCurrency';

export function getMenuItemSalePrice(item) {
  const price = Number(item?.price) || 0;
  const value = Number(item?.discountValue) || 0;
  const discount = item?.discountType === 'percentage'
    ? price * Math.min(value, 100) / 100
    : item?.discountType === 'fixed'
      ? Math.min(value, price)
      : 0;
  return Math.max(0, roundTo3(price - discount));
}

export function getMenuItemDiscountLabel(item) {
  if (item?.discountType === 'percentage') return `${item.discountValue}% off`;
  if (item?.discountType === 'fixed') return `${formatCurrency(item.discountValue)} off`;
  return '';
}