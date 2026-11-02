import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineBell } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { getOrdersSocket } from '../services/socket';
import { syncPushRegistration, isPushRole } from '../services/notificationService';
import { playAlertChime, unlockAlertAudio } from '../utils/alertSound';

const ALERT_STYLES = {
  order: 'border-primary/20 text-primary',
  kitchen: 'border-emerald-200 text-emerald-600',
  waiter: 'border-amber-200 text-amber-600',
};

function AlertToast({ kind, title, body }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${ALERT_STYLES[kind]}`}>
      <div className="rounded-full bg-slate-100 p-2">
        <HiOutlineBell size={20} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{body}</p>
      </div>
    </div>
  );
}

// Mounted once in StaffLayout. Owns the live socket connection for staff alerts
// (new orders, kitchen ready alerts, waiter calls) and the browser push token.
export default function StaffAlertsListener() {
  const { user, notificationsEnabled, notificationSettingsLoading } = useAuth();
  const restaurantId = user?.restaurantId;

  // Browsers only allow audio after a user gesture; unlock on the first one.
  useEffect(() => {
    const unlock = () => unlockAlertAudio();
    const events = ['pointerdown', 'keydown'];
    events.forEach((evt) => window.addEventListener(evt, unlock, { once: true }));
    return () => events.forEach((evt) => window.removeEventListener(evt, unlock));
  }, []);

  useEffect(() => {
    if (!user || notificationSettingsLoading || !notificationsEnabled || !isPushRole(user.role)) return;
    syncPushRegistration().catch(() => {});
  }, [user, notificationSettingsLoading, notificationsEnabled]);

  useEffect(() => {
    if (!restaurantId || notificationSettingsLoading) return undefined;

    const socket = getOrdersSocket();
    const join = () => socket.emit('join', { restaurantId });

    const notify = (kind, title, body) => {
      if (!notificationsEnabled) return;
      playAlertChime(kind);
      toast.custom(() => <AlertToast kind={kind} title={title} body={body} />, { duration: 6000 });
    };

    const handlers = {
      'order:new': (payload) =>
        notify(
          'order',
          'New order received',
          payload?.orderNumber ? `Order #${payload.orderNumber}` : 'A new order was placed',
        ),
      'kitchen:alert': (payload) =>
        notify('kitchen', 'Order ready', payload?.message || 'An order is ready to serve'),
      'waiter:call': (payload) =>
        notify('waiter', 'Waiter requested', payload?.message || 'A table needs a waiter'),
    };

    socket.on('connect', join);
    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    socket.connect();
    if (socket.connected) join();

    return () => {
      socket.off('connect', join);
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [restaurantId, notificationSettingsLoading, notificationsEnabled]);

  // Disconnect only when this listener unmounts (logout or leaving staff area).
  useEffect(() => () => getOrdersSocket().disconnect(), []);

  return null;
}
