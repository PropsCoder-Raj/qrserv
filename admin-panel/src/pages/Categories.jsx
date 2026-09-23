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

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', sortOrder: 0 });
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

  const loadCategories = useCallback(async () => {
    if (!selectedRestaurant) return;
    setLoading(true);
    try {
      const res = await menuService.getCategories(selectedRestaurant, {
        page,
        limit: 10,
        search: search || undefined,
        sortBy: sortBy || undefined,
        sortOrder,
        datePreset: datePreset || undefined,
        includeInactive: true,
      });
      const result = res.data.data;
      setCategories(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, [selectedRestaurant, page, search, sortBy, sortOrder, datePreset]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const loadRestaurants = async () => {
    try {
      const res = user?.role === 'super_admin'
        ? await restaurantService.getAll({ limit: 100 })
        : await restaurantService.getMy({ limit: 100 });
      const list = res.data.data.data || res.data.data;
      setRestaurants(Array.isArray(list) ? list : []);
      if (list.length > 0) setSelectedRestaurant(list[0]._id);
    } catch { toast.error('Failed to load restaurants'); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', sortOrder: 0 });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '', sortOrder: c.sortOrder || 0 });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await menuService.updateCategory(editing._id, form);
        toast.success('Category updated');
      } else {
        await menuService.createCategory({ ...form, restaurantId: selectedRestaurant });
        toast.success('Category created');
      }
      setModalOpen(false);
      loadCategories();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category and all its items?')) return;
    try {
      await menuService.deleteCategory(id);
      toast.success('Category deleted');
      loadCategories();
    } catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (category) => {
    try {
      await menuService.updateCategory(category._id, { isActive: !category.isActive });
      toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'}`);
      loadCategories();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleSort = (key, order) => { setSortBy(key); setSortOrder(order); setPage(1); };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', render: (c) => c.description || '-' },
    { key: 'sortOrder', label: 'Sort Order', sortable: true },
    { key: 'isActive', label: 'Status', render: (c) => (
      <button
        onClick={() => toggleActive(c)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${c.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
        title={c.isActive ? 'Click to deactivate' : 'Click to activate'}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${c.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    )},
    { key: 'actions', label: 'Actions', render: (c) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer"><HiOutlinePencil size={16} /></button>
        <button onClick={() => handleDelete(c._id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 cursor-pointer"><HiOutlineTrash size={16} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Categories</h2>
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
          <button onClick={() => setImportOpen(true)} disabled={!selectedRestaurant} className="inline-flex items-center gap-2 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer">
            <HiOutlineUpload size={18} /> Import Excel
          </button>
          <button onClick={openCreate} disabled={!selectedRestaurant} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 cursor-pointer">
            <HiOutlinePlus size={18} /> Add Category
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        <DataTable
          columns={columns}
          data={categories}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'}>
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
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
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
        title="Import Categories"
        columns={[
          { key: 'name', label: 'Name', required: true },
          { key: 'description', label: 'Description' },
          { key: 'sortOrder', label: 'Sort Order' },
        ]}
        onImport={(row) => menuService.createCategory({
          ...row,
          sortOrder: row.sortOrder ? Number(row.sortOrder) : 0,
          restaurantId: selectedRestaurant,
        })}
        onComplete={loadCategories}
      />
    </div>
  );
}
