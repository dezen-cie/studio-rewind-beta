// src/seeders/migrateFormulaEnum.js
import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../models/index.js';

async function migrateFormulaEnum() {
  try {
    await sequelize.authenticate();
    console.log('🔌 Connecté à la base PostgreSQL.');

    // Vérifier si l'ancien ENUM existe
    const [enumCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_reservations_formula'
      ) as exists;
    `);

    if (!enumCheck[0].exists) {
      console.log('⚠️ ENUM enum_reservations_formula n\'existe pas encore, sync va le créer.');
      await sequelize.sync();
      console.log('✅ Tables synchronisées.');
      process.exit(0);
      return;
    }

    // Vérifier les valeurs actuelles de l'ENUM
    const [enumValues] = await sequelize.query(`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_reservations_formula')
      ORDER BY enumsortorder;
    `);

    const currentValues = enumValues.map(e => e.enumlabel);
    console.log('📋 Valeurs actuelles de l\'ENUM:', currentValues);

    // Vérifier si on a déjà les nouvelles valeurs
    if (currentValues.includes('solo') && currentValues.includes('duo') && currentValues.includes('pro')) {
      console.log('✅ L\'ENUM contient déjà les nouvelles valeurs (solo, duo, pro).');
      process.exit(0);
      return;
    }

    console.log('🔄 Migration de l\'ENUM en cours...');

    // Supprimer les anciennes réservations (en dev seulement!)
    const [reservationCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM reservations;
    `);

    if (parseInt(reservationCount[0].count) > 0) {
      console.log(`⚠️ ${reservationCount[0].count} réservation(s) existante(s).`);
      console.log('🗑️ Suppression des réservations avec anciennes formules...');
      await sequelize.query(`DELETE FROM reservations;`);
    }

    // Méthode: Recréer l'ENUM
    // 1. Supprimer la contrainte de la colonne
    // 2. Changer le type en VARCHAR temporairement
    // 3. Supprimer l'ancien ENUM
    // 4. Créer le nouveau ENUM
    // 5. Remettre le type ENUM

    await sequelize.query(`
      ALTER TABLE reservations
      ALTER COLUMN formula TYPE VARCHAR(50);
    `);
    console.log('   ✓ Colonne convertie en VARCHAR');

    await sequelize.query(`
      DROP TYPE IF EXISTS enum_reservations_formula;
    `);
    console.log('   ✓ Ancien ENUM supprimé');

    await sequelize.query(`
      CREATE TYPE enum_reservations_formula AS ENUM ('solo', 'duo', 'pro');
    `);
    console.log('   ✓ Nouveau ENUM créé');

    await sequelize.query(`
      ALTER TABLE reservations
      ALTER COLUMN formula TYPE enum_reservations_formula
      USING formula::enum_reservations_formula;
    `);
    console.log('   ✓ Colonne reconvertie en ENUM');

    console.log('✨ Migration de l\'ENUM terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  }
}

migrateFormulaEnum();
