// src/api/adminNotifications.ts
import api from './client';

export interface NotificationCounts {
  unread_messages: number;
  new_reservations: number;
}

/**
 * Récupère les compteurs de notifications pour l'admin
 */
export async function getAdminNotificationCounts(): Promise<NotificationCounts> {
  const res = await api.get<NotificationCounts>('/admin/notifications/counts');
  return res.data;
}
