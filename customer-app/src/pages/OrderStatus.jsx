import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiArrowLeft,
  HiOutlineHome,
  HiOutlineClipboardCheck,
  HiOutlineFire,
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineDownload,
  HiPlus,
  HiMinus,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import menuService from '../services/menuService';
import Loader from '../components/Loader';
import generateBillPdf from '../utils/generateBillPdf';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: HiOutlineClock, color: '#f59e0b' },
  { key: 'confirmed', label: 'Confirmed', icon: HiOutlineClipboardCheck, color: '#3b82f6' },
  { key: 'preparing', label: 'Preparing', icon: HiOutlineFire, color: '#8b5cf6' },
  { key: 'ready', label: 'Ready', icon: HiOutlineBell, color: '#10b981' },
  { key: 'served', label: 'Served', icon: HiOutlineCheckCircle, color: '#008080' },
];

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

export default function OrderStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [menuCategories, setMenuCategories] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [editingItems, setEditingItems] = useState(false);
  const [draftItems, setDraftItems] = useState([]);
  const [updatingItems, setUpdatingItems] = useState(false);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadStatus = async () => {
    try {
      const res = await orderService.getStatus(orderId);
      const nextOrder = res.data.data;
      setOrder(nextOrder);
      if (!editingItems && nextOrder?.items) {
        setDraftItems(toDraftItems(nextOrder.items));
      }
    } catch {
      toast.error('Failed to load order status');
    } finally {
      setLoading(false);
    }
  };

  const toDraftItems = (items = []) =>
    items
      .map((item) => {
        const quantity =
          Number(item.quantity || 0) - Number(item.cancelledQuantity || 0);
        return {
          menuItemId: item.menuItemId?._id || item.menuItemId,
          name: item.name,
          price: Number(item.price || 0),
          quantity: Math.max(0, quantity),
          itemType: item.itemType || 'food',
        };
      })
      .filter((item) => item.quantity > 0);

  const loadMenuItems = async (restaurantId) => {
    if (!restaurantId || menuCategories.length > 0) return;
    try {
      const res = await menuService.getFullMenu(restaurantId);
      const categories = res.data?.data || [];
      setMenuCategories(
        categories.map((category) => ({
          _id: category._id,
          name: category.name,
          items: (category.items || []).map((item) => ({
            menuItemId: item._id,
            name: item.name,
            price: Number(item.price || 0),
            itemType: item.itemType || 'food',
          })),
        })),
      );
    } catch {
      toast.error('Failed to load menu items');
    }
  };

  if (loading) return <Loader />;
  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-warm">
        <div className="text-center">
          <span className="text-5xl">😕</span>
          <p className="mt-3 text-sm text-text-light">Order not found</p>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const canPayOnline =
    Boolean(order.tableId) &&
    Boolean(order.isPaymentGatewayAllocated) &&
    order.paymentStatus !== 'paid' &&
    !isCancelled;
  const canEditItems =
    Boolean(order.tableId) &&
    order.paymentStatus !== 'paid' &&
    !['cancelled', 'served'].includes(order.status);
  const restaurantId = order.restaurantId?._id || order.restaurantId;
  const draftTotal = draftItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const normalizedItemSearch = itemSearch.trim().toLowerCase();
  const filteredMenuCategories = menuCategories
    .map((category) => {
      if (!normalizedItemSearch) return category;
      const categoryMatches = category.name
        ?.toLowerCase()
        .includes(normalizedItemSearch);
      const items = categoryMatches
        ? category.items
        : category.items.filter((item) =>
            item.name?.toLowerCase().includes(normalizedItemSearch),
          );
      return { ...category, items };
    })
    .filter((category) => category.items.length > 0);

  const getDraftQuantity = (menuItemId) =>
    draftItems.find((item) => item.menuItemId === menuItemId)?.quantity || 0;

  const updateDraftQuantity = (menuItem, quantity) => {
    const nextQuantity = Math.max(0, Number(quantity || 0));
    setDraftItems((prev) => {
      const exists = prev.some((item) => item.menuItemId === menuItem.menuItemId);
      if (!exists && nextQuantity > 0) {
        return [...prev, { ...menuItem, quantity: nextQuantity }];
      }
      return prev
        .map((item) =>
          item.menuItemId === menuItem.menuItemId
            ? { ...item, quantity: nextQuantity }
            : item,
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const openItemEditor = async () => {
    setDraftItems(toDraftItems(order.items || []));
    setItemSearch('');
    await loadMenuItems(restaurantId);
    setEditingItems(true);
  };

  const handleUpdateItems = async () => {
    if (!draftItems.length) {
      toast.error('Order must contain at least one item');
      return;
    }

    setUpdatingItems(true);
    try {
      const res = await orderService.updateCustomerItems(order._id, draftItems);
      setOrder(res.data.data);
      setDraftItems(toDraftItems(res.data.data?.items || []));
      setEditingItems(false);
      toast.success('Order updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdatingItems(false);
    }
  };

  const handlePayOnline = async () => {
    if (!canPayOnline || paying) return;

    setPaying(true);
    try {
      const paymentRes = await paymentService.createOrder(order._id);
      const payment = paymentRes.data?.data || paymentRes.data;
      if (!payment?.razorpayOrderId || !payment?.keyId) {
        throw new Error('Payment details are missing for this order');
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Payment gateway failed to load');
        return;
      }

      const rzp = new window.Razorpay({
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
            toast.success('Payment successful');
            await loadStatus();
          } catch (err) {
            toast.error(
              err.response?.data?.message || 'Payment verification failed',
            );
          }
        },
        theme: { color: '#3c50e0' },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start payment');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <div className="bg-primary px-4 pb-16 pt-4 text-center text-white">
        <div className="mx-auto flex max-w-lg items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
          >
            <HiArrowLeft size={18} />
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
          >
            <HiOutlineHome size={18} />
          </button>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="mb-4"
        >
          {isCancelled ? (
            <HiOutlineXCircle size={64} className="mx-auto text-red-300" />
          ) : currentStepIndex >= 4 ? (
            <HiOutlineCheckCircle size={64} className="mx-auto text-green-300" />
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
            </div>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold"
        >
          {isCancelled
            ? 'Order Cancelled'
            : currentStepIndex >= 4
            ? 'Order Complete!'
            : 'Order in Progress'}
        </motion.h1>
        <p className="mt-1 text-sm text-white/70">
          #{order.orderNumber}
        </p>
        {order.orderType && (
          <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${order.orderType === 'takeaway' ? 'bg-orange-400/20 text-orange-100' : 'bg-teal-400/20 text-teal-100'}`}>
            {order.orderType === 'takeaway' ? 'Takeaway' : 'Dine In'}
          </span>
        )}
      </div>

      {/* Status Card */}
      <div className="mx-auto -mt-10 max-w-lg px-4">
        <div className="rounded-2xl bg-surface p-6 shadow-lg border border-border">
          {isCancelled ? (
            <div className="text-center py-4">
              <HiOutlineXCircle size={48} className="mx-auto text-danger" />
              <p className="mt-3 text-sm text-text-secondary">
                This order has been cancelled
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={isCurrent ? { scale: 0 } : {}}
                        animate={isCurrent ? { scale: 1 } : {}}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          isCompleted
                            ? 'shadow-md'
                            : 'border-2 border-border bg-surface'
                        }`}
                        style={
                          isCompleted
                            ? { backgroundColor: step.color }
                            : {}
                        }
                      >
                        <Icon
                          size={20}
                          className={
                            isCompleted ? 'text-white' : 'text-text-light'
                          }
                        />
                      </motion.div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div
                          className={`h-8 w-0.5 ${
                            index < currentStepIndex
                              ? 'bg-primary'
                              : 'bg-border'
                          }`}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex items-start pb-8">
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isCompleted ? 'text-text' : 'text-text-light'
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-0.5 text-xs text-primary font-medium"
                          >
                            Current status
                          </motion.p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Items & Price Distribution */}
          {order.items && order.items.length > 0 && (
            <div className="mt-4 rounded-xl bg-surface-cool p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-text">Order Items</h3>
                {canEditItems && (
                  <button
                    type="button"
                    onClick={openItemEditor}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Edit Items
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {order.items.map((item, i) => {
                  const totalQty = Number(item.quantity || 0);
                  const cancelledQty = Number(item.cancelledQuantity || 0);
                  const remainingQty = Math.max(0, totalQty - cancelledQty);
                  const lineTotal = item.price * remainingQty;
                  const hasTax = order.taxAmount > 0;
                  const isInclusive = hasTax && (order.taxType || 'exclusive') === 'inclusive';
                  const rate = order.taxRate || 0;
                  const cgstR = order.cgstRate || 0;
                  const sgstR = order.sgstRate || 0;
                  let base, itemCgst, itemSgst;
                  if (hasTax) {
                    if (isInclusive) {
                      base = Math.round(lineTotal / (1 + rate / 100) * 100) / 100;
                      const tax = Math.round((lineTotal - base) * 100) / 100;
                      itemCgst = Math.round(tax / 2 * 100) / 100;
                      itemSgst = Math.round((tax - itemCgst) * 100) / 100;
                    } else {
                      base = lineTotal;
                      itemCgst = Math.round(base * cgstR / 100 * 100) / 100;
                      itemSgst = Math.round(base * sgstR / 100 * 100) / 100;
                    }
                  }
                  return (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <span className="text-sm text-text">
                          {item.name} x {remainingQty}
                          {cancelledQty > 0 && (
                            <span className="ml-1 text-[11px] text-danger">
                              (cancelled {cancelledQty}/{totalQty})
                            </span>
                          )}
                        </span>
                        {cancelledQty > 0 && item.cancelReason && (
                          <div className="text-[11px] text-danger mt-0.5">
                            Reason: {item.cancelReason}
                          </div>
                        )}
                        {hasTax && (
                          <div className="text-[11px] text-text-light space-x-2">
                            <span>Base: ₹{base.toFixed(2)}</span>
                            <span>CGST: ₹{itemCgst.toFixed(2)}</span>
                            <span>SGST: ₹{itemSgst.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-text">₹{lineTotal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {editingItems && (
            <div className="mt-3 rounded-xl bg-surface-cool p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-text">
                  Update Items
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingItems(false)}
                  className="text-xs font-medium text-text-light"
                >
                  Cancel
                </button>
              </div>
              <input
                type="text"
                value={itemSearch}
                onChange={(event) => setItemSearch(event.target.value)}
                placeholder="Search category or menu item..."
                className="mb-3 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-text-light focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
                {filteredMenuCategories.length === 0 ? (
                  <p className="rounded-xl bg-surface px-3 py-6 text-center text-sm text-text-light">
                    No menu items found
                  </p>
                ) : (
                  filteredMenuCategories.map((category) => (
                    <div key={category._id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wide text-text-secondary">
                          {category.name}
                        </h4>
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {category.items.length}
                        </span>
                      </div>
                      {category.items.map((item) => {
                        const qty = getDraftQuantity(item.menuItemId);
                        return (
                          <div
                            key={item.menuItemId}
                            className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-text">
                                {item.name}
                              </p>
                              <p className="text-xs text-text-light">
                                Rs {item.price}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 rounded-lg bg-primary px-1 py-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateDraftQuantity(item, qty - 1)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md text-white"
                              >
                                <HiMinus size={14} />
                              </button>
                              <span className="min-w-[22px] text-center text-sm font-bold text-white">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateDraftQuantity(item, qty + 1)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md text-white"
                              >
                                <HiPlus size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-surface px-3 py-2">
                <span className="text-sm font-semibold text-text">
                  New item total
                </span>
                <span className="text-sm font-bold text-primary">
                  Rs {draftTotal}
                </span>
              </div>
              <button
                type="button"
                onClick={handleUpdateItems}
                disabled={updatingItems}
                className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {updatingItems ? 'Updating...' : 'Update Order'}
              </button>
            </div>
          )}

          {/* Amount Summary */}
          {order.taxAmount > 0 && (
            <>
              {/* Food (GST) */}
              {(order.cgstAmount > 0 || order.sgstAmount > 0) && (
                <>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-cool p-4">
                    <span className="text-sm text-text-secondary">
                      Food Subtotal
                    </span>
                    <span className="text-sm font-medium text-text">
                      ₹{Number(order.foodSubtotal ?? order.subtotalAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-cool p-4">
                    <span className="text-sm text-text-secondary">CGST ({order.cgstRate}%)</span>
                    <span className="text-sm font-medium text-text">
                      ₹{Number(order.cgstAmount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-cool p-4">
                    <span className="text-sm text-text-secondary">SGST ({order.sgstRate}%)</span>
                    <span className="text-sm font-medium text-text">
                      ₹{Number(order.sgstAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {/* Liquor (VAT) */}
              {order.vatAmount > 0 && (
                <>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-cool p-4">
                    <span className="text-sm text-text-secondary">
                      Liquor Subtotal
                    </span>
                    <span className="text-sm font-medium text-text">
                      ₹{Number(order.liquorSubtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-cool p-4">
                    <span className="text-sm text-text-secondary">VAT ({order.vatRate}%)</span>
                    <span className="text-sm font-medium text-text">
                      ₹{Number(order.vatAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
          <div className={`${order.taxAmount > 0 ? 'mt-2' : 'mt-4'} flex items-center justify-between rounded-xl bg-surface-cool p-4`}>
            <span className="text-sm text-text-secondary">Total Amount</span>
            <span className="text-lg font-bold text-text">
              ₹{order.totalAmount}
            </span>
          </div>

          {/* Payment Status */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-cool p-4">
            <span className="text-sm text-text-secondary">Payment</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                order.paymentStatus === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : order.paymentStatus === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>

          {Boolean(order.tableId) && order.paymentStatus !== 'paid' && !isCancelled && (
            <div className="mt-3 rounded-xl bg-surface-cool p-4">
              <h3 className="text-sm font-semibold text-text">
                Payment Method
              </h3>
              <p className="mt-1 text-xs text-text-light">
                Pay at the counter, or pay online from this order page.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-surface px-3 py-2 text-center">
                  <p className="text-xs text-text-light">Cash</p>
                  <p className="text-sm font-semibold text-text">
                    Pay at counter
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePayOnline}
                  disabled={!canPayOnline || paying}
                  className="rounded-xl bg-primary px-3 py-2 text-center text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <p className="text-xs text-white/80">Online</p>
                  <p className="text-sm font-semibold">
                    {paying ? 'Starting...' : 'Pay Now'}
                  </p>
                </button>
              </div>
              {!order.isPaymentGatewayAllocated && (
                <p className="mt-2 text-xs text-text-light">
                  Online payment is not available for this restaurant.
                </p>
              )}
            </div>
          )}

          {order.status === 'served' && (
            <button
              type="button"
              onClick={() => generateBillPdf(order)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
            >
              <HiOutlineDownload size={18} />
              Download PDF
            </button>
          )}
        </div>

        {/* Auto-refresh note */}
        {!isCancelled && currentStepIndex < 4 && (
          <p className="mt-4 text-center text-xs text-text-light">
            Auto-refreshing every 10 seconds
          </p>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
