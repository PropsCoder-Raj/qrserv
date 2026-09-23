import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineSearch,
  HiX,
  HiOutlineLocationMarker,
  HiOutlineClock,
} from 'react-icons/hi';
import { MdTableBar, MdPeople } from 'react-icons/md';
import toast from 'react-hot-toast';
import menuService from '../services/menuService';
import restaurantService from '../services/restaurantService';
import tableService from '../services/tableService';
import { useCart } from '../contexts/CartContext';
import CategoryTabs from '../components/CategoryTabs';
import MenuItemCard from '../components/MenuItemCard';
import CartBar from '../components/CartBar';
import Loader from '../components/Loader';

export default function Menu() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const navigate = useNavigate();
  const hasTable = Boolean(tableId);

  const {
    orderType,
    setTableInfo,
    setCartOrderType,
    setTaxInfo,
    setPaymentGatewayInfo,
  } = useCart();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [vatNo, setVatNo] = useState('');
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

      const canLoadMenu = await loadRestaurantInfo();
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

  const loadRestaurantInfo = async () => {
    try {
      const res = await restaurantService.getPublicInfo(restaurantId);
      const info = res.data.data;
      setRestaurantName(info.name);
      setGstNo(info.gst_no);
      setVatNo(info.vat_no);
      setTaxInfo(
        info.taxEnabled || false,
        info.taxRate || 0,
        info.taxType || 'inclusive',
        info.vatEnabled || false,
        info.vatRate || 0,
        info.vatType || 'inclusive',
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
    <div className="min-h-screen bg-surface-warm pb-24">
      {restaurantName && (
        <div className="bg-primary text-white">
          <div className="mx-auto max-w-lg px-4 py-3">
            <div className="flex items-center justify-center gap-1.5">
              <HiOutlineLocationMarker size={18} className="flex-shrink-0" />
              <h1 className="text-center text-lg font-bold">{restaurantName}</h1>
            </div>
            <p className="text-center text-xs">GST No.: {gstNo}</p>
            <p className="text-center text-xs">VAT No.: {vatNo}</p>
            {tableNumber || tableId ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-xs text-white/80">
                <span className="flex items-center gap-1">
                  <MdTableBar size={14} />
                  Table {tableNumber ? `#${tableNumber}` : `#${tableId.slice(-4)}`}
                </span>
                {tableCapacity > 0 && (
                  <span className="flex items-center gap-1">
                    <MdPeople size={14} />
                    {tableCapacity} Seats
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-2 flex justify-center">
                {renderOrderTypeToggle()}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between px-4 py-3">
            {!searchOpen ? (
              <>
                <div>
                  <h1 className="text-lg font-bold text-text">Menu</h1>
                  {!restaurantName && tableId && (
                    <p className="text-xs text-text-light">
                      Table {tableNumber ? `#${tableNumber}` : `#${tableId.slice(-4)}`}
                    </p>
                  )}
                  {!restaurantName && !tableId && (
                    <p className="mt-1 text-xs text-text-light">
                      {orderType === 'dine_in' ? 'Dine In Order' : 'Takeaway Order'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!restaurantName &&
                    !tableId &&
                    renderOrderTypeToggle({
                      containerClassName: 'bg-surface-cool',
                      activeClassName: 'bg-surface text-text',
                      idleClassName: 'text-text-light',
                    })}
                  <button
                    onClick={() => navigate('/orders')}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-cool text-text-secondary"
                  >
                    <HiOutlineClock size={18} />
                  </button>
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-cool text-text-secondary"
                  >
                    <HiOutlineSearch size={18} />
                  </button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex w-full items-center gap-2"
              >
                <div className="relative flex-1">
                  <HiOutlineSearch
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light"
                  />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full bg-surface-cool py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-text-light focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary"
                >
                  <HiX size={18} />
                </button>
              </motion.div>
            )}
          </div>

          {!searchOpen && categories.length > 0 && (
            <CategoryTabs
              categories={categories}
              activeId={activeCategory}
              onSelect={handleCategorySelect}
            />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-4">
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-5xl">🍽️</span>
            <p className="mt-3 text-sm text-text-light">
              {searchQuery ? 'No dishes found' : 'Menu is empty'}
            </p>
          </div>
        ) : (
          filteredMenu.map((category) => (
            <div
              key={category._id}
              ref={(el) => {
                sectionRefs.current[category._id] = el;
              }}
              className="mb-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-base font-bold text-text">{category.name}</h2>
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
                  {category.items?.length}
                </span>
              </div>
              <div className="space-y-3">
                {category.items?.map((item) => (
                  <MenuItemCard key={item._id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <CartBar />
    </div>
  );
}
