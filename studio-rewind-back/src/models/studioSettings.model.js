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
