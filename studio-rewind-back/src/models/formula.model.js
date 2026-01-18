// src/models/formula.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Formula extends Model {}

Formula.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      // identifiant technique : "solo", "duo", "pro"
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      // nom affiché dans le front : "Formule Solo", etc.
      type: DataTypes.STRING,
      allowNull: false
    },
    billing_type: {
      // "hourly" pour à l'heure, "subscription" pour abo mensuel
      type: DataTypes.ENUM('hourly', 'subscription'),
      allowNull: false
    },
    price_ttc: {
      // prix TTC / heure (pour hourly) ou / mois (pour subscription)
      type: DataTypes.FLOAT,
      allowNull: false
    },
    requires_podcaster: {
      // si true, la formule nécessite de choisir un podcasteur lors de la résa
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    description: {
      // description affichée sur le site (ex: "Formule idéale pour débuter...")
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    sequelize,
    modelName: 'Formula',
    tableName: 'formulas'
  }
);

export default Formula;
