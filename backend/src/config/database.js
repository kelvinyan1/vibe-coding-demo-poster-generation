const { Pool } = require('pg');
const { getDatabaseConfig } = require('./database-secure');

let pool = null;
let isConnected = false;

const createPool = () => {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      isConnected = false;
    });
  }
  return pool;
};

const connectDB = async () => {
  try {
    const clientPool = createPool();
    const client = await clientPool.connect();
    console.log('Database connected successfully');
    isConnected = true;
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    isConnected = false;
    // Don't throw error, allow graceful degradation
    return false;
  }
};

const checkDBConnection = async () => {
  // 如果池不存在，尝试创建
  if (!pool) {
    createPool();
  }
  
  try {
    const client = await pool.connect();
    client.release();
    isConnected = true;
    return true;
  } catch (error) {
    // 连接失败，尝试重新连接
    isConnected = false;
    try {
      await connectDB();
      return isConnected;
    } catch (reconnectError) {
      return false;
    }
  }
};

const getPool = () => {
  if (!pool) {
    createPool();
  }
  return pool;
};

const query = async (text, params) => {
  const clientPool = getPool();
  if (!isConnected) {
    throw new Error('Database not connected');
  }
  try {
    const result = await clientPool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  checkDBConnection,
  getPool,
  query,
  isConnected: () => isConnected
};
