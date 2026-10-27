import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  HiOutlinePrinter,
  HiOutlineArrowLeft,
  HiOutlineRefresh,
  HiCheckCircle,
  HiOutlineDocumentText,
  HiOutlineClipboardList,
  HiOutlineCurrencyDollar,
  HiOutlineSparkles,
} from 'react-icons/hi';
import orderService from '../services/orderService';
import restaurantService from '../services/restaurantService';
import useSubscription from '../hooks/useSubscription';
import useLiveOrderSync from '../hooks/useLiveOrderSync';
import { unwrapOrder, detectCurrency } from '../utils/orderHelper';
import ThermalReceipt from '../components/ThermalReceipt';
import ThermalKOT from '../components/ThermalKOT';
import SettleBillModal from '../components/SettleBillModal';
import '../styles/thermal-print.css';

/**
 * Paroso-Style Digital Bill and KOT Preview/Print System
 * Route: /admin/print/bill/:id
 * Query Parameter: ?kot=1 for Kitchen Order Ticket
 */
export default function AdminBillPrintPreview() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: Bill vs KOT controlled by query param ?kot=1
  const isKotMode = searchParams.get('kot') === '1';

  // Paper width state (80mm standard POS default or 58mm compact)
  const [paperWidth, setPaperWidth] = useState('80mm');

  // Currency customization (defaults to auto-detected currency)
  const [customCurrency, setCustomCurrency] = useState('');

  // Customer Data permission from subscription
  const { hasCustomerData } = useSubscription();

  // Data states
  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Settlement modal state
  const [settleModalOpen, setSettleModalOpen] = useState(false);

  // Load initial order and restaurant details with complete unwrapping
  const loadOrderData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      let res;
      // Prefer getInvoice as it is public and fully populates restaurant & items
      try {
        res = await orderService.getInvoice(id);
      } catch {
        res = await orderService.getOne(id);
      }

      const orderData = unwrapOrder(res);
      if (!orderData || (!orderData._id && !orderData.orderNumber)) {
        throw new Error('Order not found or empty response');
      }

      setOrder(orderData);

      // Extract restaurant details
      if (
        orderData.restaurantId &&
        typeof orderData.restaurantId === 'object' &&
        orderData.restaurantId.name
      ) {
        setRestaurant(orderData.restaurantId);
      } else {
        const targetRestId =
          typeof orderData.restaurantId === 'object'
            ? orderData.restaurantId?._id
            : orderData.restaurantId;

        if (targetRestId) {
          try {
            const restRes = await restaurantService.getOne(targetRestId);
            const restData = unwrapOrder(restRes);
            if (restData) {
              setRestaurant(restData);
            }
          } catch {
            if (typeof orderData.restaurantId === 'object') {
              setRestaurant(orderData.restaurantId);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load order for thermal preview:', err);
      setError('Order not found or could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  // Handle live WebSocket synchronization
  const restId =
    typeof order?.restaurantId === 'object'
      ? order?.restaurantId?._id
      : order?.restaurantId;

  const { isLive, lastSyncTime, recentlyUpdated, manualSync } = useLiveOrderSync({
    orderId: id,
    restaurantId: restId,
    onOrderUpdated: (updatedOrder) => {
      const unwrapped = unwrapOrder(updatedOrder);
      if (unwrapped) {
        setOrder(unwrapped);
        if (unwrapped.restaurantId && typeof unwrapped.restaurantId === 'object' && unwrapped.restaurantId.name) {
          setRestaurant(unwrapped.restaurantId);
        }
      }
    },
  });

  // Switch between Bill and KOT previews via searchParams
  const toggleViewMode = (mode) => {
    if (mode === 'kot') {
      searchParams.set('kot', '1');
    } else {
      searchParams.delete('kot');
    }
    setSearchParams(searchParams, { replace: true });
  };

  // Direct Admin Action: Print Bill
  const handlePrintBill = () => {
    if (isKotMode) {
      searchParams.delete('kot');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  // Direct Admin Action: Print KOT
  const handlePrintKot = () => {
    if (!isKotMode) {
      searchParams.set('kot', '1');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  // Callback when bill is settled in modal
  const handleSettleSuccess = (andPrint = false) => {
    loadOrderData();
    if (andPrint) {
      setTimeout(() => {
        handlePrintBill();
      }, 300);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-6 no-print">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Loading Live Thermal Preview...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-6 no-print">
        <div className="max-w-md rounded-2xl bg-slate-800 p-8 text-center border border-slate-700 shadow-xl">
          <div className="text-red-400 text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold mb-2">Order Preview Unavailable</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Could not find order details.'}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-700 hover:bg-slate-600 transition cursor-pointer"
            >
              Back to Orders
            </button>
            <button
              onClick={loadOrderData}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
  const isCancelled = ['cancelled', 'canceled'].includes((order.status || '').toLowerCase());
  const effectiveRest = restaurant || (typeof order.restaurantId === 'object' ? order.restaurantId : {});
  const activeCurrency = customCurrency || detectCurrency(effectiveRest, order);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* ====================================================================
          ADMIN / POS TOP CONTROL BAR (STRICTLY HIDDEN DURING PRINTING)
          ==================================================================== */}
      <header className="no-print sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 shadow-lg">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-3 max-w-7xl">
          {/* Left: Back & Order Meta */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white cursor-pointer shadow-xs"
              title="Return to previous screen"
            >
              <HiOutlineArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">
                  Order #{order.orderNumber || order._id}
                </h1>

                {effectiveRest.name && (
                  <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-700/50">
                    {effectiveRest.name}
                  </span>
                )}

                {order.tableNumber ? (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700">
                    Table {order.tableNumber}
                  </span>
                ) : (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700 uppercase">
                    {order.orderType || 'Takeaway'}
                  </span>
                )}

                {/* Live Sync Indicator */}
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                    isLive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                  title={
                    isLive
                      ? `WebSocket connected. Last synced at ${lastSyncTime.toLocaleTimeString()}`
                      : 'Reconnecting WebSocket...'
                  }
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>{isLive ? 'LIVE' : 'SYNCING'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: View Mode Tabs & Paper Width Selector */}
          <div className="flex items-center gap-2">
            {/* Bill vs KOT Switcher */}
            <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => toggleViewMode('bill')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  !isKotMode
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HiOutlineDocumentText size={15} />
                <span>Bill View</span>
              </button>

              <button
                type="button"
                onClick={() => toggleViewMode('kot')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  isKotMode
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HiOutlineClipboardList size={15} />
                <span>KOT View</span>
              </button>
            </div>

            {/* Paper Width (80mm vs 58mm) */}
            <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                  paperWidth === '80mm'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                  paperWidth === '58mm'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                58mm
              </button>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center rounded-xl bg-slate-950 px-2 py-1 border border-slate-800 text-[11px]">
              <span className="text-slate-400 mr-1.5 font-semibold">Curr:</span>
              <select
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value)}
                className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">Auto ({detectCurrency(effectiveRest, order)})</option>
                <option value="BHD" className="bg-slate-900 text-white">BHD (Bahrain)</option>
                <option value="OMR" className="bg-slate-900 text-white">OMR (Oman)</option>
                <option value="AED" className="bg-slate-900 text-white">AED (UAE)</option>
                <option value="SAR" className="bg-slate-900 text-white">SAR (Saudi)</option>
                <option value="₹" className="bg-slate-900 text-white">₹ (INR)</option>
                <option value="$" className="bg-slate-900 text-white">$ (USD)</option>
              </select>
            </div>
          </div>

          {/* Right: Direct Admin Print & Settle Actions */}
          <div className="flex items-center gap-2">
            {/* Manual Sync Button */}
            <button
              type="button"
              onClick={manualSync}
              className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              title="Refresh order data"
            >
              <HiOutlineRefresh size={16} />
            </button>

            {/* Settle Bill Button */}
            {!isCancelled && (
              <button
                type="button"
                onClick={() => setSettleModalOpen(true)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-sm ${
                  isPaid
                    ? 'border border-emerald-600/40 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {isPaid ? <HiCheckCircle size={16} /> : <HiOutlineCurrencyDollar size={16} />}
                <span>{isPaid ? 'Settled (Paid)' : 'Settle Bill'}</span>
              </button>
            )}

            {/* Print KOT Action */}
            <button
              type="button"
              onClick={handlePrintKot}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-600/50 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-900/50 cursor-pointer shadow-xs"
            >
              <HiOutlinePrinter size={16} />
              <span>Print KOT</span>
            </button>

            {/* Print Bill Action */}
            <button
              type="button"
              onClick={handlePrintBill}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 text-slate-900 px-3.5 py-1.5 text-xs font-bold transition hover:bg-white cursor-pointer shadow-sm"
            >
              <HiOutlinePrinter size={16} />
              <span>Print Bill</span>
            </button>
          </div>
        </div>

        {/* Real-time Update Notice Banner */}
        {recentlyUpdated && (
          <div className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/40 animate-pulse">
            <HiOutlineSparkles size={14} />
            <span>Live Sync: Order details updated in real time</span>
          </div>
        )}
      </header>

      {/* ====================================================================
          RECEIPT PREVIEW STAGE
          ==================================================================== */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 overflow-y-auto">
        {/* Screen Preview Subtitle */}
        <div className="no-print text-center mb-3">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {isKotMode ? '👨‍🍳 Kitchen Order Ticket Preview' : '🧾 Bill Preview'} ({paperWidth})
          </span>
        </div>

        {/* Dynamic Thermal Layout: KOT vs Bill */}
        {isKotMode ? (
          <ThermalKOT
            order={order}
            restaurant={effectiveRest}
            paperWidth={paperWidth}
          />
        ) : (
          <ThermalReceipt
            order={order}
            restaurant={effectiveRest}
            paperWidth={paperWidth}
            customerInfoEnabled={hasCustomerData}
            currency={activeCurrency}
          />
        )}
      </main>

      {/* ====================================================================
          SETTLE BILL MODAL
          ==================================================================== */}
      <SettleBillModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        order={order}
        restaurant={effectiveRest}
        onSuccess={handleSettleSuccess}
      />
    </div>
  );
}
