import { useEffect, useState } from 'react';
import {
  type PublicFormula,
  getAdminFormulas,
  updateAdminFormula
} from '../../api/formulas';

function AdminFormulasPage() {
  const [formulas, setFormulas] = useState<PublicFormula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const data = await getAdminFormulas();
        // Trier par prix croissant
        data.sort((a, b) => a.price_ttc - b.price_ttc);
        setFormulas(data);
      } catch (err: any) {
        console.error('Erreur getAdminFormulas:', err);
        const message =
          err?.response?.data?.message ||
          "Impossible de charger les formules.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function getBillingLabel(f: PublicFormula) {
    if (f.key === 'reseaux') return 'Forfait';
    return f.billing_type === 'subscription' ? 'Forfait' : 'À l\'heure';
  }

  function startEdit(f: PublicFormula) {
    setEditingId(f.id);
    setEditName(f.name);
    setEditPrice(String(f.price_ttc));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditPrice('');
  }

  async function handleSave(f: PublicFormula) {
    const newName = editName.trim();
    const newPrice = parseFloat(editPrice);

    if (!newName) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    if (isNaN(newPrice) || newPrice < 0) {
      setError('Le prix doit être un nombre positif.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await updateAdminFormula(f.id, {
        name: newName,
        price_ttc: newPrice
      });
      setFormulas((prev) =>
        prev
          .map((x) => (x.id === updated.id ? updated : x))
          .sort((a, b) => a.price_ttc - b.price_ttc)
      );
      cancelEdit();
    } catch (err: any) {
      console.error('Erreur updateAdminFormula:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de mettre à jour la formule.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Formules</h2>
          <p className="sr-page-subtitle">
            Gère les noms et prix des formules affichées sur le site.
          </p>
        </div>
        <div className="sr-section-meta">
          {formulas.length > 0 && (
            <span className="sr-chip">
              {formulas.length} formule{formulas.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        <div className="sr-card">
          {loading && <p>Chargement des formules...</p>}

          {!loading && !error && formulas.length === 0 && (
            <p>Aucune formule trouvée.</p>
          )}

          {!loading && formulas.length > 0 && (
            <table className="table is-fullwidth is-striped is-hoverable">
              <thead>
                <tr>
                  <th>Clé</th>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Prix TTC</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formulas.map((f) => {
                  const isEditing = editingId === f.id;

                  return (
                    <tr key={f.id}>
                      <td>
                        <code>{f.key}</code>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            className="input is-small"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={saving}
                          />
                        ) : (
                          f.name
                        )}
                      </td>
                      <td>{getBillingLabel(f)}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            className="input is-small"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            disabled={saving}
                            min="0"
                            step="0.01"
                            style={{ width: '100px' }}
                          />
                        ) : (
                          `${f.price_ttc.toFixed(2).replace('.', ',')}€`
                        )}
                      </td>
                      <td>
                        <div className="buttons are-small">
                          {isEditing ? (
                            <>
                              <button
                                className="button is-success"
                                disabled={saving}
                                onClick={() => handleSave(f)}
                              >
                                {saving ? '...' : 'Enregistrer'}
                              </button>
                              <button
                                className="button"
                                disabled={saving}
                                onClick={cancelEdit}
                              >
                                Annuler
                              </button>
                            </>
                          ) : (
                            <button
                              className="button is-info"
                              onClick={() => startEdit(f)}
                            >
                              Modifier
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
      </div>
    </div>
  );
}

export default AdminFormulasPage;
