export const roundTo2 = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const roundTo3 = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
};

export const formatCurrency = (value, decimals = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return (0).toFixed(decimals);
  const rounded = decimals === 3 ? roundTo3(num) : roundTo2(num);
  return rounded.toFixed(decimals);
};

export default formatCurrency;

