import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrdersSocket } from '../services/socket';
import orderService from '../services/orderService';
import { unwrapOrder } from '../utils/orderHelper';
import toast from 'react-hot-toast';

/**
 * Custom Hook for real-time order synchronization in POS/Admin views.
 * Listens to WebSocket events (order:updated, order:new) and provides
 * graceful polling fallback for guaranteed sync.
 *
 * @param {string} orderId - ID of the order being viewed/printed
 * @param {string} restaurantId - Restaurant ID for room subscription
 * @param {Function} onOrderUpdated - Callback fired when order changes
 */
export default function useLiveOrderSync({ orderId, restaurantId, onOrderUpdated }) {
  const [isLive, setIsLive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);
  const flashTimeoutRef = useRef(null);
  const callbackRef = useRef(onOrderUpdated);

  useEffect(() => {
    callbackRef.current = onOrderUpdated;
  }, [onOrderUpdated]);

  const triggerUpdateNotification = useCallback((message = 'Order synced in real-time') => {
    setRecentlyUpdated(true);
    setLastSyncTime(new Date());
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => {
      setRecentlyUpdated(false);
    }, 2500);

    toast.success(message, {
      id: 'live-sync-toast',
      duration: 2500,
      icon: '⚡',
      style: {
        fontSize: '12px',
        fontWeight: '600',
        background: '#0f172a',
        color: '#38bdf8',
        border: '1px solid #38bdf8',
      },
    });
  }, []);

  const fetchLatestOrder = useCallback(
    async (showNotification = false, customMsg) => {
      if (!orderId) return;
      try {
        let res;
        try {
          res = await orderService.getInvoice(orderId);
        } catch {
          res = await orderService.getOne(orderId);
        }
        const data = unwrapOrder(res);
        if (data && callbackRef.current) {
          callbackRef.current(data);
          setLastSyncTime(new Date());
          if (showNotification) {
            triggerUpdateNotification(customMsg || 'Order refreshed');
          }
        }
      } catch (err) {
        console.error('Failed to sync latest order data:', err);
      }
    },
    [orderId, triggerUpdateNotification],
  );

  // Setup WebSocket connection and listeners
  useEffect(() => {
    if (!orderId) return;

    const socket = getOrdersSocket();

    const handleConnect = () => {
      setIsLive(true);
      if (restaurantId) {
        socket.emit('join', { restaurantId });
      }
    };

    const handleDisconnect = () => {
      setIsLive(false);
    };

    const handleOrderUpdated = (payload) => {
      // If event matches this order or restaurant room
      if (!payload?.orderId || payload.orderId === orderId) {
        let msg = 'Live update received';
        if (payload?.status) msg = `Status updated to ${payload.status.toUpperCase()}`;
        if (payload?.paymentStatus) msg = `Payment updated to ${payload.paymentStatus.toUpperCase()}`;
        if (payload?.action === 'items_updated') msg = 'Order items modified';
        if (payload?.action === 'item_cancelled') msg = 'Item cancellation updated';

        fetchLatestOrder(true, msg);
      }
    };

    const handleNewOrder = (payload) => {
      if (payload?.orderId === orderId) {
        fetchLatestOrder(true, 'Order updated');
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('order:updated', handleOrderUpdated);
    socket.on('order:new', handleNewOrder);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    // Polling fallback every 15s to guarantee fresh status even if WS drops
    const pollInterval = setInterval(() => {
      fetchLatestOrder(false);
    }, 15000);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('order:updated', handleOrderUpdated);
      socket.off('order:new', handleNewOrder);
      clearInterval(pollInterval);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, [orderId, restaurantId, fetchLatestOrder]);

  return {
    isLive,
    lastSyncTime,
    recentlyUpdated,
    manualSync: () => fetchLatestOrder(true, 'Order manually refreshed'),
  };
}
