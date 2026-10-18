import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiArrowLeft,
  HiPlus,
  HiMinus,
  HiTrash,
  HiCash,
  HiOutlineCreditCard,
  HiGlobeAlt
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import orderService from '../services/orderService';
import couponService from '../services/couponService';
import { formatCurrency, roundTo3 } from '../utils/formatCurrency';

export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    restaurantId,
    tableId,
    orderType,
    setCartOrderType,
    paymentMethod: cartPaymentMethod,
    setCartPaymentMethod,
    updateQuantity,
    clearCart,
    taxEnabled,
    taxType,
    taxRate,
    cgstRate,
    sgstRate,
    cgstAmount,
    sgstAmount,
    grandTotal,
    vatEnabled,
    vatRate,
    vatType,
    vatAmount,
    foodSubtotal,
    liquorSubtotal,
  } = useCart();
  const hasTable = Boolean(tableId);
  const paymentMethod = cartPaymentMethod;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const finalTotal = Math.max(0, roundTo3(grandTotal - (appliedCoupon?.discountAmount || 0)));

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponCode('');
  }, [items, restaurantId]);

  const orderTypeOptions = [
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'dine_in', label: 'Dine In' },
  ];
  const paymentMethodOptions = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'ONLINE', label: 'Online' },
  ];

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Enter a coupon code');
      return;
    }
    if (!restaurantId || items.length === 0) {
      toast.error('Add items before applying a coupon');
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await couponService.validate({
        restaurantId,
        code: couponCode.trim(),
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });
      setAppliedCoupon(res.data.data);
      setCouponCode(res.data.data.couponCode);
      toast.success('Coupon applied');
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(error.response?.data?.message || 'Coupon is not valid');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!restaurantId) {
      toast.error('Please scan a QR code first');
      return;
    }
    setPlacing(true);
    try {
      const orderData = {
        restaurantId,
        ...(tableId ? { tableId } : {}),
        orderType,
        paymentMethod,
        couponCode: appliedCoupon?.couponCode || undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          itemType: i.itemType || 'food',
          spiceLevel: i.spiceLevel || undefined,
          addOns: i.addOns?.length ? i.addOns : undefined,
          specialInstructions: i.specialInstructions || undefined,
        })),
        customerName: customerName || undefined,
        customerPhone,
      };

      const res = await orderService.createForCustomer(orderData);
      const payload = res.data?.data || {};
      const order = payload.order || payload;

      if (customerPhone) {
        localStorage.setItem('customerPhone', customerPhone);
      }

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order/${order._id}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-cool text-text-secondary"
          >
            <HiArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-text">Your Cart</h1>
          </div>
          {!hasTable && (
            <div className="inline-flex rounded-full bg-surface-cool p-1">
              {orderTypeOptions.map((option) => {
                const isActive = orderType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCartOrderType(option.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${isActive
                        ? 'bg-surface text-text shadow-sm'
                        : 'text-text-light'
                      }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-6xl">🛒</span>
            <h3 className="mt-4 text-base font-semibold text-text">
              Your cart is empty
            </h3>
            <p className="mt-1 text-sm text-text-light">
              Add some delicious items from the menu
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.cartItemId}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className="flex items-center gap-3 rounded-2xl bg-surface p-4 border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text truncate">
                        {item.name}
                      </h3>
                      {(item.spiceLevel?.name || item.addOns?.length > 0 || item.specialInstructions) && (
                        <div className="mt-0.5 space-y-0.5 text-[11px] text-text-light">
                          {item.spiceLevel?.name && (
                            <div>{item.spiceLevel.emoji} {item.spiceLevel.name}</div>
                          )}
                          {item.addOns?.length > 0 && (
                            <div>
                              {item.addOns.map((a) => `${a.emoji || ''} ${a.name}`.trim()).join(', ')}
                            </div>
                          )}
                          {item.specialInstructions && (
                            <div className="italic">Note: {item.specialInstructions}</div>
                          )}
                        </div>
                      )}
                      <p className="mt-0.5 flex items-baseline gap-2 text-sm font-medium text-primary">
                        {item.originalPrice > item.price && <del className="text-xs font-normal text-text-light">{formatCurrency(item.originalPrice * item.quantity)}</del>}
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-xl bg-surface-cool p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity - 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-primary-50 hover:text-primary"
                      >
                        {item.quantity === 1 ? (
                          <HiTrash size={14} className="text-danger" />
                        ) : (
                          <HiMinus size={14} />
                        )}
                      </button>
                      <span className="min-w-[24px] text-center text-sm font-bold text-text">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity + 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-primary-50 hover:text-primary"
                      >
                        <HiPlus size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold text-text">Apply Coupon</h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{appliedCoupon.couponCode}</p>
                    <p className="mt-1 text-xs text-green-700">Coupon applied</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-cool"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="min-w-0 flex-1 rounded-xl border border-border bg-surface-cool px-4 py-3 text-sm uppercase outline-none placeholder:text-text-light focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Customer Info */}
            {grandTotal < 0 && (
              <span className="text-base font-bold text-primary">{grandTotal}</span>
            )}
            <div className="mt-6 rounded-2xl bg-surface p-4 border border-border">
              <h3 className="mb-3 text-sm font-semibold text-text">
                Your Details{' '}
                {/* <span className="font-normal text-text-light">
                  (phone required, name optional)
                </span> */}
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-cool px-4 py-3 text-sm outline-none placeholder:text-text-light focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-cool px-4 py-3 text-sm outline-none placeholder:text-text-light focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <fieldset className="mt-6 rounded-2xl border border-border bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold text-text">
                Payment Method
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethodOptions.map((option) => {
                  const isActive = paymentMethod === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${isActive
                          ? 'border-primary bg-primary/5 text-text'
                          : 'border-border text-text-light'
                        }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={isActive}
                        onChange={() => setCartPaymentMethod(option.value)}
                        className="accent-primary"
                      />
                      {option.value === 'CASH' && (
                        <HiCash size={18} className="text-green-600" aria-hidden="true" />
                      )}
                      {option.value === 'CARD' && (
                        <HiOutlineCreditCard size={18} className="text-blue-600" aria-hidden="true" />
                      )}
                      {option.value === 'ONLINE' && (
                        <HiGlobeAlt size={18} className="text-purple-600" aria-hidden="true" />
                      )}
                      {option.label}
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-text-light">
                Pay by {paymentMethod.toLowerCase()} at the restaurant.
              </p>
            </fieldset>

            {/* Bill Summary */}
            <div className="mt-6 rounded-2xl bg-surface p-4 border border-border">
              <h3 className="mb-3 text-sm font-semibold text-text">
                Bill Summary
              </h3>
              <div className="space-y-2 text-sm">
                {items.map((item) => {
                  const lineTotal = item.price * item.quantity;
                  const isLiquor = (item.itemType || 'food') === 'liquor';
                  const hasGst = !isLiquor && taxEnabled && (cgstAmount + sgstAmount) > 0;
                  const hasItemVat = isLiquor && vatEnabled && vatAmount > 0;
                  const gstIncl = hasGst && taxType === 'inclusive';
                  const vatIncl = hasItemVat && vatType === 'inclusive';
                  let base, itemCgst, itemSgst, itemVat;
                  if (hasGst) {
                    const rate = taxRate || 0;
                    if (gstIncl) {
                      base = roundTo3(lineTotal / (1 + rate / 100));
                      const tax = roundTo3(lineTotal - base);
                      itemCgst = roundTo3(tax / 2);
                      itemSgst = roundTo3(tax - itemCgst);
                    } else {
                      base = lineTotal;
                      itemCgst = roundTo3(base * cgstRate / 100);
                      itemSgst = roundTo3(base * sgstRate / 100);
                    }
                  }
                  if (hasItemVat) {
                    const vr = vatRate || 0;
                    if (vatIncl) {
                      base = roundTo3(lineTotal / (1 + vr / 100));
                      itemVat = roundTo3(lineTotal - base);
                    } else {
                      base = lineTotal;
                      itemVat = roundTo3(base * vr / 100);
                    }
                  }
                  return (
                    <div key={item.cartItemId}>
                      <div className="flex justify-between text-text-secondary">
                        <span>{item.name}{isLiquor ? ' [L]' : ''} x {item.quantity}</span>
                        <span>{formatCurrency(lineTotal)}</span>
                      </div>
                      {(item.spiceLevel?.name || item.addOns?.length > 0) && (
                        <div className="text-[11px] text-text-light ml-1">
                          {[item.spiceLevel?.name, ...(item.addOns || []).map((a) => a.name)]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                      {hasGst && (
                        <div className="text-[11px] text-text-light ml-1 mt-0.5 space-x-2">
                          <span>Base: {formatCurrency(base)}</span>
                          <span>CGST: {formatCurrency(itemCgst)}</span>
                          <span>SGST: {formatCurrency(itemSgst)}</span>
                        </div>
                      )}
                      {hasItemVat && (
                        <div className="text-[11px] text-text-light ml-1 mt-0.5 space-x-2">
                          <span>Base: {formatCurrency(base)}</span>
                          <span>VAT: {formatCurrency(itemVat)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="border-t border-border pt-2 space-y-1">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-700">
                      <span>Coupon {appliedCoupon.couponCode}</span>
                      <span>-{formatCurrency(appliedCoupon.discountAmount)}</span>
                    </div>
                  )}
                  {(cgstAmount + sgstAmount) > 0 && (
                    <>
                      <div className="flex justify-between text-text-secondary">
                        <span>Food Subtotal</span>
                        <span>{formatCurrency(foodSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>CGST ({cgstRate}%)</span>
                        <span>{formatCurrency(cgstAmount)}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>SGST ({sgstRate}%)</span>
                        <span>{formatCurrency(sgstAmount)}</span>
                      </div>
                    </>
                  )}
                  {vatAmount > 0 && (
                    <>
                      <div className="flex justify-between text-text-secondary">
                        <span>Liquor Subtotal</span>
                        <span>{formatCurrency(liquorSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>VAT ({vatRate}%)</span>
                        <span>{formatCurrency(vatAmount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold text-text">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <div className="mt-6 pb-6">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full rounded-2xl bg-primary py-4 text-base font-bold text-white shadow-lg shadow-primary/25 active:bg-primary-dark disabled:opacity-60"
              >
                {placing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Placing Order...
                  </span>
                ) : (
                  `Place Order  •  ${formatCurrency(finalTotal)}`
                )}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
