// src/api/invoices.ts
import api from './client';

/**
 * Télécharge la facture PDF d'une réservation
 */
export async function downloadInvoice(reservationId: string): Promise<void> {
  const response = await api.get(`/invoices/reservation/${reservationId}`, {
    responseType: 'blob'
  });

  // Créer un lien de téléchargement
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Extraire le nom du fichier depuis les headers ou générer un nom par défaut
  const contentDisposition = response.headers['content-disposition'];
  let filename = `facture-${reservationId.substring(0, 8)}.pdf`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) {
      filename = match[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Télécharge le relevé de commission PDF d'une réservation (pour podcasteur)
 */
export async function downloadCommissionStatement(reservationId: string): Promise<void> {
  const response = await api.get(`/invoices/commission/${reservationId}`, {
    responseType: 'blob'
  });

  // Créer un lien de téléchargement
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Extraire le nom du fichier depuis les headers ou générer un nom par défaut
  const contentDisposition = response.headers['content-disposition'];
  let filename = `commission-${reservationId.substring(0, 8)}.pdf`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) {
      filename = match[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
