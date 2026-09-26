import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineRefresh } from 'react-icons/hi';
import orderService from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed'];

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'served'];

export default function StaffOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const [cancelState, setCancelState] = useState({
    openForOrderId: null,
    itemIndex: 0,
    cancelQuantity: 1,
    reason: '',
    submitting: false,
  });

  const restaurantId = user?.restaurantId;

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await orderService.getAll(restaurantId, filterStatus || undefined, { limit: 50, sortOrder: 'desc' });
      const result = res.data.data;
      setOrders(result.data || result);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterStatus]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

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

  const cancelOrderItem = async (order) => {
    try {
      setCancelState((p) => ({ ...p, submitting: true }));
      if (!cancelState.reason?.trim()) {
        toast.error('Please enter cancel reason');
        return;
      }
      const res = await orderService.cancelOrderItem(order._id, {
        itemIndex: Number(cancelState.itemIndex),
        cancelQuantity: Number(cancelState.cancelQuantity),
        reason: cancelState.reason.trim(),
      });
      const updated = res.data.data;
      toast.success('Item cancelled');
      setOrders((prev) => prev.map((o) => (o._id === order._id ? updated : o)));
      setCancelState((p) => ({
        ...p,
        submitting: false,
        reason: '',
      }));
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to cancel item');
    } finally {
      setCancelState((p) => ({ ...p, submitting: false }));
    }
  };

  const getNextStatus = (currentStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
    return null;
  };

  const statusColor = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      preparing: 'bg-purple-100 text-purple-700 border-purple-200',
      ready: 'bg-green-100 text-green-700 border-green-200',
      served: 'bg-slate-100 text-slate-600 border-slate-200',
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
          All
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${filterStatus === s ? 'bg-primary text-white' : 'border border-stroke text-slate-600 hover:bg-slate-50'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
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
                  <span className="text-lg font-bold text-slate-800">#{order.orderNumber}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="mb-3 text-sm font-medium text-slate-600">
                  {tableLabel}
                </div>

                {/* Items */}
                <div className="mb-3 space-y-1">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-slate-700">
                      {(() => {
                        const totalQty = Number(item.quantity || 0);
                        const cancelledQty = Number(item.cancelledQuantity || 0);
                        const remainingQty = Math.max(0, totalQty - cancelledQty);
                        return (
                          <>
                            <span>
                              {remainingQty}x {item.name}
                              {cancelledQty > 0 && (
                                <span className="ml-1 text-[10px] text-red-600">
                                  (cancelled {cancelledQty}/{totalQty})
                                </span>
                              )}
                            </span>
                            <span className="text-slate-500">{item.price * remainingQty}</span>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>

                {/* Cancel item action (only until preparing) */}
                {['pending', 'confirmed', 'preparing'].includes(order.status) && (
                  <div className="mb-3 rounded-lg border border-stroke bg-white p-2">
                    <div className="mb-2 text-[11px] font-semibold text-slate-600">
                      Cancel item
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <select
                        value={cancelState.openForOrderId === order._id ? cancelState.itemIndex : 0}
                        onChange={(e) =>
                          setCancelState((p) => ({
                            ...p,
                            openForOrderId: order._id,
                            itemIndex: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-stroke bg-slate-50 px-2 py-2 text-xs outline-none"
                      >
                        {(order.items || []).map((it, idx) => {
                          const totalQty = Number(it.quantity || 0);
                          const cancelledQty = Number(it.cancelledQuantity || 0);
                          const remaining = Math.max(0, totalQty - cancelledQty);
                          return (
                            <option key={idx} value={idx} disabled={remaining <= 0}>
                              {it.name} (rem {remaining})
                            </option>
                          );
                        })}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min={1}
                          value={cancelState.openForOrderId === order._id ? cancelState.cancelQuantity : 1}
                          onChange={(e) =>
                            setCancelState((p) => ({
                              ...p,
                              openForOrderId: order._id,
                              cancelQuantity: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-stroke bg-slate-50 px-2 py-2 text-xs outline-none"
                          placeholder="Qty"
                        />
                        <button
                          onClick={() => cancelOrderItem(order)}
                          disabled={cancelState.submitting || cancelState.openForOrderId !== order._id}
                          className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                        >
                          {cancelState.submitting && cancelState.openForOrderId === order._id
                            ? 'Cancelling...'
                            : 'Cancel'}
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={cancelState.openForOrderId === order._id ? cancelState.reason : ''}
                        onChange={(e) =>
                          setCancelState((p) => ({
                            ...p,
                            openForOrderId: order._id,
                            reason: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-stroke bg-slate-50 px-2 py-2 text-xs outline-none"
                        placeholder="Reason"
                      />
                    </div>
                  </div>
                )}

                {/* Total & Payment */}
                <div className="mb-3 flex items-center justify-between border-t border-stroke pt-2">
                  <span className="text-base font-bold text-slate-800">{order.totalAmount}</span>
                  <button
                    onClick={() => updatePaymentStatus(order._id, order.paymentStatus === 'paid' ? 'pending' : 'paid')}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition ${paymentColor(order.paymentStatus)}`}
                  >
                    {order.paymentStatus === 'paid' ? 'Paid' : 'Mark Paid'}
                  </button>
                </div>

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2">
                  {nextStatus && (
                    <button
                      onClick={() => updateStatus(order._id, nextStatus)}
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-dark cursor-pointer"
                    >
                      Mark {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'served' && (
                    <button
                      onClick={() => updateStatus(order._id, 'cancelled')}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

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
