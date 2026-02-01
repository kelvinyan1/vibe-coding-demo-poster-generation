const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query, isConnected } = require('../config/database');
const { validateThreadTitle, validateMessage } = require('../utils/validation');

// 所有路由需要认证
router.use(authenticate);

// 获取用户的所有对话主题列表
router.get('/list', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const userId = req.userId;
    const result = await query(
      `SELECT t.id, t.title, t.created_at, t.updated_at,
       COUNT(c.id) as message_count
       FROM conversation_threads t
       LEFT JOIN conversations c ON c.thread_id = t.id
       WHERE t.user_id = $1
       GROUP BY t.id
       ORDER BY t.updated_at DESC`,
      [userId]
    );

    res.json({
      threads: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        created_at: row.created_at,
        updated_at: row.updated_at,
        message_count: parseInt(row.message_count) || 0
      }))
    });
  } catch (error) {
    console.error('Get threads list error:', error);
    res.status(500).json({ error: 'Failed to get threads list' });
  }
});

// 创建新对话主题
router.post('/create', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const userId = req.userId;
    const { title, initial_message } = req.body;

    // 验证标题
    const titleValidation = validateThreadTitle(title);
    if (!titleValidation.valid) {
      return res.status(400).json({ error: titleValidation.error });
    }

    // 验证初始消息（如果有）
    if (initial_message) {
      const messageValidation = validateMessage(initial_message);
      if (!messageValidation.valid) {
        return res.status(400).json({ error: messageValidation.error });
      }
    }

    // 创建对话主题
    const threadResult = await query(
      'INSERT INTO conversation_threads (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at, updated_at',
      [userId, titleValidation.value]
    );

    const thread = threadResult.rows[0];

    // 如果有初始消息，创建第一条对话
    if (initial_message) {
      const messageValidation = validateMessage(initial_message);
      if (messageValidation.valid) {
        await query(
          'INSERT INTO conversations (user_id, thread_id, message) VALUES ($1, $2, $3)',
          [userId, thread.id, messageValidation.value]
        );
      }
    }

    res.status(201).json({
      thread: {
        id: thread.id,
        title: thread.title,
        created_at: thread.created_at,
        updated_at: thread.updated_at
      }
    });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// 获取单个主题的完整对话历史
router.get('/:threadId', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const userId = req.userId;
    const threadId = parseInt(req.params.threadId);

    // 验证主题属于当前用户
    const threadCheck = await query(
      'SELECT id, title FROM conversation_threads WHERE id = $1 AND user_id = $2',
      [threadId, userId]
    );

    if (threadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // 获取主题的所有对话
    const conversations = await query(
      'SELECT id, message, response, created_at FROM conversations WHERE thread_id = $1 ORDER BY created_at ASC',
      [threadId]
    );

    // 获取主题关联的海报（包含 conversation_id 用于前端关联）
    const posters = await query(
      'SELECT id, conversation_id, prompt, poster_url, poster_data, created_at FROM posters WHERE conversation_id IN (SELECT id FROM conversations WHERE thread_id = $1) ORDER BY created_at ASC',
      [threadId]
    );

    // 转换 poster_url 为后端代理路径
    const convertPosterUrl = (url) => {
      if (!url) return url;
      if (url.startsWith('/api/poster/') && url.includes('/image')) {
        const posterIdMatch = url.match(/\/api\/poster\/([^\/]+)\/image/);
        if (posterIdMatch) {
          return `/api/poster/image/${posterIdMatch[1]}`;
        }
      }
      return url;
    };

    const convertedPosters = posters.rows.map(poster => ({
      ...poster,
      poster_url: convertPosterUrl(poster.poster_url)
    }));

    res.json({
      thread: {
        id: threadCheck.rows[0].id,
        title: threadCheck.rows[0].title
      },
      conversations: conversations.rows,
      posters: convertedPosters
    });
  } catch (error) {
    console.error('Get thread detail error:', error);
    res.status(500).json({ error: 'Failed to get thread detail' });
  }
});

// 更新主题标题
router.put('/:threadId', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const userId = req.userId;
    const threadId = parseInt(req.params.threadId);
    const { title } = req.body;

    // 验证标题
    const titleValidation = validateThreadTitle(title);
    if (!titleValidation.valid) {
      return res.status(400).json({ error: titleValidation.error });
    }

    // 验证主题属于当前用户并更新
    const result = await query(
      'UPDATE conversation_threads SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING id, title, updated_at',
      [titleValidation.value, threadId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json({
      thread: result.rows[0]
    });
  } catch (error) {
    console.error('Update thread error:', error);
    res.status(500).json({ error: 'Failed to update thread' });
  }
});

// 删除主题
router.delete('/:threadId', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const userId = req.userId;
    const threadId = parseInt(req.params.threadId);

    // 验证主题属于当前用户并删除
    const result = await query(
      'DELETE FROM conversation_threads WHERE id = $1 AND user_id = $2 RETURNING id',
      [threadId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json({
      message: 'Thread deleted successfully'
    });
  } catch (error) {
    console.error('Delete thread error:', error);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

module.exports = router;
