-- 添加对话主题表
CREATE TABLE IF NOT EXISTS conversation_threads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 修改conversations表，添加thread_id字段
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS thread_id INTEGER REFERENCES conversation_threads(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON conversation_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_thread_id ON conversations(thread_id);
