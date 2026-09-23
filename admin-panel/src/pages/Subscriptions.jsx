import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCalendar } from 'react-icons/hi';
import subscriptionService from '../services/subscriptionService';
import organizationService from '../services/organizationService';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import DatePresetFilter from '../components/DatePresetFilter';

const CUSTOMER_DATA_OPTIONS = [
  { value: 'none', label: 'No' },
  // { value: 'optional', label: 'Optional (restaurant can choose)' },
  { value: 'included', label: 'Yes (always collected)' },
];

const defaultForm = {
  name: '',
  price: '',
  discountType: 'none',
  discountValue: '',
  isPaymentGatewayAllocated: false,
  isMenuPdfEnabled: false,
  duration: '',
  offers: [],
  maxTables: 0,
  maxMenuItems: 0,
  maxCategories: 0,
  maxRestaurants: 5,
  customerDataAccess: 'optional',
  features: '',
  unlimitedTables: true,
  unlimitedMenuItems: true,
  unlimitedCategories: true,
  unlimitedRestaurants: false,
};

export default function Subscriptions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('plans');

  // Plans state
  const [subs, setSubs] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [assignForm, setAssignForm] = useState({ organizationId: '', subscriptionId: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Purchase history state
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalSpent, setHistoryTotalSpent] = useState(0);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDatePreset, setHistoryDatePreset] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionService.getAll({ page, limit: 10, search: search || undefined, sortBy: sortBy || undefined, sortOrder });
      const result = res.data.data;
      setSubs(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch { toast.error('Failed to load subscriptions'); }
    finally { setLoading(false); }
  }, [page, search, sortBy, sortOrder]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await subscriptionService.getAllHistory({
        page: historyPage,
        limit: 20,
        search: historySearch || undefined,
        datePreset: historyDatePreset || undefined,
      });
      const result = res.data.data;
      setHistoryRecords(result.records || []);
      setHistoryTotalPages(result.totalPages || 1);
      setHistoryTotal(result.total || 0);
      setHistoryTotalSpent(result.totalSpent || 0);
    } catch { toast.error('Failed to load purchase history'); }
    finally { setHistoryLoading(false); }
  }, [historyPage, historySearch, historyDatePreset]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadOrganizations(); }, []);
  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab, loadHistory]);

  const loadOrganizations = async () => {
    try {
      const res = await organizationService.getAll({ limit: 100 });
      const list = res.data.data.data || res.data.data;
      setOrganizations(Array.isArray(list) ? list : []);
    } catch {
      // ignore
    }
  };

  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name,
      price: s.price,
      discountType: s.discountType || 'none',
      discountValue: s.discountValue ?? '',
      isPaymentGatewayAllocated: Boolean(s.isPaymentGatewayAllocated),
      isMenuPdfEnabled: Boolean(s.isMenuPdfEnabled),
      duration: s.duration,
      offers: Array.isArray(s.offers)
        ? s.offers.map((o) => ({
          months: o.months ?? '',
          offerPercent: o.offerPercent ?? '',
        }))
        : [],
      maxTables: s.maxTables ?? 0,
      maxMenuItems: s.maxMenuItems ?? 0,
      maxCategories: s.maxCategories ?? 0,
      maxRestaurants: s.maxRestaurants ?? 5,
      customerDataAccess: s.customerDataAccess || 'none',
      features: s.features?.join(', ') || '',
      unlimitedTables: !s.maxTables || s.maxTables === 0,
      unlimitedMenuItems: !s.maxMenuItems || s.maxMenuItems === 0,
      unlimitedCategories: !s.maxCategories || s.maxCategories === 0,
      unlimitedRestaurants: !s.maxRestaurants || s.maxRestaurants === 0,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const offers = (form.offers || [])
        .map((o) => ({
          months: Number(o.months),
          offerPercent: Number(o.offerPercent),
        }))
        .filter((o) => Number.isFinite(o.months) && o.months > 0 && Number.isFinite(o.offerPercent));

      const payload = {
        name: form.name,
        price: Number(form.price),
        discountType: form.discountType,
        discountValue:
          form.discountType && form.discountType !== 'none'
            ? Number(form.discountValue || 0)
            : 0,
        isPaymentGatewayAllocated: Boolean(form.isPaymentGatewayAllocated),
        isMenuPdfEnabled: Boolean(form.isMenuPdfEnabled),
        duration: Number(form.duration),
        offers,
        maxTables: form.unlimitedTables ? 0 : Number(form.maxTables),
        maxMenuItems: form.unlimitedMenuItems ? 0 : Number(form.maxMenuItems),
        maxCategories: form.unlimitedCategories ? 0 : Number(form.maxCategories),
        maxRestaurants: form.unlimitedRestaurants ? 0 : Number(form.maxRestaurants),
        customerDataAccess: form.customerDataAccess,
        features: form.features ? form.features.split(',').map((f) => f.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await subscriptionService.update(editing._id, payload);
        toast.success('Plan updated');
      } else {
        await subscriptionService.create(payload);
        toast.success('Plan created');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await subscriptionService.delete(id);
      toast.success('Plan deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await subscriptionService.assign(assignForm);
      toast.success('Subscription assigned');
      setAssignModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Assignment failed'); }
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleSort = (key, order) => { setSortBy(key); setSortOrder(order); setPage(1); };

  const fmtLimit = (val) => (!val || val === 0) ? 'Unlimited' : val;
  const fmtCustomerData = (val) => {
    const map = { none: 'No', optional: 'Optional', included: 'Yes' };
    return map[val] || 'No';
  };

  const columns = [
    { key: 'name', label: 'Plan Name', sortable: true, render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'price', label: 'Price', sortable: true, render: (s) => s.price === 0 ? 'Free' : `₹${s.price}` },
    {
      key: 'discount',
      label: 'Discount',
      render: (s) => {
        if (!s.discountType || s.discountType === 'none' || !s.discountValue) return '—';
        return s.discountType === 'flat' ? `₹${s.discountValue}` : `${s.discountValue}%`;
      },
    },
    { key: 'duration', label: 'Duration', sortable: true, render: (s) => `${s.duration} days` },
    {
      key: 'isMenuPdfEnabled',
      label: 'Menu PDF',
      render: (s) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isMenuPdfEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {s.isMenuPdfEnabled ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    { key: 'maxRestaurants', label: 'Max Outlets', sortable: true, render: (s) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${!s.maxRestaurants ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
        {fmtLimit(s.maxRestaurants)}
      </span>
    )},
    { key: 'maxMenuItems', label: 'Max Items', render: (s) => fmtLimit(s.maxMenuItems) },
    { key: 'maxCategories', label: 'Max Categories', render: (s) => fmtLimit(s.maxCategories) },
    { key: 'maxTables', label: 'Max Tables', render: (s) => fmtLimit(s.maxTables) },
    { key: 'customerDataAccess', label: 'Customer Data', render: (s) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.customerDataAccess === 'none' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
        {fmtCustomerData(s.customerDataAccess)}
      </span>
    )},
    { key: 'features', label: 'Features', render: (s) => (
      <div className="flex flex-wrap gap-1">
        {s.features?.slice(0, 2).map((f, i) => (
          <span key={i} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">{f}</span>
        ))}
        {s.features?.length > 2 && <span className="text-xs text-slate-400">+{s.features.length - 2}</span>}
      </div>
    )},
    { key: 'actions', label: '', render: (s) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"><HiOutlinePencil size={16} /></button>
        <button onClick={() => handleDelete(s._id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><HiOutlineTrash size={16} /></button>
      </div>
    )},
  ];

  const toggleCls = (checked) =>
    `relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition ${checked ? 'bg-primary' : 'bg-slate-300'}`;
  const toggleDot = (checked) =>
    `inline-block h-3.5 w-3.5 rounded-full bg-white transition ${checked ? 'translate-x-4' : 'translate-x-1'}`;

  const paymentStatusStyle = (status) => {
    if (status === 'paid') return { backgroundColor: '#dcfce7', color: '#15803d' };
    if (status === 'pending') return { backgroundColor: '#fef9c3', color: '#a16207' };
    return { backgroundColor: '#f1f5f9', color: '#475569' };
  };

  const statusStyle = (status) => {
    if (status === 'active') return { backgroundColor: '#dcfce7', color: '#15803d' };
    if (status === 'expired') return { backgroundColor: '#f1f5f9', color: '#475569' };
    return { backgroundColor: '#fee2e2', color: '#b91c1c' };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Subscription Plans</h2>
        {activeTab === 'plans' && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={() => { setAssignForm({ organizationId: organizations[0]?._id || '', subscriptionId: subs[0]?._id || '' }); setAssignModal(true); }} className="inline-flex items-center gap-2 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Assign to Organization
            </button>
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
              <HiOutlinePlus size={18} /> Add Plan
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stroke">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'plans' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Plans
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Purchase History
        </button>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="rounded-xl border border-stroke bg-card shadow-sm">
          <DataTable
            columns={columns}
            data={subs}
            loading={loading}
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Search by plan name..."
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Purchase History Tab */}
      {activeTab === 'history' && (
        <div className="rounded-xl border border-stroke bg-card">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stroke px-6 py-4 gap-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                Total Transactions: <strong className="text-slate-700">{historyTotal}</strong>
              </span>
              <span className="text-sm text-slate-500">
                Total Revenue: <strong className="text-slate-700">&#8377;{historyTotalSpent.toLocaleString()}</strong>
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* <div className="w-44">
                <DatePresetFilter
                  value={historyDatePreset}
                  onChange={(val) => {
                    setHistoryDatePreset(val);
                    setHistoryPage(1);
                  }}
                />
              </div> */}
              <input
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                placeholder="Search by plan name..."
                className="w-full sm:w-56 rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : historyRecords.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stroke bg-slate-50">
                      <th className="px-5 py-3 text-left font-medium text-slate-500">#</th>
                      <th className="px-5 py-3 text-left font-medium text-slate-500">Organization</th>
                      <th className="px-5 py-3 text-left font-medium text-slate-500">Plan</th>
                      <th className="px-5 py-3 text-left font-medium text-slate-500">Price</th>
                      <th className="px-5 py-3 text-left font-medium text-slate-500">Duration</th>
                      <th className="px-5 py-3 text-left font-medium text-slate-500">Purchased By</th>
                      <th className="px-5 py-3 text-left font-medium text-slate-500">Purchase Date</th>
                      <th className="px-5 py-3 text-left font-medium text-slate-500">Expiry Date</th>
                      <th className="px-5 py-3 text-left font-medium text-slate-500">Payment</th>
                      <th className="px-5 py-3 text-left font-medium text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((record, index) => (
                      <tr key={record._id} className="border-b border-stroke last:border-0 hover:bg-slate-50">
                        <td className="px-5 py-4 text-slate-500">{(historyPage - 1) * 20 + index + 1}</td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-800">
                            {record.organizationId?.name || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">{record.planName}</td>
                        <td className="px-5 py-4 text-slate-600">
                          {record.price === 0 ? 'Free' : `₹${record.price.toLocaleString()}`}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{record.duration} days</td>
                        <td className="px-5 py-4 text-slate-600">
                          <div>{record.purchasedBy?.name || '—'}</div>
                          {record.purchasedBy?.email && (
                            <div className="text-xs text-slate-400">{record.purchasedBy.email}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {new Date(record.purchasedAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {new Date(record.expiresAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium w-fit"
                              style={paymentStatusStyle(record.paymentStatus)}
                            >
                              {record.paymentStatus === 'paid' ? 'Paid' : record.paymentStatus === 'pending' ? 'Pending' : 'Free'}
                            </span>
                            {record.razorpayPaymentId && (
                              <span className="text-xs text-slate-400 font-mono" title={record.razorpayPaymentId}>
                                {record.razorpayPaymentId.slice(0, 14)}…
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                            style={statusStyle(record.status)}
                          >
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-stroke px-5 py-3">
                  <span className="text-xs text-slate-500">Page {historyPage} of {historyTotalPages}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                      disabled={historyPage === historyTotalPages}
                      className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-16 text-center">
              <HiOutlineCalendar className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No subscription transactions found.</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'Add Plan'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Plan Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Franchise, Franchise Pro" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Price (₹) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Duration (days) *</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required min="1" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-stroke px-4 py-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Payment Gateway Allocated</label>
              <p className="text-xs text-slate-500">Turn this on to allow customers to pay while placing their order in the customer app. Turn it off if you want customers to place orders in the customer app without paying at that time.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  isPaymentGatewayAllocated: !form.isPaymentGatewayAllocated,
                })
              }
              className={toggleCls(form.isPaymentGatewayAllocated)}
              aria-pressed={form.isPaymentGatewayAllocated}
              title="Toggle payment gateway allocation"
            >
              <span className={toggleDot(form.isPaymentGatewayAllocated)} />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-stroke px-4 py-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Menu PDF Enabled</label>
              <p className="text-xs text-slate-500">Turn this on to allow restaurants on this plan to upload a menu PDF and use the Menu PDF QR code.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  isMenuPdfEnabled: !form.isMenuPdfEnabled,
                })
              }
              className={toggleCls(form.isMenuPdfEnabled)}
              aria-pressed={form.isMenuPdfEnabled}
              title="Toggle menu PDF access"
            >
              <span className={toggleDot(form.isMenuPdfEnabled)} />
            </button>
          </div>

          {/* Month-based Offers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Month Offers</h4>
              <button
                type="button"
                onClick={() => setForm({
                  ...form,
                  offers: [...(form.offers || []), { months: '', offerPercent: '' }],
                })}
                className="inline-flex items-center gap-2 rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <HiOutlinePlus size={14} /> Add Offer
              </button>
            </div>

            {(form.offers || []).length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-stroke">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-stroke">
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Months</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Offer (%)</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.offers.map((row, idx) => (
                      <tr key={idx} className="border-b border-stroke last:border-0">
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="1"
                            value={row.months}
                            onChange={(e) => {
                              const next = [...form.offers];
                              next[idx] = { ...next[idx], months: e.target.value };
                              setForm({ ...form, offers: next });
                            }}
                            placeholder="e.g. 3"
                            className="w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={row.offerPercent}
                            onChange={(e) => {
                              const next = [...form.offers];
                              next[idx] = { ...next[idx], offerPercent: e.target.value };
                              setForm({ ...form, offers: next });
                            }}
                            placeholder="e.g. 50"
                            className="w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const next = (form.offers || []).filter((_, i) => i !== idx);
                              setForm({ ...form, offers: next });
                            }}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                            title="Remove"
                          >
                            <HiOutlineTrash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Add optional month-based offers, e.g. 3 months = 50% off.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountType: e.target.value,
                    discountValue: e.target.value === 'none' ? '' : form.discountValue,
                  })
                }
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="none">None</option>
                <option value="flat">Flat (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Discount Value
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                disabled={form.discountType === 'none'}
                min="0"
                max={form.discountType === 'percentage' ? 100 : undefined}
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary disabled:bg-slate-50"
                placeholder={
                  form.discountType === 'flat'
                    ? 'e.g. 500'
                    : form.discountType === 'percentage'
                      ? 'e.g. 10'
                      : '—'
                }
              />
              {form.discountType === 'percentage' && (
                <p className="mt-1 text-xs text-slate-500">0 to 100</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Limits</h4>

            <div className="flex items-center gap-3 rounded-lg border border-stroke px-4 py-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">Max Outlets (Restaurants)</label>
                {!form.unlimitedRestaurants && (
                  <input type="number" value={form.maxRestaurants} onChange={(e) => setForm({ ...form, maxRestaurants: e.target.value })} min="1" className="mt-1.5 w-full rounded-lg border border-stroke px-4 py-2 text-sm outline-none focus:border-primary" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Unlimited</span>
                <button type="button" onClick={() => setForm({ ...form, unlimitedRestaurants: !form.unlimitedRestaurants, maxRestaurants: !form.unlimitedRestaurants ? 0 : 5 })} className={toggleCls(form.unlimitedRestaurants)}>
                  <span className={toggleDot(form.unlimitedRestaurants)} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-stroke px-4 py-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">Max Menu Items <span style={{ fontSize: "x-small" }}>(per Outlet)</span></label>
                {!form.unlimitedMenuItems && (
                  <input type="number" value={form.maxMenuItems} onChange={(e) => setForm({ ...form, maxMenuItems: e.target.value })} min="1" className="mt-1.5 w-full rounded-lg border border-stroke px-4 py-2 text-sm outline-none focus:border-primary" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Unlimited</span>
                <button type="button" onClick={() => setForm({ ...form, unlimitedMenuItems: !form.unlimitedMenuItems, maxMenuItems: !form.unlimitedMenuItems ? 0 : 50 })} className={toggleCls(form.unlimitedMenuItems)}>
                  <span className={toggleDot(form.unlimitedMenuItems)} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-stroke px-4 py-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">Max Categories <span style={{ fontSize: "x-small" }}>(per Outlet)</span></label>
                {!form.unlimitedCategories && (
                  <input type="number" value={form.maxCategories} onChange={(e) => setForm({ ...form, maxCategories: e.target.value })} min="1" className="mt-1.5 w-full rounded-lg border border-stroke px-4 py-2 text-sm outline-none focus:border-primary" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Unlimited</span>
                <button type="button" onClick={() => setForm({ ...form, unlimitedCategories: !form.unlimitedCategories, maxCategories: !form.unlimitedCategories ? 0 : 10 })} className={toggleCls(form.unlimitedCategories)}>
                  <span className={toggleDot(form.unlimitedCategories)} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-stroke px-4 py-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">Max Tables <span style={{ fontSize: "x-small" }}>(per Outlet)</span></label>
                {!form.unlimitedTables && (
                  <input type="number" value={form.maxTables} onChange={(e) => setForm({ ...form, maxTables: e.target.value })} min="1" className="mt-1.5 w-full rounded-lg border border-stroke px-4 py-2 text-sm outline-none focus:border-primary" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Unlimited</span>
                <button type="button" onClick={() => setForm({ ...form, unlimitedTables: !form.unlimitedTables, maxTables: !form.unlimitedTables ? 0 : 10 })} className={toggleCls(form.unlimitedTables)}>
                  <span className={toggleDot(form.unlimitedTables)} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Customer Contact Number Data</label>
            <select value={form.customerDataAccess} onChange={(e) => setForm({ ...form, customerDataAccess: e.target.value })} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary">
              {CUSTOMER_DATA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Features (comma-separated)</label>
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder="Sales Data Management, QR Codes, Order Management"
              rows={4}
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Subscription to Organization">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Organization *</label>
            <SearchSelect
              options={organizations.map((o) => ({ value: o._id, label: o.name }))}
              value={assignForm.organizationId}
              onChange={(val) => setAssignForm({ ...assignForm, organizationId: val })}
              placeholder="Search organization..."
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Plan *</label>
            <SearchSelect
              options={subs.map((s) => ({ value: s._id, label: `${s.name} - ₹${s.price}/${s.duration}d` }))}
              value={assignForm.subscriptionId}
              onChange={(val) => setAssignForm({ ...assignForm, subscriptionId: val })}
              placeholder="Search plan..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAssignModal(false)} className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">Assign</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
