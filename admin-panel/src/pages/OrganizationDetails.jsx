import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineEye } from 'react-icons/hi';
import organizationService from '../services/organizationService';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';

export default function OrganizationDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isOrderPaymentsPage = location.pathname === '/order-payments';
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const effectiveOrgId = useMemo(() => {
    if (user?.role === 'org_admin') return user?.organizationId || '';
    return selectedOrganizationId || id || '';
  }, [user?.role, user?.organizationId, selectedOrganizationId, id]);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRazorpayOrders: 0,
    totalRazorpayAmount: 0,
  });
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historySearch, setHistorySearch] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    if (id) {
      setSelectedOrganizationId(id);
    }
  }, [user?.role, id]);

  const renderDetailTable = (title, data) => {
    const rows = Object.entries(data || {});
    return (
      <div>
        <p className="mb-1 text-xs font-semibold text-slate-600">{title}</p>
        <div className="max-h-64 overflow-auto rounded-lg border border-stroke">
          {!rows.length ? (
            <div className="px-3 py-2 text-xs text-slate-500">
              No details available.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <tbody>
                {rows.map(([key, value]) => {
                  const isObject =
                    value !== null && typeof value === 'object';
                  return (
                    <tr key={key} className="border-b border-stroke last:border-0">
                      <td className="w-1/3 bg-slate-50 px-3 py-2 font-medium text-slate-700">
                        {key}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {isObject ? JSON.stringify(value) : String(value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const openPaymentDetails = async (paymentId) => {
    setPaymentModalOpen(true);
    setPaymentLoading(true);
    setPaymentDetails(null);
    try {
      const res = await organizationService.getRazorpayPaymentDetails(
        effectiveOrgId,
        paymentId,
      );
      setPaymentDetails(res.data.data || null);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to load payment details',
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (!effectiveOrgId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await organizationService.getOrderSummary(effectiveOrgId, {
          restaurantId: selectedRestaurantId || undefined,
        });
        const result = res.data.data || {};
        setOrganization(result.organization || null);
        setSummary(
          result.summary || {
            totalOrders: 0,
            totalRazorpayOrders: 0,
            totalRazorpayAmount: 0,
          },
        );
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [effectiveOrgId, selectedRestaurantId]);

  useEffect(() => {
    if (!effectiveOrgId) return;
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await organizationService.getRazorpayOrders(effectiveOrgId, {
          page: historyPage,
          limit: 10,
          search: historySearch || undefined,
          restaurantId: selectedRestaurantId || undefined,
        });
        const result = res.data.data || {};
        setHistory(result.data || []);
        setHistoryTotalPages(result.totalPages || 1);
        setHistoryTotal(result.total || 0);
      } catch (err) {
        toast.error(
          err.response?.data?.message || 'Failed to load Razorpay history',
        );
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [effectiveOrgId, historyPage, historySearch, selectedRestaurantId]);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    const loadOrganizations = async () => {
      try {
        const res = await organizationService.getAll({ limit: 100 });
        const result = res.data.data || {};
        setOrganizations(result.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load organizations');
      }
    };
    loadOrganizations();
  }, [user?.role]);

  useEffect(() => {
    if (!effectiveOrgId) {
      setRestaurants([]);
      return;
    }
    const loadRestaurants = async () => {
      try {
        const res = await organizationService.getRestaurants(effectiveOrgId, {
          limit: 100,
        });
        const result = res.data.data || {};
        setRestaurants(result.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load restaurants');
      }
    };
    loadRestaurants();
  }, [effectiveOrgId]);

  useEffect(() => {
    setSelectedRestaurantId('');
    setHistoryPage(1);
  }, [effectiveOrgId]);

  useEffect(() => {
    if (effectiveOrgId) return;
    setOrganization(null);
    setSummary({
      totalOrders: 0,
      totalRazorpayOrders: 0,
      totalRazorpayAmount: 0,
    });
    setHistory([]);
    setHistoryTotal(0);
    setHistoryTotalPages(1);
  }, [effectiveOrgId]);

  if (!['super_admin', 'org_admin'].includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  if (loading && effectiveOrgId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {user?.role === 'org_admin' || isOrderPaymentsPage
              ? 'Order Payments'
              : 'Organization Details'}
          </h2>
          <p className="text-sm text-slate-500">
            {organization?.name || 'Organization'}
          </p>
        </div>
        {user?.role === 'super_admin' && !isOrderPaymentsPage && (
          <button
            onClick={() => navigate('/organizations')}
            className="inline-flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <HiOutlineArrowLeft size={16} />
            Back
          </button>
        )}
      </div>

      <div className="rounded-xl border border-stroke bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Order Payments
            </h3>
            <p className="text-xs text-slate-500">
              {user?.role === 'super_admin'
                ? 'Filter by organization and restaurant to see payment data.'
                : 'Filter by restaurant to see restaurant-wise Razorpay payment data.'}
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
            {user?.role === 'super_admin' && (
              <div className="w-full sm:w-72">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Organization Filter
                </label>
                <SearchSelect
                  options={[
                    { value: '', label: 'Select Organization' },
                    ...organizations.map((org) => ({
                      value: org._id,
                      label: org.name,
                    })),
                  ]}
                  value={selectedOrganizationId}
                  onChange={(value) => {
                    setSelectedOrganizationId(value);
                    setOrganization(null);
                  }}
                  placeholder="Select Organization"
                />
              </div>
            )}
            <div className="w-full sm:w-72">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Restaurant Filter
              </label>
              <SearchSelect
                options={[
                  { value: '', label: 'All Restaurants' },
                  ...restaurants.map((restaurant) => ({
                    value: restaurant._id,
                    label: restaurant.name,
                  })),
                ]}
                value={selectedRestaurantId}
                onChange={(value) => {
                  setSelectedRestaurantId(value);
                  setHistoryPage(1);
                }}
                placeholder="All Restaurants"
              />
            </div>
          </div>
        </div>
      </div>

      {!effectiveOrgId && (
        <div className="rounded-xl border border-dashed border-stroke bg-card p-8 text-center text-sm text-slate-500">
          Select an organization to view order payments.
        </div>
      )}

      {effectiveOrgId && (
        <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stroke bg-card p-5">
          <p className="text-sm text-slate-500">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {Number(summary.totalOrders || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-xl border border-stroke bg-card p-5">
          <p className="text-sm text-slate-500">Orders Paid via Razorpay</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {Number(summary.totalRazorpayOrders || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-xl border border-stroke bg-card p-5">
          <p className="text-sm text-slate-500">Total Payments by Orders</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
           {Number(summary.totalRazorpayAmount || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        <div className="border-b border-stroke px-4 py-3">
          <h3 className="text-base font-semibold text-slate-800">
            Razorpay Order History
          </h3>
          <p className="text-xs text-slate-500">
            Orders completed with Razorpay payment
          </p>
        </div>
        <DataTable
          columns={[
            { key: 'orderNumber', label: 'Order No', sortable: true },
            {
              key: 'restaurant',
              label: 'Restaurant',
              render: (o) => o.restaurantId?.name || '-',
            },
            {
              key: 'customerName',
              label: 'Customer',
              render: (o) => o.customerName || '-',
            },
            {
              key: 'customerPhone',
              label: 'Phone',
              render: (o) => o.customerPhone || '-',
            },
            {
              key: 'totalAmount',
              label: 'Amount',
              render: (o) =>
                `${Number(o.totalAmount || 0).toLocaleString('en-IN')}`,
            },
            {
              key: 'razorpayPaymentId',
              label: 'Razorpay Payment',
              render: (o) => o.razorpayPaymentId || '-',
            },
            {
              key: 'actions',
              label: 'Action',
              render: (o) =>
                o.razorpayPaymentId ? (
                  <button
                    onClick={() => openPaymentDetails(o.razorpayPaymentId)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    <HiOutlineEye size={14} />
                    View
                  </button>
                ) : (
                  '-'
                ),
            },
            {
              key: 'createdAt',
              label: 'Date',
              sortable: true,
              render: (o) =>
                new Date(o.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }),
            },
          ]}
          data={history}
          loading={historyLoading}
          searchValue={historySearch}
          onSearchChange={(val) => {
            setHistorySearch(val);
            setHistoryPage(1);
          }}
          searchPlaceholder="Search by order, customer, phone, payment id..."
          page={historyPage}
          totalPages={historyTotalPages}
          total={historyTotal}
          limit={10}
          onPageChange={setHistoryPage}
        />
      </div>
        </>
      )}

      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Razorpay Payment Details"
      >
        {paymentLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : paymentDetails ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-stroke bg-slate-50 p-3 text-xs text-slate-700">
              <div>
                <span className="font-semibold">Order No:</span>{' '}
                {paymentDetails.order?.orderNumber || '-'}
              </div>
              <div>
                <span className="font-semibold">Restaurant:</span>{' '}
                {paymentDetails.order?.restaurantId?.name || '-'}
              </div>
              <div>
                <span className="font-semibold">Amount:</span> Rs{' '}
                {Number(paymentDetails.order?.totalAmount || 0).toLocaleString(
                  'en-IN',
                )}
              </div>
            </div>
            <div>
              {renderDetailTable(
                'Razorpay Payment API Response',
                paymentDetails.paymentDetails || {},
              )}
            </div>
            <div>
              {renderDetailTable(
                'Razorpay Order API Response',
                paymentDetails.razorpayOrderDetails || {},
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No payment details found.</p>
        )}
      </Modal>
    </div>
  );
}
