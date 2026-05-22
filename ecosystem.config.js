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
      // Mesma porta que o Nginx usa (proxy_pass http://127.0.0.1:3000)
      env_file: '/var/www/yatsunami/api/.env',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
