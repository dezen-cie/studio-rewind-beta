// src/models/promoCode.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PromoCode extends Model {}

PromoCode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true }
    },

    discount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15 // 15% par défaut
    },

    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: true // null = sans expiration
    }
  },
  {
    sequelize,
    modelName: 'PromoCode',
    tableName: 'promo_codes'
  }
);

export default PromoCode;
