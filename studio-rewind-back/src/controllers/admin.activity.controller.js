// src/controllers/admin.activity.controller.js
import {
  getClientsActivity,
  getPodcastersActivity,
  getActivitySummary
} from '../services/activity.service.js';

/**
 * GET /api/admin/activity/clients
 * Recupere l'activite des clients
 */
export async function getClients(req, res) {
  try {
    const { start_date, end_date } = req.query;

    const data = await getClientsActivity({
      startDate: start_date || null,
      endDate: end_date || null
    });

    return res.json(data);
  } catch (error) {
    console.error('Erreur getClients activity:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

/**
 * GET /api/admin/activity/podcasters
 * Recupere l'activite des podcasteurs
 */
export async function getPodcasters(req, res) {
  try {
    const { start_date, end_date } = req.query;

    const data = await getPodcastersActivity({
      startDate: start_date || null,
      endDate: end_date || null
    });

    return res.json(data);
  } catch (error) {
    console.error('Erreur getPodcasters activity:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

/**
 * GET /api/admin/activity/summary
 * Recupere le resume global de l'activite
 */
export async function getSummary(req, res) {
  try {
    const { start_date, end_date } = req.query;

    const data = await getActivitySummary({
      startDate: start_date || null,
      endDate: end_date || null
    });

    return res.json(data);
  } catch (error) {
    console.error('Erreur getSummary activity:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

/**
 * GET /api/admin/activity/export/clients
 * Export CSV des clients
 */
export async function exportClients(req, res) {
  try {
    const { start_date, end_date } = req.query;

    const data = await getClientsActivity({
      startDate: start_date || null,
      endDate: end_date || null
    });

    // Generer le CSV
    const headers = [
      'Client',
      'Email',
      'Type',
      'N° TVA',
      'Telephone',
      'Nb Reservations',
      'Heures',
      'CA HT',
      'TVA',
      'CA TTC',
      'Reductions',
      'Promos',
      '1ere Resa',
      'Derniere Resa'
    ];

    const rows = data.clients.map(c => [
      c.name,
      c.email,
      c.account_type || '',
      c.vat_number || '',
      c.phone || '',
      c.total_reservations,
      c.total_hours,
      c.total_ht.toFixed(2),
      c.total_tva.toFixed(2),
      c.total_ttc.toFixed(2),
      c.total_discount.toFixed(2),
      c.promos_used,
      c.first_reservation ? new Date(c.first_reservation).toLocaleDateString('fr-FR') : '',
      c.last_reservation ? new Date(c.last_reservation).toLocaleDateString('fr-FR') : ''
    ]);

    // Ajouter ligne totaux
    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      data.totals.total_reservations,
      data.totals.total_hours,
      data.totals.total_ht.toFixed(2),
      data.totals.total_tva.toFixed(2),
      data.totals.total_ttc.toFixed(2),
      data.totals.total_discount.toFixed(2),
      data.totals.total_promos,
      '',
      ''
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Ajouter BOM pour Excel
    const csvWithBom = '\ufeff' + csv;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=clients_${Date.now()}.csv`);
    return res.send(csvWithBom);
  } catch (error) {
    console.error('Erreur exportClients:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

/**
 * GET /api/admin/activity/export/podcasters
 * Export CSV des podcasteurs
 */
export async function exportPodcasters(req, res) {
  try {
    const { start_date, end_date } = req.query;

    const data = await getPodcastersActivity({
      startDate: start_date || null,
      endDate: end_date || null
    });

    // Generer le CSV
    const headers = [
      'Podcasteur',
      'Nb Sessions',
      'Heures',
      'CA HT genere',
      'Taux Commission',
      'Commission HT',
      'Commission TVA',
      'Commission TTC',
      '1ere Session',
      'Derniere Session'
    ];

    const rows = data.podcasters.map(p => [
      p.name,
      p.total_sessions,
      p.total_hours,
      p.total_revenue_ht.toFixed(2),
      `${p.commission_rate}%`,
      p.commission_ht.toFixed(2),
      p.commission_tva.toFixed(2),
      p.commission_ttc.toFixed(2),
      p.first_session ? new Date(p.first_session).toLocaleDateString('fr-FR') : '',
      p.last_session ? new Date(p.last_session).toLocaleDateString('fr-FR') : ''
    ]);

    // Ajouter ligne totaux
    rows.push([
      'TOTAL',
      data.totals.total_sessions,
      data.totals.total_hours,
      data.totals.total_revenue_ht.toFixed(2),
      '',
      data.totals.total_commission_ht.toFixed(2),
      data.totals.total_commission_tva.toFixed(2),
      data.totals.total_commission_ttc.toFixed(2),
      '',
      ''
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Ajouter BOM pour Excel
    const csvWithBom = '\ufeff' + csv;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=podcasters_${Date.now()}.csv`);
    return res.send(csvWithBom);
  } catch (error) {
    console.error('Erreur exportPodcasters:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}
