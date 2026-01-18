// src/pages/admin/AdminInvoicesPage.tsx
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  type AdminReservation,
  getAdminReservations,
} from '../../api/adminReservations';
import { downloadInvoice, downloadCommissionStatement, downloadAllInvoices } from '../../api/invoices';
import type { AdminLayoutOutletContext } from '../../layouts/AdminLayout';
import AdminPagination from '../../components/admin/Pagination';
import './AdminInvoicesPage.css';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAGE_SIZE = 10;

function AdminInvoicesPage() {
  const { searchQuery } = useOutletContext<AdminLayoutOutletContext>();

  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filtres par période
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  async function loadReservations() {
    try {
      setError(null);
      setLoading(true);
      const data = await getAdminReservations();
      // Ne garder que les réservations confirmées (qui ont une facture)
      const confirmed = data.filter((r) => r.status === 'confirmed');
      setReservations(confirmed);
    } catch (err: any) {
      console.error('Erreur getAdminReservations:', err);
      setError(
        err?.response?.data?.message || 'Impossible de charger les factures.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  function getClientName(r: AdminReservation) {
    if (r.User) {
      if (r.User.company_name) {
        return r.User.company_name;
      }
      if (r.User.firstname || r.User.lastname) {
        return `${r.User.firstname || ''} ${r.User.lastname || ''}`.trim();
      }
      return r.User.email;
    }
    return 'Client inconnu';
  }

  function getFormulaLabel(formula: string) {
    switch (formula) {
      case 'solo':
        return 'Formule Solo';
      case 'duo':
        return 'Formule Duo';
      case 'pro':
        return 'Formule Pro';
      default:
        return formula;
    }
  }

  async function handleDownloadClientInvoice(reservationId: string) {
    try {
      setDownloadingId(reservationId + '-client');
      setError(null);
      await downloadInvoice(reservationId);
    } catch (err: any) {
      console.error('Erreur téléchargement facture:', err);
      setError(err?.response?.data?.message || 'Impossible de télécharger la facture.');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDownloadCommission(reservationId: string) {
    try {
      setDownloadingId(reservationId + '-commission');
      setError(null);
      await downloadCommissionStatement(reservationId);
    } catch (err: any) {
      console.error('Erreur téléchargement relevé commission:', err);
      setError(err?.response?.data?.message || 'Impossible de télécharger le relevé de commission.');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDownloadAll() {
    try {
      setDownloadingAll(true);
      setError(null);
      await downloadAllInvoices(startDate || undefined, endDate || undefined);
    } catch (err: any) {
      console.error('Erreur téléchargement toutes les factures:', err);
      setError(err?.response?.data?.message || 'Impossible de télécharger les factures.');
    } finally {
      setDownloadingAll(false);
    }
  }

  function handleResetFilters() {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Filtrer par recherche
  const searchFiltered = !normalizedQuery
    ? reservations
    : reservations.filter((r) => {
        const clientName = getClientName(r);
        const formulaLabel = getFormulaLabel(r.formula);
        const podcasterName = r.podcaster?.name || '';
        const date = formatDate(r.start_date);

        const haystack = [
          clientName,
          r.User?.email,
          formulaLabel,
          podcasterName,
          date,
          r.price_ttc.toFixed(2),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      });

  // Filtrer par période
  const periodFiltered = searchFiltered.filter((r) => {
    const reservationDate = new Date(r.start_date);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (reservationDate < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (reservationDate > end) return false;
    }

    return true;
  });

  // Trier par date décroissante
  const sortedReservations = [...periodFiltered].sort((a, b) => {
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  const totalItems = sortedReservations.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, pageCount);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery, startDate, endDate]);

  const paginatedReservations = sortedReservations.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  // Calculer les totaux
  const totalTTC = sortedReservations.reduce((acc, r) => acc + r.price_ttc, 0);
  const totalWithPodcaster = sortedReservations.filter(r => r.podcaster_id).length;

  return (
    <div className="sr-page admin-invoices-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Factures</h2>
          <p className="sr-page-subtitle">
            Téléchargez les factures clients et les relevés de commission podcasteurs.
          </p>
        </div>
        <div className="sr-section-meta">
          {totalItems > 0 && (
            <span className="sr-chip">
              {totalItems} facture{totalItems > 1 ? 's' : ''} - {totalTTC.toFixed(2)} € TTC
            </span>
          )}
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        <div className="sr-card">
          <div className="invoices-filters">
            <div className="invoices-filter-group">
              <label>Du :</label>
              <input
                type="date"
                className="invoices-date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="invoices-filter-group">
              <label>Au :</label>
              <input
                type="date"
                className="invoices-date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate) && (
              <button
                className="invoices-reset-btn"
                onClick={handleResetFilters}
              >
                Réinitialiser
              </button>
            )}
            <div className="invoices-filter-spacer" />
            <button
              className="invoices-download-all-btn"
              onClick={handleDownloadAll}
              disabled={downloadingAll || totalItems === 0}
            >
              {downloadingAll ? 'Téléchargement...' : `📥 Télécharger tout (${totalItems})`}
            </button>
          </div>

          {loading && <p className="invoices-loading">Chargement des factures...</p>}

          {!loading && !error && totalItems === 0 && (
            <p className="invoices-empty">Aucune facture ne correspond à ta recherche.</p>
          )}

          {!loading && !error && totalItems > 0 && (
            <>
              <div className="invoices-table-container">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client</th>
                      <th>Formule</th>
                      <th>Podcasteur</th>
                      <th>Montant TTC</th>
                      <th>Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReservations.map((r) => (
                      <tr key={r.id}>
                        <td className="invoices-date">
                          {formatDateTime(r.start_date)}
                        </td>
                        <td className="invoices-client">
                          <div className="invoices-client-name">{getClientName(r)}</div>
                          <div className="invoices-client-email">{r.User?.email}</div>
                        </td>
                        <td className="invoices-formula">
                          {getFormulaLabel(r.formula)}
                        </td>
                        <td className="invoices-podcaster">
                          {r.podcaster?.name || '-'}
                        </td>
                        <td className="invoices-amount">
                          {r.price_ttc.toFixed(2)} €
                        </td>
                        <td className="invoices-actions">
                          <button
                            className="invoices-btn invoices-btn-client"
                            onClick={() => handleDownloadClientInvoice(r.id)}
                            disabled={downloadingId === r.id + '-client'}
                            title="Télécharger la facture client"
                          >
                            {downloadingId === r.id + '-client' ? '...' : '📄 Facture'}
                          </button>
                          {r.podcaster_id && r.podcaster?.is_billable && (
                            <button
                              className="invoices-btn invoices-btn-commission"
                              onClick={() => handleDownloadCommission(r.id)}
                              disabled={downloadingId === r.id + '-commission'}
                              title="Télécharger le relevé de commission podcasteur"
                            >
                              {downloadingId === r.id + '-commission' ? '...' : '💵 Commission'}
                            </button>
                          )}
                          {r.podcaster_id && !r.podcaster?.is_billable && (
                            <span className="invoices-no-commission" title="Employe interne - pas de commission">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <AdminPagination
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                currentPage={safeCurrentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminInvoicesPage;
