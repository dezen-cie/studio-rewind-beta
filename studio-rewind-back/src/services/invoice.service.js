// src/services/invoice.service.js
import PDFDocument from 'pdfkit';
import { Reservation, User, Podcaster, Formula } from '../models/index.js';

// Informations de l'entreprise Studio Rewind
const COMPANY_INFO = {
  name: 'Studio Rewind',
  address: '123 Rue du Studio',
  city: '75000 Paris',
  country: 'France',
  email: 'contact@studiorewind.fr',
  siret: '123 456 789 00012',
  tvaIntra: 'FR12345678901'
};

/**
 * Formate une date en français
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formate une date et heure en français
 */
function formatDateTime(date) {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formate un prix en euros
 */
function formatPrice(price) {
  // Formater avec 2 décimales et séparateur français
  const formatted = price.toFixed(2).replace('.', ',');
  // Ajouter les espaces pour les milliers
  const parts = formatted.split(',');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join(',') + ' €';
}

/**
 * Génère un numéro de facture unique
 */
function generateInvoiceNumber(reservation) {
  const date = new Date(reservation.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = reservation.id.substring(0, 8).toUpperCase();
  return `FAC-${year}${month}-${shortId}`;
}

/**
 * Génère un numéro de relevé de commission
 */
function generateCommissionNumber(reservation) {
  const date = new Date(reservation.start_date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = reservation.id.substring(0, 8).toUpperCase();
  return `COM-${year}${month}-${shortId}`;
}

/**
 * Génère une facture PDF pour une réservation
 * @param {string} reservationId - ID de la réservation
 * @returns {Promise<Buffer>} Buffer du PDF
 */
export async function generateReservationInvoice(reservationId) {
  // Récupérer la réservation avec les infos associées
  const reservation = await Reservation.findByPk(reservationId, {
    include: [
      { model: User },
      { model: Podcaster, as: 'podcaster' }
    ]
  });

  if (!reservation) {
    const err = new Error('Réservation introuvable.');
    err.status = 404;
    throw err;
  }

  if (reservation.status !== 'confirmed') {
    const err = new Error('Seules les réservations confirmées peuvent générer une facture.');
    err.status = 400;
    throw err;
  }

  const user = reservation.User;
  const formula = await Formula.findOne({ where: { key: reservation.formula } });
  const formulaName = formula?.name || reservation.formula;

  // Créer le document PDF
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const invoiceNumber = generateInvoiceNumber(reservation);

  // En-tête
  doc.fontSize(24).font('Helvetica-Bold').text('FACTURE', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').text(`N° ${invoiceNumber}`, { align: 'center' });
  doc.moveDown(2);

  // Informations émetteur (gauche)
  doc.fontSize(10).font('Helvetica-Bold').text('Émetteur :', 50);
  doc.font('Helvetica');
  doc.text(COMPANY_INFO.name);
  doc.text(COMPANY_INFO.address);
  doc.text(COMPANY_INFO.city);
  doc.text(`Email : ${COMPANY_INFO.email}`);
  doc.text(`SIRET : ${COMPANY_INFO.siret}`);
  doc.text(`TVA Intra : ${COMPANY_INFO.tvaIntra}`);

  // Informations client (droite)
  const clientX = 350;
  let clientY = 130;
  doc.font('Helvetica-Bold').text('Client :', clientX, clientY);
  clientY += 15;
  doc.font('Helvetica');

  if (user.account_type === 'professionnel' && user.company_name) {
    doc.text(user.company_name, clientX, clientY);
    clientY += 12;
    if (user.vat_number) {
      doc.text(`TVA : ${user.vat_number}`, clientX, clientY);
      clientY += 12;
    }
  }

  const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
  if (fullName) {
    doc.text(fullName, clientX, clientY);
    clientY += 12;
  }
  doc.text(user.email, clientX, clientY);
  clientY += 12;
  if (user.phone) {
    doc.text(`Tél : ${user.phone}`, clientX, clientY);
  }

  // Date de facture
  doc.moveDown(4);
  doc.fontSize(10);
  doc.text(`Date de facture : ${formatDate(new Date())}`, 50);
  doc.text(`Date de paiement : ${formatDate(reservation.updatedAt)}`);
  doc.moveDown(2);

  // Tableau des prestations
  const tableTop = doc.y;
  const tableLeft = 50;
  const colWidths = [250, 80, 80, 80];

  // En-tête du tableau
  doc.font('Helvetica-Bold').fontSize(10);
  doc.rect(tableLeft, tableTop, 490, 20).fill('#f0f0f0');
  doc.fillColor('#000000');
  doc.text('Désignation', tableLeft + 5, tableTop + 5);
  doc.text('Qté', tableLeft + colWidths[0] + 5, tableTop + 5);
  doc.text('Prix unit. HT', tableLeft + colWidths[0] + colWidths[1] + 5, tableTop + 5);
  doc.text('Total HT', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableTop + 5);

  // Ligne de prestation
  let rowY = tableTop + 25;
  doc.font('Helvetica').fontSize(9);

  // Prestation principale
  let description = `${formulaName}`;
  description += `\nDu ${formatDateTime(reservation.start_date)}`;
  description += `\nAu ${formatDateTime(reservation.end_date)}`;
  if (reservation.podcaster) {
    description += `\nPodcasteur : ${reservation.podcaster.name}`;
  }

  const priceHT = reservation.original_price_ht || reservation.price_ht;
  const unitPrice = priceHT / reservation.total_hours;

  doc.text(description, tableLeft + 5, rowY, { width: colWidths[0] - 10 });
  doc.text(`${reservation.total_hours}h`, tableLeft + colWidths[0] + 5, rowY);
  doc.text(formatPrice(unitPrice), tableLeft + colWidths[0] + colWidths[1] + 5, rowY);
  doc.text(formatPrice(priceHT), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, rowY);

  rowY += 60;

  // Si code promo appliqué
  if (reservation.promo_code && reservation.promo_discount) {
    doc.text(`Remise ${reservation.promo_code} (-${reservation.promo_discount}%)`, tableLeft + 5, rowY);
    const discount = (reservation.original_price_ht || reservation.price_ht) - reservation.price_ht;
    doc.text(`-${formatPrice(discount)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, rowY);
    rowY += 20;
  }

  // Ligne de séparation
  doc.moveTo(tableLeft, rowY).lineTo(tableLeft + 490, rowY).stroke();
  rowY += 10;

  // Totaux
  const totalsX = tableLeft + colWidths[0] + colWidths[1];
  doc.font('Helvetica').fontSize(10);
  doc.text('Total HT :', totalsX, rowY);
  doc.text(formatPrice(reservation.price_ht), totalsX + 100, rowY, { align: 'right', width: 80 });
  rowY += 18;

  doc.text('TVA (20%) :', totalsX, rowY);
  doc.text(formatPrice(reservation.price_tva), totalsX + 100, rowY, { align: 'right', width: 80 });
  rowY += 18;

  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('Total TTC :', totalsX, rowY);
  doc.text(formatPrice(reservation.price_ttc), totalsX + 100, rowY, { align: 'right', width: 80 });

  // Pied de page
  doc.fontSize(8).font('Helvetica');
  doc.text(
    'Facture acquittée - Paiement effectué par carte bancaire via Stripe',
    50,
    750,
    { align: 'center', width: 495 }
  );
  doc.text(
    `${COMPANY_INFO.name} - ${COMPANY_INFO.address}, ${COMPANY_INFO.city} - SIRET : ${COMPANY_INFO.siret}`,
    50,
    765,
    { align: 'center', width: 495 }
  );

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

/**
 * Génère un relevé de commission PDF pour un podcasteur
 * @param {string} reservationId - ID de la réservation
 * @param {string} podcasterId - ID du podcasteur
 * @returns {Promise<Buffer>} Buffer du PDF
 */
export async function generateCommissionStatement(reservationId, podcasterId) {
  // Récupérer la réservation
  const reservation = await Reservation.findByPk(reservationId, {
    include: [
      { model: User },
      { model: Podcaster, as: 'podcaster' }
    ]
  });

  if (!reservation) {
    const err = new Error('Réservation introuvable.');
    err.status = 404;
    throw err;
  }

  if (reservation.podcaster_id !== podcasterId) {
    const err = new Error('Cette réservation ne vous est pas attribuée.');
    err.status = 403;
    throw err;
  }

  if (reservation.status !== 'confirmed') {
    const err = new Error('Seules les réservations confirmées génèrent une commission.');
    err.status = 400;
    throw err;
  }

  const podcaster = reservation.podcaster;
  const formula = await Formula.findOne({ where: { key: reservation.formula } });
  const formulaName = formula?.name || reservation.formula;

  // Calcul de la commission (20% du HT)
  const commissionRate = 0.20;
  const commissionAmount = reservation.price_ht * commissionRate;

  // Créer le document PDF
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const statementNumber = generateCommissionNumber(reservation);

  // En-tête
  doc.fontSize(24).font('Helvetica-Bold').text('RELEVÉ DE COMMISSION', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').text(`N° ${statementNumber}`, { align: 'center' });
  doc.moveDown(2);

  // Informations Studio Rewind (gauche)
  doc.fontSize(10).font('Helvetica-Bold').text('Émetteur :', 50);
  doc.font('Helvetica');
  doc.text(COMPANY_INFO.name);
  doc.text(COMPANY_INFO.address);
  doc.text(COMPANY_INFO.city);
  doc.text(`Email : ${COMPANY_INFO.email}`);

  // Informations podcasteur (droite)
  const podX = 350;
  let podY = 130;
  doc.font('Helvetica-Bold').text('Bénéficiaire :', podX, podY);
  podY += 15;
  doc.font('Helvetica');
  doc.text(podcaster.name, podX, podY);

  // Date
  doc.moveDown(4);
  doc.fontSize(10);
  doc.text(`Date d'émission : ${formatDate(new Date())}`, 50);
  doc.text(`Période : ${formatDate(reservation.start_date)}`);
  doc.moveDown(2);

  // Détails de la réservation
  doc.font('Helvetica-Bold').fontSize(12).text('Détails de la prestation', 50);
  doc.moveDown(0.5);

  const detailsTop = doc.y;
  doc.font('Helvetica').fontSize(10);

  doc.rect(50, detailsTop, 495, 80).stroke();
  doc.text(`Formule : ${formulaName}`, 60, detailsTop + 10);
  doc.text(`Date : ${formatDateTime(reservation.start_date)} - ${formatDateTime(reservation.end_date)}`, 60, detailsTop + 25);
  doc.text(`Durée : ${reservation.total_hours} heure(s)`, 60, detailsTop + 40);
  doc.text(`Client : ${reservation.User.firstname || ''} ${reservation.User.lastname || reservation.User.email}`, 60, detailsTop + 55);

  doc.moveDown(5);

  // Tableau récapitulatif
  const tableTop = doc.y;
  const tableLeft = 50;

  // En-tête du tableau
  doc.font('Helvetica-Bold').fontSize(10);
  doc.rect(tableLeft, tableTop, 495, 25).fill('#f0f0f0');
  doc.fillColor('#000000');
  doc.text('Désignation', tableLeft + 10, tableTop + 7);
  doc.text('Montant', tableLeft + 400, tableTop + 7);

  let rowY = tableTop + 30;
  doc.font('Helvetica').fontSize(10);

  // Chiffre d'affaires HT
  doc.text('Chiffre d\'affaires HT de la prestation', tableLeft + 10, rowY);
  doc.text(formatPrice(reservation.price_ht), tableLeft + 400, rowY);
  rowY += 25;

  // Taux de commission
  doc.text(`Taux de commission`, tableLeft + 10, rowY);
  doc.text(`${commissionRate * 100}%`, tableLeft + 400, rowY);
  rowY += 25;

  // Ligne de séparation
  doc.moveTo(tableLeft, rowY).lineTo(tableLeft + 495, rowY).stroke();
  rowY += 15;

  // Commission à percevoir
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('Commission à percevoir :', tableLeft + 10, rowY);
  doc.text(formatPrice(commissionAmount), tableLeft + 380, rowY);

  // Note explicative
  doc.moveDown(4);
  doc.font('Helvetica').fontSize(9);
  doc.text(
    'Ce relevé atteste de la commission due au titre de la prestation effectuée. Le règlement sera effectué selon les modalités convenues.',
    50,
    doc.y,
    { width: 495, align: 'justify' }
  );

  // Pied de page
  doc.fontSize(8);
  doc.text(
    `${COMPANY_INFO.name} - ${COMPANY_INFO.address}, ${COMPANY_INFO.city}`,
    50,
    765,
    { align: 'center', width: 495 }
  );

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}
