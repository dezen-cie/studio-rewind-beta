import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  type AdminUser,
  getAdminUsers,
  activateAdminUser,
  deactivateAdminUser,
  deleteAdminUser
} from '../../api/adminUsers';
import PasswordCard from '../../components/PasswordCard';
import type { AdminLayoutOutletContext } from '../../layouts/AdminLayout';

function AdminUsersPage() {
  const { searchQuery } = useOutletContext<AdminLayoutOutletContext>();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const data = await getAdminUsers();
        setUsers(data);
      } catch (err: any) {
        console.error('Erreur getAdminUsers:', err);
        const message =
          err?.response?.data?.message ||
          "Impossible de charger la liste des utilisateurs.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function getDisplayName(u: AdminUser) {
    if (u.account_type === 'professionnel' && u.company_name) {
      return u.company_name;
    }
    if (u.firstname || u.lastname) {
      return `${u.firstname || ''} ${u.lastname || ''}`.trim();
    }
    return u.email;
  }

  function getRoleLabel(role: AdminUser['role']) {
    switch (role) {
      case 'client':
        return 'Client';
      case 'admin':
        return 'Admin';
      case 'super_admin':
        return 'Super admin';
      case 'podcaster':
        return 'Podcasteur';
      default:
        return role;
    }
  }

  async function handleActivate(u: AdminUser) {
    try {
      setActionLoadingId(u.id);
      setError(null);
      const updated = await activateAdminUser(u.id);
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err: any) {
      console.error('Erreur activateAdminUser:', err);
      const message =
        err?.response?.data?.message || "Impossible d'activer cet utilisateur.";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeactivate(u: AdminUser) {
    try {
      setActionLoadingId(u.id);
      setError(null);
      const updated = await deactivateAdminUser(u.id);
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err: any) {
      console.error('Erreur deactivateAdminUser:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de désactiver cet utilisateur.";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(u: AdminUser) {
    const confirm = window.confirm(
      `Supprimer définitivement le compte de "${getDisplayName(
        u
      )}" ? Cette action est irréversible.`
    );
    if (!confirm) return;

    try {
      setActionLoadingId(u.id);
      setError(null);
      await deleteAdminUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err: any) {
      console.error('Erreur deleteAdminUser:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de supprimer définitivement cet utilisateur.";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  function isBusy(u: AdminUser) {
    return actionLoadingId === u.id;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredUsers = !normalizedQuery
    ? users
    : users.filter((u) => {
        const displayName = getDisplayName(u);
        const roleLabel = getRoleLabel(u.role);
        const typeLabel =
          u.account_type === 'professionnel' ? 'Professionnel' : 'Particulier';

        const haystack = [
          displayName,
          u.email,
          typeLabel,
          roleLabel,
          u.phone,
          u.is_active ? 'actif' : 'inactif',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      });

  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter((u) => u.is_active).length;

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Utilisateurs</h2>
          <p className="sr-page-subtitle">
            Active, désactive ou supprime les comptes utilisateurs.
          </p>
        </div>
        <div className="sr-section-meta">
          {totalUsers > 0 && (
            <>
              <span className="sr-chip">
                {totalUsers} compte{totalUsers > 1 ? 's' : ''}
              </span>
              <span className="sr-chip">
                {activeUsers} actif{activeUsers > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        <div className="sr-card">
          {loading && <p>Chargement des utilisateurs...</p>}

          {!loading && !error && totalUsers === 0 && (
            <p>Aucun utilisateur ne correspond à ta recherche.</p>
          )}

          {!loading && !error && totalUsers > 0 && (
            <table className="table is-fullwidth is-striped is-hoverable">
              <thead>
                <tr>
                  <th>Nom / Entreprise</th>
                  <th>Email</th>
                  <th>Type de compte</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Téléphone</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const disabled = isBusy(u);
                  const isSuper = u.role === 'super_admin';

                  return (
                    <tr key={u.id}>
                      <td>{getDisplayName(u)}</td>
                      <td>{u.email}</td>
                      <td>
                        {u.account_type === 'professionnel'
                          ? 'Professionnel'
                          : 'Particulier'}
                      </td>
                      <td>{getRoleLabel(u.role)}</td>
                      <td>
                        {u.is_active ? (
                          <span className="tag is-success">Actif</span>
                        ) : (
                          <span className="tag is-danger">Inactif</span>
                        )}
                      </td>
                      <td>{u.phone}</td>
                      <td>
                        <div className="buttons are-small">
                          {u.is_active ? (
                            <button
                              className="button is-warning"
                              disabled={disabled || isSuper}
                              onClick={() => handleDeactivate(u)}
                            >
                              {disabled ? '...' : 'Désactiver'}
                            </button>
                          ) : (
                            <button
                              className="button is-success"
                              disabled={disabled || isSuper}
                              onClick={() => handleActivate(u)}
                            >
                              {disabled ? '...' : 'Activer'}
                            </button>
                          )}

                          {!isSuper && (
                            <button
                              className="button is-danger"
                              disabled={disabled}
                              onClick={() => handleDelete(u)}
                            >
                              {disabled ? '...' : 'Supprimer'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && (
          <div className="sr-card">
            <div className="sr-section">
              <div className="sr-section-header">
                <div>
                  <h3 className="sr-section-title">
                    Sécurité & réinitialisation de mot de passe
                  </h3>
                  <p className="sr-section-subtitle">
                    Outils de gestion des accès pour les membres du studio.
                  </p>
                </div>
              </div>

              <PasswordCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsersPage;
