const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// 速率限制 - 登录和注册
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5, // 限制每个 IP 15 分钟内最多 5 次请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 通用 API 速率限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 15 分钟内最多 100 次请求
  standardHeaders: true,
  legacyHeaders: false,
});

// 安全响应头配置
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

module.exports = {
  authLimiter,
  apiLimiter,
  securityHeaders
};
