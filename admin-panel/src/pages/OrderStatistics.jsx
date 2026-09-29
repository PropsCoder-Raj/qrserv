import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineRefresh, HiOutlineExclamationCircle } from 'react-icons/hi';
import Modal from '../components/Modal';
import orderStatisticsService from '../services/orderStatisticsService';

export default function OrderStatistics() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await orderStatisticsService.reset();
      toast.success('Order statistics reset successfully');
      setConfirmOpen(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Failed to reset order statistics',
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-800">
          Order Statistics
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          View and manage order statistics for your organization and
          restaurants.
        </p>
      </div>

      <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Reset Order Statistics
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Reset all order status counts to zero. This action will clear
              the current statistics for the selected organization or
              restaurant and cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <HiOutlineRefresh size={16} />
            Reset Statistics
          </button>
        </div>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => !resetting && setConfirmOpen(false)}
        title="Reset Order Statistics?"
      >
        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg bg-red-50 p-4">
            <HiOutlineExclamationCircle
              size={22}
              className="mt-0.5 shrink-0 text-red-600"
            />
            <p className="text-sm text-slate-600">
              Are you sure you want to reset the order statistics? All
              pending, confirmed, preparing, ready, served, and cancelled
              order counts will be reset to zero.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={resetting}
              className="cursor-pointer rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetting ? 'Resetting...' : 'Reset Statistics'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
