const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversation');
const posterRoutes = require('./routes/poster');
const threadRoutes = require('./routes/thread');
const { connectDB, checkDBConnection } = require('./config/database');
const { securityHeaders, apiLimiter } = require('./middleware/security');

dotenv.config();

// 安全检查
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secret') {
  console.warn('⚠️  警告: JWT_SECRET 未设置或使用默认值，生产环境不安全！');
  console.warn('请设置环境变量 JWT_SECRET 为强随机字符串');
}

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(securityHeaders);

// CORS 配置
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : false)
    : true, // 开发环境允许所有来源
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 请求体解析
app.use(express.json({ limit: '10mb' })); // 限制请求体大小

// API 速率限制
app.use('/api', apiLimiter);

// Health check
app.get('/health', async (req, res) => {
  const dbStatus = await checkDBConnection();
  res.json({
    status: 'ok',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/poster', posterRoutes);
app.use('/api/thread', threadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', process.env.NODE_ENV === 'development' ? err.stack : 'Hidden in production');
  
  // 不泄露敏感错误信息
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? '服务器内部错误' 
    : err.message;
  
  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
