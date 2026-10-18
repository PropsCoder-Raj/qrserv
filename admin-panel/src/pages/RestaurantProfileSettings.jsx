import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding,
  HiOutlineCheck,
  HiOutlineDocumentText,
  HiOutlineInformationCircle,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import restaurantService from '../services/restaurantService';
import SearchSelect from '../components/SearchSelect';

export default function RestaurantProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    cr_number: '',
    receipt_header_note: '',
    gst_no: '',
    vat_no: '',
  });

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const res =
        user?.role === 'super_admin'
          ? await restaurantService.getAll({ limit: 100 })
          : await restaurantService.getMy({ limit: 100 });
      const list = res.data?.data?.data || res.data?.data || [];
      const safeList = Array.isArray(list) ? list : [];
      setRestaurants(safeList);

      if (safeList.length > 0) {
        const initial =
          safeList.find((r) => r._id === user?.restaurantId) || safeList[0];
        setSelectedId(initial._id);
        populateForm(initial);
      }
    } catch {
      toast.error('Failed to load restaurant profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const populateForm = (r) => {
    setForm({
      name: r.name || '',
      address: r.address || '',
      phone: r.phone || '',
      email: r.email || '',
      cr_number: r.cr_number || '',
      receipt_header_note: r.receipt_header_note || '',
      gst_no: r.gst_no || '',
      vat_no: r.vat_no || '',
    });
  };

  const handleRestaurantChange = (id) => {
    setSelectedId(id);
    const target = restaurants.find((r) => r._id === id);
    if (target) {
      populateForm(target);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      toast.error('No restaurant selected');
      return;
    }

    setSaving(true);
    try {
      await restaurantService.update(selectedId, {
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        cr_number: form.cr_number,
        receipt_header_note: form.receipt_header_note,
        gst_no: form.gst_no,
        vat_no: form.vat_no,
      });
      toast.success('Restaurant profile updated successfully');
      setRestaurants((prev) =>
        prev.map((r) => (r._id === selectedId ? { ...r, ...form } : r)),
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="rounded-xl border border-stroke bg-card p-8 text-center shadow-sm">
        <HiOutlineOfficeBuilding className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-3 text-base font-semibold text-slate-800">
          No Restaurant Found
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          You do not have any restaurant assigned to manage settings for.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-800">
          Restaurant Profile Settings
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Manage commercial compliance (CR Number) and customize the invoice &
          receipt header for your restaurant.
        </p>
      </div>

      {restaurants.length > 1 && (
        <div className="rounded-xl border border-stroke bg-card p-4 shadow-sm">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Select Restaurant
          </label>
          <div className="max-w-md">
            <SearchSelect
              options={restaurants.map((r) => ({
                value: r._id,
                label: r.name,
              }))}
              value={selectedId}
              onChange={handleRestaurantChange}
              placeholder="Choose restaurant..."
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-stroke bg-card p-6 shadow-sm"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Restaurant Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                CR Number (Commercial Registration){' '}
                <span className="text-xs text-slate-400 font-normal">
                  (Optional)
                </span>
              </label>
              <input
                value={form.cr_number}
                onChange={(e) =>
                  setForm({ ...form, cr_number: e.target.value })
                }
                placeholder="e.g., 1002345678"
                maxLength={100}
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Invoice Header Note / Receipt Subtitle
                </label>
                <span className="text-xs text-slate-400">
                  {(form.receipt_header_note || '').length}/120
                </span>
              </div>
              <input
                value={form.receipt_header_note}
                onChange={(e) =>
                  setForm({
                    ...form,
                    receipt_header_note: e.target.value.slice(0, 120),
                  })
                }
                maxLength={120}
                placeholder="e.g., TRN: 100203040500003 | Authentic Mediterranean Cuisine | Welcome!"
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-xs text-slate-500">
                A single-line note printed directly below the Restaurant Name at
                the top of order/invoice PDFs.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Address *
              </label>
              <input
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                required
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="e.g., +971 4 123 4567"
                  className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value.toLowerCase().trim(),
                    })
                  }
                  type="email"
                  placeholder="e.g., info@restaurant.com"
                  className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  GST No.
                </label>
                <input
                  value={form.gst_no}
                  onChange={(e) =>
                    setForm({ ...form, gst_no: e.target.value })
                  }
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  VAT / Tax ID No.
                </label>
                <input
                  value={form.vat_no}
                  onChange={(e) =>
                    setForm({ ...form, vat_no: e.target.value })
                  }
                  placeholder="e.g. VAT123456"
                  className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                <HiOutlineCheck size={18} />
                {saving ? 'Saving...' : 'Save Profile Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Invoice Header Preview */}
        <div className="space-y-4">
          <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-slate-800">
              <HiOutlineDocumentText size={18} className="text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wide">
                Invoice PDF Live Preview
              </h4>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              This preview reflects how the header will appear at the top of
              thermal receipts and invoice PDFs across the Admin Panel and
              Customer App.
            </p>

            {/* Thermal Receipt Visual Simulation */}
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-xs text-slate-800 shadow-inner">
              <div className="text-center font-bold text-sm tracking-wide">
                {form.name || 'RESTAURANT NAME'}
              </div>

              {form.receipt_header_note ? (
                <div className="mt-1 text-center text-slate-700 font-medium">
                  {form.receipt_header_note}
                </div>
              ) : (
                <div className="mt-1 text-center text-slate-400 italic text-[11px]">
                  [ Invoice Header Note (if provided) ]
                </div>
              )}

              {form.cr_number ? (
                <div className="mt-1 text-center text-slate-700 font-semibold">
                  CR No: {form.cr_number}
                </div>
              ) : (
                <div className="mt-1 text-center text-slate-400 italic text-[11px]">
                  [ CR No: Not set ]
                </div>
              )}

              <div className="mt-1 text-center text-slate-600 text-[11px]">
                {form.address || 'Address line here'}
              </div>

              {(form.phone || form.gst_no || form.vat_no) && (
                <div className="mt-0.5 text-center text-[10px] text-slate-500">
                  {[
                    form.phone ? `Ph: ${form.phone}` : null,
                    form.gst_no ? `GST: ${form.gst_no}` : null,
                    form.vat_no ? `VAT: ${form.vat_no}` : null,
                  ]
                    .filter(Boolean)
                    .join(' | ')}
                </div>
              )}

              <div className="my-2 border-t border-dashed border-slate-400" />

              <div className="text-[11px] font-medium text-slate-800">
                Order ID: #ORD-20261016-24F3-00001
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Date: 18/10/2026</span>
                <span>Status: Served</span>
              </div>
              <div className="text-[11px]">
                Customer: Rohit Pandit
              </div>
              <div className="text-[11px] text-slate-600">
                Customer Phone: 213123123123
              </div>

              <div className="my-2 border-t border-dashed border-slate-400" />

              <div className="flex justify-between text-[11px] font-bold">
                <span>ITEM</span>
                <span>AMT</span>
              </div>
              <div className="my-1 border-t border-slate-300" />
              <div className="flex justify-between text-[11px]">
                <span>1 x Signature Dish</span>
                <span>Rs.450.00</span>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              <HiOutlineInformationCircle size={18} className="shrink-0 mt-0.5" />
              <span>
                Changes saved here automatically update all future invoice PDFs
                generated across both Admin and Customer apps.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
