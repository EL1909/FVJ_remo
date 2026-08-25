import { useCallback, useEffect, useState } from 'react';
import { AppNotification, listNotifications, markNotificationRead } from '../lib/notifications';

const POLL_MS = 45_000;

/**
 * Notificaciones no leídas del usuario logueado, con polling periódico.
 *
 * Se refresca al montar, cada POLL_MS, y cuando la pestaña vuelve a primer
 * plano (clave si llegó algo mientras estaba en background).
 */
export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refresh = useCallback(() => {
    if (!enabled) {
      setNotifications([]);
      return;
    }
    listNotifications(false)
      .then(setNotifications)
      .catch(() => {
        /* silencioso: el badge no debe romper el resto del navbar */
      });
  }, [enabled]);

  useEffect(() => {
    refresh();
    if (!enabled) return;

    const interval = window.setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, [enabled, refresh]);

  const markRead = useCallback((id: number) => {
    setNotifications((list) => list.filter((n) => n.id !== id));
    markNotificationRead(id).catch(refresh);
  }, [refresh]);

  return { notifications, refresh, markRead };
}
