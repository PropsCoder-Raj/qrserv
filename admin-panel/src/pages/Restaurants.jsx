import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineQrcode, HiOutlineDownload, HiOutlineUpload, HiOutlineDocumentText } from 'react-icons/hi';
import restaurantService from '../services/restaurantService';
import organizationService from '../services/organizationService';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import ExcelImportModal from '../components/ExcelImportModal';
import DatePresetFilter from '../components/DatePresetFilter';

const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || 'https://customer.qrserv.in';

export default function Restaurants() {
  const { user } = useAuth();
  const isAllowed = user?.role === 'super_admin' || user?.role === 'org_admin';
  const [restaurants, setRestaurants] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', owner_name: '', restaurant_type: 'dining', description: '', address: '', phone: '', email: '', gst_no: '', vat_no: '', taxEnabled: false, taxRate: 0, taxType: 'inclusive', vatEnabled: false, vatRate: 0, vatType: 'inclusive', organizationId: '' });
  const [qrModal, setQrModal] = useState({ open: false, restaurant: null, managerQr: '', staffQr: '', customerQr: '', pdfQr: '', managerUrl: '', staffUrl: '', customerUrl: '', pdfUrl: '' });
  const [importOpen, setImportOpen] = useState(false);
  const [importOrgId, setImportOrgId] = useState('');
  const [uploadingId, setUploadingId] = useState('');

  // Pagination, search, sort state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [datePreset, setDatePreset] = useState('');

  const getMenuPdfAccess = (restaurant) => {
    const organization = restaurant?.organizationId;
    const subscriptionPlan = organization?.subscriptionPlan;
    const subscriptionExpiry = organization?.subscriptionExpiry;
    const hasActivePlan = Boolean(
      subscriptionPlan &&
      (!subscriptionExpiry || new Date(subscriptionExpiry) >= new Date())
    );
    const isMenuPdfEnabled = Boolean(
      hasActivePlan && subscriptionPlan?.isMenuPdfEnabled
    );
    const hasMenuPdf = Boolean(restaurant?.menuPdf);

    return {
      isMenuPdfEnabled,
      hasMenuPdf,
      canShowPdfQr: isMenuPdfEnabled && hasMenuPdf,
    };
  };

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
      const res = user?.role === 'super_admin'
        ? await restaurantService.getAll(queryParams)
        : await restaurantService.getMy(queryParams);
      const result = res.data.data;
      setRestaurants(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch { toast.error('Failed to load restaurants'); }
    finally { setLoading(false); }
  }, [user, page, search, sortBy, sortOrder, datePreset]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadOrganizations(); }, []);

  const loadOrganizations = async () => {
    try {
      const res = await organizationService.getAll({ limit: 100 });
      const list = res.data.data.data || res.data.data;
      setOrganizations(Array.isArray(list) ? list : []);
    } catch {
      // ignore
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', owner_name: '', restaurant_type: 'dining', description: '', address: '', phone: '', email: '', gst_no: '', vat_no: '', taxEnabled: false, taxRate: 0, taxType: 'inclusive', vatEnabled: false, vatRate: 0, vatType: 'inclusive', organizationId: organizations[0]?._id || '' });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({ name: r.name, owner_name: r.owner_name || '', restaurant_type: r.restaurant_type || 'dining', description: r.description || '', address: r.address || '', phone: r.phone || '', email: r.email || '', gst_no: r.gst_no || '', vat_no: r.vat_no || '', taxEnabled: r.taxEnabled || false, taxRate: r.taxRate || 0, taxType: r.taxType || 'inclusive', vatEnabled: r.vatEnabled || false, vatRate: r.vatRate || 0, vatType: r.vatType || 'inclusive', organizationId: r.organizationId?._id || r.organizationId || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await restaurantService.update(editing._id, form);
        toast.success('Restaurant updated');
      } else {
        await restaurantService.create(form);
        toast.success('Restaurant created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this restaurant?')) return;
    try {
      await restaurantService.delete(id);
      toast.success('Restaurant deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (r) => {
    try {
      await restaurantService.update(r._id, { isActive: !r.isActive });
      toast.success(`Restaurant ${r.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleSort = (key, order) => { setSortBy(key); setSortOrder(order); setPage(1); };

  const showQrCodes = async (r) => {
    try {
      const origin = window.location.origin;
      const managerUrl = `${origin}/manager-login/${r._id}`;
      const staffUrl = `${origin}/staff-login/${r._id}`;
      const customerUrl = `${CUSTOMER_APP_URL}/restaurant/${r._id}`;
      const pdfUrl = `${CUSTOMER_APP_URL}/restaurant/${r._id}/menu-pdf`;
      const menuPdfAccess = getMenuPdfAccess(r);
      const qrOptions = { width: 512, margin: 2, color: { dark: '#000000', light: '#ffffff' } };
      const [managerQr, staffQr, customerQr, pdfQr] = await Promise.all([
        QRCode.toDataURL(managerUrl, qrOptions),
        QRCode.toDataURL(staffUrl, qrOptions),
        QRCode.toDataURL(customerUrl, qrOptions),
        menuPdfAccess.canShowPdfQr ? QRCode.toDataURL(pdfUrl, qrOptions) : Promise.resolve(''),
      ]);
      setQrModal({
        open: true,
        restaurant: r,
        managerQr,
        staffQr,
        customerQr,
        pdfQr,
        managerUrl,
        staffUrl,
        customerUrl,
        pdfUrl,
      });
    } catch { toast.error('Failed to generate QR codes'); }
  };

  const downloadQr = (dataUrl, label) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${qrModal.restaurant?.name || 'restaurant'}-${label}-qr.png`;
    link.click();
  };

  const handleMenuPdfUpload = async (restaurant) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setUploadingId(restaurant._id);
      try {
        await restaurantService.uploadMenuPdf(restaurant._id, file);
        toast.success('PDF uploaded (replaced if already existed)');
        load();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Upload failed');
      } finally {
        setUploadingId('');
      }
    };
    input.click();
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'organizationId', label: 'Organization', render: (r) => {
      const org = r.organizationId;
      return org?.name || '-';
    }},
    { key: 'slug', label: 'Slug', sortable: true },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '-' },
    { key: 'isActive', label: 'Status', render: (r) => (
      <button
        onClick={() => toggleActive(r)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${r.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
        title={r.isActive ? 'Click to deactivate' : 'Click to activate'}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${r.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    )},
    { key: 'createdAt', label: 'Created', sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <button onClick={() => showQrCodes(r)} className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50 cursor-pointer" title="Login QR Codes">
          <HiOutlineQrcode size={16} />
        </button>

        {/* {r.menuPdf && (
          <a
            href={r.menuPdf}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
            title="View menu PDF"
          >
            <HiOutlineDownload size={16} />
          </a>
        )} */}

        {getMenuPdfAccess(r).isMenuPdfEnabled && (
          <button
            onClick={() => handleMenuPdfUpload(r)}
            disabled={uploadingId === r._id}
            className={`rounded-lg p-1.5 hover:bg-slate-50 cursor-pointer ${uploadingId === r._id ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600'}`}
            title={r.menuPdf ? 'Replace menu PDF' : 'Upload menu PDF'}
          >
            <HiOutlineUpload size={16} />
          </button>
        )}

        <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer">
          <HiOutlinePencil size={16} />
        </button>
        <button onClick={() => handleDelete(r._id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 cursor-pointer">
          <HiOutlineTrash size={16} />
        </button>
      </div>
    )},
  ];

  if (!isAllowed) return <Navigate to="/" replace />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Restaurants</h2>
        {/* <div className="w-44">
          <DatePresetFilter
            value={datePreset}
            onChange={(val) => {
              setDatePreset(val);
              setPage(1);
            }}
          />
        </div> */}
        <div className="flex gap-2">
          <button onClick={() => { setImportOrgId(organizations[0]?._id || ''); setImportOpen(true); }} className="inline-flex items-center gap-2 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
            <HiOutlineUpload size={18} /> Import Excel
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer">
            <HiOutlinePlus size={18} /> Add Restaurant
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        <DataTable
          columns={columns}
          data={restaurants}
          loading={loading}
          searchValue={search}
          onSearchChange={handleSearch}
          searchPlaceholder="Search by name, slug, phone or email..."
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Restaurant' : 'Add Restaurant'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Organization *</label>
            <SearchSelect
              options={organizations.map((o) => ({ value: o._id, label: o.name }))}
              value={form.organizationId}
              onChange={(val) => setForm({ ...form, organizationId: val })}
              placeholder="Search organization..."
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Restaurant Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Owner Name *</label>
              <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} required placeholder="e.g. John Doe" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Restaurant Type *</label>
              <SearchSelect
                options={[
                  { value: 'dining', label: 'Dining' },
                  { value: 'kitchen', label: 'Kitchen' },
                  { value: 'small cart stall', label: 'Small Cart Stall' },
                ]}
                value={form.restaurant_type}
                onChange={(val) => setForm({ ...form, restaurant_type: val })}
                placeholder="Select type..."
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
              <input value={form.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setForm({ ...form, phone: v }); }} pattern="^[6-9]\d{9}$" title="Enter 10-digit number starting with 6, 7, 8 or 9" maxLength={10} placeholder="e.g. 9876543210" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase().trim() })} type="email" pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$" title="Enter a valid email address (e.g. user@example.com)" placeholder="e.g. info@restaurant.com" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Address *</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">GST No.</label>
            <input value={form.gst_no} onChange={(e) => setForm({ ...form, gst_no: e.target.value })} placeholder="e.g. 22AAAAA0000A1Z5" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          {form.gst_no && (
            <div className="rounded-lg border border-stroke p-4 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Apply GST on food items</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, taxEnabled: !form.taxEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.taxEnabled ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.taxEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {form.taxEnabled && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Total GST Rate (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
                    {form.taxRate > 0 && (
                      <p className="mt-1 text-xs text-slate-500">
                        CGST: {(form.taxRate / 2).toFixed(2)}% + SGST: {(form.taxRate / 2).toFixed(2)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">GST Type</label>
                    <select value={form.taxType} onChange={(e) => setForm({ ...form, taxType: e.target.value })} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary">
                      <option value="inclusive">Inclusive (prices include tax)</option>
                      <option value="exclusive">Exclusive (tax added on top)</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      {form.taxType === 'inclusive'
                        ? 'Menu prices already include GST. Tax will be extracted from the price at checkout.'
                        : 'Menu prices are before tax. GST will be added on top at checkout.'}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">VAT No.</label>
            <input value={form.vat_no} onChange={(e) => setForm({ ...form, vat_no: e.target.value })} placeholder="e.g. VAT123456" className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          {form.vat_no && (
            <div className="rounded-lg border border-stroke p-4 space-y-3 bg-amber-50">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Apply VAT on liquor items</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, vatEnabled: !form.vatEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.vatEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.vatEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {form.vatEnabled && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">VAT Rate (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">VAT Type</label>
                    <select value={form.vatType} onChange={(e) => setForm({ ...form, vatType: e.target.value })} className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary">
                      <option value="inclusive">Inclusive (prices include VAT)</option>
                      <option value="exclusive">Exclusive (VAT added on top)</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      {form.vatType === 'inclusive'
                        ? 'Liquor prices already include VAT. Tax will be extracted at checkout.'
                        : 'Liquor prices are before VAT. VAT will be added on top at checkout.'}
                    </p>
                  </div>
                </>
              )}
              <p className="text-xs text-amber-700">VAT applies only to menu items marked as "Liquor" type.</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* QR Codes Modal */}
      <Modal isOpen={qrModal.open} onClose={() => setQrModal({ open: false, restaurant: null, managerQr: '', staffQr: '', customerQr: '', pdfQr: '', managerUrl: '', staffUrl: '', customerUrl: '', pdfUrl: '' })} title={`QR Codes — ${qrModal.restaurant?.name || ''}`}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-5">
          {/* Manager QR */}
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-sm font-semibold text-blue-600">Manager Login</h3>
            {qrModal.managerQr && <img src={qrModal.managerQr} alt="Manager QR" className="h-40 w-40" />}
            <p className="max-w-full break-all rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{qrModal.managerUrl}</p>
            <button onClick={() => downloadQr(qrModal.managerQr, 'manager-login')} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer">
              <HiOutlineDownload size={14} /> Download
            </button>
          </div>
          {/* Staff QR */}
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-sm font-semibold text-green-600">Staff Login</h3>
            {qrModal.staffQr && <img src={qrModal.staffQr} alt="Staff QR" className="h-40 w-40" />}
            <p className="max-w-full break-all rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{qrModal.staffUrl}</p>
            <button onClick={() => downloadQr(qrModal.staffQr, 'staff-login')} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 cursor-pointer">
              <HiOutlineDownload size={14} /> Download
            </button>
          </div>
        </div>
        <hr />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-5">
          {/* Customer Order QR */}
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-sm font-semibold text-purple-600">Customer Order</h3>
            {qrModal.customerQr && <img src={qrModal.customerQr} alt="Customer Order QR" className="h-40 w-40" />}
            <p className="max-w-full break-all rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{qrModal.customerUrl}</p>
            <button onClick={() => downloadQr(qrModal.customerQr, 'customer-order')} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700 cursor-pointer">
              <HiOutlineDownload size={14} /> Download
            </button>
          </div>

          {getMenuPdfAccess(qrModal.restaurant || {}).canShowPdfQr && (
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-700">Menu PDF</h3>
              {qrModal.pdfQr && <img src={qrModal.pdfQr} alt="Menu PDF QR" className="h-40 w-40" />}
              <p className="max-w-full break-all rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{qrModal.pdfUrl}</p>
              <button onClick={() => downloadQr(qrModal.pdfQr, 'menu-pdf')} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer">
                <HiOutlineDocumentText size={14} /> Download
              </button>
            </div>
          )}
        </div>
      </Modal>

      <ExcelImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Restaurants"
        columns={[
          { key: 'name', label: 'Name', required: true },
          { key: 'owner_name', label: 'Owner Name', required: true },
          { key: 'restaurant_type', label: 'Restaurant Type', required: true },
          { key: 'description', label: 'Description' },
          { key: 'address', label: 'Address', required: true },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'gst_no', label: 'GST No' },
        ]}
        onImport={(row) => {
          const type = (row.restaurant_type || '').toLowerCase().trim();
          const validTypes = ['dining', 'kitchen', 'small cart stall'];
          return restaurantService.create({
            ...row,
            restaurant_type: validTypes.includes(type) ? type : 'dining',
            organizationId: importOrgId,
          });
        }}
        onComplete={load}
      >
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Organization for imported restaurants *</label>
          <SearchSelect
            options={organizations.map((o) => ({ value: o._id, label: o.name }))}
            value={importOrgId}
            onChange={(val) => setImportOrgId(val)}
            placeholder="Select organization..."
            required
          />
        </div>
      </ExcelImportModal>
    </div>
  );
}
