import { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'react-icons/hi';
import menuService from '../services/menuService';
import restaurantService from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import ExcelImportModal from '../components/ExcelImportModal';
import DatePresetFilter from '../components/DatePresetFilter';
import CustomizationEditor from '../components/CustomizationEditor';
import { getMenuItemSalePrice } from '../utils/menuItemPricing';
import { formatCurrency, roundTo3 } from '../utils/formatCurrency';

export default function MenuItems() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const defaultCustomization = { spiceLevels: [], addOns: [], allowSpecialInstructions: true };
  const initialFormState = {
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
  const [form, setForm] = useState(initialFormState);
  const [importOpen, setImportOpen] = useState(false);

  // Pagination, search, sort state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [datePreset, setDatePreset] = useState('');

  useEffect(() => { loadRestaurants(); }, []);

  const loadItems = useCallback(async () => {
    if (!selectedRestaurant) return;
    setLoading(true);
    try {
      const res = await menuService.getMenuItems(
        selectedRestaurant,
        undefined,
        {
          page,
          limit: 10,
          search: search || undefined,
          sortBy: sortBy || undefined,
          sortOrder,
          datePreset: datePreset || undefined,
          includeInactive: true,
        },
      );
      const result = res.data.data;
      setItems(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch { toast.error('Failed to load menu items'); }
    finally { setLoading(false); }
  }, [selectedRestaurant, page, search, sortBy, sortOrder, datePreset]);

  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { if (selectedRestaurant) loadCategories(); }, [selectedRestaurant]);

  const loadRestaurants = async () => {
    try {
      const res = user?.role === 'super_admin' ? await restaurantService.getAll({ limit: 100 }) : await restaurantService.getMy({ limit: 100 });
      const list = res.data.data.data || res.data.data;
      setRestaurants(Array.isArray(list) ? list : []);
      if (list.length > 0) setSelectedRestaurant(list[0]._id);
    } catch { toast.error('Failed to load restaurants'); }
  };

  const loadCategories = async () => {
    try {
      const res = await menuService.getCategories(selectedRestaurant, { limit: 100, includeInactive: true });
      const result = res.data.data;
      setCategories(result.data || result);
    } catch {}
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...initialFormState,
      categoryId: categories[0]?._id || '',
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
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
        allowSpecialInstructions: item.customization?.allowSpecialInstructions !== false,
      },
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
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
    setForm((prev) => ({
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
    setForm((prev) => ({
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
    setForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: prev.originalImage,
      removeImage: false,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.discountType && (
      !form.discountValue ||
      Number(form.discountValue) <= 0 ||
      (form.discountType === 'percentage' && Number(form.discountValue) > 100)
    )) {
      toast.error(form.discountType === 'percentage'
        ? 'Percentage discount must be greater than 0 and at most 100'
        : 'Discount amount must be greater than 0');
      return;
    }
    try {
      const payload = {
        name: form.name,
        description: form.description,
        ingredients: form.ingredients,
        price: Number(form.price),
        discountType: form.discountType || null,
        discountValue: Number(form.discountValue) || 0,
        categoryId: form.categoryId,
        isVeg: form.isVeg,
        preparationTime: Number(form.preparationTime),
        itemType: form.itemType,
        customization: form.customization,
      };

      if (editing) {
        if (form.removeImage) {
          payload.remove_image = true;
          payload.image = null;
        }

        await menuService.updateMenuItem(editing._id, payload);

        if (form.imageFile) {
          await menuService.uploadMenuItemImage(editing._id, form.imageFile);
        }
        toast.success('Item updated');
      } else {
        const res = await menuService.createMenuItem({ ...payload, restaurantId: selectedRestaurant });
        const createdItem = res.data.data;
        if (form.imageFile && createdItem?._id) {
          await menuService.uploadMenuItemImage(createdItem._id, form.imageFile);
        }
        toast.success('Item created');
      }
      setModalOpen(false);
      loadItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await menuService.deleteMenuItem(id);
      toast.success('Item deleted');
      loadItems();
    } catch { toast.error('Delete failed'); }
  };

  const toggleAvailability = async (item) => {
    try {
      await menuService.updateMenuItem(item._id, { isAvailable: !item.isAvailable });
      toast.success(`Item ${item.isAvailable ? 'deactivated' : 'activated'}`);
      loadItems();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const getCategoryName = (id) => categories.find((c) => c._id === id)?.name || '-';

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleSort = (key, order) => { setSortBy(key); setSortOrder(order); setPage(1); };

  const columns = [
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
    { key: 'price', label: 'Price', sortable: true, render: (r) => (
      r.discountType ? (
        <div>
          <span className="mr-2 text-xs text-slate-400 line-through">{formatCurrency(r.price)}</span>
          <span className="font-semibold text-green-700">{formatCurrency(getMenuItemSalePrice(r))}</span>
        </div>
      ) : `${formatCurrency(r.price)}`
    ) },
    { key: 'categoryId', label: 'Category', render: (r) => getCategoryName(r.categoryId) },
    { key: 'isVeg', label: 'Veg/Non-Veg', render: (r) => (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {r.isVeg ? 'Veg' : 'Non-Veg'}
      </span>
    )},
    { key: 'itemType', label: 'Item Type', render: (r) => (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${(r.itemType || 'food') === 'food' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
        {(r.itemType || 'food') === 'food' ? 'Food' : 'Liquor'}
      </span>
    )},
    { key: 'isAvailable', label: 'Status', render: (r) => (
      <button
        onClick={() => toggleAvailability(r)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${r.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}
        title={r.isAvailable ? 'Click to deactivate' : 'Click to activate'}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${r.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    )},
    { key: 'preparationTime', label: 'Prep Time', sortable: true, render: (r) => `${r.preparationTime} min` },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer"><HiOutlinePencil size={16} /></button>
        <button onClick={() => handleDelete(r._id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 cursor-pointer"><HiOutlineTrash size={16} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Menu Items</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="w-56">
            <SearchSelect
              options={restaurants.map((r) => ({ value: r._id, label: r.name }))}
              value={selectedRestaurant}
              onChange={(val) => { setSelectedRestaurant(val); setPage(1); }}
              placeholder="Select restaurant..."
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
          <button onClick={() => setImportOpen(true)} disabled={!selectedRestaurant || !categories.length} className="inline-flex items-center gap-2 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer">
            <HiOutlineUpload size={18} /> Import Excel
          </button>
          <button onClick={openCreate} disabled={!selectedRestaurant || !categories.length} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 cursor-pointer">
            <HiOutlinePlus size={18} /> Add Item
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          searchValue={search}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Menu Item' : 'Add Menu Item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Ingredients (optional)</label>
            <textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} rows={2} placeholder="List the ingredients" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Price *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" step="0.001" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Discount / Price Drop</label>
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value, discountValue: e.target.value ? form.discountValue : '' })} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="">No discount</option>
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
                {form.discountType && (
                  <div className="mt-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      {form.discountType === 'percentage' ? 'Discount percentage' : 'Discount amount'}
                    </label>
                    <input
                      type="number"
                      min="0.001"
                      max={form.discountType === 'percentage' ? 100 : undefined}
                      step="0.001"
                      required
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <p className="mt-1 text-xs text-green-700">Price after discount: {formatCurrency(getMenuItemSalePrice({ price: form.price, discountType: form.discountType, discountValue: form.discountValue }))}</p>
                  </div>
                )}
              </div>
              {(() => {
                const rest = restaurants.find((r) => r._id === selectedRestaurant);
                const price = getMenuItemSalePrice(form);
                const isLiquor = form.itemType === 'liquor';

                // Liquor items use VAT
                if (isLiquor && rest?.vatEnabled && rest.vatRate > 0 && price > 0) {
                  const vatType = rest.vatType || 'inclusive';
                  const vatR = rest.vatRate;
                  let basePrice, vat, total;
                  if (vatType === 'inclusive') {
                    total = price;
                    basePrice = roundTo3(price / (1 + vatR / 100));
                    vat = roundTo3(total - basePrice);
                  } else {
                    basePrice = price;
                    vat = roundTo3(basePrice * vatR / 100);
                    total = roundTo3(basePrice + vat);
                  }
                  return (
                    <div className="mt-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2.5 text-xs text-slate-600 space-y-1">
                      <p className="font-medium text-amber-700">
                        {vatType === 'inclusive' ? 'Price breakdown (VAT inclusive)' : 'Price breakdown (VAT exclusive)'}
                      </p>
                      <div className="flex justify-between"><span>Base Price</span><span>{formatCurrency(basePrice)}</span></div>
                      <div className="flex justify-between"><span>VAT ({vatR}%)</span><span>{formatCurrency(vat)}</span></div>
                      <div className="flex justify-between font-semibold text-slate-800 border-t border-amber-300 pt-1"><span>Customer Pays</span><span>{formatCurrency(total)}</span></div>
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
                if (!isLiquor && rest?.taxEnabled && rest.taxRate > 0 && price > 0) {
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
                    cgst = roundTo3(basePrice * cgstRate / 100);
                    sgst = roundTo3(basePrice * sgstRate / 100);
                    total = roundTo3(basePrice + cgst + sgst);
                  }
                  return (
                    <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1">
                      <p className="font-medium text-slate-700">
                        {taxType === 'inclusive' ? 'Price breakdown (GST inclusive)' : 'Price breakdown (GST exclusive)'}
                      </p>
                      <div className="flex justify-between"><span>Base Price</span><span>{formatCurrency(basePrice)}</span></div>
                      <div className="flex justify-between"><span>CGST ({cgstRate}%)</span><span>{formatCurrency(cgst)}</span></div>
                      <div className="flex justify-between"><span>SGST ({sgstRate}%)</span><span>{formatCurrency(sgst)}</span></div>
                      <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-300 pt-1"><span>Customer Pays</span><span>{formatCurrency(total)}</span></div>
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
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Category *</label>
              <SearchSelect
                options={categories.map((c) => ({ value: c._id, label: c.name }))}
                value={form.categoryId}
                onChange={(val) => setForm({ ...form, categoryId: val })}
                placeholder="Search category..."
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Prep Time (min)</label>
              <input type="number" value={form.preparationTime} onChange={(e) => setForm({ ...form, preparationTime: e.target.value })} min="1" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Item Type</label>
              <select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary">
                <option value="food">Food</option>
                <option value="liquor">Liquor</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 py-2.5 text-sm">
                <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} className="h-4 w-4 rounded border-stroke text-primary" />
                <span className="font-medium text-slate-700">Vegetarian</span>
              </label>
            </div>
          </div>
          <CustomizationEditor
            value={form.customization}
            onChange={(customization) => setForm({ ...form, customization })}
          />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">Item Image</label>
              {form.imageFile && (
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

            {form.imagePreview ? (
              <div className="relative overflow-hidden rounded-xl border border-stroke bg-slate-50/60 p-3.5 transition">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Thumbnail Preview with top-right remove button */}
                  <div className="relative group shrink-0">
                    <img
                      src={
                        form.imagePreview.startsWith('/uploads')
                          ? `${import.meta.env.VITE_API_URL || ''}${form.imagePreview}`
                          : form.imagePreview
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
                        {form.imageFile ? form.imageFile.name : (editing?.name ? `${editing.name} Image` : 'Uploaded Image')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {form.imageFile
                          ? `${(form.imageFile.size / 1024).toFixed(1)} KB • Ready to save`
                          : 'Currently active on menu & customer application'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                      >
                        <HiOutlineRefresh size={14} className="text-slate-500" />
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
                {/* Subtle indicator when existing image is marked for removal */}
                {form.removeImage && (
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                    <div className="flex items-center gap-2">
                      <HiOutlineTrash size={16} className="text-amber-600 shrink-0" />
                      <span>Image marked for removal. Save changes to confirm.</span>
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
                    <span className="text-primary hover:underline font-semibold">Click or drag image to upload</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    PNG, JPG, JPEG, or WEBP up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ExcelImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
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
          const cat = categories.find((c) => c.name.toLowerCase().trim() === catName);
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
            preparationTime: row.preparationTime ? Number(row.preparationTime) : 15,
            itemType: typeVal === 'liquor' ? 'liquor' : 'food',
            restaurantId: selectedRestaurant,
          });
        }}
        onComplete={loadItems}
      />
    </div>
  );
}
