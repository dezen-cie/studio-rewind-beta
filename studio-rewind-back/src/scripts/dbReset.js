// scripts/dbReset.js
import 'dotenv/config';
import sequelize from '../config/database.js';
import { Reservation, Subscription } from '../models/index.js';

async function main() {
  try {
    console.log('🚨 RESET COMPLET DE LA BASE (drop schema public)...');
    console.log('DB_NAME =', process.env.DB_NAME);
    console.log('DB_HOST =', process.env.DB_HOST);
    console.log('DB_USER =', process.env.DB_USER);

    await sequelize.authenticate();
    console.log('✅ Connecté à la base AVANT reset.');

    // Juste pour voir s’il y a déjà des données avant le drop
    const beforeResCount = await Reservation.count().catch(() => null);
    const beforeSubCount = await Subscription.count().catch(() => null);
    console.log('📊 Avant DROP : reservations =', beforeResCount, ', subscriptions =', beforeSubCount);

    // 1. On détruit complètement le schéma "public"
    await sequelize.query('DROP SCHEMA public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');

    console.log('✅ Schéma public recréé.');

    // 2. On recrée toutes les tables à partir des models
    await sequelize.sync({ force: true });
    console.log('✅ Tables recréées à partir des models.');

    // Recompte après sync
    const afterResCount = await Reservation.count();
    const afterSubCount = await Subscription.count();
    console.log('📊 Après sync : reservations =', afterResCount, ', subscriptions =', afterSubCount);

    console.log('⚠️ Attention : ce script ne lance PAS les seeders lui-même.');
    console.log('   Les seeders sont lancés via le script npm "db:reset" :');
    console.log('   node scripts/dbReset.js && npm run seed:superadmin && npm run seed:formulas');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur db:reset:', err);
    process.exit(1);
  }
}

main();
