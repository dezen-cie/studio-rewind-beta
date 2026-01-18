// src/controllers/invoice.controller.js
import {
  generateReservationInvoice,
  generateCommissionStatement,
  generateAllInvoicesZip
} from '../services/invoice.service.js';
import { Reservation, Podcaster } from '../models/index.js';

/**
 * GET /api/invoices/reservation/:id
 * Télécharger la facture d'une réservation (client ou admin)
 */
export async function downloadReservationInvoice(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier que l'utilisateur a accès à cette réservation
    const reservation = await Reservation.findByPk(id);

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation introuvable.' });
    }

    // Seul le propriétaire ou un admin peut télécharger la facture
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    if (reservation.user_id !== userId && !isAdmin) {
      return res.status(403).json({ message: 'Accès non autorisé à cette facture.' });
    }

    // Générer le PDF
    const pdfBuffer = await generateReservationInvoice(id);

    // Nom du fichier
    const date = new Date(reservation.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const shortId = reservation.id.substring(0, 8).toUpperCase();
    const filename = `facture-${year}${month}-${shortId}.pdf`;

    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erreur téléchargement facture:', error);
    return res.status(error.status || 500).json({
      message: error.message || 'Erreur lors de la génération de la facture.'
    });
  }
}

/**
 * GET /api/invoices/commission/:reservationId
 * Télécharger le relevé de commission d'une réservation (podcasteur)
 */
export async function downloadCommissionStatement(req, res) {
  try {
    const { reservationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Trouver le podcasteur associé à cet utilisateur
    const podcaster = await Podcaster.findOne({ where: { user_id: userId } });

    // Pour les admins, on peut aussi télécharger (utile pour vérification)
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!podcaster && !isAdmin) {
      return res.status(403).json({ message: 'Vous n\'êtes pas un podcasteur.' });
    }

    // Si admin, récupérer la réservation pour avoir le podcaster_id
    let podcasterId;
    if (isAdmin) {
      const reservation = await Reservation.findByPk(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: 'Réservation introuvable.' });
      }
      podcasterId = reservation.podcaster_id;
      if (!podcasterId) {
        return res.status(400).json({ message: 'Cette réservation n\'a pas de podcasteur associé.' });
      }
    } else {
      podcasterId = podcaster.id;
    }

    // Générer le PDF
    const pdfBuffer = await generateCommissionStatement(reservationId, podcasterId);

    // Nom du fichier
    const reservation = await Reservation.findByPk(reservationId);
    const date = new Date(reservation.start_date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const shortId = reservation.id.substring(0, 8).toUpperCase();
    const filename = `commission-${year}${month}-${shortId}.pdf`;

    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erreur téléchargement relevé commission:', error);
    return res.status(error.status || 500).json({
      message: error.message || 'Erreur lors de la génération du relevé de commission.'
    });
  }
}

/**
 * GET /api/invoices/download-all
 * Télécharger toutes les factures et commissions en ZIP (admin uniquement)
 */
export async function downloadAllInvoices(req, res) {
  try {
    const userRole = req.user.role;

    // Vérifier que l'utilisateur est admin
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }

    const { start_date, end_date } = req.query;

    // Générer le ZIP
    const zipBuffer = await generateAllInvoicesZip(start_date || null, end_date || null);

    // Nom du fichier
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    let filename = `factures-${year}${month}${day}`;
    if (start_date && end_date) {
      filename = `factures-du-${start_date}-au-${end_date}`;
    } else if (start_date) {
      filename = `factures-depuis-${start_date}`;
    } else if (end_date) {
      filename = `factures-jusquau-${end_date}`;
    }
    filename += '.zip';

    // Envoyer le ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);
  } catch (error) {
    console.error('Erreur téléchargement toutes les factures:', error);
    return res.status(error.status || 500).json({
      message: error.message || 'Erreur lors de la génération des factures.'
    });
  }
}
