import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiOutlineSearch, HiOutlineClock, HiOutlineDownload } from 'react-icons/hi';
import toast from 'react-hot-toast';
import orderService from '../services/orderService';
import Loader from '../components/Loader';
import generateBillPdf from '../utils/generateBillPdf';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-green-100 text-green-700',
  served: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(localStorage.getItem('customerPhone') || '');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('customerPhone');
    if (saved) {
      fetchOrders(saved);
    }
  }, []);

  const fetchOrders = async (phoneNumber) => {
    setLoading(true);
    try {
      const res = await orderService.getHistory(phoneNumber);
      setOrders(res.data.data || res.data);
      setSearched(true);
    } catch {
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    localStorage.setItem('customerPhone', phone.trim());
    fetchOrders(phone.trim());
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadBill = (e, order) => {
    e.stopPropagation();
    generateBillPdf(order);
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-cool text-text-secondary"
          >
            <HiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text">Order History</h1>
            <p className="text-xs text-text-light">View your past orders</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Phone Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-text-light focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              <HiOutlineSearch size={16} />
              Search
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && <Loader />}

        {/* Orders List */}
        {!loading && searched && orders.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <HiOutlineClock size={48} className="text-text-light" />
            <h3 className="mt-4 text-base font-semibold text-text">
              No orders found
            </h3>
            <p className="mt-1 text-sm text-text-light">
              No orders found for this phone number
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/order/${order._id}`)}
                className="cursor-pointer rounded-2xl border border-border bg-surface p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-text">
                      #{order.orderNumber}
                    </p>
                    <p className="mt-0.5 text-xs text-text-light">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Items summary */}
                <p className="mt-2 text-xs text-text-secondary line-clamp-1">
                  {order.items?.map((i) => `${i.name} x${i.quantity}`).join(', ')}
                </p>

                {/* Total */}
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-xs text-text-light">
                    {order.items?.reduce((sum, i) => sum + i.quantity, 0)} items
                  </span>
                  <div className="flex items-center gap-2">
                    {order.status === 'served' && (
                      <button
                        type="button"
                        onClick={(e) => handleDownloadBill(e, order)}
                        className="flex items-center gap-1 rounded-lg border border-primary/20 px-2 py-1 text-xs font-semibold text-primary"
                      >
                        <HiOutlineDownload size={14} />
                        PDF
                      </button>
                    )}
                    <span className="text-sm font-bold text-primary">
                    {order.totalAmount}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
