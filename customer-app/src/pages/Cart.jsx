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
import restaurantService from '../services/restaurantService';
import { formatCurrency } from '../utils/formatCurrency';
import { calculateBillBreakdown } from '../utils/billCalculator';
import BillBreakdown from '../components/BillBreakdown';

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
    updateItemNote,
    clearCart,
    setTaxInfo,
    taxEnabled,
    taxRate,
    taxType,
    vatEnabled,
    vatRate,
    vatType,
    gstNo,
    vatNo,
  } = useCart();
  const hasTable = Boolean(tableId);
  const paymentMethod = cartPaymentMethod;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderInstructions, setOrderInstructions] = useState('');
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Sync restaurant tax & VAT settings on cart mount or restaurantId change
  useEffect(() => {
    if (!restaurantId) return;
    restaurantService.getPublicInfo(restaurantId)
      .then((res) => {
        const info = res.data?.data;
        if (info && setTaxInfo) {
          setTaxInfo(
            info.taxEnabled || false,
            info.taxRate || 0,
            info.taxType || 'inclusive',
            info.vatEnabled || false,
            info.vatRate || 0,
            info.vatType || 'inclusive',
            info.gst_no || '',
            info.vat_no || '',
          );
        }
      })
      .catch(() => {});
  }, [restaurantId, setTaxInfo]);

  const billBreakdown = calculateBillBreakdown({
    items,
    taxSettings: {
      taxEnabled,
      taxRate,
      taxType,
      vatEnabled,
      vatRate,
      vatType,
    },
    coupon: appliedCoupon,
    orderType,
    fees: {
      deliveryFee: 0,
      platformFee: 0,
    },
  });
  const finalTotal = billBreakdown.grandTotal;

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
        order_instructions: orderInstructions.trim() || undefined,
        orderInstructions: orderInstructions.trim() || undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          itemType: i.itemType || 'food',
          spiceLevel: i.spiceLevel || undefined,
          addOns: i.addOns?.length ? i.addOns : undefined,
          cookingNote: (i.cookingNote || i.specialInstructions || '').trim() || undefined,
          specialInstructions: (i.cookingNote || i.specialInstructions || '').trim() || undefined,
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
                    className="flex flex-col gap-2 rounded-2xl bg-surface p-4 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text truncate">
                          {item.name}
                        </h3>
                        {(item.spiceLevel?.name || item.addOns?.length > 0) && (
                          <div className="mt-0.5 space-y-0.5 text-[11px] text-text-light">
                            {item.spiceLevel?.name && (
                              <div>{item.spiceLevel.emoji} {item.spiceLevel.name}</div>
                            )}
                            {item.addOns?.length > 0 && (
                              <div>
                                {item.addOns.map((a) => `${a.emoji || ''} ${a.name}`.trim()).join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="mt-0.5 flex items-baseline gap-2 text-sm font-medium text-primary">
                          {item.originalPrice > item.price && <del className="text-xs font-normal text-text-light">{formatCurrency(item.originalPrice * item.quantity)}</del>}
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </p>
                        {(() => {
                          const line = billBreakdown?.lines?.find((l) => l.menuItemId === item.menuItemId);
                          if (!line || (!line.vatAmount && !line.gstAmount)) return null;
                          return (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                              {line.vatAmount > 0 && (
                                <span className="inline-flex items-center gap-1 rounded bg-purple-50 border border-purple-200 px-1.5 py-0.5 font-medium text-purple-700">
                                  <span>VAT ({line.vatRate}%):</span>
                                  <span className="font-bold">{formatCurrency(line.vatAmount)}</span>
                                </span>
                              )}
                              {line.gstAmount > 0 && (
                                <span className="inline-flex items-center gap-1 rounded bg-primary-50 border border-primary/20 px-1.5 py-0.5 font-medium text-primary">
                                  <span>GST ({line.gstRate}%):</span>
                                  <span className="font-bold">{formatCurrency(line.gstAmount)}</span>
                                </span>
                              )}
                              <span className="text-[10px] text-text-light">
                                Base: {formatCurrency(line.taxableBase)}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-1 rounded-xl bg-surface-cool p-1 shrink-0">
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
                    </div>

                    {/* Cooking Note Input on Cart Card */}
                    <div className="pt-2 border-t border-border/60">
                      <input
                        type="text"
                        value={item.cookingNote || item.specialInstructions || ''}
                        onChange={(e) => updateItemNote(item.cartItemId, e.target.value)}
                        placeholder="Cooking Note (e.g., Extra spicy, No onions)..."
                        className="w-full rounded-xl border border-border bg-surface-cool px-3 py-1.5 text-xs outline-none focus:border-primary placeholder:text-text-light"
                      />
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

            {/* Order / Delivery Note */}
            {/* <div className="mt-6 rounded-2xl bg-surface p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text">Order / Delivery Note</h3>
                <span className="text-[11px] font-normal text-text-light">Optional</span>
              </div>
              <textarea
                value={orderInstructions}
                onChange={(e) => setOrderInstructions(e.target.value)}
                placeholder="Add general instructions (e.g. Ring bell twice, Pack cutlery, Leave at the door)..."
                rows={2}
                className="w-full rounded-xl border border-border bg-surface-cool p-3 text-sm outline-none placeholder:text-text-light focus:border-primary"
              />
            </div> */}

            {/* Customer Info */}
            {finalTotal < 0 && (
              <span className="text-base font-bold text-primary">{finalTotal}</span>
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
                {(vatNo || gstNo) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-[11px]">
                    {vatNo && (
                      <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 font-medium text-purple-700 border border-purple-100">
                        <span>VAT Reg:</span>
                        <span className="font-bold">{vatNo}</span>
                      </span>
                    )}
                    {gstNo && (
                      <span className="inline-flex items-center gap-1 rounded bg-primary-50 px-2 py-0.5 font-medium text-primary border border-primary/20">
                        <span>GSTIN:</span>
                        <span className="font-bold">{gstNo}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* <fieldset className="mt-6 rounded-2xl border border-border bg-surface p-4">
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
            </fieldset> */}

            {/* Bill Summary */}
            <div className="mt-6">
              <BillBreakdown
                breakdown={billBreakdown}
                title="Bill Summary"
                showItemsList={false}
                defaultExpanded={true}
                vatNo={vatNo}
                gstNo={gstNo}
              />
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
