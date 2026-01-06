// src/config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'studio_rewind',
  process.env.DB_USER || 'studio_rewind',
  process.env.DB_PASSWORD || 'studio_rewind',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres',
    logging: true, 
    define: {
      underscored: true,
      timestamps: true
    }
  }
);

export default sequelize;
