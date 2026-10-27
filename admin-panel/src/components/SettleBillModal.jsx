import React, { useState } from 'react';
import { HiOutlineX, HiCheckCircle, HiCash, HiCreditCard, HiOutlineQrcode } from 'react-icons/hi';
import { formatCurrency } from '../utils/formatCurrency';
import { detectCurrency } from '../utils/orderHelper';
import orderService from '../services/orderService';
import toast from 'react-hot-toast';

/**
 * POS Modal for quickly settling a bill with cash tender/change calculation
 * or card/UPI confirmation.
 */
export default function SettleBillModal({
  isOpen,
  onClose,
  order,
  restaurant = {},
  onSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (order) {
      setPaymentMethod((order.paymentMethod || 'CASH').toUpperCase());
      setTenderedAmount(String(order.totalAmount || '0'));
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const totalAmount = Number(order.totalAmount || 0);
  const currencySymbol = detectCurrency(restaurant, order);

  const tenderedNum = parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, tenderedNum - totalAmount);

  const handleQuickTender = (addValue) => {
    if (addValue === 'exact') {
      setTenderedAmount(totalAmount.toString());
    } else {
      setTenderedAmount((tenderedNum + addValue).toString());
    }
  };

  const handleSettle = async (andPrint = false) => {
    try {
      setSubmitting(true);
      // 1. Update payment status to 'paid'
      await orderService.updatePaymentStatus(order._id, 'paid');
      // 2. Update payment method
      await orderService.updatePaymentMethod(order._id, paymentMethod);

      toast.success(`Bill #${order.orderNumber || order._id} settled successfully!`);
      if (onSuccess) {
        onSuccess(andPrint);
      }
      onClose();
    } catch (err) {
      console.error('Failed to settle bill:', err);
      toast.error('Failed to settle bill. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Settle Bill & Payment
            </h2>
            <p className="text-xs text-slate-500">
              Order #{order.orderNumber || order._id} • {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
          >
            <HiOutlineX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Payable Banner */}
          <div className="rounded-xl bg-slate-900 text-white p-4 text-center shadow-inner">
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              Total Amount Payable
            </span>
            <div className="text-3xl font-black tracking-tight text-emerald-400 my-0.5">
              {currencySymbol} {formatCurrency(totalAmount)}
            </div>
            <span className="text-[11px] text-slate-400">
              Includes all applicable taxes and item discounts
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: HiCash },
                { id: 'CARD', label: 'Card / POS', icon: HiCreditCard },
                { id: 'UPI', label: 'UPI / QR', icon: HiOutlineQrcode },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentMethod(item.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      paymentMethod === item.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ItemIcon size={20} className="mb-1" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tender Calculation */}
          {paymentMethod === 'CASH' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Cash Received
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickTender('exact')}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Exact
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTender(50)}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    +50
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTender(100)}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTender(500)}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    +500
                  </button>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-base font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Change Return Alert */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                <span className="font-semibold text-slate-600">Change Due:</span>
                <span
                  className={`text-sm font-black ${
                    changeDue > 0 ? 'text-amber-600' : 'text-slate-800'
                  }`}
                >
                  {currencySymbol} {formatCurrency(changeDue)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSettle(false)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <HiCheckCircle size={16} />
            {submitting ? 'Settling...' : 'Settle Only'}
          </button>

          <button
            type="button"
            onClick={() => handleSettle(true)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50"
          >
            <HiCheckCircle size={16} />
            {submitting ? 'Settling...' : 'Settle & Print'}
          </button>
        </div>
      </div>
    </div>
  );
}
