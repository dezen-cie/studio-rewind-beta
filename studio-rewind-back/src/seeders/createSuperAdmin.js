// src/seeders/createSuperAdmin.js
import bcrypt from 'bcrypt';
import { sequelize, User } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function createSuperAdmin() {
  try {
    await sequelize.authenticate();
    console.log("🔌 Connecté à la base PostgreSQL.");

    // ======================================================
    // SUPER ADMIN
    // ======================================================
    const existingSuper = await User.findOne({ where: { role: 'super_admin' } });

    if (existingSuper) {
      console.log("⚠️ Un super admin existe déjà :", existingSuper.email);
    } else {
      const superEmail = "greg@mail.fr";
      const superPassword = "Password1+";
      const hashedSuper = await bcrypt.hash(superPassword, 10);

      const superAdmin = await User.create({
        email: superEmail,
        password: hashedSuper,
        role: 'super_admin',
        account_type: 'professionnel',
        company_name: 'Studio Rewind',
        phone: '0000000000',
        is_active: true
      });

      console.log("✨ Super admin créé !");
    }

    // ======================================================
    // ADMIN SIMPLE
    // ======================================================
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });

    if (existingAdmin) {
      console.log("⚠️ Un admin existe déjà :", existingAdmin.email);
    } else {
      const adminEmail = "admin@mail.fr";  
      const adminPassword = "Password1+";         
      const hashedAdmin = await bcrypt.hash(adminPassword, 10);

      const admin = await User.create({
        email: adminEmail,
        password: hashedAdmin,
        role: 'admin',
        account_type: 'professionnel',
        company_name: 'Admin User Company',
        phone: '0102030405',
        is_active: true
      });

      console.log("✨ Admin créé !");
    }

    console.log("✅ Seed terminé.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur seed :", error);
    process.exit(1);
  }
}

createSuperAdmin();
