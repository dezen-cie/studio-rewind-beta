// src/controllers/admin.notification.controller.js
import { getAdminNotificationCounts } from '../services/notification.service.js';

/**
 * GET /admin/notifications/counts
 * Récupère les compteurs de notifications pour l'admin
 */
export async function getNotificationCountsController(req, res, next) {
  try {
    const counts = await getAdminNotificationCounts();
    res.json(counts);
  } catch (error) {
    next(error);
  }
}
