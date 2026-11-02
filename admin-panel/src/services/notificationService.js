import api from './api';
import {
  isPushPermissionGranted,
  isPushSupported,
  requestFcmToken,
} from './firebase';

const FCM_TOKEN_KEY = 'fcmToken';

// Only these roles receive alerts on the backend, so only they register a push token.
export const PUSH_ROLES = ['captain', 'kitchen'];
export const isPushRole = (role) => PUSH_ROLES.includes(role);

export const getStoredFcmToken = () => localStorage.getItem(FCM_TOKEN_KEY);

const storeFcmToken = (token) => localStorage.setItem(FCM_TOKEN_KEY, token);

const clearStoredFcmToken = () => localStorage.removeItem(FCM_TOKEN_KEY);

const registerFcmToken = (token) => api.post('/notifications/fcm-token', { token });

const removeFcmToken = (token) =>
  api.delete('/notifications/fcm-token', { data: { token } });

// Called after a successful captain or kitchen PIN login. Asks for permission and saves the token.
export async function registerPushAfterLogin(user) {
  if (!isPushRole(user?.role)) return null;
  return enablePushForStaff();
}

// Called from the toggle, so it may prompt for permission.
export async function enablePushForStaff() {
  const token = await requestFcmToken({ prompt: true });
  if (!token) throw new Error('Unable to create a notification token');
  await registerFcmToken(token);
  storeFcmToken(token);
  return token;
}

// Runs on load: keeps the backend in sync with this browser's current token.
export async function syncPushRegistration() {
  if (!(await isPushSupported()) || !isPushPermissionGranted()) return;
  const token = await requestFcmToken();
  if (!token) return;

  const previous = getStoredFcmToken();
  if (previous && previous !== token) {
    await removeFcmToken(previous).catch(() => {});
  }
  await registerFcmToken(token);
  storeFcmToken(token);
}

// Called on logout so this browser stops receiving alerts for the signed-out user.
export async function unregisterPushForStaff() {
  const token = getStoredFcmToken();
  if (token) {
    await removeFcmToken(token).catch(() => {});
  }
  clearStoredFcmToken();
}
