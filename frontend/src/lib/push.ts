// Suscripción del dispositivo a Web Push (evz_core.push del backend).
//
// Nota iOS: Safari solo concede el permiso de notificaciones si la app está
// instalada en la pantalla de inicio. En un navegador normal `pushManager`
// existe pero `requestPermission` devuelve 'denied' sin preguntar.

import { apiFetch } from './api';

// El buffer se aloja explícitamente para que el tipo sea Uint8Array<ArrayBuffer>:
// applicationServerKey exige un ArrayBuffer real, no ArrayBufferLike.
const urlBase64ToUint8Array = (base64String: string): Uint8Array<ArrayBuffer> => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

export const pushSupported = (): boolean =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const getPermission = (): NotificationPermission =>
  pushSupported() ? Notification.permission : 'denied';

/** Devuelve la suscripción activa de este dispositivo, o null. */
export const getSubscription = async (): Promise<PushSubscription | null> => {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
};

/**
 * Pide permiso, suscribe el dispositivo y lo registra en el backend.
 * Devuelve true si quedó suscrito.
 */
export const subscribeToPush = async (): Promise<boolean> => {
  if (!pushSupported()) return false;

  const { public_key: publicKey, enabled } = await apiFetch<{ public_key: string; enabled: boolean }>(
    '/business/push/public-key/'
  );
  if (!enabled || !publicKey) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const reg = await navigator.serviceWorker.ready;
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await apiFetch('/business/push/subscribe/', {
    method: 'POST',
    body: subscription.toJSON(),
  });
  return true;
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  const subscription = await getSubscription();
  if (!subscription) return true;

  await apiFetch('/business/push/unsubscribe/', {
    method: 'POST',
    body: { endpoint: subscription.endpoint },
  });
  return subscription.unsubscribe();
};
