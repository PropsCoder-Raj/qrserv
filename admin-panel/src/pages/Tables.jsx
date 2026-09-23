import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineDownload,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlinePrinter,
  HiOutlineQrcode,
  HiOutlineSearch,
  HiOutlineTrash,
} from 'react-icons/hi';
import tableService from '../services/tableService';
import restaurantService from '../services/restaurantService';
import orderService from '../services/orderService';
import generateBillPdf from '../utils/generateBillPdf';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';

const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || 'https://customer.qrserv.in';
const HISTORY_PAGE_SIZE = 5;

export default function Tables() {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, qr: '', table: '' });
  const [viewModal, setViewModal] = useState({ open: false, table: null });
  const [viewTab, setViewTab] = useState('current');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentOrderLoading, setCurrentOrderLoading] = useState(false);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ from: '', to: '' });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historySummary, setHistorySummary] = useState({ totalOrders: 0, totalAmount: 0 });
  const [historyDetailModal, setHistoryDetailModal] = useState({ open: false, order: null });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tableNumber: '', capacity: 4 });

  // Pagination, search, sort state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [datePreset, setDatePreset] = useState('');

  useEffect(() => { loadRestaurants(); }, []);

  const loadTables = useCallback(async () => {
    if (!selectedRestaurant) return;
    setLoading(true);
    try {
      const res = await tableService.getAll(selectedRestaurant, {
        page,
        limit: 10,
        search: search || undefined,
        sortBy: sortBy || undefined,
        sortOrder,
        datePreset: datePreset || undefined,
      });
      const result = res.data.data;
      setTables(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch { toast.error('Failed to load tables'); }
    finally { setLoading(false); }
  }, [selectedRestaurant, page, search, sortBy, sortOrder, datePreset]);

  useEffect(() => { loadTables(); }, [loadTables]);

  const loadRestaurants = async () => {
    try {
      const res = user?.role === 'super_admin' ? await restaurantService.getAll({ limit: 100 }) : await restaurantService.getMy({ limit: 100 });
      const list = res.data.data.data || res.data.data;
      setRestaurants(Array.isArray(list) ? list : []);
      if (list.length > 0) setSelectedRestaurant(list[0]._id);
    } catch { toast.error('Failed to load restaurants'); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ tableNumber: '', capacity: 4 });
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ tableNumber: t.tableNumber, capacity: t.capacity || 4 });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await tableService.update(editing._id, { ...form, capacity: Number(form.capacity) });
        toast.success('Table updated');
      } else {
        await tableService.create({ ...form, capacity: Number(form.capacity), restaurantId: selectedRestaurant });
        toast.success('Table created');
      }
      setModalOpen(false);
      loadTables();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      await tableService.delete(id);
      toast.success('Table deleted');
      loadTables();
    } catch { toast.error('Delete failed'); }
  };

  const handleToggleActive = async (table) => {
    try {
      await tableService.update(table._id, { isActive: !table.isActive });
      toast.success(`Table ${table.isActive ? 'deactivated' : 'activated'}`);
      loadTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update table status');
    }
  };

  const generateQrUrl = (table) => {
    return `${CUSTOMER_APP_URL}/restaurant/${table.restaurantId}?table=${table._id}`;
  };

  const showQr = async (t) => {
    try {
      const url = generateQrUrl(t);
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrModal({ open: true, qr: qrDataUrl, table: t.tableNumber, url });
    } catch { toast.error('Failed to generate QR'); }
  };

  const downloadQr = () => {
    const link = document.createElement('a');
    link.href = qrModal.qr;
    link.download = `table-${qrModal.table}-qr.png`;
    link.click();
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };

  const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('en-IN');
  };

  const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

  const getStatusChipClass = (status) => {
    const value = String(status || '').toLowerCase();

    if (['served', 'completed'].includes(value)) {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (['preparing', 'confirmed'].includes(value)) {
      return 'bg-amber-100 text-amber-700';
    }
    if (['cancelled', 'failed'].includes(value)) {
      return 'bg-red-100 text-red-700';
    }
    if (['paid'].includes(value)) {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (['pending', 'unpaid'].includes(value)) {
      return 'bg-slate-200 text-slate-700';
    }

    return 'bg-blue-100 text-blue-700';
  };

  const renderChip = (label, value) => (
    <div className="flex items-center gap-2">
      { label && <span className="text-xs text-slate-500">{label}</span> }
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusChipClass(value)}`}>
        {value || '-'}
      </span>
    </div>
  );

  const getSelectedRestaurantData = () =>
    restaurants.find((restaurant) => restaurant._id === selectedRestaurant) || {};
  const historyFrom = historyTotal > 0 ? (historyPage - 1) * HISTORY_PAGE_SIZE + 1 : 0;
  const historyTo = Math.min(historyPage * HISTORY_PAGE_SIZE, historyTotal);

  const openHistoryDetails = (order) => {
    setHistoryDetailModal({ open: true, order });
  };

  const printOrderBill = (order) => {
    generateBillPdf(order, getSelectedRestaurantData());
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const from = total > 0 ? (page - 1) * 10 + 1 : 0;
  const to = Math.min(page * 10, total);

  const loadCurrentOrder = async (orderId) => {
    if (!orderId) {
      setCurrentOrder(null);
      setCurrentOrderLoading(false);
      return;
    }

    setCurrentOrderLoading(true);
    try {
      const res = await orderService.getOne(orderId);
      setCurrentOrder(res.data.data);
    } catch {
      setCurrentOrder(null);
      toast.error('Failed to load current order');
    } finally {
      setCurrentOrderLoading(false);
    }
  };

  const loadOrderHistory = async (table) => {
    if (!selectedRestaurant || !table?._id) {
      setHistoryOrders([]);
      setHistoryTotalPages(1);
      setHistoryTotal(0);
      setHistorySummary({ totalOrders: 0, totalAmount: 0 });
      return;
    }

    setHistoryLoading(true);
    try {
      const res = await orderService.getAll(selectedRestaurant, undefined, {
        page: historyPage,
        limit: HISTORY_PAGE_SIZE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        fromDate: historyFilter.from || undefined,
        toDate: historyFilter.to || undefined,
        tableId: table._id,
      });
      const result = res.data.data;
      setHistoryOrders(Array.isArray(result.data) ? result.data : []);
      setHistoryTotalPages(result.totalPages || 1);
      setHistoryTotal(result.total || 0);
      setHistorySummary(result.summary || { totalOrders: 0, totalAmount: 0 });
    } catch {
      setHistoryOrders([]);
      setHistoryTotalPages(1);
      setHistoryTotal(0);
      setHistorySummary({ totalOrders: 0, totalAmount: 0 });
      toast.error('Failed to load order history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const openView = (table) => {
    setViewModal({ open: true, table });
    setViewTab('current');
    setCurrentOrder(null);
    setCurrentOrderLoading(Boolean(table.activeOrder?._id));
    setHistoryFilter({ from: '', to: '' });
    setHistoryPage(1);
    setHistoryOrders([]);
    setHistoryTotalPages(1);
    setHistoryTotal(0);
    setHistorySummary({ totalOrders: 0, totalAmount: 0 });
    loadCurrentOrder(table.activeOrder?._id);
  };

  const closeView = () => {
    setViewModal({ open: false, table: null });
    setViewTab('current');
    setCurrentOrder(null);
    setCurrentOrderLoading(false);
    setHistoryOrders([]);
    setHistoryLoading(false);
    setHistoryFilter({ from: '', to: '' });
    setHistoryPage(1);
    setHistoryTotalPages(1);
    setHistoryTotal(0);
    setHistorySummary({ totalOrders: 0, totalAmount: 0 });
    setHistoryDetailModal({ open: false, order: null });
  };

  useEffect(() => {
    if (!viewModal.open || !viewModal.table) return;
    loadOrderHistory(viewModal.table);
  }, [viewModal.open, viewModal.table, selectedRestaurant, historyFilter.from, historyFilter.to, historyPage]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyFilter.from, historyFilter.to, viewModal.table?._id]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Tables</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="w-56">
            <SearchSelect
              options={restaurants.map((r) => ({ value: r._id, label: r.name }))}
              value={selectedRestaurant}
              onChange={(val) => { setSelectedRestaurant(val); setPage(1); }}
              placeholder="Select restaurant..."
            />
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
            <HiOutlinePlus size={18} /> Add Table
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        <div className="border-b border-stroke px-4 py-3">
          <div className="relative max-w-xs">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by table number..."
              className="w-full rounded-lg border border-stroke py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !tables.length ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No tables found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {tables.map((table) => (
              <div
                key={table._id}
                className="relative flex aspect-square min-h-[210px] flex-col overflow-hidden rounded-xl border border-stroke bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase text-slate-400">
                      Table
                    </p>
                    <h3 className="mt-1 truncate text-2xl font-bold text-slate-800">
                      {table.tableNumber}
                    </h3>
                  </div>
                </div>

                <div className="relative mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Table Status</p>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(table)}
                      className={`mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${table.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                      title={table.isActive ? 'Click to deactivate table' : 'Click to activate table'}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${table.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <p className={`mt-1 text-xs font-medium ${table.isActive ? 'text-green-700' : 'text-red-700'}`}>
                      {table.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Availability</p>
                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${table.isEngaged ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {table.isEngaged ? 'Occupied' : 'Available'}
                    </span>
                  </div>
                </div>

                <div className="relative mt-3 min-h-[42px] rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">Capacity</p>
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {table.capacity || 0} seats
                    {table.isEngaged && table.activeOrder?.orderNumber
                      ? ` - ${table.activeOrder.orderNumber}`
                      : ''}
                  </p>
                </div>

                <div className="relative mt-auto flex items-center justify-between border-t border-stroke pt-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openView(table)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <HiOutlineEye size={16} />
                      View
                    </button>
                    <button
                      onClick={() => showQr(table)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50"
                    >
                      <HiOutlineQrcode size={16} />
                      QR
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(table)}
                      className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                      title="Edit table"
                    >
                      <HiOutlinePencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(table._id)}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                      title="Delete table"
                    >
                      <HiOutlineTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-stroke px-4 py-3 sm:flex-row">
            <span className="text-sm text-slate-500">
              Showing {from} to {to} of {total} results
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <HiOutlineChevronLeft size={16} />
              </button>
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[32px] rounded-lg px-2.5 py-1 text-sm font-medium ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <HiOutlineChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Table' : 'Add Table'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Table Number *</label>
            <input value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} required className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="e.g. T1" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Capacity</label>
            <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} min="1" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={qrModal.open} onClose={() => setQrModal({ open: false, qr: '', table: '', url: '' })} title={`QR Code - Table ${qrModal.table}`}>
        <div className="flex flex-col items-center gap-4">
          {qrModal.qr && <img src={qrModal.qr} alt="QR Code" className="h-64 w-64" />}
          {qrModal.url && (
            <p className="max-w-full break-all rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{qrModal.url}</p>
          )}
          <button onClick={downloadQr} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
            <HiOutlineDownload size={18} /> Download QR
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={viewModal.open}
        onClose={closeView}
        title={`Table ${viewModal.table?.tableNumber || ''} Details`}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-stroke bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Table Overview</p>
                <h4 className="mt-1 text-lg font-semibold text-slate-800">
                  Table {viewModal.table?.tableNumber || '-'}
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                  Capacity: {viewModal.table?.capacity || 0} seats
                </span>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${viewModal.table?.isEngaged ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {viewModal.table?.isEngaged ? 'Occupied' : 'Available'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stroke bg-white p-1">
            <button
              type="button"
              onClick={() => setViewTab('current')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewTab === 'current'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Current Order
            </button>
            <button
              type="button"
              onClick={() => setViewTab('history')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewTab === 'history'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              History
            </button>
          </div>

          {viewTab === 'current' ? (
            currentOrderLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : currentOrder ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-stroke bg-white p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Current Order</p>
                      <p className="mt-1 text-lg font-semibold text-slate-800">{currentOrder.orderNumber || '-'}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatDateTime(currentOrder.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {renderChip('Status', currentOrder.status)}
                      {renderChip('Payment', currentOrder.paymentStatus)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Customer</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{currentOrder.customerName || '-'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{currentOrder.customerPhone || '-'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{formatCurrency(currentOrder.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-stroke">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-stroke">
                        <th className="px-4 py-3 font-semibold text-slate-600">Item</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Qty</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Price</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentOrder.items || []).map((item, index) => (
                        <tr key={`${item.name}-${index}`} className="border-b border-stroke last:border-0">
                          <td className="px-4 py-3 text-slate-700">{item.name}</td>
                          <td className="px-4 py-3 text-slate-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-slate-700">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-slate-700">{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-stroke px-4 py-10 text-center text-sm text-slate-500">
                No active order for this table.
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">From Date</label>
                  <input
                    type="date"
                    value={historyFilter.from}
                    onChange={(e) => setHistoryFilter((prev) => ({ ...prev, from: e.target.value }))}
                    className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">To Date</label>
                  <input
                    type="date"
                    value={historyFilter.to}
                    onChange={(e) => setHistoryFilter((prev) => ({ ...prev, to: e.target.value }))}
                    className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-stroke bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total Orders</p>
                  <p className="mt-2 text-2xl font-bold text-slate-800">{historySummary.totalOrders || 0}</p>
                </div>
                <div className="rounded-lg border border-stroke bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total Amount</p>
                  <p className="mt-2 text-2xl font-bold text-slate-800">{formatCurrency(historySummary.totalAmount)}</p>
                </div>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : historyOrders.length ? (
                <div className="overflow-hidden rounded-xl border border-stroke bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr className="border-b border-stroke">
                          <th className="px-4 py-3 font-semibold text-slate-600">Order #</th>
                          <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                          <th className="px-4 py-3 font-semibold text-slate-600">Items</th>
                          <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                          <th className="px-4 py-3 font-semibold text-slate-600">Payment</th>
                          <th className="px-4 py-3 font-semibold text-slate-600">Total</th>
                          <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyOrders.map((order) => (
                          <tr key={order._id} className="border-b border-stroke last:border-0 hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber || '-'}</td>
                            <td className="px-4 py-3 text-slate-600">{formatDateTime(order.createdAt)}</td>
                            <td className="px-4 py-3 text-slate-600">{order.items?.length || 0}</td>
                            <td className="px-4 py-3">{renderChip('', order.status)}</td>
                            <td className="px-4 py-3">{renderChip('', order.paymentStatus)}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800 b">{formatCurrency(order.totalAmount)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openHistoryDetails(order)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                >
                                  <HiOutlineEye size={14} />
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => printOrderBill(order)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                                >
                                  <HiOutlinePrinter size={14} />
                                  Print
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {historyTotalPages > 1 && (
                    <div className="flex flex-col items-center justify-between gap-3 border-t border-stroke px-4 py-3 sm:flex-row">
                      <span className="text-sm text-slate-500">
                        Showing {historyFrom} to {historyTo} of {historyTotal} orders
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setHistoryPage((prev) => prev - 1)}
                          disabled={historyPage <= 1}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <HiOutlineChevronLeft size={16} />
                        </button>
                        {Array.from({ length: historyTotalPages }, (_, index) => index + 1).map((pageNumber) => (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => setHistoryPage(pageNumber)}
                            className={`min-w-[32px] rounded-lg px-2.5 py-1 text-sm font-medium ${
                              pageNumber === historyPage
                                ? 'bg-primary text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setHistoryPage((prev) => prev + 1)}
                          disabled={historyPage >= historyTotalPages}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <HiOutlineChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-stroke px-4 py-10 text-center text-sm text-slate-500">
                  No order history found for the selected date range.
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={historyDetailModal.open}
        onClose={() => setHistoryDetailModal({ open: false, order: null })}
        title={`Order ${historyDetailModal.order?.orderNumber || ''}`}
      >
        {historyDetailModal.order && (
          <div className="space-y-4">
            <div className="rounded-xl border border-stroke bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Order Details</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{historyDetailModal.order.orderNumber || '-'}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDateTime(historyDetailModal.order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {renderChip('Status', historyDetailModal.order.status)}
                  {renderChip('Payment', historyDetailModal.order.paymentStatus)}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Customer</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{historyDetailModal.order.customerName || '-'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Phone</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{historyDetailModal.order.customerPhone || '-'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Table</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {historyDetailModal.order.tableId?.tableNumber || viewModal.table?.tableNumber || '-'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{formatCurrency(historyDetailModal.order.totalAmount)}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-stroke">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-stroke">
                    <th className="px-4 py-3 font-semibold text-slate-600">Item</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Qty</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Price</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(historyDetailModal.order.items || []).map((item, index) => (
                    <tr key={`${historyDetailModal.order._id}-${index}`} className="border-b border-stroke last:border-0">
                      <td className="px-4 py-3 text-slate-700">{item.name}</td>
                      <td className="px-4 py-3 text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-700">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => printOrderBill(historyDetailModal.order)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                <HiOutlinePrinter size={16} />
                Print Bill
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
