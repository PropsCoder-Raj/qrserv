import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import userService from '../services/userService';
import restaurantService from '../services/restaurantService';
import organizationService from '../services/organizationService';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import DatePresetFilter from '../components/DatePresetFilter';

const ALL_ROLES = ['super_admin', 'org_admin', 'restaurant_owner', 'manager', 'staff'];

function getAllowedRoles(currentRole) {
  if (currentRole === 'super_admin') return ALL_ROLES;
  if (currentRole === 'org_admin') return ['restaurant_owner', 'manager', 'staff'];
  if (currentRole === 'restaurant_owner') return ['manager', 'staff'];
  return ['staff'];
}

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', passcode: '', phone: '', role: 'staff', restaurantId: '', organizationId: '' });

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
      const restaurantId = user?.role === 'super_admin' || user?.role === 'org_admin'
        ? undefined
        : user?.restaurantId;
      const res = await userService.getAll(
        restaurantId,
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
      setUsers(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [user, page, search, sortBy, sortOrder, datePreset]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadRestaurants(); loadOrganizations(); }, []);

  const loadRestaurants = async () => {
    try {
      const res = user?.role === 'super_admin' ? await restaurantService.getAll({ limit: 100 }) : await restaurantService.getMy({ limit: 100 });
      const list = res.data.data.data || res.data.data;
      setRestaurants(Array.isArray(list) ? list : []);
    } catch {}
  };

  const loadOrganizations = async () => {
    try {
      const res = await organizationService.getAll({ limit: 100 });
      const list = res.data.data.data || res.data.data;
      setOrganizations(Array.isArray(list) ? list : []);
    } catch {}
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', passcode: '', phone: '', role: 'staff', restaurantId: restaurants[0]?._id || '', organizationId: '' });
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      passcode: '',
      phone: u.phone || '',
      role: u.role,
      restaurantId: u.restaurantId?._id || u.restaurantId || '',
      organizationId: u.organizationId?._id || u.organizationId || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      const isStaffRole = payload.role === 'manager' || payload.role === 'staff';
      if (isStaffRole) {
        delete payload.password;
        if (!payload.passcode) delete payload.passcode;
      } else {
        delete payload.passcode;
        if (!payload.password) delete payload.password;
      }
      if (editing) {
        await userService.update(editing._id, payload);
        toast.success('User updated');
      } else {
        await userService.create(payload);
        toast.success('User created');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await userService.delete(id);
      toast.success('User deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleSort = (key, order) => { setSortBy(key); setSortOrder(order); setPage(1); };

  const roleColor = (role) => {
    const map = {
      super_admin: 'bg-red-100 text-red-700',
      org_admin: 'bg-orange-100 text-orange-700',
      restaurant_owner: 'bg-blue-100 text-blue-700',
      manager: 'bg-purple-100 text-purple-700',
      staff: 'bg-slate-100 text-slate-700',
    };
    return map[role] || map.staff;
  };

  const getOrganizationName = (u) => {
    const organization = u.organizationId;
    if (!organization) return '-';
    if (typeof organization === 'object') return organization.name || '-';
    return organizations.find((item) => item._id === organization)?.name || '-';
  };

  const getRestaurantName = (u) => {
    const restaurant = u.restaurantId;
    if (!restaurant) return '-';
    if (typeof restaurant === 'object') return restaurant.name || '-';
    return restaurants.find((item) => item._id === restaurant)?.name || '-';
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'organizationId', label: 'Organization Name', render: getOrganizationName },
    { key: 'restaurantId', label: 'Restaurant Name', render: getRestaurantName },
    { key: 'role', label: 'Role', sortable: true, render: (u) => (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor(u.role)}`}>
        {u.role?.replace('_', ' ')}
      </span>
    )},
    { key: 'isActive', label: 'Status', render: (u) => (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {u.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (u) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(u)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"><HiOutlinePencil size={16} /></button>
        <button onClick={() => handleDelete(u._id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><HiOutlineTrash size={16} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Users</h2>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
          <HiOutlinePlus size={18} /> Add User
        </button>
      </div>

      {/* <div className="flex justify-end">
        <div className="w-44">
          <DatePresetFilter
            value={datePreset}
            onChange={(val) => {
              setDatePreset(val);
              setPage(1);
            }}
          />
        </div>
      </div> */}

      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          searchValue={search}
          onSearchChange={handleSearch}
          searchPlaceholder="Search by name, email or phone..."
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase().trim() })} required pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$" title="Enter a valid email address (e.g. user@example.com)" placeholder="e.g. john@example.com" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          {form.role === 'manager' || form.role === 'staff' ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{editing ? 'Passcode (leave empty to keep)' : 'Passcode *'}</label>
              <input
                type="text"
                value={form.passcode}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setForm({ ...form, passcode: v }); }}
                required={!editing}
                inputMode="numeric"
                maxLength={6}
                pattern="^\d{4,6}$"
                title="Passcode must be 4-6 digits"
                placeholder="4-6 digit PIN"
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{editing ? 'Password (leave empty to keep)' : 'Password *'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={6} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone *</label>
              <input value={form.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setForm({ ...form, phone: v }); }} required pattern="^[6-9]\d{9}$" title="Enter 10-digit number starting with 6, 7, 8 or 9" maxLength={10} placeholder="e.g. 9876543210" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Role *</label>
              <SearchSelect
                options={getAllowedRoles(user?.role).map((r) => ({ value: r, label: r.replace('_', ' ') }))}
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val })}
                placeholder="Select role..."
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Organization</label>
            <SearchSelect
              options={[{ value: '', label: 'None' }, ...organizations.map((o) => ({ value: o._id, label: o.name }))]}
              value={form.organizationId}
              onChange={(val) => setForm({ ...form, organizationId: val })}
              placeholder="Search organization..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Restaurant</label>
            <SearchSelect
              options={[{ value: '', label: 'None' }, ...restaurants.map((r) => ({ value: r._id, label: r.name }))]}
              value={form.restaurantId}
              onChange={(val) => setForm({ ...form, restaurantId: val })}
              placeholder="Search restaurant..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
