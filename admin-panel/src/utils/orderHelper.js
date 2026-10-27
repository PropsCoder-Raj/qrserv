/**
 * Extracts and unwraps the true order document from Axios/NestJS responses.
 * Handles Axios `res.data` and NestJS `TransformInterceptor` `{ success: true, data: order }`.
 */
export function unwrapOrder(res) {
  if (!res) return null;
  let payload = res.data !== undefined ? res.data : res;

  // Unpack NestJS TransformInterceptor wrapper: { success: true, data: order }
  if (payload && typeof payload === 'object' && payload.data !== undefined) {
    payload = payload.data;
  }

  // Handle case where it might be wrapped one more time
  if (
    payload &&
    typeof payload === 'object' &&
    payload.data !== undefined &&
    !payload._id &&
    !payload.items &&
    !payload.orderNumber
  ) {
    payload = payload.data;
  }

  return payload;
}

/**
 * Intelligent currency symbol detection based on restaurant phone, address,
 * or configured settings.
 */
export function detectCurrency(restaurant = {}, order = {}) {
  if (order?.currency) return order.currency;
  if (restaurant?.currency) return restaurant.currency;
  if (restaurant?.currencySymbol) return restaurant.currencySymbol;

  const address = (restaurant?.address || '').toLowerCase();
  const phone = (restaurant?.phone || '').trim();

  if (phone.startsWith('+973') || address.includes('bahrain') || address.includes('manama')) {
    return 'BHD';
  }
  if (phone.startsWith('+968') || address.includes('oman') || address.includes('muscat')) {
    return 'OMR';
  }
  if (phone.startsWith('+971') || address.includes('dubai') || address.includes('uae')) {
    return 'AED';
  }
  if (phone.startsWith('+966') || address.includes('saudi') || address.includes('riyadh')) {
    return 'SAR';
  }
  if (phone.startsWith('+965') || address.includes('kuwait')) {
    return 'KWD';
  }
  if (phone.startsWith('+974') || address.includes('qatar') || address.includes('doha')) {
    return 'QAR';
  }
  if (phone.startsWith('+91') || address.includes('india') || restaurant?.gst_no) {
    return '₹';
  }

  return '₹';
}
