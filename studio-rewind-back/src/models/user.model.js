// src/models/user.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true }
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    role: {
      type: DataTypes.ENUM('client', 'admin', 'super_admin'),
      defaultValue: 'client'
    },

    account_type: {
      type: DataTypes.ENUM('particulier', 'professionnel'),
      allowNull: false
    },

    firstname: { type: DataTypes.STRING, allowNull: true },
    lastname:  { type: DataTypes.STRING, allowNull: true },

    company_name: { type: DataTypes.STRING, allowNull: true },
    vat_number: { type: DataTypes.STRING, allowNull: true },

    phone: { type: DataTypes.STRING, allowNull: false },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users'
  }
);

export default User;
