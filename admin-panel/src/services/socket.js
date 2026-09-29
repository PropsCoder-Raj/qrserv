import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// Only strip to an absolute origin when the API URL is itself absolute;
// otherwise connect relative to the current origin (dev proxy handles it).
const SOCKET_BASE = /^https?:\/\//i.test(API_BASE_URL)
  ? API_BASE_URL.replace(/\/api\/?$/, '')
  : '';

let ordersSocket;

export function getOrdersSocket() {
  if (!ordersSocket) {
    ordersSocket = io(`${SOCKET_BASE}/orders`, {
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return ordersSocket;
}
