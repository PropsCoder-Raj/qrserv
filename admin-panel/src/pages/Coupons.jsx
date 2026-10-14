import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import couponService from '../services/couponService';
import restaurantService from '../services/restaurantService';

const emptyForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '0',
  maxDiscount: '',
  startAt: '',
  expiresAt: '',
  usageLimit: '',
  isActive: true,
};

const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export default function Coupons() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const res = user?.role === 'super_admin'
          ? await restaurantService.getAll({ limit: 100 })
          : await restaurantService.getMy({ limit: 100 });
        const result = res.data.data;
        const list = result?.data || result;
        setRestaurants(Array.isArray(list) ? list : []);
        if (list?.length) setSelectedRestaurant(list[0]._id);
      } catch {
        toast.error('Failed to load restaurants');
      }
    };
    loadRestaurants();
  }, [user?.role]);

  const loadCoupons = useCallback(async () => {
    if (!selectedRestaurant) {
      setCoupons([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await couponService.getAll(selectedRestaurant);
      setCoupons(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurant]);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const openCreate = () => {
    const startAt = new Date();
    const expiresAt = new Date(startAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    setEditing(null);
    setForm({
      ...emptyForm,
      startAt: toLocalInput(startAt),
      expiresAt: toLocalInput(expiresAt),
    });
    setModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount ?? 0),
      maxDiscount: coupon.maxDiscount == null ? '' : String(coupon.maxDiscount),
      startAt: toLocalInput(coupon.startAt),
      expiresAt: toLocalInput(coupon.expiresAt),
      usageLimit: coupon.usageLimit == null ? '' : String(coupon.usageLimit),
      isActive: coupon.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscount: form.discountType === 'percentage' && form.maxDiscount !== ''
        ? Number(form.maxDiscount)
        : null,
      startAt: new Date(form.startAt).toISOString(),
      expiresAt: new Date(form.expiresAt).toISOString(),
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await couponService.update(editing._id, payload);
        toast.success('Coupon updated');
      } else {
        await couponService.create({ ...payload, restaurantId: selectedRestaurant });
        toast.success('Coupon created');
      }
      setModalOpen(false);
      loadCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Coupon could not be saved');
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await couponService.update(coupon._id, { isActive: !coupon.isActive });
      toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
      loadCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      await couponService.remove(coupon._id);
      toast.success('Coupon deleted');
      loadCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const visibleCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const columns = [
    { key: 'code', label: 'Coupon Code' },
    {
      key: 'discount',
      label: 'Discount',
      render: (coupon) => coupon.discountType === 'percentage'
        ? `${coupon.discountValue}%${coupon.maxDiscount != null ? ` (max ${coupon.maxDiscount})` : ''}`
        : `${coupon.discountValue}`,
    },
    { key: 'minOrderAmount', label: 'Minimum Order', render: (coupon) => `${coupon.minOrderAmount}` },
    {
      key: 'usageCount',
      label: 'Usage',
      render: (coupon) => `${coupon.usageCount}${coupon.usageLimit == null ? '' : ` / ${coupon.usageLimit}`}`,
    },
    {
      key: 'expiresAt',
      label: 'Expiry Date',
      render: (coupon) => new Date(coupon.expiresAt).toLocaleString(),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (coupon) => (
        <button
          type="button"
          onClick={() => toggleActive(coupon)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${coupon.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
          title={coupon.isActive ? 'Click to deactivate' : 'Click to activate'}
          aria-label={`${coupon.isActive ? 'Deactivate' : 'Activate'} ${coupon.code}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${coupon.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (coupon) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(coupon)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50" title="Edit coupon" aria-label="Edit coupon">
            <HiOutlinePencil size={16} />
          </button>
          <button onClick={() => handleDelete(coupon)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" title="Delete coupon" aria-label="Delete coupon">
            <HiOutlineTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Coupons</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="w-56">
            <SearchSelect
              options={restaurants.map((restaurant) => ({ value: restaurant._id, label: restaurant.name }))}
              value={selectedRestaurant}
              onChange={setSelectedRestaurant}
              placeholder="Select restaurant..."
            />
          </div>
          <button
            onClick={openCreate}
            disabled={!selectedRestaurant}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            <HiOutlinePlus size={18} /> Add Coupon
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        <DataTable
          columns={columns}
          data={visibleCoupons}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search coupon code..."
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'Add Coupon'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Coupon Code *
              <input value={form.code} onChange={(event) => setField('code', event.target.value)} required className="mt-1.5 w-full rounded-lg border border-stroke px-3 py-2.5 outline-none focus:border-primary" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Discount Type *
              <select value={form.discountType} onChange={(event) => setField('discountType', event.target.value)} className="mt-1.5 w-full rounded-lg border border-stroke bg-white px-3 py-2.5 outline-none focus:border-primary">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Discount Value *
              <input type="number" min="0.01" step="0.01" max={form.discountType === 'percentage' ? 100 : undefined} value={form.discountValue} onChange={(event) => setField('discountValue', event.target.value)} required className="mt-1.5 w-full rounded-lg border border-stroke px-3 py-2.5 outline-none focus:border-primary" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Minimum Order Amount
              <input type="number" min="0" step="0.01" value={form.minOrderAmount} onChange={(event) => setField('minOrderAmount', event.target.value)} className="mt-1.5 w-full rounded-lg border border-stroke px-3 py-2.5 outline-none focus:border-primary" />
            </label>
            {form.discountType === 'percentage' && (
              <label className="text-sm font-medium text-slate-700">
                Maximum Discount
                <input type="number" min="0" step="0.01" value={form.maxDiscount} onChange={(event) => setField('maxDiscount', event.target.value)} className="mt-1.5 w-full rounded-lg border border-stroke px-3 py-2.5 outline-none focus:border-primary" />
              </label>
            )}
            <label className="text-sm font-medium text-slate-700">
              Usage Limit
              <input type="number" min="1" step="1" value={form.usageLimit} onChange={(event) => setField('usageLimit', event.target.value)} placeholder="Unlimited" className="mt-1.5 w-full rounded-lg border border-stroke px-3 py-2.5 outline-none focus:border-primary" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Start Date *
              <input type="datetime-local" value={form.startAt} onChange={(event) => setField('startAt', event.target.value)} required className="mt-1.5 w-full rounded-lg border border-stroke px-3 py-2.5 outline-none focus:border-primary" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Expiry Date *
              <input type="datetime-local" value={form.expiresAt} onChange={(event) => setField('expiresAt', event.target.value)} required className="mt-1.5 w-full rounded-lg border border-stroke px-3 py-2.5 outline-none focus:border-primary" />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setField('isActive', event.target.checked)} className="h-4 w-4 accent-primary" />
              Active
            </label>
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
