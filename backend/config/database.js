const { Sequelize } = require('sequelize');

const env    = process.env.NODE_ENV || 'development';
const config = require('./config')[env];

// ─────────────────────────────────────────────────────────────────────────────
// Connection Pool Strategy  (24 GB RAM | 8 PM2 workers)
//   pool.max  = 10  →  8 workers × 10 = 80 total  (under PG default of 100)
//   pool.min  = 2   →  keep 2 warm connections per worker
//   acquire   = 30s →  wait up to 30 s to get a connection before error
//   idle      = 10s →  release a connection unused for 10 s
// ─────────────────────────────────────────────────────────────────────────────
const sequelize = new Sequelize({
  ...config,

  // ── Pool ────────────────────────────────────────────────────
  pool: {
    max     : 10,     // max open connections per worker
    min     : 2,      // keep 2 alive (avoids cold-start latency)
    acquire : 30000,  // ms to wait before "connection not available" error
    idle    : 10000,  // ms before releasing an unused connection
    evict   : 1000,   // ms interval to check & close idle connections
  },

  // ── Dialect / Connection ─────────────────────────────────────
  dialectOptions: {
    connectTimeout        : 10000, // TCP connect timeout (ms)
    statement_timeout     : 60000, // kill any query running > 60 s
    idle_in_transaction_session_timeout: 30000, // kill idle transactions > 30 s
    application_name      : `onscreen-valuation-${env}`, // visible in pg_stat_activity
    useUTC                : config.dialectOptions?.useUTC !== undefined ? config.dialectOptions.useUTC : false,
    ssl                   : config.dialectOptions?.ssl || {
      require            : true,
      rejectUnauthorized : false,
    }, // Enable SSL for AWS RDS
  },

  // ── Logging ──────────────────────────────────────────────────
  logging : false,   // disabled — reduces I/O overhead on every query
  benchmark: false,

  // ── Retry on startup ─────────────────────────────────────────
  retry: {
    max: 5, // retry failed queries up to 5 times
  },
});

// ── Health check with retry ───────────────────────────────────────────────────
const MAX_RETRIES   = 5;
const RETRY_DELAY   = 3000; // ms

async function connectWithRetry(attempt = 1) {
  try {
    await sequelize.authenticate();
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.warn(`[DB] Connection attempt ${attempt} failed. Retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
      return connectWithRetry(attempt + 1);
    }
    console.error('[DB] ❌ Could not connect to PostgreSQL after', MAX_RETRIES, 'attempts:', err.message);
    process.exit(1); // crash fast — PM2 will restart the worker
  }
}

connectWithRetry();

// ── Graceful shutdown — release pool on PM2 SIGINT / SIGTERM ─────────────────
const shutdown = async (signal) => {
  await sequelize.close();
  process.exit(0);
};
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = sequelize;
