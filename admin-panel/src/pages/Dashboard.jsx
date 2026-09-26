import { useEffect, useState } from 'react';
import {
  HiOutlineClipboardList,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
  HiOutlineDownload,
} from 'react-icons/hi';
import * as XLSX from 'xlsx';
import SearchSelect from '../components/SearchSelect';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatsCard from '../components/StatsCard';
import restaurantService from '../services/restaurantService';
import orderService from '../services/orderService';
import subscriptionService from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PIE_COLORS = [
  '#3c50e0',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#64748b',
];

const PERIOD_OPTIONS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isOrgAdmin = user?.role === 'org_admin';
  const isRestaurantOwner = user?.role === 'restaurant_owner';
  const showAllOption = isSuperAdmin || isOrgAdmin;

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    mostSoldItems: [],
  });
  const [revenueData, setRevenueData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
  });
  const [revenuePeriod, setRevenuePeriod] = useState('daily');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subSummary, setSubSummary] = useState(null);
  const [planAnalytics, setPlanAnalytics] = useState([]);
  const [datePreset] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadRestaurants();
    if (isSuperAdmin) {
      loadSubscriptionAnalytics();
    }
  }, []);

  useEffect(() => {
    if (restaurantsLoaded) {
      loadDashboardData();
    }
  }, [selectedRestaurant, restaurantsLoaded, datePreset]);

  const loadRestaurants = async () => {
    try {
      const res = isSuperAdmin
        ? await restaurantService.getAll({ limit: 100 })
        : await restaurantService.getMy({ limit: 100 });
      const list = res.data.data.data || res.data.data;
      const arr = Array.isArray(list) ? list : [];
      setRestaurants(arr);
      if (!showAllOption && arr.length > 0) {
        setSelectedRestaurant(arr[0]._id);
      }
    } catch {
      toast.error('Failed to load restaurants');
    } finally {
      setRestaurantsLoaded(true);
    }
  };

  const loadSubscriptionAnalytics = async () => {
    try {
      const [historyRes, plansRes] = await Promise.all([
        subscriptionService.getAllHistory({
          page: 1,
          limit: 1,
          datePreset: datePreset || undefined,
        }),
        subscriptionService.getPlanAnalytics(),
      ]);

      const historyData = historyRes?.data?.data || {};
      const plansData = plansRes?.data?.data || {};

      setSubSummary(historyData.summary || null);
      setPlanAnalytics(
        Array.isArray(plansData.plans) ? plansData.plans : [],
      );
    } catch (err) {
      console.error(
        'Subscription analytics error:',
        err?.response?.data || err?.message,
      );
      setSubSummary(null);
      setPlanAnalytics([]);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    const restaurantId = selectedRestaurant || undefined;
    try {
      const [statsRes, ordersRes] = await Promise.allSettled([
        orderService.getStats(restaurantId, {
          datePreset: datePreset || undefined,
        }),
        orderService.getAll(restaurantId, undefined, {
          limit: 5,
          sortOrder: 'desc',
          datePreset: datePreset || undefined,
        }),
      ]);

      if (statsRes.status === 'fulfilled') {
        const summary = statsRes.value?.data?.data;
        if (summary) {
          setStats({
            totalOrders: summary.totalOrders || 0,
            totalSales: summary.totalSales || 0,
            mostSoldItems: summary.mostSoldItems || [],
          });
          setRevenueData({
            daily: summary.revenueDaily || [],
            weekly: summary.revenueWeekly || [],
            monthly: summary.revenueMonthly || [],
            yearly: summary.revenueYearly || [],
          });
        }
      } else {
        console.error(
          'Stats API failed:',
          statsRes.reason?.response?.data || statsRes.reason?.message,
        );
        toast.error('Failed to load order statistics');
      }

      if (ordersRes.status === 'fulfilled') {
        const ordersData = ordersRes.value?.data?.data;
        setOrders(ordersData?.data || ordersData || []);
      } else {
        console.error(
          'Orders API failed:',
          ordersRes.reason?.response?.data || ordersRes.reason?.message,
        );
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const currentRevenueData = revenueData[revenuePeriod] || [];

  const formatLabel = (label) => {
    if (revenuePeriod === 'daily') {
      const date = new Date(label);
      return date.toLocaleDateString('en', {
        month: 'short',
        day: 'numeric',
      });
    }
    if (revenuePeriod === 'weekly') {
      return label.replace(/^\d{4}-/, '');
    }
    if (revenuePeriod === 'monthly') {
      const [year, month] = label.split('-');
      const date = new Date(year, parseInt(month, 10) - 1);
      return date.toLocaleDateString('en', {
        month: 'short',
        year: '2-digit',
      });
    }
    return label;
  };

  const chartData = currentRevenueData.map((item) => ({
    label: formatLabel(item.label),
    revenue: item.revenue,
    orders: item.orders,
  }));

  const planChartData = planAnalytics.map((plan) => ({
    id: plan._id,
    name: plan.name,
    price: Number(plan.price) || 0,
    duration: Number(plan.duration) || 0,
    activeCount: Number(plan.activeCount) || 0,
    totalPurchaseCount: Number(plan.totalPurchaseCount) || 0,
    isActive: Boolean(plan.isActive),
  }));

  const purchaseShareData = planChartData
    .filter((plan) => plan.totalPurchaseCount > 0)
    .map((plan) => ({
      name: plan.name,
      value: plan.totalPurchaseCount,
    }));

  const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-IN');
  };

  const formatDateOnly = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN');
  };

  const getRestaurantName = (restaurantId) => {
    if (!restaurantId) return 'All Restaurants';
    return (
      restaurants.find((restaurant) => restaurant._id === restaurantId)?.name ||
      'Selected Restaurant'
    );
  };

  const buildWorkbookFromSheets = (sheets, fileName) => {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(({ name, rows }) => {
      const safeName = String(name || 'Sheet')
        .replace(/[\\/*?:[\]]/g, '')
        .slice(0, 31);
      const sheet =
        rows.length > 0
          ? XLSX.utils.json_to_sheet(rows)
          : XLSX.utils.aoa_to_sheet([['No data available']]);
      XLSX.utils.book_append_sheet(workbook, sheet, safeName || 'Sheet');
    });

    XLSX.writeFile(workbook, fileName);
  };

  const fetchAllRecords = async (fetchPage) => {
    const allRows = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await fetchPage(page);
      const payload = response?.data?.data || {};
      const rows = payload.records || payload.data || [];
      allRows.push(...(Array.isArray(rows) ? rows : []));
      totalPages = Number(payload.totalPages) || 1;
      page += 1;
    } while (page <= totalPages);

    return allRows;
  };

  const exportSuperAdminData = async () => {
    const [subscriptionHistory, allRestaurants] = await Promise.all([
      fetchAllRecords((page) =>
        subscriptionService.getAllHistory({
          page,
          limit: 500,
          datePreset: datePreset || undefined,
        }),
      ),
      restaurantService.getAll({ page: 1, limit: 1000 }),
    ]);

    const restaurantRows =
      allRestaurants?.data?.data?.data || allRestaurants?.data?.data || [];

    buildWorkbookFromSheets(
      [
        {
          name: 'Overview',
          rows: [
            {
              Role: 'Super Admin',
              'Total Transactions': subSummary?.totalTransactions || 0,
              'Subscription Revenue': subSummary?.totalRevenue || 0,
              'Active Subscriptions': subSummary?.activeCount || 0,
              'Paid Subscriptions': subSummary?.paidCount || 0,
              'Free Subscriptions': subSummary?.freeCount || 0,
              'Total Plans': planChartData.length,
              'Total Restaurants': restaurantRows.length,
              'Exported At': formatDateTime(new Date()),
            },
          ],
        },
        {
          name: 'Plan Breakdown',
          rows: planChartData.map((plan) => ({
            Plan: plan.name,
            Price: plan.price,
            'Duration Days': plan.duration,
            'Active Subscriptions': plan.activeCount,
            'Total Purchases': plan.totalPurchaseCount,
            Status: plan.isActive ? 'Active' : 'Inactive',
          })),
        },
        {
          name: 'Subscription History',
          rows: subscriptionHistory.map((item) => ({
            Organization: item.organizationId?.name || '-',
            Plan: item.subscriptionId?.name || item.planName || '-',
            Price: Number(item.price) || 0,
            Duration:
              item.subscriptionId?.duration ||
              item.duration ||
              item.months ||
              '-',
            Status: item.status || '-',
            'Payment Status': item.paymentStatus || '-',
            'Purchased By': item.purchasedBy?.name || '-',
            'Purchased Email': item.purchasedBy?.email || '-',
            'Purchased At': formatDateTime(item.purchasedAt),
            'Start Date': formatDateOnly(item.startDate),
            'End Date': formatDateOnly(item.endDate),
          })),
        },
        {
          name: 'Restaurants',
          rows: restaurantRows.map((restaurant) => ({
            Name: restaurant.name || '-',
            Email: restaurant.email || '-',
            Phone: restaurant.phone || '-',
            Address: restaurant.address || '-',
            Organization:
              restaurant.organizationId?.name ||
              restaurant.organizationName ||
              '-',
            'Tax Enabled': restaurant.taxEnabled ? 'Yes' : 'No',
            'Tax Rate': restaurant.taxRate || 0,
            'VAT Enabled': restaurant.vatEnabled ? 'Yes' : 'No',
            'VAT Rate': restaurant.vatRate || 0,
            'Created At': formatDateTime(restaurant.createdAt),
          })),
        },
      ],
      `dashboard_super_admin_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const exportOrderAnalyticsData = async () => {
    const orderRows = await fetchAllRecords((page) =>
      orderService.getAll(selectedRestaurant || undefined, undefined, {
        page,
        limit: 500,
        sortOrder: 'desc',
        datePreset: datePreset || undefined,
      }),
    );

    const restaurantMap = new Map(
      restaurants.map((restaurant) => [restaurant._id, restaurant.name]),
    );

    buildWorkbookFromSheets(
      [
        {
          name: 'Overview',
          rows: [
            {
              Role: isOrgAdmin ? 'Organization Admin' : 'Restaurant Owner',
              Restaurant: getRestaurantName(selectedRestaurant),
              'Total Orders': stats.totalOrders || 0,
              'Total Sales': stats.totalSales || 0,
              'Recent Orders Loaded': orders.length,
              'Full Orders Exported': orderRows.length,
              'Exported At': formatDateTime(new Date()),
            },
          ],
        },
        {
          name: 'Top Items',
          rows: stats.mostSoldItems.map((item, index) => ({
            Rank: index + 1,
            Item: item.name,
            'Quantity Sold': item.quantity,
          })),
        },
        {
          name: 'Order Status',
          rows: pieData.map((item) => ({
            Status: item.name,
            Count: item.value,
          })),
        },
        {
          name: 'Revenue Daily',
          rows: revenueData.daily.map((item) => ({
            Period: item.label,
            Revenue: item.revenue,
            Orders: item.orders,
          })),
        },
        {
          name: 'Revenue Weekly',
          rows: revenueData.weekly.map((item) => ({
            Period: item.label,
            Revenue: item.revenue,
            Orders: item.orders,
          })),
        },
        {
          name: 'Revenue Monthly',
          rows: revenueData.monthly.map((item) => ({
            Period: item.label,
            Revenue: item.revenue,
            Orders: item.orders,
          })),
        },
        {
          name: 'Revenue Yearly',
          rows: revenueData.yearly.map((item) => ({
            Period: item.label,
            Revenue: item.revenue,
            Orders: item.orders,
          })),
        },
        {
          name: 'Orders',
          rows: orderRows.map((order) => ({
            'Order Number': order.orderNumber || '-',
            Restaurant:
              restaurantMap.get(order.restaurantId) ||
              order.restaurantName ||
              getRestaurantName(selectedRestaurant),
            Customer: order.customerName || '-',
            Phone: order.customerPhone || '-',
            'Order Type': order.orderType || '-',
            Items:
              order.items
                ?.map(
                  (item) =>
                    `${item.name} x${item.quantity}${
                      item.cancelledQuantity
                        ? ` (cancelled ${item.cancelledQuantity})`
                        : ''
                    }`,
                )
                .join(', ') || '-',
            Subtotal: Number(order.subtotalAmount) || 0,
            Tax: Number(order.taxAmount) || 0,
            Total: Number(order.totalAmount) || 0,
            Status: order.status || '-',
            'Payment Status': order.paymentStatus || '-',
            'Created At': formatDateTime(order.createdAt),
          })),
        },
      ],
      `dashboard_${
        isOrgAdmin ? 'org_admin' : 'restaurant_owner'
      }_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      if (isSuperAdmin) {
        await exportSuperAdminData();
      } else if (isOrgAdmin || isRestaurantOwner) {
        await exportOrderAnalyticsData();
      }
      toast.success('Excel export completed');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export dashboard data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {(
            (isOrgAdmin || isRestaurantOwner) &&
            restaurants.length > 0 &&
            (showAllOption || restaurants.length > 1)
          ) && (
            <div className="w-56">
              <SearchSelect
                options={[
                  ...(showAllOption
                    ? [{ value: '', label: 'All Restaurants' }]
                    : []),
                  ...restaurants.map((restaurant) => ({
                    value: restaurant._id,
                    label: restaurant.name,
                  })),
                ]}
                value={selectedRestaurant}
                onChange={(value) => setSelectedRestaurant(value)}
                placeholder="Select restaurant..."
              />
            </div>
          )}
          {(isSuperAdmin || isOrgAdmin || isRestaurantOwner) && (
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HiOutlineDownload size={16} />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          )}
        </div>
      </div>

      {isSuperAdmin && subSummary && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-base font-semibold text-slate-800">
              Subscription Overview
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                title="Total Transactions"
                value={(subSummary.totalTransactions || 0).toLocaleString(
                  'en-IN',
                )}
                icon={HiOutlineClipboardList}
                color="purple"
              />
              <StatsCard
                title="Subscription Revenue"
                value={`${Number(
                  subSummary.totalRevenue || 0,
                ).toLocaleString('en-IN')}`}
                icon={HiOutlineCurrencyRupee}
                color="cyan"
              />
              <StatsCard
                title="Active Subscriptions"
                value={(subSummary.activeCount || 0).toLocaleString('en-IN')}
                icon={HiOutlineCheckCircle}
                color="green"
              />
              <StatsCard
                title="Paid / Free"
                value={`${subSummary.paidCount || 0} / ${
                  subSummary.freeCount || 0
                }`}
                icon={HiOutlineCreditCard}
                color="orange"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-800">
                  Plan Performance
                </h3>
                <p className="text-sm text-slate-500">
                  Active organizations and total purchases for each
                  subscription plan
                </p>
              </div>
              {planChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart
                    data={planChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      tick={{ fill: '#64748b' }}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={64}
                    />
                    <YAxis
                      allowDecimals={false}
                      fontSize={11}
                      tick={{ fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="activeCount"
                      name="Active subscriptions"
                      fill="#3c50e0"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="totalPurchaseCount"
                      name="Total purchases"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[340px] items-center justify-center text-sm text-slate-400">
                  No plan analytics available
                </div>
              )}
            </div>

            <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-800">
                  Purchase Share
                </h3>
                <p className="text-sm text-slate-500">
                  How total purchases are distributed across plans
                </p>
              </div>
              {purchaseShareData.length > 0 ? (
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart>
                    <Pie
                      data={purchaseShareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {purchaseShareData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        Number(value).toLocaleString('en-IN'),
                        'Purchases',
                      ]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={24} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[340px] items-center justify-center text-sm text-slate-400">
                  No purchase records available
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-800">
                Plan Breakdown
              </h3>
              <p className="text-sm text-slate-500">
                Detailed analytics for each subscription plan
              </p>
            </div>
            {planChartData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stroke bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Active
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Purchases
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {planChartData.map((plan) => (
                      <tr
                        key={plan.id}
                        className="border-b border-stroke last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {plan.name}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                         {plan.price.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {plan.duration} days
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {plan.activeCount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {plan.totalPurchaseCount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              plan.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-400">
                No subscription plans found
              </div>
            )}
          </div>
        </div>
      )}

      {(isOrgAdmin || isRestaurantOwner) && (
        <>
          <div>
            <h3 className="mb-3 text-base font-semibold text-slate-800">
              Order Analytics
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                title="Total Orders"
                value={stats.totalOrders.toLocaleString()}
                icon={HiOutlineClipboardList}
                color="blue"
              />
              <StatsCard
                title="Total Sales"
                value={`${stats.totalSales.toLocaleString()}`}
                icon={HiOutlineCurrencyRupee}
                color="green"
              />
            </div>
          </div>

          <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold text-slate-800">
                Total Revenue
              </h3>
              <div className="flex overflow-hidden rounded-lg border border-stroke">
                {PERIOD_OPTIONS.map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setRevenuePeriod(period.key)}
                    className={`cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors ${
                      revenuePeriod === period.key
                        ? 'bg-primary text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="revenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3c50e0"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3c50e0"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    fontSize={11}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis
                    fontSize={11}
                    tick={{ fill: '#64748b' }}
                    tickFormatter={(value) =>
                      `${
                        value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
                      }`
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'revenue'
                        ? `${Number(value).toLocaleString()}`
                        : value,
                      name === 'revenue' ? 'Revenue' : 'Orders',
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3c50e0"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                  <Bar
                    dataKey="orders"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                    opacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
                No revenue data for this period
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800">
                Order Status
              </h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                  No orders yet
                </div>
              )}
            </div>

            <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800">
                Top 10 Most Sold Items
              </h3>
              {stats.mostSoldItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stroke">
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-slate-500">
                          #
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-slate-500">
                          Item Name
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-slate-500">
                          Qty Sold
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.mostSoldItems.map((item, index) => (
                        <tr
                          key={item.name}
                          className="border-b border-stroke transition-colors last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-3 py-2.5 font-medium text-slate-500">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">
                            {item.name}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600">
                            {item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-slate-400">
                  No sales data available
                </p>
              )}
            </div>

            <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800">
                Recent Orders
              </h3>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stroke bg-slate-50">
                        <th className="px-4 py-3 font-semibold text-slate-600">
                          Order #
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600">
                          Customer
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600">
                          Amount
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order._id}
                          className="border-b border-stroke last:border-0"
                        >
                          <td className="px-4 py-3 font-medium">
                            {order.orderNumber}
                          </td>
                          <td className="px-4 py-3">
                            {order.customerName || '-'}
                          </td>
                          <td className="px-4 py-3">
                           {order.totalAmount}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={order.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                  No orders yet
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    ready: 'bg-green-100 text-green-700',
    served: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[status] || colors.pending
      }`}
    >
      {status}
    </span>
  );
}
