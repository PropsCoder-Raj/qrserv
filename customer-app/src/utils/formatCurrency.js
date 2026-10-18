export const roundTo3 = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
};

export const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000';
  return roundTo3(num).toFixed(3);
};

export default formatCurrency;
