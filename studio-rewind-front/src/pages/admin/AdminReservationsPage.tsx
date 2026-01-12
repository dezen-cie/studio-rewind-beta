// src/pages/admin/AdminReservationsPage.tsx
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  type AdminReservation,
  getAdminReservations,
  getAdminReservationsByDay,
  updateAdminReservation,
  cancelAdminReservation,
} from '../../api/adminReservations';
import type { AdminLayoutOutletContext } from '../../layouts/AdminLayout';
import AdminPagination from '../../components/admin/Pagination';

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

function formatDateInputValue(dateStr: string | null) {
  if (!dateStr) return '';
  return dateStr;
}

function toDateTimeLocalValue(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const PAGE_SIZE = 5;

function AdminReservationsPage() {
  const { searchQuery } = useOutletContext<AdminLayoutOutletContext>();

  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);

  async function loadAll() {
    try {
      setError(null);
      setLoading(true);
      const data = await getAdminReservations();
      setReservations(data);
    } catch (err: any) {
      console.error('Erreur getAdminReservations:', err);
      setError(
        err?.response?.data?.message || "Impossible de charger les réservations."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadByDay(date: string) {
    try {
      setError(null);
      setLoading(true);
      const data = await getAdminReservationsByDay(date);
      setReservations(data);
    } catch (err: any) {
      console.error('Erreur getAdminReservationsByDay:', err);
      setError(
        err?.response?.data?.message ||
          'Impossible de charger les réservations pour ce jour.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function handleDateChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (!value) {
      setSelectedDate(null);
      setCurrentPage(1);
      loadAll();
    } else {
      setSelectedDate(value);
      setCurrentPage(1);
      loadByDay(value);
    }
  }

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
      case 'autonome':
        return 'Formule autonome';
      case 'amelioree':
        return 'Formule améliorée';
      case 'abonnement':
        return "Pack d'heures";
      case 'reseaux':
        return 'Formule réseaux';
      default:
        return formula;
    }
  }

  function handleEditClick(r: AdminReservation) {
    setEditingId(r.id);
    setEditStart(toDateTimeLocalValue(r.start_date));
    setEditEnd(toDateTimeLocalValue(r.end_date));
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditStart('');
    setEditEnd('');
  }

  async function handleSaveEdit(reservationId: string) {
    if (!editStart || !editEnd) {
      alert('Les dates de début et de fin sont obligatoires.');
      return;
    }

    try {
      setActionLoadingId(reservationId);
      setError(null);

      const startIso = new Date(editStart).toISOString();
      const endIso = new Date(editEnd).toISOString();

      const updated = await updateAdminReservation(reservationId, {
        start_date: startIso,
        end_date: endIso,
      });

      setReservations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );

      setEditingId(null);
      setEditStart('');
      setEditEnd('');
    } catch (err: any) {
      console.error('Erreur updateAdminReservation:', err);
      const message =
        err?.response?.data?.message || 'Impossible de modifier la réservation.';
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCancelReservation(reservationId: string) {
    const confirm = window.confirm(
      'Es-tu sûr de vouloir annuler cette réservation ?'
    );
    if (!confirm) return;

    try {
      setActionLoadingId(reservationId);
      setError(null);

      const updated = await cancelAdminReservation(reservationId);

      setReservations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch (err: any) {
      console.error('Erreur cancelAdminReservation:', err);
      const message =
        err?.response?.data?.message || "Impossible d'annuler la réservation.";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  function getStatusLabel(status: AdminReservation['status']) {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'cancelled':
        return 'Annulée';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // 1) Filtre texte
  const filteredReservations = !normalizedQuery
    ? reservations
    : reservations.filter((r) => {
        const clientName = getClientName(r);
        const statusLabel = getStatusLabel(r.status);
        const formulaLabel = getFormulaLabel(r.formula);
        const dates = `${formatDateTime(r.start_date)} ${formatDateTime(
          r.end_date
        )}`;

        const haystack = [
          clientName,
          r.User?.email,
          formulaLabel,
          statusLabel,
          dates,
          r.price_ttc.toFixed(2),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      });

  // 2) Filtre "futur" (page Réservations = uniquement les créneaux à venir)
  const now = new Date();
  const futureReservations = filteredReservations.filter((r) => {
    const end = new Date(r.end_date);
    if (Number.isNaN(end.getTime())) return false;
    return end > now;
  });

  const totalReservations = futureReservations.length;

  // 3) Pagination
  const pageCount = Math.max(1, Math.ceil(totalReservations / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, pageCount);

  useEffect(() => {
    // Quand on change la recherche ou la date, on revient page 1
    setCurrentPage(1);
  }, [normalizedQuery, selectedDate]);

  const paginatedReservations = futureReservations.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE + 0
  );

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Réservations</h2>
          <p className="sr-page-subtitle">
            Consulte et gère toutes les réservations clients à venir.
          </p>
        </div>
        <div className="sr-section-meta">
          {totalReservations > 0 && (
            <span className="sr-chip">
              {totalReservations} réservation
              {totalReservations > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        <div className="sr-card">
          <div className="sr-section-header" style={{ marginBottom: '0.6rem' }}>
            <div>
              <h3 className="sr-section-title">Filtre par jour</h3>
              <p className="sr-section-subtitle">
                Affiche uniquement les réservations d’une date précise ou
                l’ensemble (à venir).
              </p>
            </div>
            <div className="sr-section-meta">
              <div className="field" style={{ marginBottom: 0 }}>
                <div className="control">
                  <input
                    className="input"
                    type="date"
                    value={formatDateInputValue(selectedDate)}
                    onChange={handleDateChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {loading && <p>Chargement des réservations...</p>}

          {!loading && !error && totalReservations === 0 && (
            <p>Aucune réservation à venir ne correspond à ta recherche.</p>
          )}

          {!loading && !error && totalReservations > 0 && (
            <>
              <div className="sr-admin-reservations-list">
                {paginatedReservations.map((r) => {
                  const isEditing = editingId === r.id;
                  const isBusy = actionLoadingId === r.id;

                  return (
                    <div
                      key={r.id}
                      className="sr-card"
                      style={{ marginBottom: '0.8rem' }}
                    >
                      <div className="columns is-vcentered">
                        <div className="column is-4">
                          <h3 className="has-text-weight-semibold has-text-white">
                            {getClientName(r)}
                          </h3>
                          <p className="is-size-7">
                            Email : {r.User?.email || 'N/A'}
                          </p>
                          <p className="is-size-7">
                            Formule : {getFormulaLabel(r.formula)}
                          </p>
                        </div>

                        <div className="column is-4">
                          {isEditing ? (
                            <>
                              <div className="field">
                                <label className="label has-text-white is-size-7">
                                  Début
                                </label>
                                <div className="control">
                                  <input
                                    className="input"
                                    type="datetime-local"
                                    value={editStart}
                                    onChange={(e) =>
                                      setEditStart(e.target.value)
                                    }
                                  />
                                </div>
                              </div>
                              <div className="field">
                                <label className="label has-text-white is-size-7">
                                  Fin
                                </label>
                                <div className="control">
                                  <input
                                    className="input"
                                    type="datetime-local"
                                    value={editEnd}
                                    onChange={(e) =>
                                      setEditEnd(e.target.value)
                                    }
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <p>
                                <strong>Début :</strong>{' '}
                                {formatDateTime(r.start_date)}
                              </p>
                              <p>
                                <strong>Fin :</strong>{' '}
                                {formatDateTime(r.end_date)}
                              </p>
                              <p>
                                <strong>Durée :</strong> {r.total_hours} h
                              </p>
                            </>
                          )}
                        </div>

                        <div className="column is-2">
                          <p>
                            <strong>Total TTC :</strong>{' '}
                            {r.price_ttc.toFixed(2)} €
                          </p>
                          <p>
                            <strong>HT :</strong> {r.price_ht.toFixed(2)} €
                          </p>
                          <p>
                            <strong>TVA :</strong> {r.price_tva.toFixed(2)} €
                          </p>
                        </div>

                        <div className="column is-2">
                          <p style={{ marginBottom: '0.5rem' }}>
                            <strong style={{ marginRight: '0.5rem' }}>
                              Statut :
                            </strong>{' '}
                            <span
                              style={{ padding: '0.25rem 0.6rem' }}
                              className={
                                r.status === 'confirmed'
                                  ? 'tag is-success'
                                  : r.status === 'cancelled'
                                  ? 'tag is-danger'
                                  : 'tag is-warning'
                              }
                            >
                              {getStatusLabel(r.status)}
                            </span>
                          </p>

                          <div className="buttons are-small">
                            {isEditing ? (
                              <>
                                <button
                                  className="button is-primary"
                                  onClick={() => handleSaveEdit(r.id)}
                                  disabled={isBusy}
                                >
                                  {isBusy ? 'Sauvegarde...' : 'Enregistrer'}
                                </button>
                                <button
                                  className="button"
                                  onClick={handleCancelEdit}
                                  disabled={isBusy}
                                >
                                  Annuler
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="button is-info"
                                  onClick={() => handleEditClick(r)}
                                  disabled={
                                    isBusy || r.status === 'cancelled'
                                  }
                                >
                                  Modifier
                                </button>
                                <button
                                  className="button is-danger"
                                  onClick={() =>
                                    handleCancelReservation(r.id)
                                  }
                                  disabled={
                                    isBusy || r.status === 'cancelled'
                                  }
                                >
                                  {isBusy ? 'Annulation...' : 'Annuler'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <AdminPagination
                totalItems={totalReservations}
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

export default AdminReservationsPage;
