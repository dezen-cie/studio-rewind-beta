// src/seeders/addTeamDisplayOrder.js
// Script pour ajouter la colonne team_display_order à la table podcasters
import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../models/index.js';

async function addTeamDisplayOrder() {
  try {
    await sequelize.authenticate();
    console.log('🔌 Connecté à la base PostgreSQL.');

    // Vérifier si la colonne existe déjà
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'podcasters' AND column_name = 'team_display_order';
    `);

    if (columns.length > 0) {
      console.log('✅ La colonne team_display_order existe déjà.');
      process.exit(0);
      return;
    }

    console.log('🔄 Ajout de la colonne team_display_order...');

    await sequelize.query(`
      ALTER TABLE podcasters
      ADD COLUMN team_display_order INTEGER DEFAULT NULL;
    `);

    console.log('✅ Colonne team_display_order ajoutée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

addTeamDisplayOrder();
