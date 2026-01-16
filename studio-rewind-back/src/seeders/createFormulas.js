// src/seeders/createFormulas.js
import dotenv from 'dotenv';
dotenv.config();

import { sequelize, Formula } from '../models/index.js';

async function createDefaultFormulas() {
  try {
    await sequelize.authenticate();
    console.log('🔌 Connecté à la base PostgreSQL (seed formulas).');

    await sequelize.sync(); // s'assure que les tables existent

    const defaults = [
      {
        key: 'solo',
        name: 'Formule SOLO',
        billing_type: 'hourly',
        price_ttc: 99
      },
      {
        key: 'duo',
        name: 'Formule DUO',
        billing_type: 'hourly',
        price_ttc: 490
      },
      {
        key: 'pro',
        name: 'Formule PRO',
        billing_type: 'hourly',
        price_ttc: 990
      }
    ];

    for (const formulaData of defaults) {
      // Chercher ou créer la formule
      let formula = await Formula.findOne({ where: { key: formulaData.key } });

      if (formula) {
        console.log(`↺ Formule déjà présente : ${formulaData.key} (${formula.name})`);
      } else {
        formula = await Formula.create(formulaData);
        console.log(`✅ Formule créée : ${formulaData.key} (${formulaData.name})`);
      }
    }

    console.log('✨ Seed des formules terminé.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur seed formulas :', error);
    process.exit(1);
  }
}

createDefaultFormulas();
