import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlinePrinter,
  HiCash,
  HiOutlineCreditCard,
  HiGlobeAlt
} from 'react-icons/hi';
import orderService from '../services/orderService';
import generateBillPdf from '../utils/generateBillPdf';
import generateKotPdf from '../utils/generateKotPdf';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import tableService from '../services/tableService';
import couponService from '../services/couponService';
import { useAuth } from '../contexts/AuthContext';
import useSubscription from '../hooks/useSubscription';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import CustomizationEditor from '../components/CustomizationEditor';
import { getMenuItemSalePrice } from '../utils/menuItemPricing';
import { formatCurrency, roundTo3 } from '../utils/formatCurrency';
import subscriptionService from '../services/subscriptionService';
import DatePresetFilter from '../components/DatePresetFilter';

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed'];
const CREATE_PAYMENT_STATUSES = ['pending', 'paid'];
const EMPTY_OPEN_FOOD_FORM = {
  name: '',
  description: '',
  ingredients: '',
  price: '',
  discountType: '',
  discountValue: '',
  categoryId: '',
  newCategoryName: '',
  preparationTime: 15,
  itemType: 'food',
  isVeg: false,
  imageFile: null,
  imagePreview: '',
  customization: { spiceLevels: [], addOns: [], allowSpecialInstructions: true },
};

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
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, order: null });
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [openFoodVisible, setOpenFoodVisible] = useState(false);
  const [openFoodSubmitting, setOpenFoodSubmitting] = useState(false);
  const [openFoodForm, setOpenFoodForm] = useState(EMPTY_OPEN_FOOD_FORM);
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
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [manualDiscount, setManualDiscount] = useState({
    applied: false,
    type: 'PERCENTAGE',
    value: '',
    reason: '',
  });
  const isCaptainOrManager = ['captain', 'manager'].includes(user?.role);
  const canCreateOrder = ['super_admin', 'org_admin', 'restaurant_owner', 'captain', 'manager'].includes(user?.role);
  const canEditOrder = canCreateOrder;
  const canDeleteOrder = ['super_admin', 'org_admin', 'restaurant_owner', 'captain', 'manager'].includes(user?.role);
  const isOrderDeletable = (order) =>
    canDeleteOrder && ['cancelled', 'canceled'].includes(order?.status);
  const [newOrder, setNewOrder] = useState({
    restaurantId: '',
    orderType: 'takeaway',
    tableId: '',
    customerName: '',
    customerPhone: '',
    paymentMethod: 'CASH',
    paymentStatus: 'pending',
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
      const res = isSuperAdmin
        ? await restaurantService.getAll({ limit: 100 })
        : isCaptainOrManager && user.restaurantId
          ? await restaurantService.getOne(user.restaurantId)
          : await restaurantService.getMy({ limit: 100 });
      const list = isCaptainOrManager
        ? [res.data.data]
        : res.data.data.data || res.data.data;
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

  const updatePaymentMethod = async (orderId, paymentMethod) => {
    try {
      const normalizedMethod = String(paymentMethod || 'CASH').toUpperCase();
      await orderService.updatePaymentMethod(orderId, normalizedMethod);
      toast.success(`Payment method updated to ${normalizedMethod}`);
      loadOrders();
      if (detailModal.order?._id === orderId) {
        setDetailModal((prev) => ({ ...prev, order: { ...prev.order, paymentMethod: normalizedMethod } }));
      }
    } catch { toast.error('Failed to update payment method'); }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirm.order) return;
    setDeletingOrder(true);
    try {
      await orderService.remove(deleteConfirm.order._id);
      toast.success(
        `Order #${deleteConfirm.order.orderNumber || deleteConfirm.order._id} deleted successfully`,
      );
      if (detailModal.order?._id === deleteConfirm.order._id) {
        setDetailModal({ open: false, order: null });
      }
      setDeleteConfirm({ open: false, order: null });
      setOrders((prev) => prev.filter((o) => o._id !== deleteConfirm.order._id));
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeletingOrder(false);
    }
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
    const price = Math.round((getMenuItemSalePrice(menuItem) + addOnsTotal + (Number(spiceLevel?.priceDelta) || 0)) * 100) / 100;
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

  const createOpenFoodItem = async () => {
    if (!newOrder.restaurantId) return toast.error('Select a restaurant first');
    if (!openFoodForm.name.trim()) return toast.error('Enter an item name');
    if (!openFoodForm.price.trim() || !Number.isFinite(Number(openFoodForm.price)) || Number(openFoodForm.price) < 0) {
      return toast.error('Enter a valid item price');
    }
    if (openFoodForm.discountType && (
      !openFoodForm.discountValue ||
      Number(openFoodForm.discountValue) <= 0 ||
      (openFoodForm.discountType === 'percentage' && Number(openFoodForm.discountValue) > 100)
    )) {
      return toast.error(openFoodForm.discountType === 'percentage'
        ? 'Percentage discount must be greater than 0 and at most 100'
        : 'Discount amount must be greater than 0');
    }

    setOpenFoodSubmitting(true);
    try {
      let category = menuCategories.find((entry) => entry._id === openFoodForm.categoryId);
      if (openFoodForm.categoryId === '__new__') {
        if (!openFoodForm.newCategoryName.trim()) {
          toast.error('Enter a category name');
          return;
        }
        const categoryResponse = await menuService.createCategory({
          name: openFoodForm.newCategoryName.trim(),
          restaurantId: newOrder.restaurantId,
        });
        category = categoryResponse.data.data;
        setMenuCategories((current) => [...current, { ...category, items: [] }]);
        setOpenFoodForm((current) => ({ ...current, categoryId: category._id, newCategoryName: '' }));
      }
      if (!category?._id) return toast.error('Select or create a category');

      const itemResponse = await menuService.createMenuItem({
        name: openFoodForm.name.trim(),
        description: openFoodForm.description.trim(),
        ingredients: openFoodForm.ingredients.trim(),
        price: Number(openFoodForm.price),
        discountType: openFoodForm.discountType || null,
        discountValue: Number(openFoodForm.discountValue) || 0,
        categoryId: category._id,
        restaurantId: newOrder.restaurantId,
        itemType: openFoodForm.itemType,
        isVeg: openFoodForm.isVeg,
        preparationTime: Number(openFoodForm.preparationTime) || 15,
        customization: openFoodForm.customization,
      });
      const createdItem = itemResponse.data.data;
      if (openFoodForm.imageFile && createdItem?._id) {
        try {
          await menuService.uploadMenuItemImage(createdItem._id, openFoodForm.imageFile);
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Item added, but image upload failed');
        }
      }
      setMenuItems((current) => [...current, createdItem]);
      setMenuCategories((current) => {
        const categoryExists = current.some((entry) => entry._id === category._id);
        return categoryExists
          ? current.map((entry) => entry._id === category._id
            ? { ...entry, items: [...(entry.items || []), createdItem] }
            : entry)
          : [...current, { ...category, items: [createdItem] }];
      });
      setSelectedCategory(category._id);
      addNewOrderItem(createdItem);
      setOpenFoodForm({ ...EMPTY_OPEN_FOOD_FORM, categoryId: category._id });
      setOpenFoodVisible(false);
      toast.success('Food item added to menu and order');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create food item');
    } finally {
      setOpenFoodSubmitting(false);
    }
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

  const formatAmount = (amount) => formatCurrency(amount);
  const orderEstimate = (() => {
    const foodSubtotal = newOrder.items
      .filter((item) => (item.itemType || 'food') === 'food')
      .reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
    const liquorSubtotal = newOrder.items
      .filter((item) => item.itemType === 'liquor')
      .reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
    const foodInclusive = restaurantTax?.taxType === 'inclusive';
    const vatInclusive = restaurantTax?.vatType === 'inclusive';
    const gstHalfRate = roundTo3(Number(restaurantTax?.taxRate || 0) / 2);
    const foodTax = restaurantTax?.taxEnabled && restaurantTax.taxRate > 0 && foodSubtotal > 0
      ? foodInclusive
        ? roundTo3(foodSubtotal - roundTo3(foodSubtotal / (1 + restaurantTax.taxRate / 100)))
        : roundTo3(roundTo3(foodSubtotal * (gstHalfRate / 100)) * 2)
      : 0;
    const vatTax = restaurantTax?.vatEnabled && restaurantTax.vatRate > 0 && liquorSubtotal > 0
      ? vatInclusive
        ? roundTo3(liquorSubtotal - roundTo3(liquorSubtotal / (1 + restaurantTax.vatRate / 100)))
        : roundTo3(liquorSubtotal * (restaurantTax.vatRate / 100))
      : 0;
    const subtotal = roundTo3(foodSubtotal + liquorSubtotal);
    const tax = roundTo3(foodTax + vatTax);
    const additionalTax = roundTo3((foodInclusive ? 0 : foodTax) + (vatInclusive ? 0 : vatTax));
    const couponDiscount = appliedCoupon ? roundTo3(appliedCoupon.discountAmount) : 0;

    let manualDiscountAmount = 0;
    if (manualDiscount.applied && manualDiscount.value) {
      const val = roundTo3(Number(manualDiscount.value) || 0);
      if (manualDiscount.type === 'PERCENTAGE') {
        manualDiscountAmount = roundTo3((subtotal * Math.min(100, Math.max(0, val))) / 100);
      } else {
        manualDiscountAmount = roundTo3(Math.min(val, subtotal));
      }
      const remainingSubtotal = Math.max(0, roundTo3(subtotal - couponDiscount));
      manualDiscountAmount = roundTo3(Math.min(manualDiscountAmount, remainingSubtotal));
    }

    const totalDiscount = roundTo3(couponDiscount + manualDiscountAmount);

    return {
      subtotal,
      tax,
      foodTax,
      vatTax,
      couponDiscount,
      manualDiscountAmount,
      discount: totalDiscount,
      total: Math.max(0, roundTo3(subtotal + additionalTax - totalDiscount)),
    };
  })();

  const applyManualDiscount = () => {
    if (!newOrder.items.length) {
      return toast.error('Add items before applying a discount');
    }
    const val = Number(manualDiscount.value);
    if (!manualDiscount.value || !Number.isFinite(val) || val <= 0) {
      return toast.error('Enter a valid discount value greater than 0');
    }
    if (manualDiscount.type === 'PERCENTAGE' && val > 100) {
      return toast.error('Percentage discount cannot exceed 100%');
    }
    if (manualDiscount.type === 'FIXED' && val > orderEstimate.subtotal) {
      return toast.error(`Fixed discount cannot exceed subtotal (${formatAmount(orderEstimate.subtotal)})`);
    }
    setManualDiscount((prev) => ({ ...prev, applied: true }));
    toast.success('Manual discount applied');
  };

  const removeManualDiscount = () => {
    setManualDiscount({
      applied: false,
      type: 'PERCENTAGE',
      value: '',
      reason: '',
    });
    toast.info('Manual discount removed');
  };

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
    setOrderSubmitting(true);
    try {
      const manualDiscountPayload = {
        manualDiscountType: manualDiscount.applied ? manualDiscount.type : null,
        manualDiscountValue: manualDiscount.applied ? Number(manualDiscount.value) || 0 : 0,
        manualDiscountReason: manualDiscount.applied ? manualDiscount.reason.trim() : '',
        manual_discount_type: manualDiscount.applied ? manualDiscount.type : null,
        manual_discount_value: manualDiscount.applied ? Number(manualDiscount.value) || 0 : 0,
        manual_discount_reason: manualDiscount.applied ? manualDiscount.reason.trim() : '',
      };

      if (editingOrderId) {
        await orderService.updateItems(editingOrderId, {
          couponCode: appliedCoupon?.code || '',
          ...manualDiscountPayload,
          items: newOrder.items.map((item) => {
            const payload = { ...item };
            delete payload.itemKey;
            return payload;
          }),
        });
        toast.success('Order updated');
        setDetailModal({ open: false, order: null });
      } else {
        await orderService.create({
          restaurantId: newOrder.restaurantId,
          tableId: newOrder.orderType === 'dine_in' ? newOrder.tableId : null,
          orderType: newOrder.orderType,
          paymentMethod: (newOrder.paymentMethod || 'CASH').toUpperCase(),
          paymentStatus: (newOrder.paymentStatus || 'pending').toLowerCase(),
          customerName: newOrder.customerName.trim() || undefined,
          customerPhone: newOrder.customerPhone.trim() || undefined,
          couponCode: appliedCoupon?.code,
          ...manualDiscountPayload,
          items: newOrder.items.map((item) => {
            const payload = { ...item };
            delete payload.itemKey;
            return payload;
          }),
        });
        toast.success('Order created');
      }
      setCreateModalOpen(false);
      setEditingOrderId('');
      setNewOrder((current) => ({
        ...current,
        tableId: '',
        customerName: '',
        customerPhone: '',
        paymentMethod: 'CASH',
        paymentStatus: 'pending',
        items: [],
      }));
      setCouponCode('');
      setAppliedCoupon(null);
      setManualDiscount({
        applied: false,
        type: 'PERCENTAGE',
        value: '',
        reason: '',
      });
      loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create order');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const startEditingOrder = (order) => {
    const restaurantId = getRestaurantId(order);
    const items = (order.items || []).map((item) => {
      const menuItemId = typeof item.menuItemId === 'object'
        ? item.menuItemId?._id
        : item.menuItemId;
      return {
        ...item,
        menuItemId,
        itemKey: [menuItemId, item.spiceLevel?.name || '', ...(item.addOns || []).map((addOn) => addOn.name).sort(), item.specialInstructions || ''].join('::'),
      };
    });

    const rawManualType = (order.manualDiscountType || order.manual_discount_type || '').toUpperCase();
    const rawManualVal = order.manualDiscountValue ?? order.manual_discount_value ?? '';
    const rawManualReason = order.manualDiscountReason || order.manual_discount_reason || '';
    const hasManual = (rawManualType === 'PERCENTAGE' || rawManualType === 'FIXED') && Number(rawManualVal) > 0;
    const manualAmt = Number(order.manualDiscountAmount ?? order.manual_discount_amount) || 0;
    const couponDiscount = Math.max(0, roundTo3((Number(order.discountAmount) || 0) - manualAmt));

    setEditingOrderId(order._id);
    setNewOrder({
      restaurantId,
      orderType: order.orderType || 'takeaway',
      tableId: getTableId(order) || '',
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      paymentMethod: (order.paymentMethod || 'CASH').toUpperCase(),
      paymentStatus: (order.paymentStatus || 'pending').toLowerCase(),
      items,
    });
    setCouponCode(order.couponCode || '');
    setAppliedCoupon(order.couponCode ? {
      code: order.couponCode,
      discountAmount: couponDiscount,
    } : null);
    setManualDiscount({
      applied: hasManual,
      type: rawManualType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
      value: rawManualVal !== '' ? String(rawManualVal) : '',
      reason: rawManualReason,
    });
    setDetailModal({ open: false, order: null });
    setCreateModalOpen(true);
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
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${paymentMethod?.toLowerCase() === 'online'
      ? 'bg-blue-100 text-blue-700'
      : paymentMethod?.toUpperCase() === 'CARD'
        ? 'bg-indigo-100 text-indigo-700'
        : 'bg-slate-100 text-slate-700'
      }`}>
      {paymentMethod?.toLowerCase() === 'online'
        ? 'Online'
        : paymentMethod?.toUpperCase() === 'CARD'
          ? 'Card'
          : 'Cash'}
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

  const isOrderEditable = (order) =>
    canEditOrder &&
    ['pending', 'confirmed', 'preparing'].includes(order?.status) &&
    order?.paymentStatus !== 'paid' &&
    !(order?.items || []).some((item) => Number(item.cancelledQuantity || 0) > 0);

  const columns = [
    { key: 'orderNumber', label: 'Order #', sortable: true, render: (o) => <span className="font-medium">{o.orderNumber}</span> },
    { key: 'restaurantId', label: 'Restaurant', render: (o) => getRestaurantName(o) },
    { key: 'tableId', label: 'Table', render: (o) => getTableLabel(o) },
    ...(hasCustomerData ? [{ key: 'customerName', label: 'Customer', sortable: true, render: (o) => displayCustomerField(o.customerName) }] : []),
    ...(hasCustomerData ? [{ key: 'customerPhone', label: 'Phone', render: (o) => displayCustomerField(o.customerPhone) }] : []),
    { key: 'orderType', label: 'Order Type', render: (o) => renderOrderType(o.orderType) },
    { key: 'paymentMethod', label: 'Payment Type', render: (o) => renderPaymentMethod(o.paymentMethod) },
    { key: 'items', label: 'Items', render: (o) => `${o.items?.length || 0} items` },
    { key: 'totalAmount', label: 'Total', sortable: true, render: (o) => formatAmount(o.totalAmount) },
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
        <div className="flex items-center gap-1">
          <button type="button" aria-label={`View order ${o.orderNumber}`} onClick={() => setDetailModal({ open: true, order: o })} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer">
            <HiOutlineEye size={16} />
          </button>
          <button
            type="button"
            aria-label={`Print thermal bill for order ${o.orderNumber}`}
            title="Paroso Thermal Bill & KOT Live Preview"
            onClick={() => window.open(`/admin/print/bill/${o._id}`, '_blank')}
            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
          >
            <HiOutlinePrinter size={16} />
          </button>
          {isOrderEditable(o) && (
            <button type="button" aria-label={`Update order ${o.orderNumber}`} title="Update order" onClick={() => startEditingOrder(o)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer">
              <HiOutlinePencil size={16} />
            </button>
          )}
          {isOrderDeletable(o) && (
            <button
              type="button"
              aria-label={`Delete order ${o.orderNumber}`}
              title="Delete Canceled Order"
              onClick={() => setDeleteConfirm({ open: true, order: o })}
              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <HiOutlineTrash size={16} />
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Orders</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {canCreateOrder && <button
            type="button"
            onClick={() => {
              setEditingOrderId('');
              setNewOrder({
                restaurantId: selectedRestaurant || (restaurants.length === 1 ? restaurants[0]._id : ''),
                orderType: 'takeaway',
                tableId: '',
                customerName: '',
                customerPhone: '',
                paymentMethod: 'CASH',
                paymentStatus: 'pending',
                items: [],
              });
              setOpenFoodVisible(false);
              setOpenFoodForm({ ...EMPTY_OPEN_FOOD_FORM });
              setCouponCode('');
              setAppliedCoupon(null);
              setManualDiscount({
                applied: false,
                type: 'PERCENTAGE',
                value: '',
                reason: '',
              });
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <HiOutlinePlus size={16} /> Create order
          </button>}
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

      <Modal isOpen={createModalOpen} onClose={() => { setCreateModalOpen(false); setEditingOrderId(''); setOpenFoodVisible(false); setOpenFoodForm({ ...EMPTY_OPEN_FOOD_FORM }); setManualDiscount({ applied: false, type: 'PERCENTAGE', value: '', reason: '' }); }} title={editingOrderId ? 'Update order' : 'Create order'}>
        <form onSubmit={submitNewOrder} className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {!editingOrderId && <label className="text-sm font-medium text-slate-700">
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
            </label>}
            {!editingOrderId && <label className="text-sm font-medium text-slate-700">
              Order type
              <select
                value={newOrder.orderType}
                onChange={(event) => setNewOrder((current) => ({ ...current, orderType: event.target.value, tableId: '' }))}
                className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="takeaway">Takeaway</option>
                <option value="dine_in">Dine in</option>
              </select>
            </label>}
            {!editingOrderId && newOrder.orderType === 'dine_in' && (
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
            {!editingOrderId && <label className="text-sm font-medium text-slate-700">
              Customer name <span className="font-normal text-slate-400">(optional)</span>
              <input value={newOrder.customerName} onChange={(event) => setNewOrder((current) => ({ ...current, customerName: event.target.value }))} className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none" />
            </label>}
            {!editingOrderId && <label className="text-sm font-medium text-slate-700">
              Phone <span className="font-normal text-slate-400">(optional)</span>
              <input type="tel" value={newOrder.customerPhone} onChange={(event) => setNewOrder((current) => ({ ...current, customerPhone: event.target.value }))} className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none" />
            </label>}
            {!editingOrderId && (
              <fieldset className="text-sm font-medium text-slate-700">
                <legend className="mb-1">Payment method</legend>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'CARD', label: 'Card' },
                    { value: 'ONLINE', label: 'Online' },
                  ].map((option) => {
                    const isActive = newOrder.paymentMethod === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition ${isActive
                            ? 'border-primary bg-primary/5 text-slate-800'
                            : 'border-stroke text-slate-500'
                          }`}
                      >
                        <input
                          type="radio"
                          name="newOrderPaymentMethod"
                          value={option.value}
                          checked={isActive}
                          onChange={() =>
                            setNewOrder((current) => ({ ...current, paymentMethod: option.value }))
                          }
                          className="accent-primary"
                        />
                        {option.value === 'CASH' && (
                          <HiCash size={16} className="text-green-600" aria-hidden="true" />
                        )}
                        {option.value === 'CARD' && (
                          <HiOutlineCreditCard size={16} className="text-blue-600" aria-hidden="true" />
                        )}
                        {option.value === 'ONLINE' && (
                          <HiGlobeAlt size={16} className="text-purple-600" aria-hidden="true" />
                        )}
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
            {!editingOrderId && <label className="text-sm font-medium text-slate-700">
              Payment status
              <select
                value={newOrder.paymentStatus}
                onChange={(event) => setNewOrder((current) => ({ ...current, paymentStatus: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none"
              >
                {CREATE_PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status === 'paid' ? 'Paid' : 'Pending'}</option>
                ))}
              </select>
            </label>}
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
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenFoodVisible((visible) => !visible)}
                disabled={!newOrder.restaurantId || createLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50"
              >
                <HiOutlinePlus size={14} /> Open food
              </button>
            </div>
            {openFoodVisible && (
              <section className="mb-3 space-y-3 rounded-lg border border-stroke bg-slate-50 p-3">
                <p className="text-xs text-slate-500">This creates a food item and saves it to this restaurant's menu.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-600">
                    Item name
                    <input
                      value={openFoodForm.name}
                      onChange={(event) => setOpenFoodForm((current) => ({ ...current, name: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-normal text-slate-800"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Description
                    <textarea
                      rows={2}
                      value={openFoodForm.description}
                      onChange={(event) => setOpenFoodForm((current) => ({ ...current, description: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-normal text-slate-800"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Ingredients
                    <textarea
                      rows={2}
                      value={openFoodForm.ingredients}
                      onChange={(event) => setOpenFoodForm((current) => ({ ...current, ingredients: event.target.value }))}
                      placeholder="List the ingredients"
                      className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-normal text-slate-800"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Price
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={openFoodForm.price}
                      onChange={(event) => setOpenFoodForm((current) => ({ ...current, price: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-normal text-slate-800"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Discount / Price Drop
                    <select
                      value={openFoodForm.discountType}
                      onChange={(event) => setOpenFoodForm((current) => ({ ...current, discountType: event.target.value, discountValue: event.target.value ? current.discountValue : '' }))}
                      className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-normal text-slate-800"
                    >
                      <option value="">No discount</option>
                      <option value="percentage">Percentage off</option>
                      <option value="fixed">Fixed amount off</option>
                    </select>
                    {openFoodForm.discountType && (
                      <input
                        type="number"
                        min="0.001"
                        max={openFoodForm.discountType === 'percentage' ? 100 : undefined}
                        step="0.001"
                        required
                        value={openFoodForm.discountValue}
                        onChange={(event) => setOpenFoodForm((current) => ({ ...current, discountValue: event.target.value }))}
                        className="mt-2 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-normal text-slate-800"
                      />
                    )}
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Prep Time (min)
                    <input
                      type="number"
                      min="1"
                      value={openFoodForm.preparationTime}
                      onChange={(event) => setOpenFoodForm((current) => ({ ...current, preparationTime: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-normal text-slate-800"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Item Type
                    <select
                      value={openFoodForm.itemType}
                      onChange={(event) => setOpenFoodForm((current) => ({ ...current, itemType: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-normal text-slate-800"
                    >
                      <option value="food">Food</option>
                      <option value="liquor">Liquor</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                    Category
                    <SearchSelect
                      options={[
                        { value: '__new__', label: '+ Create new category' },
                        ...menuCategories.map((category) => ({ value: category._id, label: category.name })),
                      ]}
                      value={openFoodForm.categoryId}
                      onChange={(categoryId) => setOpenFoodForm((current) => ({ ...current, categoryId }))}
                      placeholder="Search or create category..."
                    />
                  </label>
                  {openFoodForm.categoryId === '__new__' && (
                    <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                      New category name
                      <input
                        value={openFoodForm.newCategoryName}
                        onChange={(event) => setOpenFoodForm((current) => ({ ...current, newCategoryName: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-normal text-slate-800"
                      />
                    </label>
                  )}
                  <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={openFoodForm.isVeg}
                      onChange={(event) => setOpenFoodForm((current) => ({ ...current, isVeg: event.target.checked }))}
                      className="accent-primary"
                    />
                    Vegetarian
                  </label>
                  <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                    Item Image
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setOpenFoodForm((current) => ({
                          ...current,
                          imageFile: file,
                          imagePreview: file ? URL.createObjectURL(file) : current.imagePreview,
                        }));
                      }}
                      className="mt-1 w-full rounded-lg border border-stroke bg-white px-3 py-2 text-xs font-normal text-slate-700"
                    />
                    {openFoodForm.imagePreview && (
                      <img src={openFoodForm.imagePreview} alt="Menu item preview" className="mt-2 h-20 w-20 rounded-md object-cover" />
                    )}
                  </label>
                </div>
                <CustomizationEditor
                  value={openFoodForm.customization}
                  onChange={(customization) => setOpenFoodForm((current) => ({ ...current, customization }))}
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setOpenFoodVisible(false)} className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-slate-600">
                    Cancel
                  </button>
                  <button type="button" onClick={createOpenFoodItem} disabled={openFoodSubmitting} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                    {openFoodSubmitting ? 'Adding...' : 'Create and add'}
                  </button>
                </div>
              </section>
            )}
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
                          <p className="text-xs text-slate-500">
                            {item.discountType && <span className="mr-1 line-through">{formatCurrency(item.price)}</span>}
                            <span className={item.discountType ? 'font-semibold text-green-700' : ''}>{formatCurrency(getMenuItemSalePrice(item))}</span>
                            {item.itemType === 'liquor' ? ' · Liquor' : ''}
                          </p>
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
                                {customization.spiceLevels.map((level) => <option key={level.name} value={level.name}>{level.emoji ? `${level.emoji} ` : ''}{level.name}{Number(level.priceDelta) > 0 ? ` (+${formatCurrency(level.priceDelta)})` : ''}</option>)}
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
                                    <span className="text-xs text-slate-500">{Number(addOn.priceDelta) > 0 ? `+${formatCurrency(addOn.priceDelta)}` : 'Free'}</span>
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

          <div className="space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
            <h4 className="font-semibold text-slate-700">Order Summary</h4>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal / Order Total:</span>
              <span>₹{formatAmount(orderEstimate.subtotal)}</span>
            </div>

            {/* Manual Discount Controls / Applied Line */}
            {manualDiscount.applied ? (
              <div className="flex justify-between items-center text-green-700 bg-green-50/80 border border-green-200 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium">
                    Manual Discount ({manualDiscount.type === 'PERCENTAGE' ? `${manualDiscount.value}%` : 'Fixed'}):
                  </span>
                  <span className="font-semibold">-₹{formatAmount(orderEstimate.manualDiscountAmount)}</span>
                  {manualDiscount.reason && (
                    <span className="text-xs text-slate-500 font-normal">
                      [Reason: {manualDiscount.reason}]
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={removeManualDiscount}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 underline cursor-pointer shrink-0 ml-2"
                >
                  [Remove]
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-stroke bg-white p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Manual Discount</span>
                  {/* Segmented Control */}
                  <div className="inline-flex rounded-lg border border-stroke bg-slate-100 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setManualDiscount((prev) => ({ ...prev, type: 'PERCENTAGE', value: '' }))}
                      className={`rounded-md px-2.5 py-1 font-medium transition ${
                        manualDiscount.type === 'PERCENTAGE'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualDiscount((prev) => ({ ...prev, type: 'FIXED', value: '' }))}
                      className={`rounded-md px-2.5 py-1 font-medium transition ${
                        manualDiscount.type === 'FIXED'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Fixed Amount (₹)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max={manualDiscount.type === 'PERCENTAGE' ? 100 : orderEstimate.subtotal}
                      value={manualDiscount.value}
                      onChange={(e) => setManualDiscount((prev) => ({ ...prev, value: e.target.value }))}
                      placeholder={manualDiscount.type === 'PERCENTAGE' ? 'Discount % (e.g. 10)' : 'Amount ₹ (e.g. 50.000)'}
                      className="w-full rounded-lg border border-stroke bg-white px-3 py-1.5 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={manualDiscount.reason}
                      onChange={(e) => setManualDiscount((prev) => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g., Manager courtesy, loyalty gesture"
                      className="w-full rounded-lg border border-stroke bg-white px-3 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={applyManualDiscount}
                    disabled={!manualDiscount.value || Number(manualDiscount.value) <= 0 || !newOrder.items.length}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer"
                  >
                    Apply Discount
                  </button>
                </div>
              </div>
            )}

            {restaurantTax?.taxEnabled && <div className="flex justify-between text-slate-600"><span>GST{restaurantTax.taxType === 'inclusive' ? ' (included)' : ''}</span><span>₹{formatAmount(orderEstimate.foodTax)}</span></div>}
            {restaurantTax?.vatEnabled && <div className="flex justify-between text-slate-600"><span>VAT{restaurantTax.vatType === 'inclusive' ? ' (included)' : ''}</span><span>₹{formatAmount(orderEstimate.vatTax)}</span></div>}
            <div className="flex justify-between text-slate-600"><span>Taxes / Other Charges:</span><span>₹{formatAmount(orderEstimate.tax)}</span></div>
            {appliedCoupon && <div className="flex justify-between text-green-700"><span>Coupon discount ({appliedCoupon.code})</span><span>-₹{formatAmount(orderEstimate.couponDiscount)}</span></div>}
            <div className="flex justify-between border-t border-stroke pt-2 font-semibold text-slate-800"><span>Final Total:</span><span>₹{formatAmount(orderEstimate.total)}</span></div>
            <p className="text-xs text-slate-500">Final amount is calculated by the server when the order is created.</p>
          </div>

          <div className="flex justify-end gap-2 border-t border-stroke pt-4">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
            <button type="submit" disabled={orderSubmitting || createLoading || !newOrder.items.length} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {orderSubmitting ? (editingOrderId ? 'Updating...' : 'Creating...') : (editingOrderId ? 'Update order' : 'Create order')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal isOpen={detailModal.open} onClose={() => setDetailModal({ open: false, order: null })} title={`Order ${detailModal.order?.orderNumber || ''}`}>
        {detailModal.order && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stroke pb-3">
              <span className="text-sm font-semibold text-slate-800">Order Overview</span>
              {isOrderDeletable(detailModal.order) && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ open: true, order: detailModal.order })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 cursor-pointer transition"
                  title="Delete Canceled Order"
                >
                  <HiOutlineTrash size={14} />
                  Delete Order
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Restaurant:</span> <span className="font-medium">{getRestaurantName(detailModal.order)}</span></div>
              <div><span className="text-slate-500">Restaurant ID:</span> <span className="font-medium">{getRestaurantId(detailModal.order) || '-'}</span></div>
              <div><span className="text-slate-500">Table:</span> <span className="font-medium">{getTableLabel(detailModal.order)}</span></div>
              <div><span className="text-slate-500">Table ID:</span> <span className="font-medium">{getTableId(detailModal.order) || '-'}</span></div>
              {hasCustomerData && <div><span className="text-slate-500">Customer:</span> <span className="font-medium">{displayCustomerField(detailModal.order.customerName)}</span></div>}
              {hasCustomerData && <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{displayCustomerField(detailModal.order.customerPhone)}</span></div>}
              <div><span className="text-slate-500">Type:</span> <span className="ml-1">{renderOrderType(detailModal.order.orderType)}</span></div>
              <fieldset className="text-slate-500">
                <legend>Payment Method</legend>
                <div className="mt-1 flex gap-2">
                  {[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'CARD', label: 'Card' },
                    { value: 'ONLINE', label: 'Online' },
                  ].map((option) => {
                    // Standardize the payment method value for exact comparison
                    const currentPaymentMethod = detailModal.order.paymentMethod?.toUpperCase();

                    // Check if current option matches or fallback to CASH if unrecognized
                    const isActive =
                      currentPaymentMethod === option.value ||
                      (!['CARD', 'ONLINE'].includes(currentPaymentMethod) && option.value === 'CASH');

                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition ${isActive
                          ? 'border-primary bg-primary/5 text-slate-800'
                          : 'border-stroke text-slate-500'
                          }`}
                      >
                        <input
                          type="radio"
                          name={`detailPaymentMethod-${detailModal.order._id}`}
                          value={option.value}
                          checked={isActive}
                          onChange={() => updatePaymentMethod(detailModal.order._id, option.value)}
                          className="accent-primary"
                        />
                        {option.value === 'CASH' && (
                          <HiCash size={14} className="text-green-600" aria-hidden="true" />
                        )}
                        {option.value === 'CARD' && (
                          <HiOutlineCreditCard size={14} className="text-blue-600" aria-hidden="true" />
                        )}
                        {option.value === 'ONLINE' && (
                          <HiGlobeAlt size={14} className="text-purple-600" aria-hidden="true" />
                        )}
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div><span className="text-slate-500">Status:</span> <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(detailModal.order.status)}`}>{detailModal.order.status}</span></div>
              <div><span className="text-slate-500">Payment:</span> <select value={detailModal.order.paymentStatus} onChange={(e) => updatePaymentStatus(detailModal.order._id, e.target.value)} className={`ml-1 rounded-full border-0 px-2 py-0.5 text-xs font-medium outline-none cursor-pointer ${paymentColor(detailModal.order.paymentStatus)}`}>{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Items</h4>
              {isOrderEditable(detailModal.order) && (
                <button
                  type="button"
                  onClick={() => startEditingOrder(detailModal.order)}
                  className="mb-3 rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit order
                </button>
              )}
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
                                base = roundTo3(lineTotal / (1 + vatR / 100));
                                itemVat = roundTo3(lineTotal - base);
                              } else {
                                base = lineTotal;
                                itemVat = roundTo3((base * vatR) / 100);
                              }
                            } else if (!isLiquor && hasGst) {
                              if (gstInclusive) {
                                base = roundTo3(lineTotal / (1 + rate / 100));
                                const tax = roundTo3(lineTotal - base);
                                itemCgst = roundTo3(tax / 2);
                                itemSgst = roundTo3(tax - itemCgst);
                              } else {
                                base = lineTotal;
                                itemCgst = roundTo3((base * cgstR) / 100);
                                itemSgst = roundTo3((base * sgstR) / 100);
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
                                      {(item.cookingNote || item.specialInstructions || item.notes) && (
                                        <div className="mt-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900 inline-block">
                                          📝 Note: {item.cookingNote || item.specialInstructions || item.notes}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {isLiquor && hasVat && (
                                    <div className="mt-0.5 text-[11px] text-slate-400 space-x-2">
                                      <span>Base: {formatCurrency(base)}</span>
                                      <span>VAT: {formatCurrency(itemVat)}</span>
                                    </div>
                                  )}
                                  {!isLiquor && hasGst && (
                                    <div className="mt-0.5 text-[11px] text-slate-400 space-x-2">
                                      <span>Base: {formatCurrency(base)}</span>
                                      <span>CGST: {formatCurrency(itemCgst)}</span>
                                      <span>SGST: {formatCurrency(itemSgst)}</span>
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
                                <td className="px-3 py-2 text-right">{formatCurrency(lineTotal)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {(() => {
                      const manualAmt = Number(o.manualDiscountAmount ?? o.manual_discount_amount) || 0;
                      const manualType = (o.manualDiscountType || o.manual_discount_type || '').toUpperCase();
                      const manualVal = o.manualDiscountValue ?? o.manual_discount_value;
                      const manualReason = o.manualDiscountReason || o.manual_discount_reason || '';
                      const couponAmt = Math.max(0, roundTo3((Number(o.discountAmount) || 0) - manualAmt));

                      return hasTax ? (
                        <div className="mt-2 space-y-1 text-right text-sm">
                          {hasGst && (
                            <>
                              <div className="text-slate-600">
                                Food Subtotal: {formatCurrency(o.foodSubtotal || 0)}
                              </div>
                              <div className="text-slate-600">CGST ({cgstR}%): {formatCurrency(o.cgstAmount || 0)}</div>
                              <div className="text-slate-600">SGST ({sgstR}%): {formatCurrency(o.sgstAmount || 0)}</div>
                            </>
                          )}
                          {hasVat && (
                            <>
                              <div className="text-slate-600">
                                Liquor Subtotal: {formatCurrency(o.liquorSubtotal || 0)}
                              </div>
                              <div className="text-slate-600">VAT ({vatR}%): {formatCurrency(o.vatAmount || 0)}</div>
                            </>
                          )}
                          {couponAmt > 0 && (
                            <div className="text-green-700">
                              Coupon Discount {o.couponCode ? `(${o.couponCode})` : ''}: -{formatCurrency(couponAmt)}
                            </div>
                          )}
                          {manualAmt > 0 && (
                            <div className="text-green-700">
                              Manual Discount ({manualType === 'PERCENTAGE' ? `${manualVal}%` : 'Fixed'}{manualReason ? ` - ${manualReason}` : ''}): -{formatCurrency(manualAmt)}
                            </div>
                          )}
                          {couponAmt === 0 && manualAmt === 0 && o.discountAmount > 0 && (
                            <div className="text-green-700">
                              Discount {o.couponCode ? `(${o.couponCode})` : ''}: -{formatCurrency(o.discountAmount)}
                            </div>
                          )}
                          <div className="font-bold border-t border-stroke pt-1">Total: {formatCurrency(o.totalAmount)}</div>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1 text-right text-sm">
                          {couponAmt > 0 && (
                            <div className="text-green-700">
                              Coupon Discount {o.couponCode ? `(${o.couponCode})` : ''}: -{formatCurrency(couponAmt)}
                            </div>
                          )}
                          {manualAmt > 0 && (
                            <div className="text-green-700">
                              Manual Discount ({manualType === 'PERCENTAGE' ? `${manualVal}%` : 'Fixed'}{manualReason ? ` - ${manualReason}` : ''}): -{formatCurrency(manualAmt)}
                            </div>
                          )}
                          {couponAmt === 0 && manualAmt === 0 && o.discountAmount > 0 && (
                            <div className="text-green-700">
                              Discount {o.couponCode ? `(${o.couponCode})` : ''}: -{formatCurrency(o.discountAmount)}
                            </div>
                          )}
                          <div className="font-bold">Total: {formatCurrency(o.totalAmount)}</div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
            </div>

            {(detailModal.order?.order_instructions || detailModal.order?.orderInstructions || detailModal.order?.notes) && (
              <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-3 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                  <span>🔔</span>
                  <span>Special Order Instructions / Note</span>
                </div>
                <p className="mt-1 text-xs font-medium text-amber-950 break-words">
                  {detailModal.order.order_instructions || detailModal.order.orderInstructions || detailModal.order.notes}
                </p>
              </div>
            )}

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
        {detailModal.order && (
          <div className="mt-5 flex items-center justify-between border-t border-stroke pt-4">
            {isOrderDeletable(detailModal.order) ? (
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: true, order: detailModal.order })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 cursor-pointer"
              >
                <HiOutlineTrash size={14} />
                Delete Order
              </button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.open(`/admin/print/bill/${detailModal.order._id}`, '_blank')}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 cursor-pointer shadow-xs"
                title="Open Paroso-Style Thermal Preview & Live Sync"
              >
                <HiOutlinePrinter size={14} />
                Print Bill
              </button>
              {/* <button
                type="button"
                onClick={() => {
                  const rest = restaurants.find((r) => r._id === selectedRestaurant);
                  generateKotPdf(detailModal.order, rest);
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer shadow-xs"
              >
                <HiOutlinePrinter size={14} className="text-slate-600" />
                Print KOT
              </button>
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
                className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 cursor-pointer"
              >
                <HiOutlinePrinter size={14} />
                Print Bill
              </button> */}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Canceled Order Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => !deletingOrder && setDeleteConfirm({ open: false, order: null })}
        title="Delete Canceled Order"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently remove Order #{deleteConfirm.order?.orderNumber || deleteConfirm.order?._id}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-stroke">
            <button
              type="button"
              disabled={deletingOrder}
              onClick={() => setDeleteConfirm({ open: false, order: null })}
              className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deletingOrder}
              onClick={handleDeleteOrder}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              {deletingOrder ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
