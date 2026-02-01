const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, isConnected } = require('../config/database');
const { authLimiter } = require('../middleware/security');
const { validateUsername, validateEmail, validatePassword } = require('../utils/validation');

// 应用速率限制
router.use('/register', authLimiter);
router.use('/login', authLimiter);

// 注册
router.post('/register', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { username, email, password } = req.body;

    // 输入验证
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({ error: usernameValidation.error });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // 检查用户是否已存在
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, passwordHash]
    );

    const user = result.rows[0];
    
    // 检查 JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'secret') {
      console.error('JWT_SECRET 未正确配置');
      return res.status(500).json({ error: '服务器配置错误' });
    }
    
    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' });
    }

    // 查找用户
    const result = await query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 检查 JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'secret') {
      console.error('JWT_SECRET 未正确配置');
      return res.status(500).json({ error: '服务器配置错误' });
    }
    
    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: '7d'
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
