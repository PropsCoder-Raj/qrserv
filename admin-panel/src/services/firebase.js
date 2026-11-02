import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getMessaging, getToken, isSupported as isMessagingSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyAogYtpkOeuKgxLKXxFdETv-UjSgNIARlw',
  authDomain: 'qrserv-6b222.firebaseapp.com',
  projectId: 'qrserv-6b222',
  storageBucket: 'qrserv-6b222.firebasestorage.app',
  messagingSenderId: '1019878177598',
  appId: '1:1019878177598:web:85c6cf242e545dcdae4a6f',
  measurementId: 'G-K36G25MJKX',
};

// Public web-push certificate key from the Firebase console (Cloud Messaging > Web Push certificates).
const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BBJqJSgOGs_NgmPuWFP7QGsZw_vEbZutzpkXSr4gpJqJDMm5ydLHXVgjSKwjrtNYzgbrRiHPbVq7VOCCoM2B-Ew';

export const firebaseApp = initializeApp(firebaseConfig);

isAnalyticsSupported().then((supported) => {
  if (supported) getAnalytics(firebaseApp);
});

export async function isPushSupported() {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    (await isMessagingSupported())
  );
}

export function isPushPermissionGranted() {
  return 'Notification' in window && Notification.permission === 'granted';
}

// Asks for notification permission when `prompt` is true; otherwise only fetches
// a token if permission was already granted. Returns null when no token is available.
export async function requestFcmToken({ prompt = false } = {}) {
  if (!(await isPushSupported())) {
    throw new Error('Push notifications are not supported in this browser');
  }

  if (Notification.permission === 'default' && prompt) {
    await Notification.requestPermission();
  }
  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  return getToken(getMessaging(firebaseApp), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}
