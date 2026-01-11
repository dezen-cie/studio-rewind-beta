// src/seeders/createFormulas.js
import dotenv from 'dotenv';
dotenv.config();

import { sequelize, Formula } from '../models/index.js';

async function createDefaultFormulas() {
  try {
    await sequelize.authenticate();
    console.log('🔌 Connecté à la base PostgreSQL (seed formulas).');

    await sequelize.sync(); // s'assure que la table existe

    const defaults = [
      {
        key: 'autonome',
        name: 'Formule autonome',
        billing_type: 'hourly',
        price_ttc: 100
      },
      {
        key: 'amelioree',
        name: 'Formule améliorée',
        billing_type: 'hourly',
        price_ttc: 300
      },
      {
        key: 'abonnement',
        name: 'Formule abonnement',
        billing_type: 'subscription',
        price_ttc: 800
      },
      {
        key: 'reseaux',
        name: 'Formule Réseaux',
        billing_type: 'subscription',
        price_ttc: 1200
      }
    ];

    for (const f of defaults) {
      const existing = await Formula.findOne({ where: { key: f.key } });
      if (existing) {
        console.log(`↺ Formule déjà présente : ${f.key} (${existing.name})`);
      } else {
        await Formula.create(f);
        console.log(`✅ Formule créée : ${f.key} (${f.name})`);
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
