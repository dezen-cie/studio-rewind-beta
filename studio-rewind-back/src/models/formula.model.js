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
      // identifiant technique : "solo", "duo", "pro", ou généré automatiquement
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
    },
    image_url: {
      // URL de l'image de la formule affichée dans le tunnel de réservation
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    border_start: {
      // couleur de début du dégradé de bordure (ex: "rgb(153, 221, 252)")
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'rgb(153, 221, 252)'
    },
    border_end: {
      // couleur de fin du dégradé de bordure (ex: "rgb(196, 202, 0)")
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'rgb(196, 202, 0)'
    },
    min_height: {
      // hauteur minimale de la carte en pixels
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 420
    },
    display_order: {
      // ordre d'affichage (0 = premier)
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      // si false, la formule n'est pas affichée sur le site
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Formula',
    tableName: 'formulas'
  }
);

export default Formula;
