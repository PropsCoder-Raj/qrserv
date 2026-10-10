import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlinePlus } from 'react-icons/hi';
import orderService from '../services/orderService';
import generateBillPdf from '../utils/generateBillPdf';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import tableService from '../services/tableService';
import couponService from '../services/couponService';
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [configuringItemId, setConfiguringItemId] = useState('');
  const [draftSpiceLevel, setDraftSpiceLevel] = useState('');
  const [draftAddOns, setDraftAddOns] = useState([]);
  const [draftInstructions, setDraftInstructions] = useState('');
  const [restaurantTax, setRestaurantTax] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponSubmitting, setCouponSubmitting] = useState(false);
  const [newOrder, setNewOrder] = useState({
    restaurantId: '',
    orderType: 'takeaway',
    tableId: '',
    customerName: '',
    customerPhone: '',
    items: [],
  });
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

  useEffect(() => {
    if (!createModalOpen || !newOrder.restaurantId) return undefined;
    let active = true;
    setCreateLoading(true);
    Promise.all([
      menuService.getFullMenu(newOrder.restaurantId),
      tableService.getAll(newOrder.restaurantId, { page: 1, limit: 1000 }),
      restaurantService.getOne(newOrder.restaurantId),
    ])
      .then(([menuRes, tableRes, restaurantRes]) => {
        if (!active) return;
        const categories = menuRes.data.data || [];
        setMenuCategories(categories);
        setMenuItems(categories.flatMap((category) => category.items || []));
        const tableData = tableRes.data.data;
        setTables(Array.isArray(tableData) ? tableData : tableData?.data || []);
        setRestaurantTax(restaurantRes.data.data);
      })
      .catch(() => {
        if (active) toast.error('Failed to load menu and tables');
      })
      .finally(() => {
        if (active) setCreateLoading(false);
      });
    return () => { active = false; };
  }, [createModalOpen, newOrder.restaurantId]);

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

  const addNewOrderItem = (menuItem, configuration = {}) => {
    const addOns = configuration.addOns || [];
    const spiceLevel = configuration.spiceLevel;
    const addOnsTotal = addOns.reduce((sum, addOn) => sum + (Number(addOn.priceDelta) || 0), 0);
    const price = Math.round((Number(menuItem.price) + addOnsTotal + (Number(spiceLevel?.priceDelta) || 0)) * 100) / 100;
    const itemKey = [menuItem._id, spiceLevel?.name || '', ...addOns.map((addOn) => addOn.name).sort(), configuration.specialInstructions || ''].join('::');
    const orderItem = {
      itemKey,
      menuItemId: menuItem._id,
      name: menuItem.name,
      price,
      quantity: 1,
      itemType: menuItem.itemType || 'food',
      spiceLevel,
      addOns,
      specialInstructions: configuration.specialInstructions || undefined,
    };
    setNewOrder((current) => {
      const existing = current.items.find((entry) => entry.itemKey === itemKey);
      return {
        ...current,
        items: existing
          ? current.items.map((entry) => entry.itemKey === itemKey
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry)
          : [...current.items, orderItem],
      };
    });
    setAppliedCoupon(null);
    setConfiguringItemId('');
    setDraftSpiceLevel('');
    setDraftAddOns([]);
    setDraftInstructions('');
  };

  const configureOrAddMenuItem = (menuItem) => {
    const customization = menuItem.customization || {};
    if (!(customization.spiceLevels?.length || customization.addOns?.length)) {
      addNewOrderItem(menuItem);
      return;
    }
    setConfiguringItemId(menuItem._id);
    setDraftSpiceLevel('');
    setDraftAddOns([]);
    setDraftInstructions('');
  };

  const confirmConfiguredItem = (menuItem) => {
    const spiceLevel = menuItem.customization?.spiceLevels?.find((level) => level.name === draftSpiceLevel);
    addNewOrderItem(menuItem, {
      spiceLevel,
      addOns: draftAddOns,
      specialInstructions: draftInstructions.trim(),
    });
  };

  const applyCoupon = async () => {
    if (!newOrder.restaurantId || !newOrder.items.length) {
      return toast.error('Add items before applying a coupon');
    }
    if (!couponCode.trim()) return toast.error('Enter a coupon code');
    setCouponSubmitting(true);
    try {
      const response = await couponService.validate({
        restaurantId: newOrder.restaurantId,
        code: couponCode.trim(),
        items: newOrder.items.map(({ menuItemId, quantity, spiceLevel, addOns, specialInstructions }) => ({
          menuItemId,
          quantity,
          spiceLevel,
          addOns,
          specialInstructions,
        })),
      });
      const validated = response.data.data;
      setAppliedCoupon({
        code: validated.couponCode,
        discountAmount: Number(validated.discountAmount) || 0,
      });
      setCouponCode(validated.couponCode);
      toast.success(`Coupon applied: ${validated.couponCode}`);
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(error?.response?.data?.message || 'Coupon could not be applied');
    } finally {
      setCouponSubmitting(false);
    }
  };

  const formatAmount = (amount) => Number(amount || 0).toFixed(2);
  const orderEstimate = (() => {
    const foodSubtotal = newOrder.items
      .filter((item) => (item.itemType || 'food') === 'food')
      .reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
    const liquorSubtotal = newOrder.items
      .filter((item) => item.itemType === 'liquor')
      .reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
    const foodInclusive = restaurantTax?.taxType === 'inclusive';
    const vatInclusive = restaurantTax?.vatType === 'inclusive';
    const gstHalfRate = Math.round((Number(restaurantTax?.taxRate || 0) / 2) * 100) / 100;
    const foodTax = restaurantTax?.taxEnabled && restaurantTax.taxRate > 0 && foodSubtotal > 0
      ? foodInclusive
        ? Math.round((foodSubtotal - Math.round((foodSubtotal / (1 + restaurantTax.taxRate / 100)) * 100) / 100) * 100) / 100
        : Math.round((Math.round((foodSubtotal * (gstHalfRate / 100)) * 100) / 100 + Math.round((foodSubtotal * (gstHalfRate / 100)) * 100) / 100) * 100) / 100
      : 0;
    const vatTax = restaurantTax?.vatEnabled && restaurantTax.vatRate > 0 && liquorSubtotal > 0
      ? vatInclusive
        ? Math.round((liquorSubtotal - Math.round((liquorSubtotal / (1 + restaurantTax.vatRate / 100)) * 100) / 100) * 100) / 100
        : Math.round((liquorSubtotal * (restaurantTax.vatRate / 100)) * 100) / 100
      : 0;
    const subtotal = foodSubtotal + liquorSubtotal;
    const tax = Math.round((foodTax + vatTax) * 100) / 100;
    const additionalTax = (foodInclusive ? 0 : foodTax) + (vatInclusive ? 0 : vatTax);
    const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    return {
      subtotal,
      tax,
      foodTax,
      vatTax,
      discount,
      total: Math.max(0, Math.round((subtotal + additionalTax - discount) * 100) / 100),
    };
  })();

  const visibleMenuCategories = menuCategories
    .map((category) => ({
      ...category,
      items: (category.items || []).filter((item) =>
        item.name.toLowerCase().includes(itemSearch.trim().toLowerCase()),
      ),
    }))
    .filter((category) => category.items.length > 0);
  const visibleMenuItems = visibleMenuCategories
    .filter((category) => selectedCategory === 'all' || category._id === selectedCategory)
    .flatMap((category) => category.items);

  const submitNewOrder = async (event) => {
    event.preventDefault();
    if (!newOrder.restaurantId) return toast.error('Select a restaurant');
    if (!newOrder.items.length) return toast.error('Add at least one menu item');
    if (newOrder.orderType === 'dine_in' && !newOrder.tableId) {
      return toast.error('Select a table for dine-in');
    }
    setCreateSubmitting(true);
    try {
      await orderService.create({
        restaurantId: newOrder.restaurantId,
        tableId: newOrder.orderType === 'dine_in' ? newOrder.tableId : null,
        orderType: newOrder.orderType,
        paymentMethod: 'cash',
        customerName: newOrder.customerName.trim() || undefined,
        customerPhone: newOrder.customerPhone.trim() || undefined,
        couponCode: appliedCoupon?.code,
        items: newOrder.items.map(({ itemKey, ...item }) => item),
      });
      toast.success('Order created');
      setCreateModalOpen(false);
      setNewOrder((current) => ({
        ...current,
        tableId: '',
        customerName: '',
        customerPhone: '',
        items: [],
      }));
      setCouponCode('');
      setAppliedCoupon(null);
      loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create order');
    } finally {
      setCreateSubmitting(false);
    }
  };

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
    { key: 'totalAmount', label: 'Total', sortable: true, render: (o) => `${o.totalAmount}` },
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              setNewOrder((current) => ({ ...current, restaurantId: selectedRestaurant || (restaurants.length === 1 ? restaurants[0]._id : '') }));
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <HiOutlinePlus size={16} /> Create order
          </button>
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

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create order">
        <form onSubmit={submitNewOrder} className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Restaurant
              <select
                required
                value={newOrder.restaurantId}
                onChange={(event) => {
                  setNewOrder((current) => ({ ...current, restaurantId: event.target.value, tableId: '', items: [] }));
                  setAppliedCoupon(null);
                  setCouponCode('');
                  setRestaurantTax(null);
                  setMenuCategories([]);
                  setMenuItems([]);
                  setItemSearch('');
                  setSelectedCategory('all');
                }}
                className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">Select restaurant</option>
                {restaurants.map((restaurant) => <option key={restaurant._id} value={restaurant._id}>{restaurant.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Order type
              <select
                value={newOrder.orderType}
                onChange={(event) => setNewOrder((current) => ({ ...current, orderType: event.target.value, tableId: '' }))}
                className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="takeaway">Takeaway</option>
                <option value="dine_in">Dine in</option>
              </select>
            </label>
            {newOrder.orderType === 'dine_in' && (
              <label className="text-sm font-medium text-slate-700">
                Table
                <select
                  required
                  value={newOrder.tableId}
                  onChange={(event) => setNewOrder((current) => ({ ...current, tableId: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="">Select table</option>
                  {tables.filter((table) => table.isActive).map((table) => (
                    <option key={table._id} value={table._id} disabled={!!table.activeOrder}>
                      Table {table.tableNumber}{table.activeOrder ? ' (engaged)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-sm font-medium text-slate-700">
              Customer name <span className="font-normal text-slate-400">(optional)</span>
              <input value={newOrder.customerName} onChange={(event) => setNewOrder((current) => ({ ...current, customerName: event.target.value }))} className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Phone <span className="font-normal text-slate-400">(optional)</span>
              <input type="tel" value={newOrder.customerPhone} onChange={(event) => setNewOrder((current) => ({ ...current, customerPhone: event.target.value }))} className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none" />
            </label>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Items</h4>
            <input
              type="search"
              value={itemSearch}
              onChange={(event) => {
                setItemSearch(event.target.value);
                setSelectedCategory('all');
              }}
              placeholder="Search menu items"
              disabled={createLoading || !newOrder.restaurantId}
              className="mb-2 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none"
            />
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setSelectedCategory('all')} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${selectedCategory === 'all' ? 'border-primary bg-primary text-white' : 'border-stroke text-slate-600'}`}>All categories</button>
              {visibleMenuCategories.map((category) => (
                <button key={category._id} type="button" onClick={() => setSelectedCategory(category._id)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${selectedCategory === category._id ? 'border-primary bg-primary text-white' : 'border-stroke text-slate-600'}`}>
                  {category.name} <span className="opacity-70">{category.items.length}</span>
                </button>
              ))}
            </div>
            {createLoading ? <p className="py-6 text-center text-sm text-slate-500">Loading menu...</p> : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {visibleMenuItems.map((item) => {
                  const customization = item.customization || {};
                  const hasOptions = !!(customization.spiceLevels?.length || customization.addOns?.length);
                  return (
                    <div key={item._id} className="rounded-lg border border-stroke p-3">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.price}{item.itemType === 'liquor' ? ' · Liquor' : ''}</p>
                        </div>
                        <button type="button" onClick={() => configureOrAddMenuItem(item)} className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          {hasOptions ? 'Customize' : 'Add'}
                        </button>
                      </div>
                      {configuringItemId === item._id && (
                        <div className="mt-3 space-y-3 border-t border-stroke pt-3">
                          {customization.spiceLevels?.length > 0 && (
                            <label className="block text-xs font-medium text-slate-600">
                              Spice level
                              <select value={draftSpiceLevel} onChange={(event) => setDraftSpiceLevel(event.target.value)} className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-normal text-slate-700">
                                <option value="">No spice selection</option>
                                {customization.spiceLevels.map((level) => <option key={level.name} value={level.name}>{level.emoji ? `${level.emoji} ` : ''}{level.name}{Number(level.priceDelta) > 0 ? ` (+${level.priceDelta})` : ''}</option>)}
                              </select>
                            </label>
                          )}
                          {customization.addOns?.length > 0 && (
                            <fieldset>
                              <legend className="mb-1 text-xs font-medium text-slate-600">Add-ons</legend>
                              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                {customization.addOns.map((addOn) => (
                                  <label key={addOn.name} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                                    <input
                                      type="checkbox"
                                      checked={draftAddOns.some((selected) => selected.name === addOn.name)}
                                      onChange={(event) => setDraftAddOns((current) => event.target.checked
                                        ? [...current, addOn]
                                        : current.filter((selected) => selected.name !== addOn.name))}
                                      className="accent-primary"
                                    />
                                    <span className="min-w-0 flex-1 truncate">{addOn.emoji ? `${addOn.emoji} ` : ''}{addOn.name}</span>
                                    <span className="text-xs text-slate-500">{Number(addOn.priceDelta) > 0 ? `+${addOn.priceDelta}` : 'Free'}</span>
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          )}
                          {customization.allowSpecialInstructions !== false && (
                            <input value={draftInstructions} onChange={(event) => setDraftInstructions(event.target.value)} placeholder="Special instructions (optional)" className="w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none" />
                          )}
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setConfiguringItemId('')} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600">Cancel</button>
                            <button type="button" onClick={() => confirmConfiguredItem(item)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">Add item</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!createLoading && newOrder.restaurantId && visibleMenuItems.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No menu items match this search.</p>}
              </div>
            )}
            {!createLoading && newOrder.restaurantId && menuItems.length === 0 && <p className="mt-2 text-sm text-slate-500">No available menu items for this restaurant.</p>}
          </div>

          <section className="space-y-2 border-t border-stroke pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Selected items</h4>
              <span className="text-xs text-slate-500">{newOrder.items.reduce((sum, item) => sum + item.quantity, 0)} total</span>
            </div>
            {newOrder.items.length > 0 ? (
              <div className="divide-y divide-stroke rounded-lg border border-stroke">
                {newOrder.items.map((item) => (
                  <div key={item.itemKey} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">{item.name}</p>
                      {(item.spiceLevel || item.addOns?.length > 0 || item.specialInstructions) && (
                        <p className="truncate text-xs text-slate-500">
                          {[item.spiceLevel?.name, ...(item.addOns || []).map((addOn) => addOn.name), item.specialInstructions].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className="text-slate-500">{item.price}</span>
                    <input
                      aria-label={`Quantity for ${item.name}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => {
                        setNewOrder((current) => ({
                          ...current,
                          items: current.items.map((entry) => entry.itemKey === item.itemKey
                            ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) }
                            : entry),
                        }));
                        setAppliedCoupon(null);
                      }}
                      className="w-16 rounded-md border border-stroke px-2 py-1 text-center"
                    />
                    <button type="button" onClick={() => {
                      setNewOrder((current) => ({ ...current, items: current.items.filter((entry) => entry.itemKey !== item.itemKey) }));
                      setAppliedCoupon(null);
                    }} className="text-xs font-medium text-red-600">Remove</button>
                  </div>
                ))}
              </div>
            ) : <p className="rounded-lg border border-dashed border-stroke px-3 py-5 text-center text-sm text-slate-500">No items selected.</p>}
          </section>

          <div className="space-y-3 rounded-lg border border-stroke p-3">
            <h4 className="text-sm font-semibold text-slate-700">Coupon</h4>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  setAppliedCoupon(null);
                }}
                placeholder="Enter coupon code"
                disabled={!newOrder.items.length}
                className="min-w-0 flex-1 rounded-lg border border-stroke bg-white px-3 py-2 text-sm uppercase outline-none"
              />
              <button type="button" onClick={applyCoupon} disabled={couponSubmitting || !newOrder.items.length} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">
                {couponSubmitting ? 'Checking...' : appliedCoupon ? 'Apply again' : 'Apply'}
              </button>
            </div>
            {appliedCoupon && <p className="text-xs font-medium text-green-700">{appliedCoupon.code} applied</p>}
          </div>

          <div className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
            <h4 className="mb-3 font-semibold text-slate-700">Order total</h4>
            <div className="flex justify-between text-slate-600"><span>Items subtotal</span><span>{formatAmount(orderEstimate.subtotal)}</span></div>
            {restaurantTax?.taxEnabled && <div className="flex justify-between text-slate-600"><span>GST{restaurantTax.taxType === 'inclusive' ? ' (included)' : ''}</span><span>{formatAmount(orderEstimate.foodTax)}</span></div>}
            {restaurantTax?.vatEnabled && <div className="flex justify-between text-slate-600"><span>VAT{restaurantTax.vatType === 'inclusive' ? ' (included)' : ''}</span><span>{formatAmount(orderEstimate.vatTax)}</span></div>}
            <div className="flex justify-between text-slate-600"><span>Total tax</span><span>{formatAmount(orderEstimate.tax)}</span></div>
            {appliedCoupon && <div className="flex justify-between text-green-700"><span>Coupon discount</span><span>-{formatAmount(orderEstimate.discount)}</span></div>}
            <div className="flex justify-between border-t border-stroke pt-2 font-semibold text-slate-800"><span>Total amount</span><span>{formatAmount(orderEstimate.total)}</span></div>
            <p className="text-xs text-slate-500">Final amount is calculated by the server when the order is created.</p>
          </div>

          <div className="flex justify-end gap-2 border-t border-stroke pt-4">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
            <button type="submit" disabled={createSubmitting || createLoading || !newOrder.items.length} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {createSubmitting ? 'Creating...' : 'Create order'}
            </button>
          </div>
        </form>
      </Modal>

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
                                  {(item.spiceLevel?.name || item.addOns?.length > 0 || item.specialInstructions) && (
                                    <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                                      {item.spiceLevel?.name && (
                                        <div>
                                          <span className="font-medium text-slate-600">Spice:</span>{' '}
                                          {item.spiceLevel.emoji} {item.spiceLevel.name}
                                        </div>
                                      )}
                                      {item.addOns?.length > 0 && (
                                        <div>
                                          <span className="font-medium text-slate-600">Add-ons:</span>{' '}
                                          {item.addOns
                                            .map((a) => `${a.emoji || ''} ${a.name}`.trim())
                                            .join(', ')}
                                        </div>
                                      )}
                                      {item.specialInstructions && (
                                        <div className="italic">
                                          <span className="font-medium text-slate-600 not-italic">Note:</span>{' '}
                                          {item.specialInstructions}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {isLiquor && hasVat && (
                                    <div className="mt-0.5 text-[11px] text-slate-400 space-x-2">
                                      <span>Base: {base.toFixed(2)}</span>
                                      <span>VAT: {itemVat.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {!isLiquor && hasGst && (
                                    <div className="mt-0.5 text-[11px] text-slate-400 space-x-2">
                                      <span>Base: {base.toFixed(2)}</span>
                                      <span>CGST: {itemCgst.toFixed(2)}</span>
                                      <span>SGST: {itemSgst.toFixed(2)}</span>
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
                                <td className="px-3 py-2 text-right">{lineTotal}</td>
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
                              Food Subtotal: {(o.foodSubtotal || 0).toFixed(2)}
                            </div>
                            <div className="text-slate-600">CGST ({cgstR}%): {o.cgstAmount}</div>
                            <div className="text-slate-600">SGST ({sgstR}%): {o.sgstAmount}</div>
                          </>
                        )}
                        {hasVat && (
                          <>
                            <div className="text-slate-600">
                              Liquor Subtotal: {(o.liquorSubtotal || 0).toFixed(2)}
                            </div>
                            <div className="text-slate-600">VAT ({vatR}%): {o.vatAmount}</div>
                          </>
                        )}
                        <div className="font-bold border-t border-stroke pt-1">Total: {o.totalAmount}</div>
                      </div>
                    ) : (
                      <div className="mt-2 text-right text-sm font-bold">Total: {o.totalAmount}</div>
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
