const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { query, isConnected } = require('../config/database');

// 所有路由需要认证
router.use(authenticate);

// 调用算法服务生成海报
async function callAlgorithmService(prompt) {
  const algorithmUrl = process.env.ALGORITHM_SERVICE_URL || 'http://localhost:8000';
  
  try {
    const response = await axios.post(`${algorithmUrl}/generate`, {
      prompt: prompt
    }, {
      timeout: 30000 // 30秒超时
    });
    return response.data;
  } catch (error) {
    console.error('Algorithm service error:', error.message);
    // 如果算法服务不可用，返回 dummy 数据
    return {
      poster_url: 'https://via.placeholder.com/800x1200/4A90E2/FFFFFF?text=Dummy+Poster',
      poster_data: {
        prompt: prompt,
        status: 'dummy',
        message: 'Algorithm service unavailable, returning dummy data'
      }
    };
  }
}

// 生成海报
router.post('/generate', async (req, res) => {
  try {
    const userId = req.userId;
    const { prompt, conversation_id } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 调用算法服务
    const algorithmResult = await callAlgorithmService(prompt);

    // 保存到数据库
    let posterId = null;
    if (isConnected()) {
      try {
        const result = await query(
          'INSERT INTO posters (user_id, conversation_id, prompt, poster_url, poster_data) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [userId, conversation_id || null, prompt, algorithmResult.poster_url, JSON.stringify(algorithmResult.poster_data)]
        );
        posterId = result.rows[0].id;

        // 如果有 conversation_id，更新对话响应，并更新主题更新时间
        if (conversation_id) {
          await query(
            'UPDATE conversations SET response = $1 WHERE id = $2',
            [JSON.stringify(algorithmResult), conversation_id]
          );
          
          // 更新主题的更新时间
          const threadResult = await query(
            'SELECT thread_id FROM conversations WHERE id = $1',
            [conversation_id]
          );
          if (threadResult.rows.length > 0 && threadResult.rows[0].thread_id) {
            await query(
              'UPDATE conversation_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
              [threadResult.rows[0].thread_id]
            );
          }
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // 即使数据库保存失败，也返回结果
      }
    }

    res.json({
      id: posterId,
      prompt: prompt,
      poster_url: algorithmResult.poster_url,
      poster_data: algorithmResult.poster_data,
      message: isConnected() ? 'Poster generated successfully' : 'Poster generated (database unavailable)'
    });
  } catch (error) {
    console.error('Generate poster error:', error);
    res.status(500).json({ error: 'Failed to generate poster' });
  }
});

// 获取用户的海报列表
router.get('/list', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({ error: 'Database service unavailable' });
    }

    const userId = req.userId;
    const result = await query(
      'SELECT id, prompt, poster_url, poster_data, created_at FROM posters WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    res.json({
      posters: result.rows
    });
  } catch (error) {
    console.error('Get poster list error:', error);
    res.status(500).json({ error: 'Failed to get poster list' });
  }
});

module.exports = router;
