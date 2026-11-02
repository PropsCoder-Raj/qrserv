import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineRefresh,
  HiCash,
  HiOutlineCreditCard,
  HiOutlinePrinter,
} from 'react-icons/hi';
import orderService from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';
import { getOrdersSocket } from '../services/socket';
import Orders from './Orders';
import { formatCurrency } from '../utils/formatCurrency';
import generateKotPdf from '../utils/generateKotPdf';

const KITCHEN_STATUSES = ['confirmed', 'ready'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed'];

const KITCHEN_TRANSITIONS = { confirmed: 'ready' };

export default function StaffOrders() {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const restaurantId = user?.restaurantId;
  // Kitchen staff see only KOT details; payment data and the customer bill stay hidden.
  const isKitchen = user?.role === 'kitchen';

  // Always fetch the full (unfiltered) list so status filter buttons can
  // show accurate counts; the active filter is then applied client-side.
  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await orderService.getAll(restaurantId, undefined, { limit: 100, sortOrder: 'desc' });
      const result = res.data.data;
      setAllOrders(result.data || result);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Keep the list fresh when a new order arrives. Chime and toast are handled by StaffAlertsListener.
  useEffect(() => {
    if (!restaurantId) return undefined;
    const socket = getOrdersSocket();
    socket.on('order:new', loadOrders);
    return () => {
      socket.off('order:new', loadOrders);
    };
  }, [restaurantId, loadOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status);
      toast.success(`Status updated to ${status}`);
      loadOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const updatePaymentStatus = async (orderId, paymentStatus) => {
    try {
      await orderService.updatePaymentStatus(orderId, paymentStatus);
      toast.success(`Payment updated to ${paymentStatus}`);
      loadOrders();
    } catch {
      toast.error('Failed to update payment');
    }
  };

  const updatePaymentMethod = async (orderId, paymentMethod) => {
    try {
      const normalizedMethod = String(paymentMethod || 'CASH').toUpperCase();
      await orderService.updatePaymentMethod(orderId, normalizedMethod);
      toast.success(`Payment method updated to ${normalizedMethod}`);
      loadOrders();
    } catch {
      toast.error('Failed to update payment method');
    }
  };

  const getNextStatus = (currentStatus) => KITCHEN_TRANSITIONS[currentStatus] || null;

  const statusColor = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      ready: 'bg-green-100 text-green-700 border-green-200',
      completed: 'bg-slate-100 text-slate-600 border-slate-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return map[status] || map.pending;
  };

  const paymentColor = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return map[status] || map.pending;
  };

  const getTableLabel = (order) => {
    const table = order?.tableId;
    if (!table) return '-';
    if (typeof table === 'object') {
      return table.tableNumber ? `Table ${table.tableNumber}` : table._id || '-';
    }
    return table;
  };

  const kitchenOrders = allOrders.filter((o) => KITCHEN_STATUSES.includes(o.status));
  const statusCounts = KITCHEN_STATUSES.reduce((acc, s) => {
    acc[s] = kitchenOrders.filter((o) => o.status === s).length;
    return acc;
  }, {});
  const orders = filterStatus
    ? kitchenOrders.filter((o) => o.status === filterStatus)
    : kitchenOrders;

  if (user?.role === 'captain' || user?.role === 'manager') return <Orders />;

  if (!restaurantId) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        No restaurant assigned to your account.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Orders</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="inline-flex items-center gap-1 rounded-lg border border-stroke px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <HiOutlineRefresh size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${!filterStatus ? 'bg-primary text-white' : 'border border-stroke text-slate-600 hover:bg-slate-50'}`}
        >
          All ({kitchenOrders.length})
        </button>
        {KITCHEN_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${filterStatus === s ? 'bg-primary text-white' : 'border border-stroke text-slate-600 hover:bg-slate-50'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-slate-500">
          No orders found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            const tableLabel = getTableLabel(order);
            return (
              <div
                key={order._id}
                className={`rounded-xl border-2 bg-card p-4 shadow-sm ${statusColor(order.status)}`}
              >
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-800">#{order.orderNumber}</span>
                    <button
                      type="button"
                      onClick={() => window.open(`/admin/print/bill/${order._id}?kot=1`, '_blank')}
                      title="Live Thermal KOT Ticket"
                      className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 shadow-xs hover:bg-amber-100 cursor-pointer"
                    >
                      <HiOutlinePrinter size={13} className="text-amber-600" />
                      Thermal KOT
                    </button>
                    {!isKitchen && (
                      <button
                        type="button"
                        onClick={() => window.open(`/admin/print/bill/${order._id}`, '_blank')}
                        title="Live Thermal Bill"
                        className="inline-flex items-center gap-1 rounded-md border border-stroke bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
                      >
                        <HiOutlinePrinter size={13} className="text-slate-500" />
                        Bill
                      </button>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="mb-3 text-sm font-medium text-slate-600">
                  {tableLabel}
                </div>

                {/* Overall Order Note Highlighted Banner */}
                {(order.order_instructions || order.orderInstructions || order.notes) && (
                  <div className="mb-3 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-2.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                      <span>🔔</span>
                      <span>Special Order Note</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-amber-950 break-words">
                      {order.order_instructions || order.orderInstructions || order.notes}
                    </p>
                  </div>
                )}

                {/* Items */}
                <div className="mb-3 space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="text-sm text-slate-700 pb-1.5 border-b border-stroke/50 last:border-0 last:pb-0">
                      {(() => {
                        const totalQty = Number(item.quantity || 0);
                        const cancelledQty = Number(item.cancelledQuantity || 0);
                        const remainingQty = Math.max(0, totalQty - cancelledQty);
                        return (
                          <div className="flex justify-between font-medium">
                            <span>
                              {remainingQty}x {item.name}
                              {cancelledQty > 0 && (
                                <span className="ml-1 text-[10px] text-red-600 font-normal">
                                  (cancelled {cancelledQty}/{totalQty})
                                </span>
                              )}
                            </span>
                            <span className="text-slate-500 font-normal">{formatCurrency(item.price * remainingQty)}</span>
                          </div>
                        );
                      })()}
                      {(item.spiceLevel?.name || item.addOns?.length > 0) && (
                        <div className="ml-2 mt-0.5 space-y-0.5 text-[11px] text-slate-500">
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
                      {(item.cookingNote || item.specialInstructions || item.notes) && (
                        <div className="mt-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 shadow-xs flex items-start gap-1.5">
                          <span className="shrink-0 text-amber-700">📝 Note:</span>
                          <span className="break-words font-medium">{item.cookingNote || item.specialInstructions || item.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total & Payment (hidden for kitchen staff) */}
                {!isKitchen && (
                <div className="mb-3 flex items-center justify-between border-t border-stroke pt-2">
                  <span className="text-base font-bold text-slate-800">{formatCurrency(order.totalAmount)}</span>
                  <div className="flex items-center gap-2">
                    <fieldset>
                      <legend className="sr-only">Payment method</legend>
                      <div className="flex gap-1">
                        {[
                          { value: 'CASH', label: 'Cash' },
                          { value: 'CARD', label: 'Card' },
                        ].map((option) => {
                          const isActive =
                            (order.paymentMethod?.toUpperCase() === 'CARD'
                              ? 'CARD'
                              : 'CASH') === option.value;
                          return (
                            <label
                              key={option.value}
                              className={`flex cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
                                isActive
                                  ? 'border-primary bg-primary/5 text-slate-800'
                                  : 'border-stroke text-slate-500'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`paymentMethod-${order._id}`}
                                value={option.value}
                                checked={isActive}
                                onChange={() => updatePaymentMethod(order._id, option.value)}
                                className="accent-primary"
                              />
                              {option.value === 'CASH' ? (
                                <HiCash size={14} className="text-green-600" aria-hidden="true" />
                              ) : (
                                <HiOutlineCreditCard size={14} className="text-blue-600" aria-hidden="true" />
                              )}
                              {option.label}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                    <button
                      onClick={() => updatePaymentStatus(order._id, order.paymentStatus === 'paid' ? 'pending' : 'paid')}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition ${paymentColor(order.paymentStatus)}`}
                    >
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Mark Paid'}
                    </button>
                  </div>
                </div>
                )}

                {/* Status Actions: kitchen may only move CONFIRMED -> READY */}
                {nextStatus && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(order._id, nextStatus)}
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-dark cursor-pointer"
                    >
                      Mark Ready
                    </button>
                  </div>
                )}

                {/* Time */}
                <div className="mt-2 text-[10px] text-slate-400">
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
