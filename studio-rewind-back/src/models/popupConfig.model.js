// src/models/popupConfig.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PopupConfig extends Model {}

PopupConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false
    },

    subtitle: {
      type: DataTypes.STRING,
      allowNull: true
    },

    text: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    discount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15
    },

    // Préfixe pour les codes générés (ex: "PROMO", "BIENVENUE", "SUMMER")
    code_prefix: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PROMO'
    },

    // Durée de validité des codes en jours (null = sans expiration)
    code_validity_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30
    },

    // Afficher une seule fois ou à chaque visite
    show_once: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },

    // Une seule popup peut être active à la fois
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'PopupConfig',
    tableName: 'popup_configs'
  }
);

export default PopupConfig;
