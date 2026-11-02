import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import {
  HiOutlineDownload,
  HiOutlineDocumentText,
  HiOutlineQrcode,
  HiOutlineDuplicate,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import restaurantService from '../services/restaurantService';
import Modal from '../components/Modal';
import SearchSelect from '../components/SearchSelect';
import { getMenuPdfAccess } from '../utils/menuPdf';

const CUSTOMER_APP_URL =
  import.meta.env.VITE_CUSTOMER_APP_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5174'
    : 'https://customer.qrserv.in');

export default function RestaurantQrCodes() {
  const { user } = useAuth();
  const isRestaurantOwner = user?.role === 'restaurant_owner';

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const [qrState, setQrState] = useState({
    managerQr: '',
    staffQr: '',
    customerQr: '',
    pdfQr: '',
    managerUrl: '',
    staffUrl: '',
    customerUrl: '',
    pdfUrl: '',
  });

  const [qrModal, setQrModal] = useState({
    open: false,
    restaurant: null,
    managerQr: '',
    staffQr: '',
    customerQr: '',
    pdfQr: '',
    managerUrl: '',
    staffUrl: '',
    customerUrl: '',
    pdfUrl: '',
  });

  // Guard: Only restaurant_owner should access this page
  if (!isRestaurantOwner) {
    return <Navigate to="/settings/restaurant-profile" replace />;
  }

  const generateQrs = useCallback(async (r) => {
    if (!r?._id) return;
    try {
      const origin = window.location.origin;
      const managerUrl = `${origin}/captain-login/${r._id}`;
      const staffUrl = `${origin}/kitchen-login/${r._id}`;
      const customerUrl = `${CUSTOMER_APP_URL}/restaurant/${r._id}`;
      const pdfUrl = `${CUSTOMER_APP_URL}/restaurant/${r._id}/menu-pdf`;
      const menuPdfAccess = getMenuPdfAccess(r);
      const qrOptions = {
        width: 512,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      };

      const [managerQr, staffQr, customerQr, pdfQr] = await Promise.all([
        QRCode.toDataURL(managerUrl, qrOptions),
        QRCode.toDataURL(staffUrl, qrOptions),
        QRCode.toDataURL(customerUrl, qrOptions),
        menuPdfAccess.canShowPdfQr
          ? QRCode.toDataURL(pdfUrl, qrOptions)
          : Promise.resolve(''),
      ]);

      setQrState({
        managerQr,
        staffQr,
        customerQr,
        pdfQr,
        managerUrl,
        staffUrl,
        customerUrl,
        pdfUrl,
      });
    } catch {
      toast.error('Failed to generate QR codes');
    }
  }, []);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await restaurantService.getMy({ limit: 100 });
      const list = res.data?.data?.data || res.data?.data || [];
      const safeList = Array.isArray(list) ? list : [];
      setRestaurants(safeList);

      if (safeList.length > 0) {
        const initial =
          safeList.find((r) => r._id === user?.restaurantId) || safeList[0];
        setSelectedId(initial._id);
        setSelectedRestaurant(initial);
        await generateQrs(initial);
      }
    } catch {
      toast.error('Failed to load restaurant information');
    } finally {
      setLoading(false);
    }
  }, [user, generateQrs]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const handleRestaurantChange = async (id) => {
    setSelectedId(id);
    const target = restaurants.find((r) => r._id === id);
    if (target) {
      setSelectedRestaurant(target);
      await generateQrs(target);
    }
  };

  const downloadQr = (dataUrl, label) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${
      selectedRestaurant?.name || qrModal.restaurant?.name || 'restaurant'
    }-${label}-qr.png`;
    link.click();
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} URL copied to clipboard`);
  };

  const openModal = () => {
    setQrModal({
      open: true,
      restaurant: selectedRestaurant,
      ...qrState,
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!selectedRestaurant) {
    return (
      <div className="rounded-xl border border-stroke bg-card p-8 text-center shadow-sm">
        <HiOutlineQrcode className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-3 text-base font-semibold text-slate-800">
          No Restaurant Found
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          You do not have an active restaurant assigned to access QR codes.
        </p>
      </div>
    );
  }

  const menuPdfAccess = getMenuPdfAccess(selectedRestaurant);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Restaurant QR Codes
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Access and download operational QR codes for captain login, kitchen
            display, customer ordering, and menu PDF.
          </p>
        </div>

        {/* <button
          onClick={openModal}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-dark cursor-pointer transition-colors sm:self-auto"
        >
          <HiOutlineQrcode size={16} />
          <span>Open in Modal</span>
        </button> */}
      </div>

      {/* Restaurant selector if multiple */}
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

      {/* QR Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 1. Captain Login QR */}
        <div className="flex flex-col justify-between rounded-xl border border-stroke bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 border border-blue-100">
              Captain Login
            </span>
            <p className="text-xs text-slate-500">
              Scan by restaurant captains/managers to manage live orders and tables.
            </p>
            {qrState.managerQr && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <img
                  src={qrState.managerQr}
                  alt="Captain QR"
                  className="h-44 w-44 object-contain"
                />
              </div>
            )}
            <div className="w-full">
              <p className="break-all rounded-lg bg-slate-50 p-2 text-center font-mono text-[11px] text-slate-600 border border-slate-100">
                {qrState.managerUrl}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={() => copyToClipboard(qrState.managerUrl, 'Captain Login')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <HiOutlineDuplicate size={15} /> Copy Link
            </button>
            <button
              onClick={() => downloadQr(qrState.managerQr, 'captain-login')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer shadow-xs"
            >
              <HiOutlineDownload size={15} /> Download PNG
            </button>
          </div>
        </div>

        {/* 2. Kitchen Login QR */}
        <div className="flex flex-col justify-between rounded-xl border border-stroke bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
              Kitchen Login
            </span>
            <p className="text-xs text-slate-500">
              Scan on kitchen display tablets to view incoming tickets and KOTs.
            </p>
            {qrState.staffQr && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <img
                  src={qrState.staffQr}
                  alt="Kitchen QR"
                  className="h-44 w-44 object-contain"
                />
              </div>
            )}
            <div className="w-full">
              <p className="break-all rounded-lg bg-slate-50 p-2 text-center font-mono text-[11px] text-slate-600 border border-slate-100">
                {qrState.staffUrl}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={() => copyToClipboard(qrState.staffUrl, 'Kitchen Login')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <HiOutlineDuplicate size={15} /> Copy Link
            </button>
            <button
              onClick={() => downloadQr(qrState.staffQr, 'kitchen-login')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
            >
              <HiOutlineDownload size={15} /> Download PNG
            </button>
          </div>
        </div>

        {/* 3. Customer Order QR */}
        <div className="flex flex-col justify-between rounded-xl border border-stroke bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-600 border border-purple-100">
              Customer Order
            </span>
            <p className="text-xs text-slate-500">
              Primary digital menu QR for customers to browse dishes and place orders.
            </p>
            {qrState.customerQr && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <img
                  src={qrState.customerQr}
                  alt="Customer Order QR"
                  className="h-44 w-44 object-contain"
                />
              </div>
            )}
            <div className="w-full">
              <p className="break-all rounded-lg bg-slate-50 p-2 text-center font-mono text-[11px] text-slate-600 border border-slate-100">
                {qrState.customerUrl}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 border-t border-slate-100 pt-4">
            <a
              href={qrState.customerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <HiOutlineExternalLink size={15} /> Preview
            </a>
            <button
              onClick={() => copyToClipboard(qrState.customerUrl, 'Customer Order')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <HiOutlineDuplicate size={15} /> Copy Link
            </button>
            <button
              onClick={() => downloadQr(qrState.customerQr, 'customer-order')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700 cursor-pointer shadow-xs"
            >
              <HiOutlineDownload size={15} /> Download PNG
            </button>
          </div>
        </div>

        {/* 4. Menu PDF QR (If enabled) */}
        {menuPdfAccess.canShowPdfQr && (
          <div className="flex flex-col justify-between rounded-xl border border-stroke bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700 border border-slate-200">
                Menu PDF
              </span>
              <p className="text-xs text-slate-500">
                Direct QR for customers to open and download the uploaded PDF menu.
              </p>
              {qrState.pdfQr && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <img
                    src={qrState.pdfQr}
                    alt="Menu PDF QR"
                    className="h-44 w-44 object-contain"
                  />
                </div>
              )}
              <div className="w-full">
                <p className="break-all rounded-lg bg-slate-50 p-2 text-center font-mono text-[11px] text-slate-600 border border-slate-100">
                  {qrState.pdfUrl}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => copyToClipboard(qrState.pdfUrl, 'Menu PDF')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <HiOutlineDuplicate size={15} /> Copy Link
              </button>
              <button
                onClick={() => downloadQr(qrState.pdfQr, 'menu-pdf')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                <HiOutlineDocumentText size={15} /> Download PNG
              </button>
            </div>
          </div>
        )}
      </div>

      {/* The exact requested Modal Component */}
      <Modal
        isOpen={qrModal.open}
        onClose={() =>
          setQrModal({
            open: false,
            restaurant: null,
            managerQr: '',
            staffQr: '',
            customerQr: '',
            pdfQr: '',
            managerUrl: '',
            staffUrl: '',
            customerUrl: '',
            pdfUrl: '',
          })
        }
        title={`QR Codes — ${qrModal.restaurant?.name || selectedRestaurant?.name || ''}`}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-5">
          {/* Captain QR */}
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-sm font-semibold text-blue-600">Captain Login</h3>
            {qrModal.managerQr && (
              <img
                src={qrModal.managerQr}
                alt="Captain QR"
                className="h-40 w-40"
              />
            )}
            <p className="max-w-full break-all rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
              {qrModal.managerUrl}
            </p>
            <button
              onClick={() => downloadQr(qrModal.managerQr, 'captain-login')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer"
            >
              <HiOutlineDownload size={14} /> Download
            </button>
          </div>
          {/* Kitchen QR */}
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-sm font-semibold text-green-600">Kitchen Login</h3>
            {qrModal.staffQr && (
              <img
                src={qrModal.staffQr}
                alt="Kitchen QR"
                className="h-40 w-40"
              />
            )}
            <p className="max-w-full break-all rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
              {qrModal.staffUrl}
            </p>
            <button
              onClick={() => downloadQr(qrModal.staffQr, 'kitchen-login')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 cursor-pointer"
            >
              <HiOutlineDownload size={14} /> Download
            </button>
          </div>
        </div>
        <hr />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-5">
          {/* Customer Order QR */}
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-sm font-semibold text-purple-600">
              Customer Order
            </h3>
            {qrModal.customerQr && (
              <img
                src={qrModal.customerQr}
                alt="Customer Order QR"
                className="h-40 w-40"
              />
            )}
            <p className="max-w-full break-all rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
              {qrModal.customerUrl}
            </p>
            <button
              onClick={() => downloadQr(qrModal.customerQr, 'customer-order')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700 cursor-pointer"
            >
              <HiOutlineDownload size={14} /> Download
            </button>
          </div>

          {getMenuPdfAccess(qrModal.restaurant || selectedRestaurant || {})
            .canShowPdfQr && (
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-700">Menu PDF</h3>
              {qrModal.pdfQr && (
                <img
                  src={qrModal.pdfQr}
                  alt="Menu PDF QR"
                  className="h-40 w-40"
                />
              )}
              <p className="max-w-full break-all rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
                {qrModal.pdfUrl}
              </p>
              <button
                onClick={() => downloadQr(qrModal.pdfQr, 'menu-pdf')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
              >
                <HiOutlineDocumentText size={14} /> Download
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
