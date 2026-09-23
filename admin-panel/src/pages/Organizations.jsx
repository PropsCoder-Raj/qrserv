import { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUpload, HiOutlineEye } from 'react-icons/hi';
import organizationService from '../services/organizationService';
import userService from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import ExcelImportModal from '../components/ExcelImportModal';
import DatePresetFilter from '../components/DatePresetFilter';

export default function Organizations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', logo: '', address: '', phone: '', email: '', ownerId: '' });
  const [importOpen, setImportOpen] = useState(false);

  // Pagination, search, sort state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [datePreset, setDatePreset] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {
        page,
        limit: 10,
        search: search || undefined,
        sortBy: sortBy || undefined,
        sortOrder,
        datePreset: datePreset || undefined,
      };
      const res = await organizationService.getAll(queryParams);
      const result = res.data.data;
      setOrgs(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch { toast.error('Failed to load organizations'); }
    finally { setLoading(false); }
  }, [page, search, sortBy, sortOrder, datePreset]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadUsers(); }, []);

  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;

  const loadUsers = async () => {
    try {
      const res = await userService.getAll(undefined, { limit: 100 });
      const list = res.data.data.data || res.data.data;
      setUsers(Array.isArray(list) ? list : []);
    } catch {}
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', logo: '', address: '', phone: '', email: '', ownerId: '' });
    setModalOpen(true);
  };

  const openEdit = (o) => {
    setEditing(o);
    setForm({
      name: o.name || '',
      description: o.description || '',
      logo: o.logo || '',
      address: o.address || '',
      phone: o.phone || '',
      email: o.email || '',
      ownerId: o.ownerId?._id || o.ownerId || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await organizationService.update(editing._id, form);
        toast.success('Organization updated');
      } else {
        await organizationService.create(form);
        toast.success('Organization created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this organization? This will affect all its restaurants.')) return;
    try {
      await organizationService.delete(id);
      toast.success('Organization deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (o) => {
    try {
      await organizationService.update(o._id, { isActive: !o.isActive });
      toast.success(`Organization ${o.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleSort = (key, order) => { setSortBy(key); setSortOrder(order); setPage(1); };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'slug', label: 'Slug', sortable: true },
    { key: 'ownerId', label: 'Owner', render: (o) => o.ownerId?.name || '-' },
    { key: 'email', label: 'Email', render: (o) => o.email || '-' },
    { key: 'phone', label: 'Phone', render: (o) => o.phone || '-' },
    { key: 'subscriptionPlan', label: 'Plan', render: (o) => {
      const plan = o.subscriptionPlan;
      if (!plan) return <span className="text-xs text-slate-400">No plan</span>;
      return (
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {plan.name}
        </span>
      );
    }},
    { key: 'subscriptionExpiry', label: 'Expires', render: (o) => {
      if (!o.subscriptionExpiry) return '-';
      const date = new Date(o.subscriptionExpiry);
      const isExpired = date < new Date();
      return (
        <span className={`text-xs ${isExpired ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
          {date.toLocaleDateString()}
        </span>
      );
    }},
    { key: 'isActive', label: 'Status', render: (o) => (
      <button
        onClick={() => toggleActive(o)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${o.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
        title={o.isActive ? 'Click to deactivate' : 'Click to activate'}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${o.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    )},
    { key: 'createdAt', label: 'Created', sortable: true, render: (o) => new Date(o.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (o) => (
      <div className="flex gap-2">
        <button onClick={() => navigate(`/organizations/${o._id}`)} className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 cursor-pointer" title="View details">
          <HiOutlineEye size={16} />
        </button>
        <button onClick={() => openEdit(o)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer">
          <HiOutlinePencil size={16} />
        </button>
        <button onClick={() => handleDelete(o._id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 cursor-pointer">
          <HiOutlineTrash size={16} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Organizations</h2>
        {/* <div className="w-44">
          <DatePresetFilter
            value={datePreset}
            onChange={(val) => {
              setDatePreset(val);
              setPage(1);
            }}
          />
        </div> */}
        {user?.role === 'super_admin' && (
          <div className="flex gap-2">
            {/* <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
              <HiOutlineUpload size={18} /> Import Excel
            </button> */}
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer">
              <HiOutlinePlus size={18} /> Add Organization
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        <DataTable
          columns={columns}
          data={orgs}
          loading={loading}
          searchValue={search}
          onSearchChange={handleSearch}
          searchPlaceholder="Search by name, slug or email..."
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Organization' : 'Add Organization'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Organization Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Owner (Org Admin) *</label>
            <SearchSelect
              options={users.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` }))}
              value={form.ownerId}
              onChange={(val) => setForm({ ...form, ownerId: val })}
              placeholder="Search user by name or email..."
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
              <input value={form.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setForm({ ...form, phone: v }); }} pattern="^[6-9]\d{9}$" title="Enter 10-digit number starting with 6, 7, 8 or 9" maxLength={10} placeholder="e.g. 9876543210" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase().trim() })} type="email" pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$" title="Enter a valid email address (e.g. user@example.com)" placeholder="e.g. info@orggroup.com" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Logo URL</label>
            <input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
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
        title="Import Organizations"
        columns={[
          { key: 'name', label: 'Name', required: true },
          { key: 'description', label: 'Description' },
          { key: 'address', label: 'Address' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
        ]}
        onImport={(row) => organizationService.create(row)}
        onComplete={load}
      />
    </div>
  );
}
