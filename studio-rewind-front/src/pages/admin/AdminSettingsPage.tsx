// src/pages/admin/AdminSettingsPage.tsx
import { useEffect, useState, useRef } from 'react';
import { Settings, Clock, Percent, Building2, Landmark, Upload, Trash2, Save, Check, Bell, CalendarOff } from 'lucide-react';
import {
  getAdminSettings,
  updateAdminSettings,
  uploadAdminLogo,
  deleteAdminLogo,
  type StudioSettings
} from '../../api/adminSettings';
import './AdminSettingsPage.css';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

const ALL_HOURS: string[] = [];
for (let h = 0; h < 24; h++) {
  ALL_HOURS.push(`${h.toString().padStart(2, '0')}:00`);
  ALL_HOURS.push(`${h.toString().padStart(2, '0')}:30`);
}
ALL_HOURS.push('24:00');

const REMINDER_OPTIONS = [
  { value: 1, label: '1 heure' },
  { value: 2, label: '2 heures' },
  { value: 6, label: '6 heures' },
  { value: 12, label: '12 heures' },
  { value: 24, label: '24 heures (1 jour)' },
  { value: 48, label: '48 heures (2 jours)' },
  { value: 72, label: '72 heures (3 jours)' },
];

function AdminSettingsPage() {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Horaires
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [openDays, setOpenDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Tarification
  const [vatRate, setVatRate] = useState('20');
  const [commissionRate, setCommissionRate] = useState('20');
  const [nightSurchargeBefore, setNightSurchargeBefore] = useState('09:00');
  const [nightSurchargeAfter, setNightSurchargeAfter] = useState('18:00');
  const [nightSurchargePercent, setNightSurchargePercent] = useState('0');
  const [weekendSurchargePercent, setWeekendSurchargePercent] = useState('0');

  // Notifications
  const [confirmationEmailEnabled, setConfirmationEmailEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderHoursBefore, setReminderHoursBefore] = useState(24);

  // Fermetures
  const [holidaysClosureEnabled, setHolidaysClosureEnabled] = useState(false);

  // Entreprise
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPostalCode, setCompanyPostalCode] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companySiret, setCompanySiret] = useState('');
  const [companyVatNumber, setCompanyVatNumber] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  // Banque
  const [bankName, setBankName] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankBic, setBankBic] = useState('');

  // Logo
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les paramètres
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminSettings();
      setSettings(data);

      // Horaires
      setOpeningTime(data.opening_time?.substring(0, 5) || '09:00');
      setClosingTime(data.closing_time?.substring(0, 5) || '18:00');
      setOpenDays(data.open_days || [1, 2, 3, 4, 5]);

      // Tarification
      setVatRate(String(data.vat_rate || 20));
      setCommissionRate(String(data.commission_rate || 20));
      setNightSurchargeBefore(data.night_surcharge_before?.substring(0, 5) || '09:00');
      setNightSurchargeAfter(data.night_surcharge_after?.substring(0, 5) || '18:00');
      setNightSurchargePercent(String(data.night_surcharge_percent || 0));
      setWeekendSurchargePercent(String(data.weekend_surcharge_percent || 0));

      // Notifications
      setConfirmationEmailEnabled(data.confirmation_email_enabled ?? true);
      setReminderEnabled(data.reminder_enabled ?? true);
      setReminderHoursBefore(data.reminder_hours_before || 24);

      // Fermetures
      setHolidaysClosureEnabled(data.holidays_closure_enabled ?? false);

      // Entreprise
      setCompanyName(data.company_name || '');
      setCompanyAddress(data.company_address || '');
      setCompanyPostalCode(data.company_postal_code || '');
      setCompanyCity(data.company_city || '');
      setCompanySiret(data.company_siret || '');
      setCompanyVatNumber(data.company_vat_number || '');
      setCompanyEmail(data.company_email || '');
      setCompanyPhone(data.company_phone || '');

      // Banque
      setBankName(data.bank_name || '');
      setBankIban(data.bank_iban || '');
      setBankBic(data.bank_bic || '');

      // Logo
      setLogoPath(data.logo_path);
    } catch (err: any) {
      console.error('Erreur chargement settings:', err);
      setError('Impossible de charger les paramètres.');
    } finally {
      setLoading(false);
    }
  }

  function toggleOpenDay(day: number) {
    setOpenDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await updateAdminSettings({
        // Horaires
        opening_time: openingTime,
        closing_time: closingTime,
        open_days: openDays,
        // Tarification
        vat_rate: parseFloat(vatRate),
        commission_rate: parseFloat(commissionRate),
        night_surcharge_before: nightSurchargeBefore,
        night_surcharge_after: nightSurchargeAfter,
        night_surcharge_percent: parseFloat(nightSurchargePercent),
        weekend_surcharge_percent: parseFloat(weekendSurchargePercent),
        // Notifications
        confirmation_email_enabled: confirmationEmailEnabled,
        reminder_enabled: reminderEnabled,
        reminder_hours_before: reminderHoursBefore,
        // Fermetures
        holidays_closure_enabled: holidaysClosureEnabled,
        // Entreprise
        company_name: companyName || undefined,
        company_address: companyAddress || undefined,
        company_postal_code: companyPostalCode || undefined,
        company_city: companyCity || undefined,
        company_siret: companySiret || undefined,
        company_vat_number: companyVatNumber || undefined,
        company_email: companyEmail || undefined,
        company_phone: companyPhone || undefined,
        // Banque
        bank_name: bankName || undefined,
        bank_iban: bankIban || undefined,
        bank_bic: bankBic || undefined
      });

      setSuccessMessage('Paramètres enregistrés avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      setError(err?.response?.data?.message || 'Impossible de sauvegarder les paramètres.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setError(null);
      const result = await uploadAdminLogo(file);
      setLogoPath(result.logo_path);
      setSuccessMessage('Logo uploadé avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Erreur upload logo:', err);
      setError(err?.response?.data?.message || 'Impossible d\'uploader le logo.');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDeleteLogo() {
    if (!confirm('Supprimer le logo ?')) return;

    try {
      setError(null);
      await deleteAdminLogo();
      setLogoPath(null);
      setSuccessMessage('Logo supprimé.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Erreur suppression logo:', err);
      setError(err?.response?.data?.message || 'Impossible de supprimer le logo.');
    }
  }

  if (loading) {
    return (
      <div className="sr-page">
        <div className="settings-loading">Chargement des paramètres...</div>
      </div>
    );
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">
            <Settings size={24} />
            Réglages
          </h2>
          <p className="sr-page-subtitle">
            Configurez les paramètres généraux du studio.
          </p>
        </div>
        <button
          type="button"
          className="button is-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} />
          <span>{saving ? 'Enregistrement...' : 'Enregistrer tout'}</span>
        </button>
      </div>

      {error && <div className="settings-error">{error}</div>}
      {successMessage && <div className="settings-success"><Check size={16} /> {successMessage}</div>}

      <div className="settings-grid">
        {/* SECTION 1: HORAIRES DU STUDIO */}
        <div className="sr-card settings-section">
          <div className="settings-section-header">
            <Clock size={20} />
            <h3>Horaires du studio</h3>
          </div>
          <div className="settings-section-body">
            <div className="settings-row">
              <div className="field">
                <label className="label">Heure d'ouverture</label>
                <div className="control">
                  <div className="select">
                    <select value={openingTime} onChange={(e) => setOpeningTime(e.target.value)}>
                      {ALL_HOURS.filter(h => h !== '24:00').map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label">Heure de fermeture</label>
                <div className="control">
                  <div className="select">
                    <select value={closingTime} onChange={(e) => setClosingTime(e.target.value)}>
                      {ALL_HOURS.map((h) => (
                        <option key={h} value={h}>{h === '24:00' ? '00:00 (minuit)' : h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="field">
              <label className="label">Jours d'ouverture</label>
              <div className="days-checkboxes">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day.value} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={openDays.includes(day.value)}
                      onChange={() => toggleOpenDay(day.value)}
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <p className="settings-info">
              Les créneaux en dehors de ces horaires seront automatiquement bloqués.
              Les jours non cochés seront également indisponibles.
            </p>
          </div>
        </div>

        {/* SECTION 2: TARIFICATION */}
        <div className="sr-card settings-section">
          <div className="settings-section-header">
            <Percent size={20} />
            <h3>Tarification</h3>
          </div>
          <div className="settings-section-body">
            <div className="settings-row">
              <div className="field">
                <label className="label">Taux de TVA</label>
                <div className="control has-suffix">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
              <div className="field">
                <label className="label">Commission podcasteurs</label>
                <div className="control has-suffix">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
            </div>

            <div className="settings-subsection">
              <label className="label">Majoration nuit</label>
              <div className="settings-row settings-row-3">
                <div className="field">
                  <label className="label-small">Avant</label>
                  <div className="control">
                    <div className="select">
                      <select value={nightSurchargeBefore} onChange={(e) => setNightSurchargeBefore(e.target.value)}>
                        {ALL_HOURS.filter(h => h !== '24:00').map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label-small">Après</label>
                  <div className="control">
                    <div className="select">
                      <select value={nightSurchargeAfter} onChange={(e) => setNightSurchargeAfter(e.target.value)}>
                        {ALL_HOURS.filter(h => h !== '24:00').map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label-small">Majoration</label>
                  <div className="control has-suffix">
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={nightSurchargePercent}
                      onChange={(e) => setNightSurchargePercent(e.target.value)}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>
              </div>
              <p className="settings-info-small">
                Majoration appliquée aux créneaux avant {nightSurchargeBefore} et après {nightSurchargeAfter}.
              </p>
            </div>

            <div className="settings-row">
              <div className="field">
                <label className="label">Majoration week-end</label>
                <div className="control has-suffix">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={weekendSurchargePercent}
                    onChange={(e) => setWeekendSurchargePercent(e.target.value)}
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
            </div>
            <p className="settings-info">
              Majoration appliquée aux réservations le samedi et dimanche.
            </p>
          </div>
        </div>

        {/* SECTION 3: NOTIFICATIONS */}
        <div className="sr-card settings-section">
          <div className="settings-section-header">
            <Bell size={20} />
            <h3>Notifications</h3>
          </div>
          <div className="settings-section-body">
            <div className="field">
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={confirmationEmailEnabled}
                  onChange={(e) => setConfirmationEmailEnabled(e.target.checked)}
                />
                <span className="settings-toggle-slider"></span>
                <span className="settings-toggle-label">Email de confirmation de réservation</span>
              </label>
              <p className="settings-info-small" style={{ marginLeft: '52px', marginTop: '0.25rem' }}>
                Envoie un email au client lorsque sa réservation est confirmée.
              </p>
            </div>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                />
                <span className="settings-toggle-slider"></span>
                <span className="settings-toggle-label">Rappels automatiques</span>
              </label>
            </div>

            {reminderEnabled && (
              <div className="field" style={{ marginLeft: '52px' }}>
                <label className="label">Délai de rappel avant réservation</label>
                <div className="control">
                  <div className="select">
                    <select
                      value={reminderHoursBefore}
                      onChange={(e) => setReminderHoursBefore(parseInt(e.target.value))}
                    >
                      {REMINDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="settings-info-small" style={{ marginTop: '0.25rem' }}>
                  Un email de rappel sera envoyé aux clients avant leur réservation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: FERMETURES */}
        <div className="sr-card settings-section">
          <div className="settings-section-header">
            <CalendarOff size={20} />
            <h3>Fermetures</h3>
          </div>
          <div className="settings-section-body">
            <div className="field">
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={holidaysClosureEnabled}
                  onChange={(e) => setHolidaysClosureEnabled(e.target.checked)}
                />
                <span className="settings-toggle-slider"></span>
                <span className="settings-toggle-label">Fermer automatiquement les jours fériés</span>
              </label>
            </div>

            <p className="settings-info">
              Le studio sera automatiquement fermé les jours fériés français
              (1er janvier, Pâques, 1er mai, 8 mai, Ascension, 14 juillet, 15 août,
              Toussaint, 11 novembre, 25 décembre).
            </p>
          </div>
        </div>

        {/* SECTION 5: INFORMATIONS ENTREPRISE */}
        <div className="sr-card settings-section settings-section-large">
          <div className="settings-section-header">
            <Building2 size={20} />
            <h3>Informations entreprise</h3>
          </div>
          <div className="settings-section-body">
            <div className="settings-row">
              <div className="field">
                <label className="label">Nom de l'entreprise</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="Studio Rewind SARL"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">SIRET</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="123 456 789 00012"
                    value={companySiret}
                    onChange={(e) => setCompanySiret(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label className="label">Adresse</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="123 rue du Podcast"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="field">
                <label className="label">Code postal</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="75001"
                    value={companyPostalCode}
                    onChange={(e) => setCompanyPostalCode(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">Ville</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="Paris"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="settings-row">
              <div className="field">
                <label className="label">N° TVA intracommunautaire</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="FR12345678901"
                    value={companyVatNumber}
                    onChange={(e) => setCompanyVatNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">Téléphone</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="01 23 45 67 89"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label className="label">Email de facturation</label>
              <div className="control">
                <input
                  className="input"
                  type="email"
                  placeholder="facturation@studiorewind.fr"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />
              </div>
            </div>

            <p className="settings-info">
              Ces informations apparaîtront sur toutes les factures générées.
            </p>
          </div>
        </div>

        {/* SECTION 6: COORDONNÉES BANCAIRES */}
        <div className="sr-card settings-section">
          <div className="settings-section-header">
            <Landmark size={20} />
            <h3>Coordonnées bancaires</h3>
          </div>
          <div className="settings-section-body">
            <div className="field">
              <label className="label">Nom de la banque</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Banque Populaire"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label className="label">IBAN</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label className="label">BIC / SWIFT</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="BNPAFRPP"
                  value={bankBic}
                  onChange={(e) => setBankBic(e.target.value)}
                />
              </div>
            </div>

            <p className="settings-info">
              Ces informations bancaires apparaîtront sur les factures pour les paiements par virement.
            </p>
          </div>
        </div>

        {/* SECTION 7: LOGO */}
        <div className="sr-card settings-section">
          <div className="settings-section-header">
            <Upload size={20} />
            <h3>Logo entreprise</h3>
          </div>
          <div className="settings-section-body">
            {logoPath ? (
              <div className="logo-preview">
                <img
                  src={`${apiBaseUrl}/uploads/${logoPath}`}
                  alt="Logo entreprise"
                />
                <button
                  type="button"
                  className="button is-danger is-small"
                  onClick={handleDeleteLogo}
                >
                  <Trash2 size={14} />
                  <span>Supprimer</span>
                </button>
              </div>
            ) : (
              <div className="logo-upload">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <Upload size={16} />
                  <span>{uploadingLogo ? 'Upload en cours...' : 'Choisir un fichier'}</span>
                </button>
                <p className="settings-info">
                  Formats acceptés : JPG, PNG, GIF, WebP. Taille max : 5 Mo.
                </p>
              </div>
            )}
            <p className="settings-info">
              Ce logo apparaîtra sur les factures et documents officiels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsPage;
