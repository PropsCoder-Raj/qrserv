import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardList,
  HiOutlineShoppingBag,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiArrowSmUp,
  HiArrowSmDown,
  HiOutlineRefresh,
  HiOutlineExternalLink,
  HiCash,
} from 'react-icons/hi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import SearchSelect from '../components/SearchSelect';
import analyticsService from '../services/analyticsService';
import restaurantService from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7Days', label: 'Last 7 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last30Days', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Payment Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const FULFILLMENT_OPTIONS = [
  { value: 'all', label: 'All Order Types' },
  { value: 'dine_in', label: 'Dine In' },
  { value: 'takeaway', label: 'Takeaway' },
];

const toApiDate = (date) => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function TrendBadge({ percentageChange = 0, trend = 'neutral' }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <HiArrowSmUp className="h-3.5 w-3.5" />
        +{Math.abs(percentageChange)}% vs prev
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
        <HiArrowSmDown className="h-3.5 w-3.5" />
        -{Math.abs(percentageChange)}% vs prev
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">
      0% vs prev
    </span>
  );
}

function KpiCard({
  title,
  value,
  subvalue,
  percentageChange,
  trend,
  icon: Icon,
  color = 'blue',
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'border-rose-100',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-stroke bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <h4 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h4>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${scheme.bg} ${scheme.border} border shadow-xs`}
        >
          <Icon size={24} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="text-xs font-medium text-slate-600">{subvalue}</div>
        <TrendBadge percentageChange={percentageChange} trend={trend} />
      </div>
    </div>
  );
}

export default function OrderAnalytics() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isOrgAdmin = user?.role === 'org_admin';
  const showAllOption = isSuperAdmin || isOrgAdmin;

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [rangeOption, setRangeOption] = useState('thisMonth');
  const [customRange, setCustomRange] = useState({ from: null, to: null });
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [fulfillmentMethod, setFulfillmentMethod] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('volume'); // 'volume' | 'revenue'

  useEffect(() => {
    loadRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCustomRangeReady =
    rangeOption !== 'custom' || (customRange.from && customRange.to);

  useEffect(() => {
    if (restaurantsLoaded && isCustomRangeReady) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    restaurantsLoaded,
    selectedRestaurant,
    rangeOption,
    customRange.from,
    customRange.to,
    paymentStatus,
    fulfillmentMethod,
  ]);

  const loadRestaurants = async () => {
    try {
      const res = isSuperAdmin
        ? await restaurantService.getAll({ limit: 100 })
        : await restaurantService.getMy({ limit: 100 });
      const list = res.data?.data?.data || res.data?.data;
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

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getOrderAnalytics({
        restaurantId: selectedRestaurant || undefined,
        datePreset: rangeOption === 'custom' ? undefined : rangeOption,
        startDate:
          rangeOption === 'custom' ? toApiDate(customRange.from) : undefined,
        endDate:
          rangeOption === 'custom' ? toApiDate(customRange.to) : undefined,
        paymentStatus,
        fulfillmentMethod,
      });
      setAnalytics(res?.data?.data || null);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Failed to load order analytics',
      );
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const restaurantOptions = useMemo(
    () => [
      ...(showAllOption ? [{ value: '', label: 'All Restaurants' }] : []),
      ...restaurants.map((restaurant) => ({
        value: restaurant._id,
        label: restaurant.name,
      })),
    ],
    [restaurants, showAllOption],
  );

  const kpis = analytics?.kpis || {
    totalOrders: {
      count: 0,
      grossRevenue: 0,
      percentageChange: 0,
      trend: 'neutral',
    },
    pendingOrders: {
      count: 0,
      activeValue: 0,
      percentageOfTotal: 0,
      percentageChange: 0,
      trend: 'neutral',
    },
    completedOrders: {
      count: 0,
      fulfilledRevenue: 0,
      fulfillmentRate: 0,
      percentageChange: 0,
      trend: 'neutral',
    },
    cancelledOrders: {
      count: 0,
      lossValue: 0,
      cancellationRate: 0,
      percentageChange: 0,
      trend: 'neutral',
    },
  };

  const orderTrends = analytics?.orderTrends || [];
  const statusDistribution = analytics?.statusDistribution || [];
  const recentOrders = analytics?.recentOrders || [];
  const totalOrdersCount = analytics?.totalOrders || 0;

  // Filter pie data to statuses with counts > 0 for clean display
  const pieData = useMemo(() => {
    return statusDistribution.filter((item) => item.count > 0);
  }, [statusDistribution]);

  return (
    <div className="space-y-6">
      {/* Page Header & Filtering Controls */}
      <div className="rounded-xl border border-stroke bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              Order Analytics Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor key order KPIs, fulfillment performance, volume trends, and
              payment breakdowns.
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-50 lg:self-auto"
            title="Refresh analytics data"
          >
            <HiOutlineRefresh
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:flex xl:flex-wrap xl:items-center">
          {/* Restaurant Selector */}
          {restaurantOptions.length > 0 &&
            (showAllOption || restaurants.length > 1) && (
              <div className="w-full sm:w-56">
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Restaurant
                </label>
                <SearchSelect
                  options={restaurantOptions}
                  value={selectedRestaurant}
                  onChange={setSelectedRestaurant}
                  placeholder="Select restaurant..."
                />
              </div>
            )}

          {/* Date Range Preset */}
          <div className="w-full sm:w-44">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Date Range
            </label>
            <select
              value={rangeOption}
              onChange={(e) => setRangeOption(e.target.value)}
              className="h-10 w-full rounded-lg border border-stroke bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Picker */}
          {rangeOption === 'custom' && (
            <div className="w-full sm:w-60">
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Custom Dates
              </label>
              <DatePicker
                selectsRange
                startDate={customRange.from}
                endDate={customRange.to}
                onChange={([from, to]) => setCustomRange({ from, to })}
                isClearable={false}
                placeholderText="Start date – End date"
                dateFormat="MMM d, yyyy"
                className="h-10 w-full rounded-lg border border-stroke bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Payment Status Filter */}
          <div className="w-full sm:w-48">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="h-10 w-full rounded-lg border border-stroke bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary"
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fulfillment Method Filter */}
          <div className="w-full sm:w-44">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Fulfillment Method
            </label>
            <select
              value={fulfillmentMethod}
              onChange={(e) => setFulfillmentMethod(e.target.value)}
              className="h-10 w-full rounded-lg border border-stroke bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary"
            >
              {FULFILLMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading analytics metrics...
          </p>
        </div>
      ) : (
        <>
          {/* 1. Key Metric Cards (KPI Summary) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total Orders"
              value={kpis.totalOrders.count.toLocaleString('en-IN')}
              subvalue={`Gross Value: ${formatCurrency(kpis.totalOrders.grossRevenue)}`}
              percentageChange={kpis.totalOrders.percentageChange}
              trend={kpis.totalOrders.trend}
              icon={HiOutlineShoppingBag}
              color="blue"
            />
            <KpiCard
              title="Pending / Processing"
              value={kpis.pendingOrders.count.toLocaleString('en-IN')}
              subvalue={`Active: ${formatCurrency(kpis.pendingOrders.activeValue)} • ${kpis.pendingOrders.percentageOfTotal}%`}
              percentageChange={kpis.pendingOrders.percentageChange}
              trend={kpis.pendingOrders.trend}
              icon={HiOutlineClock}
              color="amber"
            />
            <KpiCard
              title="Completed / Delivered"
              value={kpis.completedOrders.count.toLocaleString('en-IN')}
              subvalue={`Fulfillment: ${kpis.completedOrders.fulfillmentRate}% • ${formatCurrency(kpis.completedOrders.fulfilledRevenue)}`}
              percentageChange={kpis.completedOrders.percentageChange}
              trend={kpis.completedOrders.trend}
              icon={HiOutlineCheckCircle}
              color="emerald"
            />
            <KpiCard
              title="Cancelled / Refunded"
              value={kpis.cancelledOrders.count.toLocaleString('en-IN')}
              subvalue={`Loss: ${formatCurrency(kpis.cancelledOrders.lossValue)} • ${kpis.cancelledOrders.cancellationRate}%`}
              percentageChange={kpis.cancelledOrders.percentageChange}
              trend={kpis.cancelledOrders.trend}
              icon={HiOutlineXCircle}
              color="rose"
            />
          </div>

          {/* 2. Visual Analytics Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Order Trends Timeline (Line / Area Chart) */}
            <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm lg:col-span-7 xl:col-span-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    Order Trends Over Time
                  </h3>
                  <p className="text-xs text-slate-500">
                    {chartView === 'volume'
                      ? 'Total volume vs completed & cancelled orders'
                      : 'Gross sales revenue performance over time'}
                  </p>
                </div>

                {/* View Mode Toggle */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setChartView('volume')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                      chartView === 'volume'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Volume
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView('revenue')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                      chartView === 'revenue'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Revenue
                  </button>
                </div>
              </div>

              <div className="mt-6">
                {orderTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart
                      data={orderTrends}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="totalGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3B82F6"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3B82F6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="completedGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10B981"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10B981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="revenueGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8B5CF6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8B5CF6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#F1F5F9"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        fontSize={11}
                        tick={{ fill: '#64748B' }}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <YAxis
                        fontSize={11}
                        tick={{ fill: '#64748B' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={chartView === 'revenue'}
                        tickFormatter={(v) =>
                          chartView === 'revenue'
                            ? `${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
                            : v
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                        formatter={(value, name) => {
                          if (name === 'revenue') {
                            return [`${formatCurrency(value)}`, 'Revenue'];
                          }
                          if (name === 'totalOrders') {
                            return [value, 'Total Orders'];
                          }
                          if (name === 'completedOrders') {
                            return [value, 'Completed / Delivered'];
                          }
                          if (name === 'cancelledOrders') {
                            return [value, 'Cancelled / Refunded'];
                          }
                          return [value, name];
                        }}
                      />

                      {chartView === 'volume' ? (
                        <>
                          <Area
                            type="monotone"
                            dataKey="totalOrders"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            fill="url(#totalGradient)"
                            name="totalOrders"
                          />
                          <Area
                            type="monotone"
                            dataKey="completedOrders"
                            stroke="#10B981"
                            strokeWidth={2}
                            fill="url(#completedGradient)"
                            name="completedOrders"
                          />
                          <Line
                            type="monotone"
                            dataKey="cancelledOrders"
                            stroke="#EF4444"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            name="cancelledOrders"
                          />
                        </>
                      ) : (
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8B5CF6"
                          strokeWidth={2.5}
                          fill="url(#revenueGradient)"
                          name="revenue"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 flex-col items-center justify-center text-slate-400">
                    <HiOutlineClipboardList className="h-10 w-10 stroke-1 text-slate-300" />
                    <p className="mt-2 text-sm">
                      No order trend data available for this range
                    </p>
                  </div>
                )}
              </div>

              {/* Chart Legend Footer */}
              {chartView === 'volume' && orderTrends.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-slate-600">Total Orders</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Completed / Delivered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3 border-t-2 border-dashed border-rose-500" />
                    <span className="text-slate-600">Cancelled / Refunded</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Order Status Distribution (Doughnut Chart) */}
            <div className="flex flex-col justify-between rounded-xl border border-stroke bg-card p-5 shadow-sm lg:col-span-5 xl:col-span-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Status Distribution
                </h3>
                <p className="text-xs text-slate-500">
                  Breakdown by current order stage
                </p>
              </div>

              <div className="relative my-4 flex h-60 items-center justify-center">
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="count"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={92}
                          paddingAngle={3}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.status} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, item) => [
                            `${value} orders (${item.payload.percentage}%) • ${formatCurrency(item.payload.revenue)}`,
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Centered Donut Metric */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Total
                      </span>
                      <span className="text-2xl font-black text-slate-800">
                        {totalOrdersCount}
                      </span>
                      <span className="text-[11px] text-slate-400">orders</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <HiOutlineCheckCircle className="h-10 w-10 stroke-1 text-slate-300" />
                    <p className="mt-2 text-sm">No orders recorded</p>
                  </div>
                )}
              </div>

              {/* Status List Breakdown */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                {statusDistribution.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span>{item.count}</span>
                      <span className="text-slate-400 font-normal">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Recent Orders Table */}
          <div className="rounded-xl border border-stroke bg-card shadow-sm">
            <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-stroke">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Recent Orders Snapshot
                </h3>
                <p className="text-xs text-slate-500">
                  Latest 10 orders matching active filters
                </p>
              </div>

              <Link
                to="/orders"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Go to Orders Management</span>
                <HiOutlineExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stroke bg-slate-50 uppercase text-slate-500 font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Order Number</th>
                    <th className="px-5 py-3">Date & Time</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Type / Table</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke text-slate-700">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => {
                      // Status badge styling
                      const isCompleted = [
                        'completed',
                        'served',
                        'delivered',
                      ].includes(order.status);
                      const isCancelled = [
                        'cancelled',
                        'returned',
                        'refunded',
                      ].includes(order.status);
                      const isPending = [
                        'pending',
                        'confirmed',
                        'ready',
                        'preparing',
                      ].includes(order.status);

                      const statusBadge = isCompleted ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 capitalize">
                          {order.status}
                        </span>
                      ) : isCancelled ? (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200 capitalize">
                          {order.status}
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200 capitalize">
                          {order.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
                          {order.status}
                        </span>
                      );

                      // Payment status pill
                      const paymentBadge =
                        order.paymentStatus === 'paid' ? (
                          <span className="font-semibold text-emerald-600">
                            Paid • {order.paymentMethod}
                          </span>
                        ) : order.paymentStatus === 'failed' ? (
                          <span className="font-semibold text-rose-600">
                            Failed • {order.paymentMethod}
                          </span>
                        ) : (
                          <span className="font-semibold text-amber-600">
                            Pending • {order.paymentMethod}
                          </span>
                        );

                      return (
                        <tr
                          key={order._id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-5 py-3 font-mono font-medium text-slate-800">
                            {order.orderNumber}
                          </td>
                          <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-medium text-slate-800">
                              {order.customerName || 'Guest'}
                            </div>
                            {order.customerPhone && (
                              <div className="text-[11px] text-slate-400">
                                {order.customerPhone}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 capitalize">
                              {order.orderType?.replace('_', ' ') || 'Dine In'}
                            </span>
                            {order.tableNumber && (
                              <span className="ml-1.5 text-xs text-slate-500">
                                Table {order.tableNumber}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">{paymentBadge}</td>
                          <td className="px-5 py-3">{statusBadge}</td>
                          <td className="px-5 py-3 text-right font-bold text-slate-900">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Link
                              to={`/admin/print/bill/${order._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-primary hover:text-primary transition-colors"
                            >
                              <span>Receipt</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-sm text-slate-400"
                      >
                        No orders found matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
