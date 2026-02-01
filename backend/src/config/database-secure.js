// 数据库安全配置
// 生产环境应使用 SSL 连接

const { Pool } = require('pg');

const getDatabaseConfig = () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'poster_db',
    user: process.env.DB_USER || 'poster_user',
    password: process.env.DB_PASSWORD || 'poster_password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  // 生产环境使用 SSL
  if (process.env.NODE_ENV === 'production' && process.env.DB_SSL === 'true') {
    config.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  return config;
};

module.exports = { getDatabaseConfig };
