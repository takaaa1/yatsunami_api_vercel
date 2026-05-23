module.exports = {
  apps: [
    {
      name: 'yatsunami-api',
      script: 'dist/main.js',
      cwd: '/var/www/yatsunami/api',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      // Legado PM2 — blue/green usa proxy em :3070 (ver deploy.sh)
      env_file: '/var/www/yatsunami/api/.env',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
