import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlinePrinter } from 'react-icons/hi';
import orderService from '../services/orderService';
import generateBillPdf from '../utils/generateBillPdf';
import restaurantService from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import useSubscription from '../hooks/useSubscription';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import subscriptionService from '../services/subscriptionService';
import DatePresetFilter from '../components/DatePresetFilter';

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed'];

export default function Orders() {
  const { user } = useAuth();
  const { hasCustomerData, customerDataIncluded } = useSubscription();
  const isSuperAdmin = user?.role === 'super_admin';
  const isOrgAdmin = user?.role === 'org_admin';
  const showAllOption = isSuperAdmin || isOrgAdmin;
  const [customerInfoEnabled, setCustomerInfoEnabled] = useState(true);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState({ open: false, order: null });

  // Cancel item state (within detail modal)
  const [cancelForm, setCancelForm] = useState({
    itemIndex: 0,
    cancelQuantity: 1,
    reason: '',
    submitting: false,
  });

  // Pagination, search, sort state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [datePreset, setDatePreset] = useState('');

  useEffect(() => { loadRestaurants(); }, []);

  const loadOrders = useCallback(async () => {
    if (!restaurantsLoaded) return;
    setLoading(true);
    try {
      const res = await orderService.getAll(
        selectedRestaurant || undefined,
        filterStatus || undefined,
        {
          page,
          limit: 10,
          search: search || undefined,
          sortBy: sortBy || undefined,
          sortOrder,
          datePreset: datePreset || undefined,
        },
      );
      const result = res.data.data;
      setOrders(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [
    selectedRestaurant,
    restaurantsLoaded,
    filterStatus,
    page,
    search,
    sortBy,
    sortOrder,
    datePreset,
  ]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const loadRestaurants = async () => {
    try {
      const res = isSuperAdmin ? await restaurantService.getAll({ limit: 100 }) : await restaurantService.getMy({ limit: 100 });
      const list = res.data.data.data || res.data.data;
      const arr = Array.isArray(list) ? list : [];
      setRestaurants(arr);
      if (!showAllOption && arr.length > 0) {
        setSelectedRestaurant(arr[0]._id);
      }
    } catch { toast.error('Failed to load restaurants'); }
    finally { setRestaurantsLoaded(true); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status);
      toast.success(`Order status updated to ${status}`);
      loadOrders();
      if (detailModal.order?._id === orderId) {
        setDetailModal((prev) => ({ ...prev, order: { ...prev.order, status } }));
      }
    } catch { toast.error('Failed to update status'); }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      setCustomerInfoEnabled(true);
      return;
    }

    if (isOrgAdmin) {
      loadData();
      return;
    }

    // For other roles, rely on subscription info already available in auth context
    setCustomerInfoEnabled(!!customerDataIncluded);
  }, [isOrgAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activePlan] = await Promise.all([
        subscriptionService.getMyActivePlan(),
      ]);

      const status = activePlan?.data?.data?.subscriptionId?.customerDataAccess === 'included';
      setCustomerInfoEnabled(status);
    } catch {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (orderId, paymentStatus) => {
    try {
      await orderService.updatePaymentStatus(orderId, paymentStatus);
      toast.success(`Payment status updated to ${paymentStatus}`);
      loadOrders();
      if (detailModal.order?._id === orderId) {
        setDetailModal((prev) => ({ ...prev, order: { ...prev.order, paymentStatus } }));
      }
    } catch { toast.error('Failed to update payment status'); }
  };

  const cancelOrderItem = async (orderId) => {
    try {
      setCancelForm((p) => ({ ...p, submitting: true }));
      const { itemIndex, cancelQuantity, reason } = cancelForm;
      if (!reason?.trim()) {
        toast.error('Please enter cancel reason');
        return;
      }
      if (!Number.isFinite(Number(cancelQuantity)) || Number(cancelQuantity) <= 0) {
        toast.error('Cancel quantity must be at least 1');
        return;
      }

      const res = await orderService.cancelOrderItem(orderId, {
        itemIndex: Number(itemIndex),
        cancelQuantity: Number(cancelQuantity),
        reason: reason.trim(),
      });
      toast.success('Item cancelled');

      const updated = res.data.data;
      // Update list + detail view
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? updated : o)),
      );
      setDetailModal((prev) => ({ ...prev, order: updated }));
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to cancel item');
    } finally {
      setCancelForm((p) => ({ ...p, submitting: false }));
    }
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleSort = (key, order) => { setSortBy(key); setSortOrder(order); setPage(1); };

  const statusColor = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-purple-100 text-purple-700',
      ready: 'bg-green-100 text-green-700',
      served: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return map[status] || map.pending;
  };

  const paymentColor = (status) => {
    const map = { pending: 'bg-yellow-100 text-yellow-700', paid: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' };
    return map[status] || map.pending;
  };

  const renderOrderType = (orderType) => (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${orderType === 'takeaway' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
      {orderType === 'takeaway' ? 'Takeaway' : 'Dine In'}
    </span>
  );

  const renderPaymentMethod = (paymentMethod) => (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
      paymentMethod === 'online'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-slate-100 text-slate-700'
    }`}>
      {paymentMethod === 'online' ? 'Online' : 'Cash'}
    </span>
  );

  function maskString(str) {
    if (!str) return '-';
    const s = String(str);
    if (s.length <= 6) return s; // Return as is if too short
    const first3 = s.slice(0, 3);
    const last3 = s.slice(-3);
    const maskLength = s.length - 6;
    return first3 + '*'.repeat(maskLength) + last3;
  }

  const displayCustomerField = (val) =>
    customerInfoEnabled ? val || '-' : maskString(val);

  const getRestaurantName = (order) => {
    const restaurant = order?.restaurantId;
    if (restaurant && typeof restaurant === 'object') {
      return restaurant.name || restaurant.slug || restaurant._id || '-';
    }

    return (
      restaurants.find((r) => r._id === restaurant)?.name ||
      restaurant ||
      '-'
    );
  };

  const getRestaurantId = (order) => {
    const restaurant = order?.restaurantId;
    return restaurant && typeof restaurant === 'object'
      ? restaurant._id
      : restaurant;
  };

  const getTableLabel = (order) => {
    const table = order?.tableId;
    if (!table) return '-';
    if (typeof table === 'object') {
      return table.tableNumber
        ? `Table ${table.tableNumber}`
        : table._id || '-';
    }
    return table;
  };

  const getTableId = (order) => {
    const table = order?.tableId;
    return table && typeof table === 'object' ? table._id : table;
  };

  const columns = [
    { key: 'orderNumber', label: 'Order #', sortable: true, render: (o) => <span className="font-medium">{o.orderNumber}</span> },
    { key: 'restaurantId', label: 'Restaurant', render: (o) => getRestaurantName(o) },
    { key: 'tableId', label: 'Table', render: (o) => getTableLabel(o) },
    ...(hasCustomerData ? [{ key: 'customerName', label: 'Customer', sortable: true, render: (o) => displayCustomerField(o.customerName) }] : []),
    ...(hasCustomerData ? [{ key: 'customerPhone', label: 'Phone', render: (o) => displayCustomerField(o.customerPhone) }] : []),
    { key: 'orderType', label: 'Order Type', render: (o) => renderOrderType(o.orderType) },
    { key: 'paymentMethod', label: 'Payment Type', render: (o) => renderPaymentMethod(o.paymentMethod) },
    { key: 'items', label: 'Items', render: (o) => `${o.items?.length || 0} items` },
    { key: 'totalAmount', label: 'Total', sortable: true, render: (o) => `₹${o.totalAmount}` },
    {
      key: 'status', label: 'Status', render: (o) => (
        <select
          value={o.status}
          onChange={(e) => updateStatus(o._id, e.target.value)}
          className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium outline-none cursor-pointer ${statusColor(o.status)}`}
        >
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    },
    {
      key: 'paymentStatus', label: 'Payment', render: (o) => (
        <select
          value={o.paymentStatus}
          onChange={(e) => updatePaymentStatus(o._id, e.target.value)}
          className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium outline-none cursor-pointer ${paymentColor(o.paymentStatus)}`}
        >
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    },
    { key: 'createdAt', label: 'Date', sortable: true, render: (o) => new Date(o.createdAt).toLocaleDateString() },
    {
      key: 'actions', label: '', render: (o) => (
        <button onClick={() => setDetailModal({ open: true, order: o })} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
          <HiOutlineEye size={16} />
        </button>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Orders</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          {restaurants.length > 0 && (showAllOption || restaurants.length > 1) && (
            <div className="w-56">
              <SearchSelect
                options={[
                  ...(showAllOption ? [{ value: '', label: 'All Restaurants' }] : []),
                  ...restaurants.map((r) => ({ value: r._id, label: r.name })),
                ]}
                value={selectedRestaurant}
                onChange={(val) => { setSelectedRestaurant(val); setPage(1); }}
                placeholder="Select restaurant..."
              />
            </div>
          )}
          <div className="w-44">
            <SearchSelect
              options={[{ value: '', label: 'All Statuses' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s }))]}
              value={filterStatus}
              onChange={(val) => { setFilterStatus(val); setPage(1); }}
              placeholder="Filter status..."
            />
          </div>

          {/* <div className="w-44">
            <DatePresetFilter
              value={datePreset}
              onChange={(val) => {
                setDatePreset(val);
                setPage(1);
              }}
            />
          </div> */}
        </div>
      </div>

      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          searchValue={search}
          onSearchChange={handleSearch}
          searchPlaceholder="Search by order #, customer name or phone..."
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {/* Order Detail Modal */}
      <Modal isOpen={detailModal.open} onClose={() => setDetailModal({ open: false, order: null })} title={`Order ${detailModal.order?.orderNumber || ''}`}>
        {detailModal.order && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Restaurant:</span> <span className="font-medium">{getRestaurantName(detailModal.order)}</span></div>
              <div><span className="text-slate-500">Restaurant ID:</span> <span className="font-medium">{getRestaurantId(detailModal.order) || '-'}</span></div>
              <div><span className="text-slate-500">Table:</span> <span className="font-medium">{getTableLabel(detailModal.order)}</span></div>
              <div><span className="text-slate-500">Table ID:</span> <span className="font-medium">{getTableId(detailModal.order) || '-'}</span></div>
              {hasCustomerData && <div><span className="text-slate-500">Customer:</span> <span className="font-medium">{displayCustomerField(detailModal.order.customerName)}</span></div>}
              {hasCustomerData && <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{displayCustomerField(detailModal.order.customerPhone)}</span></div>}
              <div><span className="text-slate-500">Type:</span> <span className="ml-1">{renderOrderType(detailModal.order.orderType)}</span></div>
              <div><span className="text-slate-500">Payment Type:</span> <span className="ml-1">{renderPaymentMethod(detailModal.order.paymentMethod)}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(detailModal.order.status)}`}>{detailModal.order.status}</span></div>
              <div><span className="text-slate-500">Payment:</span> <select value={detailModal.order.paymentStatus} onChange={(e) => updatePaymentStatus(detailModal.order._id, e.target.value)} className={`ml-1 rounded-full border-0 px-2 py-0.5 text-xs font-medium outline-none cursor-pointer ${paymentColor(detailModal.order.paymentStatus)}`}>{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Items</h4>
              {(() => {
                const o = detailModal.order;
                const hasGst = (o.cgstAmount || 0) > 0 || (o.sgstAmount || 0) > 0;
                const hasVat = (o.vatAmount || 0) > 0;
                const hasTax = hasGst || hasVat;
                const gstInclusive = hasGst && (o.taxType || 'exclusive') === 'inclusive';
                const vatInclusive = hasVat && (o.vatType || 'exclusive') === 'inclusive';
                const rate = o.taxRate || 0;
                const cgstR = o.cgstRate || 0;
                const sgstR = o.sgstRate || 0;
                const vatR = o.vatRate || 0;
                return (
                  <>
                    {/* Cancel single item */}
                    {['pending', 'confirmed', 'preparing'].includes(o.status) && (
                      <div className="mb-3 rounded-lg border border-stroke bg-slate-50 p-3">
                        <div className="mb-2 text-xs font-semibold text-slate-600">
                          Cancel item (partial qty allowed)
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <select
                            value={cancelForm.itemIndex}
                            onChange={(e) =>
                              setCancelForm((p) => ({
                                ...p,
                                itemIndex: Number(e.target.value),
                              }))
                            }
                            className="w-full rounded-lg border border-stroke bg-white px-2 py-2 text-xs outline-none"
                          >
                            {(o.items || []).map((it, idx) => {
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
                          <input
                            type="number"
                            min={1}
                            value={cancelForm.cancelQuantity}
                            onChange={(e) =>
                              setCancelForm((p) => ({
                                ...p,
                                cancelQuantity: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-stroke bg-white px-2 py-2 text-xs outline-none"
                            placeholder="Qty"
                          />
                          <button
                            onClick={() => cancelOrderItem(o._id)}
                            disabled={cancelForm.submitting}
                            className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            {cancelForm.submitting ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                        <textarea
                          value={cancelForm.reason}
                          onChange={(e) =>
                            setCancelForm((p) => ({ ...p, reason: e.target.value }))
                          }
                          className="mt-2 w-full rounded-lg border border-stroke bg-white px-2 py-2 text-xs outline-none"
                          rows={2}
                          placeholder="Reason"
                        />
                      </div>
                    )}

                    <div className="rounded-lg border border-stroke">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-stroke bg-slate-50">
                          <th className="px-3 py-2 text-left font-medium text-slate-600">Item</th>
                          <th className="px-3 py-2 text-center font-medium text-slate-600">Qty</th>
                          <th className="px-3 py-2 text-right font-medium text-slate-600">Amount</th>
                        </tr></thead>
                        <tbody>
                          {o.items?.map((item, i) => {
                            const totalQty = Number(item.quantity || 0);
                            const cancelledQty = Number(item.cancelledQuantity || 0);
                            const remainingQty = Math.max(0, totalQty - cancelledQty);
                            const lineTotal = item.price * remainingQty;
                            const isLiquor = (item.itemType || 'food') === 'liquor';
                            let base, itemCgst, itemSgst, itemVat;
                            if (isLiquor && hasVat) {
                              if (vatInclusive) {
                                base = Math.round(lineTotal / (1 + vatR / 100) * 100) / 100;
                                itemVat = Math.round((lineTotal - base) * 100) / 100;
                              } else {
                                base = lineTotal;
                                itemVat = Math.round(base * vatR / 100 * 100) / 100;
                              }
                            } else if (!isLiquor && hasGst) {
                              if (gstInclusive) {
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
                              <tr key={i} className="border-b border-stroke last:border-0">
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    {item.name}
                                    {isLiquor && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Liquor</span>}
                                    {cancelledQty > 0 && (
                                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                                        Cancelled {cancelledQty}/{totalQty}
                                      </span>
                                    )}
                                  </div>
                                  {cancelledQty > 0 && item.cancelReason && (
                                    <div className="mt-0.5 text-[11px] text-red-600">
                                      Reason: {item.cancelReason}
                                    </div>
                                  )}
                                  {isLiquor && hasVat && (
                                    <div className="mt-0.5 text-[11px] text-slate-400 space-x-2">
                                      <span>Base: ₹{base.toFixed(2)}</span>
                                      <span>VAT: ₹{itemVat.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {!isLiquor && hasGst && (
                                    <div className="mt-0.5 text-[11px] text-slate-400 space-x-2">
                                      <span>Base: ₹{base.toFixed(2)}</span>
                                      <span>CGST: ₹{itemCgst.toFixed(2)}</span>
                                      <span>SGST: ₹{itemSgst.toFixed(2)}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {remainingQty}
                                  {cancelledQty > 0 && (
                                    <div className="text-[10px] text-slate-400">
                                      of {totalQty}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right">₹{lineTotal}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {hasTax ? (
                      <div className="mt-2 space-y-1 text-right text-sm">
                        {hasGst && (
                          <>
                            <div className="text-slate-600">
                              Food Subtotal: ₹{(o.foodSubtotal || 0).toFixed(2)}
                            </div>
                            <div className="text-slate-600">CGST ({cgstR}%): ₹{o.cgstAmount}</div>
                            <div className="text-slate-600">SGST ({sgstR}%): ₹{o.sgstAmount}</div>
                          </>
                        )}
                        {hasVat && (
                          <>
                            <div className="text-slate-600">
                              Liquor Subtotal: ₹{(o.liquorSubtotal || 0).toFixed(2)}
                            </div>
                            <div className="text-slate-600">VAT ({vatR}%): ₹{o.vatAmount}</div>
                          </>
                        )}
                        <div className="font-bold border-t border-stroke pt-1">Total: ₹{o.totalAmount}</div>
                      </div>
                    ) : (
                      <div className="mt-2 text-right text-sm font-bold">Total: ₹{o.totalAmount}</div>
                    )}
                  </>
                );
              })()}
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Order Status</h4>
              <div className="flex flex-wrap items-center gap-2">
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(detailModal.order._id, s)}
                    disabled={detailModal.order.status === s}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${detailModal.order.status === s ? 'bg-primary text-white' : 'border border-stroke text-slate-600 hover:bg-slate-50'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Payment Status</h4>
              <div className="flex flex-wrap items-center gap-2">
                {PAYMENT_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updatePaymentStatus(detailModal.order._id, s)}
                    disabled={detailModal.order.paymentStatus === s}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${detailModal.order.paymentStatus === s ? 'bg-green-600 text-white' : 'border border-stroke text-slate-600 hover:bg-slate-50'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {detailModal.order &&
          <button
            onClick={() => {
              const rest = restaurants.find((r) => r._id === selectedRestaurant);
              const orderForBill = { ...detailModal.order };
              if (hasCustomerData) {
                orderForBill.customerName = customerInfoEnabled
                  ? detailModal.order.customerName
                  : maskString(detailModal.order.customerName);
                orderForBill.customerPhone = customerInfoEnabled
                  ? detailModal.order.customerPhone
                  : maskString(detailModal.order.customerPhone);
              } else {
                delete orderForBill.customerName;
                delete orderForBill.customerPhone;
              }

              generateBillPdf(orderForBill, rest);
            }}
            className="ml-auto mt-5 flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 cursor-pointer"
          >
            <HiOutlinePrinter size={14} />
            Print Bill
          </button>
        }
      </Modal>
    </div>
  );
}
