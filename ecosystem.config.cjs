const { join } = require('node:path')

module.exports = {
  apps: [
    {
      name: 'raw-site',
      script: 'apps/raw-site/.output/server/index.mjs',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: String(process.env.PORT || 4006)
      }
    }
  ]
}
