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

    // 处理 poster_url：如果是相对路径，转换为后端代理路径
    let finalPosterUrl = algorithmResult.poster_url;
    if (finalPosterUrl && finalPosterUrl.startsWith('/api/poster/')) {
      // 提取 poster_id，转换为后端代理路径
      const posterIdMatch = finalPosterUrl.match(/\/api\/poster\/([^\/]+)\/image/);
      if (posterIdMatch) {
        finalPosterUrl = `/api/poster/image/${posterIdMatch[1]}`;
        // 同时更新数据库中保存的 URL
        if (posterId) {
          await query(
            'UPDATE posters SET poster_url = $1 WHERE id = $2',
            [finalPosterUrl, posterId]
          );
        }
      }
    }

    res.json({
      id: posterId,
      prompt: prompt,
      poster_url: finalPosterUrl,
      poster_data: algorithmResult.poster_data,
      message: isConnected() ? 'Poster generated successfully' : 'Poster generated (database unavailable)'
    });
  } catch (error) {
    console.error('Generate poster error:', error);
    res.status(500).json({ error: 'Failed to generate poster' });
  }
});

// 转换 poster_url 为后端代理路径的辅助函数
function convertPosterUrl(url) {
  if (!url) return url;
  if (url.startsWith('/api/poster/') && url.includes('/image')) {
    const posterIdMatch = url.match(/\/api\/poster\/([^\/]+)\/image/);
    if (posterIdMatch) {
      return `/api/poster/image/${posterIdMatch[1]}`;
    }
  }
  return url;
}

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

    // 转换所有 poster_url
    const posters = result.rows.map(poster => ({
      ...poster,
      poster_url: convertPosterUrl(poster.poster_url)
    }));

    res.json({
      posters: posters
    });
  } catch (error) {
    console.error('Get poster list error:', error);
    res.status(500).json({ error: 'Failed to get poster list' });
  }
});

// 代理算法服务的图片请求
router.get('/image/:posterId', async (req, res) => {
  try {
    const { posterId } = req.params;
    const algorithmUrl = process.env.ALGORITHM_SERVICE_URL || 'http://localhost:8000';
    
    // 转发请求到算法服务
    const imageUrl = `${algorithmUrl}/poster/${posterId}/image`;
    
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 10000
      });
      
      // 设置响应头
      res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // 转发图片流
      response.data.pipe(res);
    } catch (error) {
      console.error('Failed to fetch image from algorithm service:', error.message);
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Proxy image error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

module.exports = router;
