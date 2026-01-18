// src/models/studioSettings.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class StudioSettings extends Model {}

StudioSettings.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // Clé unique pour identifier le paramètre (ex: 'main' pour les paramètres principaux)
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'main'
    },
    // =====================
    // HORAIRES D'OUVERTURE
    // =====================
    // Heure d'ouverture (format HH:MM)
    opening_time: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '09:00'
    },
    // Heure de fermeture (format HH:MM)
    closing_time: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '18:00'
    },
    // Jours d'ouverture (tableau de numéros: 1=Lundi, 2=Mardi, ..., 7=Dimanche)
    open_days: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [1, 2, 3, 4, 5] // Lundi à Vendredi par défaut
    },
    // =====================
    // TARIFICATION
    // =====================
    vat_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 20.00 // 20% par défaut
    },
    commission_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 20.00 // 20% par défaut
    },
    // Majoration nuit - avant quelle heure (ex: avant 9h)
    night_surcharge_before: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: '09:00'
    },
    // Majoration nuit - après quelle heure (ex: après 18h)
    night_surcharge_after: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: '18:00'
    },
    // Pourcentage de majoration nuit
    night_surcharge_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00 // 0% par défaut (pas de majoration)
    },
    // Pourcentage de majoration week-end
    weekend_surcharge_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00 // 0% par défaut (pas de majoration)
    },
    // =====================
    // NOTIFICATIONS EMAIL
    // =====================
    // Email de confirmation de réservation
    confirmation_email_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // Email de rappel avant réservation
    reminder_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // Délai de rappel en heures avant la réservation
    reminder_hours_before: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 24
    },
    // =====================
    // FERMETURES
    // =====================
    holidays_closure_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // =====================
    // INFORMATIONS ENTREPRISE
    // =====================
    company_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_postal_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_siret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_vat_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // =====================
    // COORDONNÉES BANCAIRES
    // =====================
    bank_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bank_iban: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bank_bic: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // =====================
    // LOGO
    // =====================
    logo_path: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'StudioSettings',
    tableName: 'studio_settings',
    indexes: [
      {
        unique: true,
        fields: ['key']
      }
    ]
  }
);

export default StudioSettings;
