import { apiFetch } from './api';

export interface AppNotification {
  id: number;
  notif_type: string;
  title: string;
  body: string;
  link: string;
  data: Record<string, any>;
  object_type: string | null;
  object_id: string | null;
  is_read: boolean;
  created_at: string;
}

/** Por defecto trae solo las no leídas (badge del bell); all=true suma el historial. */
export function listNotifications(all = false): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>(`/business/notifications/${all ? '?all=true' : ''}`);
}

export function markNotificationRead(id: number): Promise<AppNotification> {
  return apiFetch<AppNotification>(`/business/notifications/${id}/mark-read/`, { method: 'POST' });
}
