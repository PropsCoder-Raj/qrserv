import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUpload,
  HiOutlinePhotograph,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineCheck,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineSelector,
  HiOutlineSearch,
  HiOutlineFolder,
  HiOutlineTag,
} from 'react-icons/hi';
import menuService from '../services/menuService';
import restaurantService from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import ExcelImportModal from '../components/ExcelImportModal';
import CustomizationEditor from '../components/CustomizationEditor';
import { getMenuItemSalePrice } from '../utils/menuItemPricing';
import { formatCurrency, roundTo3 } from '../utils/formatCurrency';

export default function MenuManagement() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Restaurant & Categories state
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all',
  );
  const [categoryItemCounts, setCategoryItemCounts] = useState({});
  const [totalItemsCount, setTotalItemsCount] = useState(0);

  // Category Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Category Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  });
  const [categoryImportOpen, setCategoryImportOpen] = useState(false);

  // Menu Items state
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemImportOpen, setItemImportOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Menu Items Pagination, search, sort state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemSearch, setItemSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const defaultCustomization = {
    spiceLevels: [],
    addOns: [],
    allowSpecialInstructions: true,
  };
  const initialItemFormState = {
    name: '',
    description: '',
    ingredients: '',
    price: '',
    discountType: '',
    discountValue: '',
    categoryId: '',
    isVeg: false,
    preparationTime: 15,
    itemType: 'food',
    imageFile: null,
    imagePreview: '',
    removeImage: false,
    originalImage: '',
    customization: defaultCustomization,
  };
  const [itemForm, setItemForm] = useState(initialItemFormState);

  const loadRestaurants = useCallback(async () => {
    try {
      const res =
        user?.role === 'super_admin'
          ? await restaurantService.getAll({ limit: 100 })
          : await restaurantService.getMy({ limit: 100 });
      const list = res.data.data.data || res.data.data;
      const parsedList = Array.isArray(list) ? list : [];
      setRestaurants(parsedList);
      if (parsedList.length > 0) {
        setSelectedRestaurant(parsedList[0]._id);
      }
    } catch {
      toast.error('Failed to load restaurants');
    }
  }, [user?.role]);

  // Load Restaurants on mount
  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  // Load all categories for selected restaurant
  const loadCategories = useCallback(async () => {
    if (!selectedRestaurant) return;
    setCategoriesLoading(true);
    try {
      const res = await menuService.getCategories(selectedRestaurant, {
        limit: 100,
        includeInactive: true,
      });
      const result = res.data.data;
      const list = result.data || result || [];
      // Sort categories by sortOrder ascending
      const sorted = [...list].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      );
      setCategories(sorted);

      // Validate selected category
      const currentParam = searchParams.get('category');
      if (currentParam && currentParam !== 'all') {
        const exists = sorted.some((c) => c._id === currentParam);
        if (exists) {
          setSelectedCategory(currentParam);
        } else if (sorted.length > 0) {
          setSelectedCategory(sorted[0]._id);
        } else {
          setSelectedCategory('all');
        }
      } else if (!currentParam && sorted.length > 0) {
        setSelectedCategory((prev) => {
          if (prev && (prev === 'all' || sorted.some((c) => c._id === prev))) {
            return prev;
          }
          return sorted[0]._id;
        });
      }
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, [selectedRestaurant, searchParams]);

  // Load item counts across categories
  const loadCategoryItemCounts = useCallback(async () => {
    if (!selectedRestaurant) return;
    try {
      const res = await menuService.getMenuItems(selectedRestaurant, undefined, {
        limit: 1000,
        includeInactive: true,
      });
      const allItems = res.data.data.data || res.data.data || [];
      const counts = {};
      allItems.forEach((it) => {
        if (it.categoryId) {
          counts[it.categoryId] = (counts[it.categoryId] || 0) + 1;
        }
      });
      setCategoryItemCounts(counts);
      setTotalItemsCount(allItems.length);
    } catch {
      // Ignore count fetch errors
    }
  }, [selectedRestaurant]);

  // Reload categories & counts when restaurant changes
  useEffect(() => {
    if (selectedRestaurant) {
      loadCategories();
      loadCategoryItemCounts();
    }
  }, [selectedRestaurant, loadCategories, loadCategoryItemCounts]);

  // Load Menu Items based on selected restaurant, category, search, pagination, sort
  const loadItems = useCallback(async () => {
    if (!selectedRestaurant) return;
    setItemsLoading(true);
    try {
      const categoryFilter =
        selectedCategory && selectedCategory !== 'all'
          ? selectedCategory
          : undefined;

      const res = await menuService.getMenuItems(
        selectedRestaurant,
        categoryFilter,
        {
          page,
          limit: 10,
          search: itemSearch || undefined,
          sortBy: sortBy || undefined,
          sortOrder,
          includeInactive: true,
        },
      );
      const result = res.data.data;
      setItems(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
    } catch {
      toast.error('Failed to load menu items');
    } finally {
      setItemsLoading(false);
    }
  }, [selectedRestaurant, selectedCategory, page, itemSearch, sortBy, sortOrder]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Category Selection
  const selectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', categoryId);
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Category CRUD
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      sortOrder: categories.length,
      isActive: true,
    });
    setCategoryModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || '',
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive !== false,
    });
    setCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await menuService.updateCategory(editingCategory._id, categoryForm);
        toast.success('Category updated');
      } else {
        const res = await menuService.createCategory({
          ...categoryForm,
          restaurantId: selectedRestaurant,
        });
        toast.success('Category created');
        const createdCat = res.data.data;
        if (createdCat?._id) {
          selectCategory(createdCat._id);
        }
      }
      setCategoryModalOpen(false);
      loadCategories();
      loadCategoryItemCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all its items?')) return;
    try {
      await menuService.deleteCategory(id);
      toast.success('Category deleted');
      if (selectedCategory === id) {
        const remaining = categories.filter((c) => c._id !== id);
        selectCategory(remaining.length > 0 ? remaining[0]._id : 'all');
      }
      loadCategories();
      loadCategoryItemCounts();
      loadItems();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const toggleCategoryActive = async (category) => {
    try {
      await menuService.updateCategory(category._id, {
        isActive: !category.isActive,
      });
      toast.success(
        `Category ${category.isActive ? 'deactivated' : 'activated'}`,
      );
      loadCategories();
    } catch {
      toast.error('Failed to update category status');
    }
  };

  // Category Reorder
  const handleMoveCategory = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const withSequentialOrders = reordered.map((cat, idx) => ({
      ...cat,
      sortOrder: idx,
    }));
    setCategories(withSequentialOrders);

    try {
      await Promise.all([
        menuService.updateCategory(withSequentialOrders[index]._id, {
          sortOrder: index,
        }),
        menuService.updateCategory(withSequentialOrders[targetIndex]._id, {
          sortOrder: targetIndex,
        }),
      ]);
      toast.success('Category order updated');
    } catch {
      toast.error('Failed to update category order');
      loadCategories();
    }
  };

  // Drag and Drop for Categories
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // Left drag area
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex =
      draggedIndex !== null
        ? draggedIndex
        : Number(e.dataTransfer.getData('text/plain'));
    setDraggedIndex(null);
    setDragOverIndex(null);

    if (
      sourceIndex === targetIndex ||
      isNaN(sourceIndex) ||
      sourceIndex < 0 ||
      targetIndex < 0
    ) {
      return;
    }

    const reordered = [...categories];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    const withSequentialOrders = reordered.map((cat, idx) => ({
      ...cat,
      sortOrder: idx,
    }));
    setCategories(withSequentialOrders);

    try {
      const updates = withSequentialOrders.filter(
        (cat, idx) => categories[idx]?._id !== cat._id,
      );
      await Promise.all(
        updates.map((cat) =>
          menuService.updateCategory(cat._id, { sortOrder: cat.sortOrder }),
        ),
      );
      toast.success('Category order updated');
    } catch {
      toast.error('Failed to save category order');
      loadCategories();
    }
  };

  // Filtered categories in sidebar based on categorySearch
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const selectedCategoryObj =
    selectedCategory === 'all'
      ? null
      : categories.find((c) => c._id === selectedCategory);

  // Menu Item CRUD
  const openCreateItem = () => {
    setEditingItem(null);
    const targetCatId =
      selectedCategory && selectedCategory !== 'all'
        ? selectedCategory
        : categories[0]?._id || '';

    setItemForm({
      ...initialItemFormState,
      categoryId: targetCatId,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setItemModalOpen(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      ingredients: item.ingredients || '',
      price: item.price,
      discountType: item.discountType || '',
      discountValue: item.discountType ? item.discountValue : '',
      categoryId: item.categoryId,
      isVeg: item.isVeg || false,
      preparationTime: item.preparationTime || 15,
      itemType: item.itemType || 'food',
      imageFile: null,
      imagePreview: item.image || '',
      removeImage: false,
      originalImage: item.image || '',
      customization: {
        spiceLevels: item.customization?.spiceLevels || [],
        addOns: item.customization?.addOns || [],
        allowSpecialInstructions:
          item.customization?.allowSpecialInstructions !== false,
      },
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setItemModalOpen(true);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PNG, JPG, JPEG, and WEBP files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setItemForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl,
      removeImage: false,
    }));
  };

  const handleRemoveImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setItemForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: '',
      removeImage: Boolean(prev.originalImage),
    }));
  };

  const handleUndoRemoveImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setItemForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: prev.originalImage,
      removeImage: false,
    }));
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (
      itemForm.discountType &&
      (!itemForm.discountValue ||
        Number(itemForm.discountValue) <= 0 ||
        (itemForm.discountType === 'percentage' &&
          Number(itemForm.discountValue) > 100))
    ) {
      toast.error(
        itemForm.discountType === 'percentage'
          ? 'Percentage discount must be greater than 0 and at most 100'
          : 'Discount amount must be greater than 0',
      );
      return;
    }
    try {
      const payload = {
        name: itemForm.name,
        description: itemForm.description,
        ingredients: itemForm.ingredients,
        price: Number(itemForm.price),
        discountType: itemForm.discountType || null,
        discountValue: Number(itemForm.discountValue) || 0,
        categoryId: itemForm.categoryId,
        isVeg: itemForm.isVeg,
        preparationTime: Number(itemForm.preparationTime),
        itemType: itemForm.itemType,
        customization: itemForm.customization,
      };

      if (editingItem) {
        if (itemForm.removeImage) {
          payload.remove_image = true;
          payload.image = null;
        }

        await menuService.updateMenuItem(editingItem._id, payload);

        if (itemForm.imageFile) {
          await menuService.uploadMenuItemImage(
            editingItem._id,
            itemForm.imageFile,
          );
        }
        toast.success('Item updated');
      } else {
        const res = await menuService.createMenuItem({
          ...payload,
          restaurantId: selectedRestaurant,
        });
        const createdItem = res.data.data;
        if (itemForm.imageFile && createdItem?._id) {
          await menuService.uploadMenuItemImage(
            createdItem._id,
            itemForm.imageFile,
          );
        }
        toast.success('Item created');
      }
      setItemModalOpen(false);
      loadItems();
      loadCategoryItemCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await menuService.deleteMenuItem(id);
      toast.success('Item deleted');
      loadItems();
      loadCategoryItemCounts();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleItemAvailability = async (item) => {
    try {
      await menuService.updateMenuItem(item._id, {
        isAvailable: !item.isAvailable,
      });
      toast.success(`Item ${item.isAvailable ? 'deactivated' : 'activated'}`);
      loadItems();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const getCategoryName = (id) =>
    categories.find((c) => c._id === id)?.name || '-';

  const handleSearch = (val) => {
    setItemSearch(val);
    setPage(1);
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  // Columns for DataTable matching existing MenuItems.jsx
  const itemColumns = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'image',
      label: 'Image',
      render: (r) =>
        r.image ? (
          <img
            src={`${import.meta.env.VITE_API_URL || ''}${r.image}`}
            alt={r.name}
            className="h-12 w-12 rounded-lg object-cover"
          />
        ) : (
          <span className="text-xs text-slate-400">No image</span>
        ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (r) =>
        r.discountType ? (
          <div>
            <span className="mr-2 text-xs text-slate-400 line-through">
              {formatCurrency(r.price)}
            </span>
            <span className="font-semibold text-green-700">
              {formatCurrency(getMenuItemSalePrice(r))}
            </span>
          </div>
        ) : (
          `${formatCurrency(r.price)}`
        ),
    },
    {
      key: 'categoryId',
      label: 'Category',
      render: (r) => getCategoryName(r.categoryId),
    },
    {
      key: 'isVeg',
      label: 'Veg/Non-Veg',
      render: (r) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            r.isVeg
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {r.isVeg ? 'Veg' : 'Non-Veg'}
        </span>
      ),
    },
    {
      key: 'itemType',
      label: 'Item Type',
      render: (r) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            (r.itemType || 'food') === 'food'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {(r.itemType || 'food') === 'food' ? 'Food' : 'Liquor'}
        </span>
      ),
    },
    {
      key: 'isAvailable',
      label: 'Status',
      render: (r) => (
        <button
          onClick={() => toggleItemAvailability(r)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
            r.isAvailable ? 'bg-green-500' : 'bg-slate-300'
          }`}
          title={r.isAvailable ? 'Click to deactivate' : 'Click to activate'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              r.isAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ),
    },
    {
      key: 'preparationTime',
      label: 'Prep Time',
      sortable: true,
      render: (r) => `${r.preparationTime} min`,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditItem(r)}
            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer"
            title="Edit Item"
          >
            <HiOutlinePencil size={16} />
          </button>
          <button
            onClick={() => handleDeleteItem(r._id)}
            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 cursor-pointer"
            title="Delete Item"
          >
            <HiOutlineTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Menu Management</h2>
          <p className="text-xs text-slate-500">
            Unified catalog workspace: curate categories and menu items
          </p>
        </div>

        {/* Global Restaurant Selector */}
        <div className="flex items-center gap-3">
          <div className="w-64">
            <SearchSelect
              options={restaurants.map((r) => ({ value: r._id, label: r.name }))}
              value={selectedRestaurant}
              onChange={(val) => {
                setSelectedRestaurant(val);
                setPage(1);
              }}
              placeholder="Select restaurant..."
            />
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Left Sidebar: Categories List (Master) */}
        <aside className="w-full lg:w-80 shrink-0 rounded-xl border border-stroke bg-card shadow-sm flex flex-col lg:sticky lg:top-4 max-h-[calc(100vh-6rem)]">
          {/* Categories Header */}
          <div className="p-3.5 border-b border-stroke">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <HiOutlineTag className="text-primary" size={18} />
                <h3 className="font-semibold text-slate-800 text-sm">Categories</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {categories.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCategoryImportOpen(true)}
                  disabled={!selectedRestaurant}
                  title="Import Categories Excel"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 cursor-pointer transition"
                >
                  <HiOutlineUpload size={16} />
                </button>
                <button
                  type="button"
                  onClick={openCreateCategory}
                  disabled={!selectedRestaurant}
                  title="Add Category"
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-40 cursor-pointer transition"
                >
                  <HiOutlinePlus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Category Search Filter */}
            <div className="relative">
              <HiOutlineSearch
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Filter categories..."
                className="w-full rounded-lg border border-stroke py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-primary placeholder:text-slate-400 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Categories List Container */}
          <div className="p-2 space-y-1 overflow-y-auto flex-1">
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                {/* "All Items" Option */}
                {!categorySearch && (
                  <div
                    onClick={() => selectCategory('all')}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium cursor-pointer transition ${
                      selectedCategory === 'all'
                        ? 'bg-primary text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <HiOutlineFolder
                        size={16}
                        className={
                          selectedCategory === 'all'
                            ? 'text-white'
                            : 'text-slate-500'
                        }
                      />
                      <span className="truncate">All Items</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        selectedCategory === 'all'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {totalItemsCount}
                    </span>
                  </div>
                )}

                {/* Divider */}
                {!categorySearch && categories.length > 0 && (
                  <div className="my-1 border-t border-stroke" />
                )}

                {/* Filtered Category Items */}
                {filteredCategories.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {categorySearch
                      ? 'No matching categories'
                      : 'No categories yet. Click "+ Add" above.'}
                  </div>
                ) : (
                  filteredCategories.map((cat, index) => {
                    const isSelected = selectedCategory === cat._id;
                    const itemCount = categoryItemCounts[cat._id] || 0;
                    const isFirst = index === 0;
                    const isLast = index === filteredCategories.length - 1;

                    return (
                      <div
                        key={cat._id}
                        draggable={!categorySearch}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => selectCategory(cat._id)}
                        className={`group relative flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs transition cursor-pointer select-none ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                            : 'border-transparent text-slate-700 hover:bg-slate-50'
                        } ${
                          dragOverIndex === index
                            ? 'border-t-2 border-t-primary bg-primary/5'
                            : ''
                        } ${draggedIndex === index ? 'opacity-30' : ''}`}
                      >
                        {/* Drag Handle & Info */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {!categorySearch && (
                            <span
                              title="Drag to reorder"
                              className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 shrink-0"
                            >
                              <HiOutlineSelector size={14} />
                            </span>
                          )}
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              cat.isActive ? 'bg-green-500' : 'bg-slate-300'
                            }`}
                            title={cat.isActive ? 'Active' : 'Inactive'}
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>

                        {/* Count & Actions */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {itemCount}
                          </span>

                          {/* Hover Actions: Reorder, Edit, Delete */}
                          <div
                            className={`flex items-center gap-0.5 transition ${
                              isSelected
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!categorySearch && (
                              <>
                                <button
                                  type="button"
                                  disabled={isFirst}
                                  onClick={() => handleMoveCategory(index, 'up')}
                                  title="Move up"
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                >
                                  <HiOutlineChevronUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={isLast}
                                  onClick={() => handleMoveCategory(index, 'down')}
                                  title="Move down"
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                >
                                  <HiOutlineChevronDown size={12} />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditCategory(cat)}
                              title="Edit category"
                              className="p-1 text-blue-600 hover:bg-blue-100/60 rounded cursor-pointer"
                            >
                              <HiOutlinePencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat._id)}
                              title="Delete category"
                              className="p-1 text-red-600 hover:bg-red-100/60 rounded cursor-pointer"
                            >
                              <HiOutlineTrash size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </aside>

        {/* Main Panel: Menu Items (Detail) */}
        <section className="flex-1 min-w-0 space-y-4 w-full">
          {/* Selected Category Header Banner */}
          <div className="rounded-xl border border-stroke bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-800 truncate">
                    {selectedCategoryObj
                      ? selectedCategoryObj.name
                      : 'All Menu Items'}
                  </h3>
                  {selectedCategoryObj && (
                    <button
                      type="button"
                      onClick={() => toggleCategoryActive(selectedCategoryObj)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        selectedCategoryObj.isActive
                          ? 'bg-green-500'
                          : 'bg-slate-300'
                      }`}
                      title={
                        selectedCategoryObj.isActive
                          ? 'Click to deactivate category'
                          : 'Click to activate category'
                      }
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          selectedCategoryObj.isActive
                            ? 'translate-x-4.5'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {total} {total === 1 ? 'item' : 'items'}
                  </span>
                </div>
                {selectedCategoryObj?.description ? (
                  <p className="mt-1 text-xs text-slate-500 truncate">
                    {selectedCategoryObj.description}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedCategory === 'all'
                      ? 'Showing all menu items across all categories.'
                      : 'Items in this category.'}
                  </p>
                )}
              </div>

              {/* Action Buttons for Menu Items */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setItemImportOpen(true)}
                  disabled={!selectedRestaurant || !categories.length}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stroke px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer shadow-xs transition"
                >
                  <HiOutlineUpload size={16} /> Import Excel
                </button>
                <button
                  type="button"
                  onClick={openCreateItem}
                  disabled={!selectedRestaurant || !categories.length}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-50 cursor-pointer shadow-xs transition"
                >
                  <HiOutlinePlus size={16} /> Add Item
                </button>
              </div>
            </div>
          </div>

          {/* DataTable */}
          <div className="rounded-xl border border-stroke bg-card shadow-sm">
            <DataTable
              columns={itemColumns}
              data={items}
              loading={itemsLoading}
              searchValue={itemSearch}
              onSearchChange={handleSearch}
              searchPlaceholder="Search by name or description..."
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          </div>
        </section>
      </div>

      {/* --- MODALS --- */}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Name *
            </label>
            <input
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
              required
              placeholder="e.g. Appetizers, Main Course, Drinks"
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, description: e.target.value })
              }
              rows={2}
              placeholder="Brief description of this category..."
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Sort Order
              </label>
              <input
                type="number"
                value={categoryForm.sortOrder}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    sortOrder: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      isActive: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-stroke text-primary"
                />
                <span className="font-medium text-slate-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer"
            >
              {editingCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Excel Import Modal */}
      <ExcelImportModal
        isOpen={categoryImportOpen}
        onClose={() => setCategoryImportOpen(false)}
        title="Import Categories"
        columns={[
          { key: 'name', label: 'Name', required: true },
          { key: 'description', label: 'Description' },
          { key: 'sortOrder', label: 'Sort Order' },
        ]}
        onImport={(row) =>
          menuService.createCategory({
            ...row,
            sortOrder: row.sortOrder ? Number(row.sortOrder) : 0,
            restaurantId: selectedRestaurant,
          })
        }
        onComplete={() => {
          loadCategories();
          loadCategoryItemCounts();
        }}
      />

      {/* Add / Edit Menu Item Modal */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
      >
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Name *
            </label>
            <input
              value={itemForm.name}
              onChange={(e) =>
                setItemForm({ ...itemForm, name: e.target.value })
              }
              required
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={itemForm.description}
              onChange={(e) =>
                setItemForm({ ...itemForm, description: e.target.value })
              }
              rows={2}
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Ingredients (optional)
            </label>
            <textarea
              value={itemForm.ingredients}
              onChange={(e) =>
                setItemForm({ ...itemForm, ingredients: e.target.value })
              }
              rows={2}
              placeholder="List the ingredients"
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Price *
              </label>
              <input
                type="number"
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm({ ...itemForm, price: e.target.value })
                }
                required
                min="0"
                step="0.001"
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Discount / Price Drop
                </label>
                <select
                  value={itemForm.discountType}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      discountType: e.target.value,
                      discountValue: e.target.value ? itemForm.discountValue : '',
                    })
                  }
                  className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">No discount</option>
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
                {itemForm.discountType && (
                  <div className="mt-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      {itemForm.discountType === 'percentage'
                        ? 'Discount percentage'
                        : 'Discount amount'}
                    </label>
                    <input
                      type="number"
                      min="0.001"
                      max={
                        itemForm.discountType === 'percentage' ? 100 : undefined
                      }
                      step="0.001"
                      required
                      value={itemForm.discountValue}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          discountValue: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <p className="mt-1 text-xs text-green-700">
                      Price after discount:{' '}
                      {formatCurrency(
                        getMenuItemSalePrice({
                          price: itemForm.price,
                          discountType: itemForm.discountType,
                          discountValue: itemForm.discountValue,
                        }),
                      )}
                    </p>
                  </div>
                )}
              </div>
              {(() => {
                const rest = restaurants.find(
                  (r) => r._id === selectedRestaurant,
                );
                const price = getMenuItemSalePrice(itemForm);
                const isLiquor = itemForm.itemType === 'liquor';

                // Liquor items use VAT
                if (
                  isLiquor &&
                  rest?.vatEnabled &&
                  rest.vatRate > 0 &&
                  price > 0
                ) {
                  const vatType = rest.vatType || 'inclusive';
                  const vatR = rest.vatRate;
                  let basePrice, vat, total;
                  if (vatType === 'inclusive') {
                    total = price;
                    basePrice = roundTo3(price / (1 + vatR / 100));
                    vat = roundTo3(total - basePrice);
                  } else {
                    basePrice = price;
                    vat = roundTo3((basePrice * vatR) / 100);
                    total = roundTo3(basePrice + vat);
                  }
                  return (
                    <div className="mt-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2.5 text-xs text-slate-600 space-y-1">
                      <p className="font-medium text-amber-700">
                        {vatType === 'inclusive'
                          ? 'Price breakdown (VAT inclusive)'
                          : 'Price breakdown (VAT exclusive)'}
                      </p>
                      <div className="flex justify-between">
                        <span>Base Price</span>
                        <span>{formatCurrency(basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT ({vatR}%)</span>
                        <span>{formatCurrency(vat)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-slate-800 border-t border-amber-300 pt-1">
                        <span>Customer Pays</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  );
                }
                if (isLiquor && rest?.vatEnabled && rest.vatRate > 0) {
                  const vatType = rest.vatType || 'inclusive';
                  return (
                    <p className="mt-1 text-xs text-amber-600">
                      {vatType === 'inclusive'
                        ? `This price includes VAT (${rest.vatRate}%)`
                        : `VAT (${rest.vatRate}%) will be added at checkout`}
                    </p>
                  );
                }

                // Food items use GST
                if (
                  !isLiquor &&
                  rest?.taxEnabled &&
                  rest.taxRate > 0 &&
                  price > 0
                ) {
                  const taxType = rest.taxType || 'inclusive';
                  const rate = rest.taxRate;
                  const cgstRate = roundTo3(rate / 2);
                  const sgstRate = roundTo3(rate / 2);
                  let basePrice, cgst, sgst, total;
                  if (taxType === 'inclusive') {
                    total = price;
                    basePrice = roundTo3(price / (1 + rate / 100));
                    const tax = roundTo3(total - basePrice);
                    cgst = roundTo3(tax / 2);
                    sgst = roundTo3(tax - cgst);
                  } else {
                    basePrice = price;
                    cgst = roundTo3((basePrice * cgstRate) / 100);
                    sgst = roundTo3((basePrice * sgstRate) / 100);
                    total = roundTo3(basePrice + cgst + sgst);
                  }
                  return (
                    <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1">
                      <p className="font-medium text-slate-700">
                        {taxType === 'inclusive'
                          ? 'Price breakdown (GST inclusive)'
                          : 'Price breakdown (GST exclusive)'}
                      </p>
                      <div className="flex justify-between">
                        <span>Base Price</span>
                        <span>{formatCurrency(basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CGST ({cgstRate}%)</span>
                        <span>{formatCurrency(cgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({sgstRate}%)</span>
                        <span>{formatCurrency(sgst)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-300 pt-1">
                        <span>Customer Pays</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  );
                }
                if (!isLiquor && rest?.taxEnabled && rest.taxRate > 0) {
                  const taxType = rest.taxType || 'inclusive';
                  return (
                    <p className="mt-1 text-xs text-slate-500">
                      {taxType === 'inclusive'
                        ? `This price includes GST (${rest.taxRate}%)`
                        : `GST (${rest.taxRate}%) will be added at checkout`}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Category *
              </label>
              <SearchSelect
                options={categories.map((c) => ({
                  value: c._id,
                  label: c.name,
                }))}
                value={itemForm.categoryId}
                onChange={(val) =>
                  setItemForm({ ...itemForm, categoryId: val })
                }
                placeholder="Search category..."
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Prep Time (min)
              </label>
              <input
                type="number"
                value={itemForm.preparationTime}
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    preparationTime: e.target.value,
                  })
                }
                min="1"
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Item Type
              </label>
              <select
                value={itemForm.itemType}
                onChange={(e) =>
                  setItemForm({ ...itemForm, itemType: e.target.value })
                }
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="food">Food</option>
                <option value="liquor">Liquor</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 py-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.isVeg}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, isVeg: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-stroke text-primary"
                />
                <span className="font-medium text-slate-700">Vegetarian</span>
              </label>
            </div>
          </div>
          <CustomizationEditor
            value={itemForm.customization}
            onChange={(customization) =>
              setItemForm({ ...itemForm, customization })
            }
          />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Item Image
              </label>
              {itemForm.imageFile && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <HiOutlineCheck size={13} /> New image ready
                </span>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {itemForm.imagePreview ? (
              <div className="relative overflow-hidden rounded-xl border border-stroke bg-slate-50/60 p-3.5 transition">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Thumbnail Preview */}
                  <div className="relative group shrink-0">
                    <img
                      src={
                        itemForm.imagePreview.startsWith('/uploads')
                          ? `${import.meta.env.VITE_API_URL || ''}${itemForm.imagePreview}`
                          : itemForm.imagePreview
                      }
                      alt="Menu item preview"
                      className="h-28 w-28 rounded-lg object-cover border border-slate-200 bg-white shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Remove image"
                      aria-label="Remove image"
                      className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 focus:outline-none transition cursor-pointer"
                    >
                      <HiOutlineX size={16} />
                    </button>
                  </div>

                  {/* Actions & details */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {itemForm.imageFile
                          ? itemForm.imageFile.name
                          : editingItem?.name
                            ? `${editingItem.name} Image`
                            : 'Uploaded Image'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {itemForm.imageFile
                          ? `${(itemForm.imageFile.size / 1024).toFixed(1)} KB • Ready to save`
                          : 'Currently active on menu & customer application'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                      >
                        <HiOutlineRefresh
                          size={14}
                          className="text-slate-500"
                        />
                        Change / Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 hover:text-red-700 transition cursor-pointer"
                      >
                        <HiOutlineTrash size={14} />
                        Remove Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {itemForm.removeImage && (
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                    <div className="flex items-center gap-2">
                      <HiOutlineTrash
                        size={16}
                        className="text-amber-600 shrink-0"
                      />
                      <span>
                        Image marked for removal. Save changes to confirm.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUndoRemoveImage}
                      className="font-semibold underline hover:text-amber-950 transition cursor-pointer"
                    >
                      Undo
                    </button>
                  </div>
                )}

                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-300 bg-slate-50/50 hover:border-primary/60 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-2">
                    <HiOutlinePhotograph size={22} />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    <span className="text-primary hover:underline font-semibold">
                      Click or drag image to upload
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    PNG, JPG, JPEG, or WEBP up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setItemModalOpen(false)}
              className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer"
            >
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Menu Item Excel Import Modal */}
      <ExcelImportModal
        isOpen={itemImportOpen}
        onClose={() => setItemImportOpen(false)}
        title="Import Menu Items"
        columns={[
          { key: 'name', label: 'Name', required: true },
          { key: 'description', label: 'Description' },
          { key: 'ingredients', label: 'Ingredients' },
          { key: 'price', label: 'Price', required: true },
          { key: 'category', label: 'Category', required: true },
          { key: 'isVeg', label: 'Is Veg' },
          { key: 'preparationTime', label: 'Preparation Time' },
          { key: 'itemType', label: 'Item Type (food/liquor)' },
        ]}
        onImport={(row) => {
          const catName = (row.category || '').toString().toLowerCase().trim();
          const cat = categories.find(
            (c) => c.name.toLowerCase().trim() === catName,
          );
          if (!cat) throw new Error(`Category "${row.category}" not found`);
          const vegVal = (row.isVeg || '').toString().toLowerCase().trim();
          const typeVal = (row.itemType || '').toString().toLowerCase().trim();
          return menuService.createMenuItem({
            name: row.name,
            description: row.description || '',
            ingredients: row.ingredients || '',
            price: Number(row.price),
            categoryId: cat._id,
            isVeg: vegVal === 'yes' || vegVal === 'true' || vegVal === '1',
            preparationTime: row.preparationTime
              ? Number(row.preparationTime)
              : 15,
            itemType: typeVal === 'liquor' ? 'liquor' : 'food',
            restaurantId: selectedRestaurant,
          });
        }}
        onComplete={() => {
          loadItems();
          loadCategoryItemCounts();
        }}
      />
    </div>
  );
}
