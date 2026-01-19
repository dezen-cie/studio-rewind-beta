// src/models/reservation.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Reservation extends Model {}

Reservation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },

    formula: {
      // Clé de la formule (ex: 'solo', 'duo', 'pro', ou toute formule créée dynamiquement)
      type: DataTypes.STRING,
      allowNull: false
    },

    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },

    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },

    total_hours: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    price_ht: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

     is_subscription: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    price_tva: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    price_ttc: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    stripe_payment_intent_id: {
      type: DataTypes.STRING,
      allowNull: true
    },

    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
      defaultValue: 'pending'
    },

    podcaster_id: {
      type: DataTypes.UUID,
      allowNull: true, // Nullable pour les achats de pack d'heures
      references: {
        model: 'podcasters',
        key: 'id'
      }
    },

    // Champs pour le code promo
    promo_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },

    promo_label: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    promo_discount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    original_price_ht: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    original_price_ttc: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    // Indique si un rappel email a été envoyé pour cette réservation
    reminder_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    // Indique si l'admin a vu cette réservation (pour les notifications)
    admin_viewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'Reservation',
    tableName: 'reservations'
  }
);

export default Reservation;
