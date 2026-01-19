// src/services/notification.service.js
import { Message, Reservation } from '../models/index.js';

/**
 * Récupère les compteurs de notifications pour l'admin
 * @returns {Promise<{unread_messages: number, new_reservations: number}>}
 */
export async function getAdminNotificationCounts() {
  // Compter les messages non lus (status = 'new')
  const unreadMessages = await Message.count({
    where: { status: 'new' }
  });

  // Compter les nouvelles réservations confirmées non vues par l'admin
  const newReservations = await Reservation.count({
    where: {
      status: 'confirmed',
      admin_viewed: false
    }
  });

  return {
    unread_messages: unreadMessages,
    new_reservations: newReservations
  };
}

/**
 * Marque les réservations confirmées comme vues par l'admin
 * @returns {Promise<number>} Nombre de réservations mises à jour
 */
export async function markReservationsAsViewed() {
  const [affectedRows] = await Reservation.update(
    { admin_viewed: true },
    {
      where: {
        status: 'confirmed',
        admin_viewed: false
      }
    }
  );
  return affectedRows;
}
