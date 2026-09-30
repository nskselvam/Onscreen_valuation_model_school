// ─────────────────────────────────────────────────────────────────────────────
// System Profile  :  64 GB RAM  |  32 CPU Cores
// Worker count    :  15  (leaves cores for OS / DB / Nginx)
// Heap per worker :  3.5 GB  →  15 workers × 3.5 GB = 52.5 GB max heap
// Restart ceiling :  4 GB per worker  (handles burst before restart)
// Reserved for OS/DB/Nginx :  ~11.5 GB  (safe headroom)
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  apps: [
    {
      // ── Identity ─────────────────────────────────────────────
      name        : 'examination-backend',
      script      : 'app.js',

      // ── Cluster / Scaling ─────────────────────────────────────
      instances   : 2,             // 15 of 32 cores (optimal for high concurrency)
      exec_mode   : 'cluster',      // load balance across all workers

      // ── Memory & Node Tuning ──────────────────────────────────
      // 3.5 GB heap per worker; expose-gc lets Node free memory proactively
      node_args           : '--max-old-space-size=3584 --expose-gc',
      max_memory_restart  : '4096M', // restart a worker that exceeds 4 GB

      // ── Stability & Auto-restart ──────────────────────────────
      watch               : false,
      autorestart         : true,
      restart_delay       : 3000,   // 3 s back-off before restarting (ms)
      max_restarts        : 4,     // allow more retries for heavy workloads
      min_uptime          : '10s',  // stable if alive > 10 s

      // ── Logging ───────────────────────────────────────────────
      output          : './logs/pm2-out.log',
      error           : './logs/pm2-error.log',
      log_date_format : 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs      : true,       // one log file for all workers

      // ── Graceful Shutdown ─────────────────────────────────────
      kill_timeout         : 15000, // 15 s — allows PDF / file ops to finish
      listen_timeout       : 15000, // 15 s for app to become ready
      shutdown_with_message: true,

      // ── Environment : Development ─────────────────────────────
      env: {
        NODE_ENV         : 'development',
        PORT             : 8020,
        UV_THREADPOOL_SIZE: 128,    // more threads for file / DB / PDF I/O (32 cores × 4)
      },

      // ── Environment : Production ──────────────────────────────
      env_production: {
        NODE_ENV         : 'production',
        PORT             : 8020,
        UV_THREADPOOL_SIZE: 128,    // handles concurrent PDF & file uploads (32 cores × 4)
      },
    },
  ],
};
// cd backend
// pm2 reload ecosystem.config.js --env production
// pm2 start ecosystem.config.js --env production

// # Start in development
// pm2 start ecosystem.config.js

// # Reload with zero downtime (production only)
// pm2 reload ecosystem.config.js --env production

// # Save & enable on system reboot
// pm2 save
// 
