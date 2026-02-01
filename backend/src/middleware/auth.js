const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'secret') {
      console.error('JWT_SECRET 未正确配置');
      return res.status(500).json({ error: '服务器配置错误' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的令牌' });
    }
    return res.status(401).json({ error: '认证失败' });
  }
};

module.exports = { authenticate };
