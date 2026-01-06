// src/models/subscription.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Subscription extends Model {}

Subscription.init(
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

    monthly_hours_quota: {
      type: DataTypes.INTEGER,
      defaultValue: 5 // 5h/mois
    },

    hours_used: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    stripe_subscription_id: {
      type: DataTypes.STRING,
      allowNull: true
    },

    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    // Prix de l'abonnement (800€ TTC par défaut)
    price_ht: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 800 / 1.2
    },

    price_tva: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 800 - 800 / 1.2
    },

    price_ttc: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 800
    },

    // date de paiement de l'abonnement
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions'
  }
);

export default Subscription;
