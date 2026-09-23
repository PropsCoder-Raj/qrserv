import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowLeft, HiPlus, HiMinus, HiTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    restaurantId,
    tableId,
    orderType,
    setCartOrderType,
    paymentMethod: cartPaymentMethod,
    isPaymentGatewayAllocated,
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
  const paymentMethod = hasTable ? 'cash' : cartPaymentMethod;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [placing, setPlacing] = useState(false);

  const orderTypeOptions = [
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'dine_in', label: 'Dine In' },
  ];
  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'online', label: 'Online' },
  ];

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCustomerPhone(digitsOnly);

    if (!digitsOnly) {
      setPhoneError('');
      return;
    }

    if (!/^[6-9]/.test(digitsOnly)) {
      setPhoneError('Mobile number must start with 6, 7, 8, or 9');
      return;
    }

    if (digitsOnly.length < 10) {
      setPhoneError('Mobile number must be 10 digits');
      return;
    }

    setPhoneError('');
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
    if (!customerPhone || phoneError || !/^[6-9]\d{9}$/.test(customerPhone)) {
      setPhoneError(
        phoneError || 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9',
      );
      toast.error('Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return;
    }

    setPlacing(true);
    let orderForRollback = null;
    let razorpayOrderIdForRollback = '';
    let rollbackDone = false;
    try {
      const orderData = {
        restaurantId,
        ...(tableId ? { tableId } : {}),
        orderType,
        paymentMethod: hasTable ? 'cash' : paymentMethod,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          itemType: i.itemType || 'food',
        })),
        customerName: customerName || undefined,
        customerPhone,
      };

      const res = await orderService.createForCustomer(orderData);
      const payload = res.data?.data || {};
      const order = payload.order || payload;
      const paymentRequired = Boolean(payload.paymentRequired);
      orderForRollback = order;

      if (customerPhone) {
        localStorage.setItem('customerPhone', customerPhone);
      }

      if (!paymentRequired) {
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/order/${order._id}`, { replace: true });
        return;
      }

      const payment = payload.payment;
      if (!payment?.razorpayOrderId || !payment?.keyId) {
        throw new Error('Payment details are missing for this order');
      }
      razorpayOrderIdForRollback = payment.razorpayOrderId;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        await orderService.rollbackFailedPaymentOrder(
          order._id,
          payment.razorpayOrderId,
        );
        rollbackDone = true;
        toast.error('Payment gateway failed to load. Order was not created.');
        return;
      }

      let completed = false;
      const options = {
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        name: 'QR Order',
        description: `Order ${order.orderNumber || ''}`,
        order_id: payment.razorpayOrderId,
        handler: async (response) => {
          try {
            await paymentService.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            completed = true;
            clearCart();
            toast.success('Payment successful! Order placed.');
            navigate(`/order/${order._id}`, { replace: true });
          } catch (verifyErr) {
            try {
              await orderService.rollbackFailedPaymentOrder(
                order._id,
                payment.razorpayOrderId,
              );
              rollbackDone = true;
            } catch {
              // ignore rollback errors in UI path
            }
            toast.error(
              verifyErr.response?.data?.message ||
                'Payment failed. Order was not created.',
            );
          }
        },
        prefill: {
          name: customerName || '',
          contact: customerPhone || '',
        },
        theme: { color: '#3c50e0' },
        modal: {
          ondismiss: () => {
            if (completed) return;
            orderService
              .rollbackFailedPaymentOrder(order._id, payment.razorpayOrderId)
              .finally(() => {
                rollbackDone = true;
                toast.error('Payment cancelled. Order was not created.');
              });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      if (
        !rollbackDone &&
        orderForRollback?._id &&
        razorpayOrderIdForRollback
      ) {
        try {
          await orderService.rollbackFailedPaymentOrder(
            orderForRollback._id,
            razorpayOrderIdForRollback,
          );
        } catch {
          // ignore rollback errors
        }
      }
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
            {/* <p className="text-xs text-text-light">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                orderType === 'takeaway'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-teal-100 text-teal-700'
              }`}>
                {orderType === 'dine_in' ? 'Dine In' : 'Takeaway'}
              </span>
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                paymentMethod === 'online'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {paymentMethod === 'online' ? 'Online Payment' : 'Cash Payment'}
              </span>
            </p> */}
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
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      isActive
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
                    key={item.menuItemId}
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
                      <p className="mt-0.5 text-sm font-medium text-primary">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-xl bg-surface-cool p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.menuItemId, item.quantity - 1)
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
                          updateQuantity(item.menuItemId, item.quantity + 1)
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

            {/* Customer Info */}
            {grandTotal < 0 && (
                    <span className="text-base font-bold text-primary">₹{grandTotal}</span>
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
                  onChange={handlePhoneChange}
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  required
                  className={`w-full rounded-xl border bg-surface-cool px-4 py-3 text-sm outline-none placeholder:text-text-light focus:ring-2 ${
                    phoneError
                      ? 'border-danger focus:border-danger focus:ring-danger/10'
                      : 'border-border focus:border-primary focus:ring-primary/10'
                  }`}
                />
                {phoneError && (
                  <p className="px-1 text-xs text-danger">{phoneError}</p>
                )}
              </div>
            </div>

            {isPaymentGatewayAllocated && !hasTable && (
                  <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
                <h3 className="mb-3 text-sm font-semibold text-text">
                  Payment Method
                </h3>
                <div className="inline-flex rounded-full bg-surface-cool p-1">
                  {paymentMethodOptions.map((option) => {
                    const isActive = paymentMethod === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCartPaymentMethod(option.value)}
                        className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                          isActive
                            ? 'bg-surface text-text shadow-sm'
                            : 'text-text-light'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-text-light">
                  Choose cash payment or pay online with Razorpay.
                </p>
              </div>
                )}

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
                      base = Math.round(lineTotal / (1 + rate / 100) * 100) / 100;
                      const tax = Math.round((lineTotal - base) * 100) / 100;
                      itemCgst = Math.round(tax / 2 * 100) / 100;
                      itemSgst = Math.round((tax - itemCgst) * 100) / 100;
                    } else {
                      base = lineTotal;
                      itemCgst = Math.round(base * cgstRate / 100 * 100) / 100;
                      itemSgst = Math.round(base * sgstRate / 100 * 100) / 100;
                    }
                  }
                  if (hasItemVat) {
                    const vr = vatRate || 0;
                    if (vatIncl) {
                      base = Math.round(lineTotal / (1 + vr / 100) * 100) / 100;
                      itemVat = Math.round((lineTotal - base) * 100) / 100;
                    } else {
                      base = lineTotal;
                      itemVat = Math.round(base * vr / 100 * 100) / 100;
                    }
                  }
                  return (
                    <div key={item.menuItemId}>
                      <div className="flex justify-between text-text-secondary">
                        <span>{item.name}{isLiquor ? ' [L]' : ''} x {item.quantity}</span>
                        <span>₹{lineTotal}</span>
                      </div>
                      {hasGst && (
                        <div className="text-[11px] text-text-light ml-1 mt-0.5 space-x-2">
                          <span>Base: ₹{base.toFixed(2)}</span>
                          <span>CGST: ₹{itemCgst.toFixed(2)}</span>
                          <span>SGST: ₹{itemSgst.toFixed(2)}</span>
                        </div>
                      )}
                      {hasItemVat && (
                        <div className="text-[11px] text-text-light ml-1 mt-0.5 space-x-2">
                          <span>Base: ₹{base.toFixed(2)}</span>
                          <span>VAT: ₹{itemVat.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="border-t border-border pt-2 space-y-1">
                  {(cgstAmount + sgstAmount) > 0 && (
                    <>
                      <div className="flex justify-between text-text-secondary">
                        <span>Food Subtotal</span>
                        <span>₹{foodSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>CGST ({cgstRate}%)</span>
                        <span>₹{cgstAmount}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>SGST ({sgstRate}%)</span>
                        <span>₹{sgstAmount}</span>
                      </div>
                    </>
                  )}
                  {vatAmount > 0 && (
                    <>
                      <div className="flex justify-between text-text-secondary">
                        <span>Liquor Subtotal</span>
                        <span>₹{liquorSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>VAT ({vatRate}%)</span>
                        <span>₹{vatAmount}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold text-text">
                    <span>Total</span>
                    <span className="text-primary">₹{grandTotal}</span>
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
                  `${paymentMethod === 'online' ? 'Pay Online' : 'Place Order'}  •  ₹${grandTotal}`
                )}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
