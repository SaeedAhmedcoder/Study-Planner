const { Sequelize } = require('sequelize');

let databaseUrl = process.env.DATABASE_URL || 'sqlite::memory:';

// Heroku/Neon sometimes provide postgres:// — Sequelize accepts it, but normalize anyway
if (databaseUrl.startsWith('postgres://')) {
  databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production'
      ? { require: true, rejectUnauthorized: false }
      : false,
  },
  pool: { max: 5, min: 0, idle: 10000 },
});

module.exports = sequelize;