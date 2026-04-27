module.exports = {
  apps: [
    {
      name: 'yatsunami-api',
      script: 'dist/main.js',
      cwd: '/var/www/yatsunami/api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
