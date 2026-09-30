require('dotenv').config({ path: `${process.cwd()}/.env` });

module.exports = {

  // ── Development ───────────────────────────────────────────────
  development: {
    username       : process.env.DB_USERNAME,
    password       : process.env.DB_PASSWORD,   // move to .env — never hardcode
    database       : process.env.DB_NAME,
    host           : process.env.DB_HOST        || '127.0.0.1',
    port           : process.env.DB_PORT        || 5432,
    dialect        : 'postgres',
    timezone       : '+05:30',                  // IST
    dialectOptions : {
      useUTC         : false,
      connectTimeout : 10000,
    },
  },

  // ── Test ──────────────────────────────────────────────────────
  test: {
    username       : process.env.DB_USERNAME    || 'postgres',
    password       : process.env.DB_PASSWORD    || null,
    database       : process.env.DB_NAME        || 'database_test',
    host           : process.env.DB_HOST        || '127.0.0.1',
    port           : process.env.DB_PORT        || 5432,
    dialect        : 'postgres',
    timezone       : '+05:30',
    dialectOptions : { useUTC: false },
  },

  // ── Production ────────────────────────────────────────────────
  production: {
    username       : process.env.DB_USERNAME,
    password       : process.env.DB_PASSWORD,
    database       : process.env.DB_NAME,
    host           : process.env.DB_HOST,
    port           : process.env.DB_PORT        || 5432,
    dialect        : 'postgres',
    timezone       : '+05:30',                  // IST
    dialectOptions : {
      useUTC         : false,
      connectTimeout : 10000,
      // Uncomment when using SSL (recommended for remote/cloud DB)
      // ssl: {
      //   require            : true,
      //   rejectUnauthorized : false,  // set true + provide CA cert for strict SSL
      // },
    },
  },
};