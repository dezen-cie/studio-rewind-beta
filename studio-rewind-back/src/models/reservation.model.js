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
      type: DataTypes.ENUM('autonome', 'amelioree', 'abonnement', 'reseaux'),
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
    }
  },
  {
    sequelize,
    modelName: 'Reservation',
    tableName: 'reservations'
  }
);

export default Reservation;
