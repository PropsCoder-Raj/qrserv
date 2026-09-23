import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUpload } from 'react-icons/hi';
import menuService from '../services/menuService';
import restaurantService from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import ExcelImportModal from '../components/ExcelImportModal';
import DatePresetFilter from '../components/DatePresetFilter';

export default function MenuItems() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '', isVeg: false, preparationTime: 15, itemType: 'food', imageFile: null, imagePreview: '' });
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
    setForm({ name: '', description: '', price: '', categoryId: categories[0]?._id || '', isVeg: false, preparationTime: 15, itemType: 'food', imageFile: null, imagePreview: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId,
      isVeg: item.isVeg || false,
      preparationTime: item.preparationTime || 15,
      itemType: item.itemType || 'food',
      imageFile: null,
      imagePreview: item.image || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        categoryId: form.categoryId,
        isVeg: form.isVeg,
        preparationTime: Number(form.preparationTime),
        itemType: form.itemType,
      };
      if (editing) {
        await menuService.updateMenuItem(editing._id, { name: payload.name, description: payload.description, price: payload.price, isVeg: payload.isVeg, preparationTime: payload.preparationTime, itemType: payload.itemType });
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
    { key: 'price', label: 'Price', sortable: true, render: (r) => `₹${r.price}` },
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Price *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" step="0.01" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
              {(() => {
                const rest = restaurants.find((r) => r._id === selectedRestaurant);
                const price = parseFloat(form.price) || 0;
                const isLiquor = form.itemType === 'liquor';

                // Liquor items use VAT
                if (isLiquor && rest?.vatEnabled && rest.vatRate > 0 && price > 0) {
                  const vatType = rest.vatType || 'inclusive';
                  const vatR = rest.vatRate;
                  let basePrice, vat, total;
                  if (vatType === 'inclusive') {
                    total = price;
                    basePrice = Math.round(price / (1 + vatR / 100) * 100) / 100;
                    vat = Math.round((total - basePrice) * 100) / 100;
                  } else {
                    basePrice = price;
                    vat = Math.round(basePrice * vatR / 100 * 100) / 100;
                    total = basePrice + vat;
                  }
                  return (
                    <div className="mt-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2.5 text-xs text-slate-600 space-y-1">
                      <p className="font-medium text-amber-700">
                        {vatType === 'inclusive' ? 'Price breakdown (VAT inclusive)' : 'Price breakdown (VAT exclusive)'}
                      </p>
                      <div className="flex justify-between"><span>Base Price</span><span>₹{basePrice.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>VAT ({vatR}%)</span><span>₹{vat.toFixed(2)}</span></div>
                      <div className="flex justify-between font-semibold text-slate-800 border-t border-amber-300 pt-1"><span>Customer Pays</span><span>₹{total.toFixed(2)}</span></div>
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
                  const cgstRate = Math.round(rate / 2 * 100) / 100;
                  const sgstRate = Math.round(rate / 2 * 100) / 100;
                  let basePrice, cgst, sgst, total;
                  if (taxType === 'inclusive') {
                    total = price;
                    basePrice = Math.round(price / (1 + rate / 100) * 100) / 100;
                    const tax = Math.round((total - basePrice) * 100) / 100;
                    cgst = Math.round(tax / 2 * 100) / 100;
                    sgst = Math.round((tax - cgst) * 100) / 100;
                  } else {
                    basePrice = price;
                    cgst = Math.round(basePrice * cgstRate / 100 * 100) / 100;
                    sgst = Math.round(basePrice * sgstRate / 100 * 100) / 100;
                    total = basePrice + cgst + sgst;
                  }
                  return (
                    <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1">
                      <p className="font-medium text-slate-700">
                        {taxType === 'inclusive' ? 'Price breakdown (GST inclusive)' : 'Price breakdown (GST exclusive)'}
                      </p>
                      <div className="flex justify-between"><span>Base Price</span><span>₹{basePrice.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>CGST ({cgstRate}%)</span><span>₹{cgst.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>SGST ({sgstRate}%)</span><span>₹{sgst.toFixed(2)}</span></div>
                      <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-300 pt-1"><span>Customer Pays</span><span>₹{total.toFixed(2)}</span></div>
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Item Image</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setForm({
                  ...form,
                  imageFile: file,
                  imagePreview: file ? URL.createObjectURL(file) : form.imagePreview,
                });
              }}
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              PNG, JPG, JPEG, or WEBP. If an image already exists, it will be replaced.
            </p>
            {form.imagePreview && (
              <img
                src={
                  form.imagePreview.startsWith('/uploads')
                    ? `${import.meta.env.VITE_API_URL || ''}${form.imagePreview}`
                    : form.imagePreview
                }
                alt="Menu item preview"
                className="mt-3 h-24 w-24 rounded-lg object-cover"
              />
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
