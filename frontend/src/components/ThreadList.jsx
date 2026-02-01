import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import './ThreadList.css'

function ThreadList({ threads, currentThreadId, onSelectThread, onCreateThread, onDeleteThread }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [newThreadMessage, setNewThreadMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateThread = async (e) => {
    e.preventDefault()
    if (!newThreadTitle.trim()) {
      setError('请输入主题标题')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/thread/create', {
        title: newThreadTitle.trim(),
        initial_message: newThreadMessage.trim() || null
      })

      onCreateThread(response.data.thread)
      setNewThreadTitle('')
      setNewThreadMessage('')
      setShowCreateForm(false)
    } catch (err) {
      console.error('Create thread error:', err)
      console.error('Error response:', err.response)
      const errorMsg = err.response?.data?.error || err.message || '创建失败，请重试'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteThread = async (threadId, e) => {
    e.stopPropagation()
    if (!window.confirm('确定要删除这个对话主题吗？')) {
      return
    }

    try {
      await api.delete(`/thread/${threadId}`)
      onDeleteThread(threadId)
      if (currentThreadId === threadId) {
        onSelectThread(null)
      }
    } catch (err) {
      alert(err.response?.data?.error || '删除失败')
    }
  }

  return (
    <div className="thread-list-container">
      <div className="thread-list-header">
        <h2>对话主题</h2>
        <button 
          className="new-thread-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          + 新建主题
        </button>
      </div>

      {showCreateForm && (
        <form className="create-thread-form" onSubmit={handleCreateThread}>
          <input
            type="text"
            placeholder="主题标题（例如：科技活动海报）"
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            required
            disabled={loading}
          />
          <textarea
            placeholder="初始消息（可选）"
            value={newThreadMessage}
            onChange={(e) => setNewThreadMessage(e.target.value)}
            rows="2"
            disabled={loading}
          />
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? '创建中...' : '创建'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowCreateForm(false)
                setError('')
              }}
              disabled={loading}
            >
              取消
            </button>
          </div>
        </form>
      )}

      <div className="thread-list">
        {threads.length === 0 ? (
          <div className="empty-state">
            <p>还没有对话主题</p>
            <p>点击"新建主题"开始第一个对话</p>
          </div>
        ) : (
          threads.map(thread => (
            <div
              key={thread.id}
              className={`thread-item ${currentThreadId === thread.id ? 'active' : ''}`}
              onClick={() => onSelectThread(thread.id)}
            >
              <div className="thread-title">{thread.title}</div>
              <div className="thread-meta">
                <span>{thread.message_count} 条消息</span>
                <span className="thread-date">
                  {new Date(thread.updated_at).toLocaleDateString()}
                </span>
              </div>
              <button
                className="delete-thread-btn"
                onClick={(e) => handleDeleteThread(thread.id, e)}
                title="删除主题"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ThreadList
