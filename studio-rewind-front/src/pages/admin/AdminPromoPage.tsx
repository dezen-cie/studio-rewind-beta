// src/pages/admin/AdminPromoPage.tsx
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Ticket, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';
import {
  getAdminPromoCodes,
  getAdminPromoStats,
  deleteAdminPromoCode,
  type PromoCode,
  type PromoStats
} from '../../api/adminPromo';
import type { AdminLayoutOutletContext } from '../../layouts/AdminLayout';
import './AdminPromoPage.css';

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getStatus(code: PromoCode): { label: string; className: string } {
  if (code.used) {
    return { label: 'Utilise', className: 'promo-status--used' };
  }
  if (new Date(code.expires_at) < new Date()) {
    return { label: 'Expire', className: 'promo-status--expired' };
  }
  return { label: 'Actif', className: 'promo-status--active' };
}

function AdminPromoPage() {
  const { searchQuery } = useOutletContext<AdminLayoutOutletContext>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [codesData, statsData] = await Promise.all([
        getAdminPromoCodes(),
        getAdminPromoStats()
      ]);
      setCodes(codesData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Erreur chargement promo:', err);
      setError('Impossible de charger les codes promo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, code: string) {
    const confirm = window.confirm(`Supprimer le code promo "${code}" ?`);
    if (!confirm) return;

    try {
      setDeleting(id);
      await deleteAdminPromoCode(id);
      setCodes(prev => prev.filter(c => c.id !== id));
      // Mettre a jour les stats
      const statsData = await getAdminPromoStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Erreur suppression promo:', err);
      alert(err?.response?.data?.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(null);
    }
  }

  // Filtrage par recherche
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCodes = !normalizedQuery
    ? codes
    : codes.filter(code => {
        const haystack = [
          code.code,
          code.email,
          formatDate(code.createdAt),
          getStatus(code).label
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Codes Promo</h2>
          <p className="sr-page-subtitle">
            Gestion des codes promotionnels envoyes aux visiteurs
          </p>
        </div>
        {stats && (
          <div className="sr-section-meta">
            <span className="sr-chip">{stats.total} code{stats.total > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        {loading ? (
          <div className="promo-loading">Chargement...</div>
        ) : (
          <>
            {/* Cards statistiques */}
            <div className="promo-summary-cards">
              <div className="promo-card">
                <div className="promo-card-icon">
                  <Ticket size={24} />
                </div>
                <div className="promo-card-content">
                  <span className="promo-card-value">{stats?.total ?? 0}</span>
                  <span className="promo-card-label">Total</span>
                </div>
              </div>
              <div className="promo-card promo-card--active">
                <div className="promo-card-icon">
                  <Clock size={24} />
                </div>
                <div className="promo-card-content">
                  <span className="promo-card-value">{stats?.active ?? 0}</span>
                  <span className="promo-card-label">Actifs</span>
                </div>
              </div>
              <div className="promo-card promo-card--used">
                <div className="promo-card-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="promo-card-content">
                  <span className="promo-card-value">{stats?.used ?? 0}</span>
                  <span className="promo-card-label">Utilises</span>
                </div>
              </div>
              <div className="promo-card promo-card--expired">
                <div className="promo-card-icon">
                  <XCircle size={24} />
                </div>
                <div className="promo-card-content">
                  <span className="promo-card-value">{stats?.expired ?? 0}</span>
                  <span className="promo-card-label">Expires</span>
                </div>
              </div>
            </div>

            {/* Liste des codes */}
            <div className="sr-card">
              <h3 className="promo-table-title">Liste des codes promo</h3>
              {filteredCodes.length === 0 ? (
                <p className="promo-no-data">Aucun code promo.</p>
              ) : (
                <div className="promo-table-container">
                  <table className="promo-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Email</th>
                        <th className="text-center">Reduction</th>
                        <th className="text-center">Statut</th>
                        <th>Cree le</th>
                        <th>Expire le</th>
                        <th>Utilise le</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map((code) => {
                        const status = getStatus(code);
                        return (
                          <tr key={code.id}>
                            <td className="promo-code-cell">{code.code}</td>
                            <td className="promo-email-cell">{code.email}</td>
                            <td className="text-center">{code.discount}%</td>
                            <td className="text-center">
                              <span className={`promo-status ${status.className}`}>
                                {status.label}
                              </span>
                            </td>
                            <td>{formatDate(code.createdAt)}</td>
                            <td>{formatDate(code.expires_at)}</td>
                            <td>{formatDate(code.used_at)}</td>
                            <td className="text-center">
                              <button
                                className="promo-delete-btn"
                                onClick={() => handleDelete(code.id, code.code)}
                                disabled={deleting === code.id}
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPromoPage;
