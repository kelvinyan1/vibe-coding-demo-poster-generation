const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query, isConnected } = require('../config/database');
const { validateMessage } = require('../utils/validation');

// 所有路由需要认证
router.use(authenticate);

// 获取对话历史
router.get('/history', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const userId = req.userId;
    const result = await query(
      'SELECT id, message, response, created_at FROM conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    res.json({
      conversations: result.rows
    });
  } catch (error) {
    console.error('Get conversation history error:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

// 在主题中创建新对话消息
router.post('/new', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const userId = req.userId;
    const { message, thread_id } = req.body;

    // 验证消息
    const messageValidation = validateMessage(message);
    if (!messageValidation.valid) {
      return res.status(400).json({ error: messageValidation.error });
    }

    if (!thread_id || !Number.isInteger(parseInt(thread_id))) {
      return res.status(400).json({ error: '有效的主题 ID 是必需的' });
    }

    // 验证主题属于当前用户
    const threadCheck = await query(
      'SELECT id FROM conversation_threads WHERE id = $1 AND user_id = $2',
      [thread_id, userId]
    );

    if (threadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // 保存对话消息
    const result = await query(
      'INSERT INTO conversations (user_id, thread_id, message) VALUES ($1, $2, $3) RETURNING id, message, created_at',
      [userId, parseInt(thread_id), messageValidation.value]
    );

    // 更新主题的更新时间
    await query(
      'UPDATE conversation_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [thread_id]
    );

    res.status(201).json({
      conversation: result.rows[0]
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

module.exports = router;
