import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar,
  HiOutlineCurrencyRupee,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSearch,
  HiOutlineFilter,
} from 'react-icons/hi';
import subscriptionService from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import DatePresetFilter from '../components/DatePresetFilter';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_OPTIONS = [
  { value: '', label: 'All Payments' },
  { value: 'paid', label: 'Paid' },
  { value: 'free', label: 'Free' },
  { value: 'pending', label: 'Pending' },
];

const LIMIT = 15;

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-stroke bg-card px-5 py-4 shadow-sm">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-50 text-green-700',
    expired: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.expired}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PaymentBadge({ status }) {
  const styles = {
    paid: 'bg-green-50 text-green-700',
    free: 'bg-slate-100 text-slate-600',
    pending: 'bg-amber-50 text-amber-700',
  };
  const labels = { paid: 'Paid', free: 'Free', pending: 'Pending' };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.free}`}>
      {labels[status] || 'Free'}
    </span>
  );
}

export default function SubscriptionHistories() {
  const { user } = useAuth();
  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    activeCount: 0,
    paidCount: 0,
    freeCount: 0,
  });

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [datePreset, setDatePreset] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionService.getAllHistory({
        page,
        limit: LIMIT,
        search: search || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        datePreset: datePreset || undefined,
      });
      const data = res.data.data;
      setRecords(data.records || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setSummary(data.summary || {
        totalRevenue: 0, totalTransactions: 0, activeCount: 0, paidCount: 0, freeCount: 0,
      });
    } catch {
      toast.error('Failed to load subscription histories');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, paymentFilter, datePreset]);

  useEffect(() => { load(); }, [load]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = (val) => { setStatusFilter(val); setPage(1); };
  const handlePaymentChange = (val) => { setPaymentFilter(val); setPage(1); };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setPaymentFilter('');
    setDatePreset('');
    setPage(1);
  };

  const hasFilters = search || statusFilter || paymentFilter;

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const fmtPrice = (p) => (p === 0 ? 'Free' : `₹${Number(p).toLocaleString('en-IN')}`);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Subscription Histories</h1>
        <p className="mt-1 text-sm text-slate-500">All subscription purchases across every organization</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={HiOutlineClipboardList}
          label="Total Transactions"
          value={summary.totalTransactions.toLocaleString('en-IN')}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={HiOutlineCurrencyRupee}
          label="Total Revenue"
          value={`₹${Number(summary.totalRevenue).toLocaleString('en-IN')}`}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={HiOutlineCheckCircle}
          label="Active Subscriptions"
          value={summary.activeCount.toLocaleString('en-IN')}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={HiOutlineCurrencyRupee}
          label="Paid / Free"
          value={`${summary.paidCount} / ${summary.freeCount}`}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-stroke bg-card px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by plan name..."
                className="w-full rounded-lg border border-stroke pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Search
            </button>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <HiOutlineFilter className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border border-stroke px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => handlePaymentChange(e.target.value)}
            className="rounded-lg border border-stroke px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"
          >
            {PAYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Date Preset */}
          {/* <div className="w-44">
            <DatePresetFilter
              value={datePreset}
              onChange={(val) => {
                setDatePreset(val);
                setPage(1);
              }}
            />
          </div> */}

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="whitespace-nowrap rounded-lg border border-stroke px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        {/* Table Header info */}
        <div className="flex items-center justify-between border-b border-stroke px-5 py-3.5">
          <p className="text-sm text-slate-500">
            Showing <strong className="text-slate-700">{records.length}</strong> of{' '}
            <strong className="text-slate-700">{total}</strong> records
          </p>
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>

        {loading && records.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <HiOutlineCalendar className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-base font-medium text-slate-600">No records found</p>
            <p className="mt-1 text-sm text-slate-400">
              {hasFilters ? 'Try clearing your filters.' : 'No subscription purchases yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-slate-50 text-left">
                  <th className="px-5 py-3 font-medium text-slate-500 w-10">#</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Organization</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Plan</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Price</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Duration</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Purchased By</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Purchase Date</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Expiry Date</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Payment</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Status</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Razorpay ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {records.map((record, index) => (
                  <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {(page - 1) * LIMIT + index + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800">
                        {record.organizationId?.name || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        {record.planName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {fmtPrice(record.price)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{record.duration}d</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-700">{record.purchasedBy?.name || '—'}</p>
                      {record.purchasedBy?.email && (
                        <p className="text-xs text-slate-400">{record.purchasedBy.email}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {fmtDate(record.purchasedAt)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {(() => {
                        const expired = new Date(record.expiresAt) < new Date();
                        return (
                          <span className={`text-sm ${expired ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                            {fmtDate(record.expiresAt)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5">
                      <PaymentBadge status={record.paymentStatus || 'free'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {record.razorpayPaymentId ? (
                        <span
                          className="font-mono text-xs text-slate-500 cursor-default"
                          title={record.razorpayPaymentId}
                        >
                          {record.razorpayPaymentId.slice(0, 16)}…
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stroke px-5 py-3.5">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HiOutlineChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-primary text-white'
                        : 'border border-stroke text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HiOutlineChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
