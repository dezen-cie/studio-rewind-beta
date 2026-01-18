// src/migrations/migrate-formula-enum-to-string.js
// Migration pour convertir le champ formula de ENUM vers STRING
import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database.js';

async function migrateFormulaColumn() {
  try {
    await sequelize.authenticate();
    console.log('🔌 Connecté à la base PostgreSQL.');

    console.log('🔄 Migration du champ formula de ENUM vers STRING...');

    // Modifier la colonne formula de ENUM vers VARCHAR
    await sequelize.query(`
      ALTER TABLE reservations
      ALTER COLUMN formula TYPE VARCHAR(255)
      USING formula::text;
    `);

    console.log('✅ Colonne formula migrée avec succès !');

    // Optionnel: supprimer l'ancien type ENUM s'il n'est plus utilisé
    try {
      await sequelize.query(`DROP TYPE IF EXISTS enum_reservations_formula;`);
      console.log('🗑️ Ancien type ENUM supprimé.');
    } catch (e) {
      console.log('ℹ️ Ancien type ENUM déjà supprimé ou inexistant.');
    }

    console.log('✨ Migration terminée.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  }
}

migrateFormulaColumn();
