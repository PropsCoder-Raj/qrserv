import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import toast from 'react-hot-toast';
import menuService from '../services/menuService';
import alertService from '../services/alertService';
import restaurantService from '../services/restaurantService';
import tableService from '../services/tableService';
import designService from '../services/designService';
import { useCart } from '../contexts/CartContext';
import Loader from '../components/Loader';
import StorefrontThemeRenderer from '../components/themes/StorefrontThemeRenderer';
import { DEFAULT_CLASSIC_CONFIG, mergeClassicConfig } from '../utils/designTheme';

export default function Menu() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const navigate = useNavigate();
  const hasTable = Boolean(tableId);

  // Mirrors the backend 60s per-table cooldown so the button stays disabled after a successful call.
  const handleCallWaiter = async () => {
    setCallingWaiter(true);
    try {
      await alertService.callWaiter({ restaurantId, tableId });
      toast.success('Waiter has been notified');
      setWaiterCooldown(true);
      setTimeout(() => setWaiterCooldown(false), 60000);
    } catch (err) {
      if (err?.response?.status === 429) {
        toast('A waiter was already called. Please wait a moment.');
        setWaiterCooldown(true);
        setTimeout(() => setWaiterCooldown(false), 60000);
      } else {
        toast.error('Could not call the waiter. Please try again.');
      }
    } finally {
      setCallingWaiter(false);
    }
  };

  const {
    orderType,
    setTableInfo,
    setCartOrderType,
    setTaxInfo,
    setPaymentGatewayInfo,
    syncMenuPrices,
  } = useCart();
  const [menu, setMenu] = useState([]);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [waiterCooldown, setWaiterCooldown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLogo, setRestaurantLogo] = useState('');
  const [restaurantDescription, setRestaurantDescription] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [receiptHeaderNote, setReceiptHeaderNote] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [vatNo, setVatNo] = useState('');
  const [storeDesign, setStoreDesign] = useState({
    activeTheme: 'classic',
    classicConfig: DEFAULT_CLASSIC_CONFIG,
  });
  const [tableNumber, setTableNumber] = useState('');
  const [tableCapacity, setTableCapacity] = useState(0);
  const [tableActive, setTableActive] = useState(true);
  const [planStatus, setPlanStatus] = useState({
    checked: false,
    restaurantIsActive: true,
    organizationIsActive: true,
    hasSubscriptionPlan: false,
    hasActivePlan: false,
    isPlanExpired: false,
  });
  const sectionRefs = useRef({});

  useEffect(() => {
    const initializePage = async () => {
      if (restaurantId) {
        setTableInfo(restaurantId, tableId || '', orderType);
      }

      let canLoadTableMenu = true;
      if (tableId) {
        canLoadTableMenu = await loadTableInfo();
      }

      const [canLoadMenu] = await Promise.all([
        loadRestaurantInfo(),
        loadStoreDesign(),
      ]);
      if (canLoadMenu && canLoadTableMenu) {
        await loadMenu();
      } else {
        setMenu([]);
        setLoading(false);
      }
    };

    initializePage();
  }, [restaurantId, tableId]);

  useEffect(() => {
    if (!restaurantId || hasTable) return;
    setTableInfo(restaurantId, '', orderType);
  }, [restaurantId, hasTable, orderType, setTableInfo]);

  const loadStoreDesign = async () => {
    try {
      const res = await designService.getByRestaurant(restaurantId);
      const data = res.data?.data;
      if (data) {
        setStoreDesign({
          activeTheme: data.activeTheme || 'classic',
          classicConfig: mergeClassicConfig(data.classicConfig),
        });
      }
    } catch {
      // Silently fall back to Classic defaults if design config cannot be fetched
    }
  };

  const loadRestaurantInfo = async () => {
    try {
      const res = await restaurantService.getPublicInfo(restaurantId);
      const info = res.data.data;
      setRestaurantName(info.name);
      setRestaurantLogo(info.logo || '');
      setRestaurantDescription(info.description || '');
      setCrNumber(info.cr_number || '');
      setReceiptHeaderNote(info.receipt_header_note || '');
      setGstNo(info.gst_no);
      setVatNo(info.vat_no);
      setTaxInfo(
        info.taxEnabled || false,
        info.taxRate || 0,
        info.taxType || 'inclusive',
        info.vatEnabled || false,
        info.vatRate || 0,
        info.vatType || 'inclusive',
        info.gst_no || '',
        info.vat_no || '',
      );
      setPaymentGatewayInfo(info.isPaymentGatewayAllocated || false);
      setPlanStatus({
        checked: true,
        restaurantIsActive: info.restaurantIsActive !== false,
        organizationIsActive: info.organizationIsActive !== false,
        hasSubscriptionPlan: Boolean(info.hasSubscriptionPlan),
        hasActivePlan: Boolean(info.hasActivePlan),
        isPlanExpired: Boolean(info.isPlanExpired),
      });
      return Boolean(
        info.restaurantIsActive !== false &&
          info.organizationIsActive !== false &&
          info.hasActivePlan,
      );
    } catch {
      setPlanStatus({
        checked: true,
        restaurantIsActive: false,
        organizationIsActive: false,
        hasSubscriptionPlan: false,
        hasActivePlan: false,
        isPlanExpired: false,
      });
      return false;
    }
  };

  const loadTableInfo = async () => {
    try {
      const res = await tableService.getPublicInfo(tableId);
      setTableNumber(res.data.data.tableNumber);
      setTableCapacity(res.data.data.capacity);
      const isActive = res.data.data.isActive !== false;
      setTableActive(isActive);
      return isActive;
    } catch {
      // silently fail, will fall back to truncated table id
      return true;
    }
  };

  const loadMenu = async () => {
    try {
      const res = await menuService.getFullMenu(restaurantId);
      const data = res.data.data;
      setMenu(data);
      syncMenuPrices(data.flatMap((category) => category.items || []));
      if (data.length > 0) {
        setActiveCategory(data[0]._id);
      }
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const categories = menu.map((cat) => ({
    ...cat,
    itemCount: cat.items?.length || 0,
  }));

  const handleCategorySelect = (catId) => {
    setActiveCategory(catId);
    const el = sectionRefs.current[catId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const orderTypeOptions = [
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'dine_in', label: 'Dine In' },
  ];

  const renderOrderTypeToggle = ({
    containerClassName = '',
    activeClassName = '',
    idleClassName = '',
  } = {}) => {
    if (hasTable) return null;

    return (
      <div
        className={`inline-flex rounded-full bg-white/15 p-1 ${containerClassName}`.trim()}
      >
        {orderTypeOptions.map((option) => {
          const isActive = orderType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setCartOrderType(option.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                isActive
                  ? `bg-white text-primary shadow-sm ${activeClassName}`
                  : `text-white/80 ${idleClassName}`
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  };

  const filteredMenu = searchQuery
    ? menu
        .map((cat) => ({
          ...cat,
          items: cat.items?.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((cat) => cat.items?.length > 0)
    : menu;

  if (loading) return <Loader />;

  const unavailableReason = !planStatus.restaurantIsActive
    ? 'This restaurant is currently inactive.'
    : !planStatus.organizationIsActive
      ? 'This organization is currently inactive.'
      : hasTable && !tableActive
        ? 'This table is currently inactive.'
      : planStatus.isPlanExpired
        ? 'This restaurant plan has expired.'
        : 'This restaurant does not have an active plan.';

  if (
    planStatus.checked &&
    (!planStatus.restaurantIsActive ||
      !planStatus.organizationIsActive ||
      !planStatus.hasActivePlan ||
      (hasTable && !tableActive))
  ) {
    return (
      <div className="min-h-screen bg-surface-warm px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-primary">
            <HiOutlineLocationMarker size={20} />
            <span className="text-lg font-semibold">
              {restaurantName || 'Restaurant'}
            </span>
          </div>
          <h1 className="mt-5 text-2xl font-bold text-text">
            Menu is currently unavailable
          </h1>
          <p className="mt-3 text-sm text-text-light">
            {unavailableReason}
          </p>
          <p className="mt-2 text-sm text-text-light">
            {hasTable && !tableActive
              ? 'Please contact the restaurant staff to activate this table.'
              : 'Please contact the restaurant to reactivate service.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <StorefrontThemeRenderer
      activeTheme={storeDesign.activeTheme}
      classicConfig={storeDesign.classicConfig}
      restaurantName={restaurantName}
      restaurantLogo={restaurantLogo}
      restaurantDescription={restaurantDescription}
      crNumber={crNumber}
      receiptHeaderNote={receiptHeaderNote}
      gstNo={gstNo}
      vatNo={vatNo}
      hasTable={hasTable}
      tableId={tableId}
      tableNumber={tableNumber}
      tableCapacity={tableCapacity}
      orderType={orderType}
      renderOrderTypeToggle={renderOrderTypeToggle}
      waiterCooldown={waiterCooldown}
      callingWaiter={callingWaiter}
      handleCallWaiter={handleCallWaiter}
      onNavigateOrders={() => navigate('/orders')}
      searchOpen={searchOpen}
      setSearchOpen={setSearchOpen}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      categories={categories}
      activeCategory={activeCategory}
      onSelectCategory={handleCategorySelect}
      filteredMenu={filteredMenu}
      sectionRefs={sectionRefs}
    />
  );
}
