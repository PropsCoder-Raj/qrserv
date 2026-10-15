import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardList,
  HiCash,
  HiOutlineCreditCard,
  HiOutlineGlobe
} from 'react-icons/hi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import StatsCard from '../components/StatsCard';
import SearchSelect from '../components/SearchSelect';
import analyticsService from '../services/analyticsService';
import restaurantService from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'last7Days', label: 'Last 7 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

const toApiDate = (date) => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function OrderAnalytics() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isOrgAdmin = user?.role === 'org_admin';
  const showAllOption = isSuperAdmin || isOrgAdmin;

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [rangeOption, setRangeOption] = useState('today');
  const [customRange, setCustomRange] = useState({ from: null, to: null });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
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
  ]);

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

  const totalOrders = analytics?.totalOrders || 0;
  const cash = analytics?.cash || { count: 0, percentage: 0 };
  const card = analytics?.card || { count: 0, percentage: 0 };
  const online = analytics?.online || { count: 0, percentage: 0 };
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Order Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Total orders split by payment method (Cash, Card, Online).
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {restaurantOptions.length > 0 &&
            (showAllOption || restaurants.length > 1) && (
              <div className="w-56">
                <SearchSelect
                  options={restaurantOptions}
                  value={selectedRestaurant}
                  onChange={setSelectedRestaurant}
                  placeholder="Select restaurant..."
                />
              </div>
            )}

          <select
            value={rangeOption}
            onChange={(e) => setRangeOption(e.target.value)}
            className="h-10 rounded-lg border border-stroke bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {rangeOption === 'custom' && (
            <DatePicker
              selectsRange
              startDate={customRange.from}
              endDate={customRange.to}
              onChange={([from, to]) => setCustomRange({ from, to })}
              isClearable={false}
              placeholderText="Select date range"
              dateFormat="MMM d, yyyy"
              className="h-10 w-60 rounded-lg border border-stroke bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total Orders"
            value={totalOrders.toLocaleString('en-IN')}
            icon={HiOutlineClipboardList}
            color="blue"
          />
          <StatsCard
            title="Cash Orders"
            value={`${cash.count.toLocaleString('en-IN')} (${cash.percentage}%)`}
            icon={HiCash}
            color="green"
          />
          <StatsCard
            title="Card Orders"
            value={`${card.count.toLocaleString('en-IN')} (${card.percentage}%)`}
            icon={HiOutlineCreditCard}
            color="purple"
          />
          <StatsCard
            title="Online Orders"
            value={`${online.count.toLocaleString('en-IN')} (${online.percentage}%)`}
            icon={HiOutlineGlobe}
            color="teal"
          />
        </div>
      )}
    </div>
  );
}
