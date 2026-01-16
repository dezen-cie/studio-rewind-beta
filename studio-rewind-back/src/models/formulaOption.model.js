// src/models/formulaOption.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class FormulaOption extends Model {}

FormulaOption.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    formula_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'formulas',
        key: 'id'
      }
    },
    icon: {
      // Nom de l'icône Lucide (ex: "FilePlay", "User", "Scissors")
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Circle'
    },
    content: {
      // Texte de l'option (ex: "Rushes vidéos & audio")
      type: DataTypes.STRING,
      allowNull: false
    },
    display_order: {
      // Ordre d'affichage
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'FormulaOption',
    tableName: 'formula_options'
  }
);

export default FormulaOption;
