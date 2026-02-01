import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { removeToken, getUser } from '../utils/auth'
import ThreadList from './ThreadList'
import './Chat.css'

function Chat() {
  const [threads, setThreads] = useState([])
  const [currentThreadId, setCurrentThreadId] = useState(null)
  const [currentThread, setCurrentThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()
  const user = getUser()

  useEffect(() => {
    loadThreads()
  }, [])

  useEffect(() => {
    if (currentThreadId) {
      loadThreadDetail(currentThreadId)
    } else {
      setMessages([])
      setCurrentThread(null)
    }
  }, [currentThreadId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadThreads = async () => {
    try {
      const response = await api.get('/thread/list')
      setThreads(response.data.threads || [])
    } catch (err) {
      console.error('Failed to load threads:', err)
    }
  }

  const loadThreadDetail = async (threadId) => {
    try {
      const response = await api.get(`/thread/${threadId}`)
      const data = response.data
      setCurrentThread(data.thread)

      // 构建消息列表
      const messageList = []
      const conversations = data.conversations || []
      const posters = data.posters || []
      
      // 创建海报映射
      const posterMap = {}
      posters.forEach(poster => {
        if (poster.poster_data && typeof poster.poster_data === 'string') {
          try {
            poster.poster_data = JSON.parse(poster.poster_data)
          } catch (e) {
            console.error('Failed to parse poster_data:', e)
          }
        }
        // 假设poster关联到最近的conversation
        posterMap[poster.id] = poster
      })

      conversations.forEach((conv, index) => {
        // 用户消息
        messageList.push({
          id: `conv-${conv.id}`,
          type: 'user',
          text: conv.message,
          conversationId: conv.id,
          timestamp: conv.created_at
        })

        // 助手响应（如果有）
        if (conv.response) {
          let responseData = conv.response
          if (typeof responseData === 'string') {
            try {
              responseData = JSON.parse(responseData)
            } catch (e) {
              // 如果不是JSON，当作普通文本
            }
          }

          // 查找关联的海报，获取标题
          let posterTitle = null
          const relatedPoster = posters.find(p => {
            // 通过 conversation_id 关联
            return p.conversation_id === conv.id
          })
          
          if (relatedPoster) {
            // 优先使用 poster_data 中的标题
            let posterData = relatedPoster.poster_data
            if (typeof posterData === 'string') {
              try {
                posterData = JSON.parse(posterData)
              } catch (e) {
                posterData = null
              }
            }
            
            if (posterData?.elements) {
              const titleElement = posterData.elements.find(el => el.id === 'title')
              if (titleElement?.content) {
                posterTitle = titleElement.content
              }
            }
            
            // 如果没有标题，使用 prompt
            if (!posterTitle && relatedPoster.prompt) {
              posterTitle = relatedPoster.prompt
            }
          }
          
          // 如果还是没有，尝试从 responseData 中获取
          if (!posterTitle && typeof responseData === 'object' && responseData.poster_data) {
            const titleElement = responseData.poster_data.elements?.find(el => el.id === 'title')
            if (titleElement?.content) {
              posterTitle = titleElement.content
            }
          }

          messageList.push({
            id: `response-${conv.id}`,
            type: 'assistant',
            text: typeof responseData === 'string' ? responseData : responseData.message || '海报已生成',
            posterUrl: typeof responseData === 'object' ? responseData.poster_url : null,
            posterTitle: posterTitle,
            isPoster: true,
            conversationId: conv.id,
            timestamp: conv.created_at
          })
        }
      })

      setMessages(messageList)
    } catch (err) {
      console.error('Failed to load thread detail:', err)
      setError('加载对话失败')
    }
  }

  const handleSelectThread = (threadId) => {
    setCurrentThreadId(threadId)
  }

  const handleCreateThread = (newThread) => {
    setThreads(prev => [newThread, ...prev])
    setCurrentThreadId(newThread.id)
  }

  const handleDeleteThread = (threadId) => {
    setThreads(prev => prev.filter(t => t.id !== threadId))
    if (currentThreadId === threadId) {
      setCurrentThreadId(null)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading || !currentThreadId) return

    const userMessage = input.trim()
    setInput('')
    setError('')
    setLoading(true)

    // 添加用户消息到UI
    const tempUserMessage = {
      id: `temp-user-${Date.now()}`,
      type: 'user',
      text: userMessage,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      // 在主题中创建对话消息
      const convResponse = await api.post('/conversation/new', {
        message: userMessage,
        thread_id: currentThreadId
      })
      const conversationId = convResponse.data.conversation.id

      // 生成海报
      const posterResponse = await api.post('/poster/generate', {
        prompt: userMessage,
        conversation_id: conversationId
      })

      const poster = posterResponse.data

      // 提取海报标题
      let posterTitle = userMessage
      if (poster.poster_data?.elements) {
        const titleElement = poster.poster_data.elements.find(el => el.id === 'title')
        if (titleElement?.content) {
          posterTitle = titleElement.content
        }
      }

      // 添加助手响应
      const assistantMessage = {
        id: `response-${conversationId}`,
        type: 'assistant',
        text: `海报已生成！${poster.poster_data?.message || ''}`,
        posterUrl: poster.poster_url,
        posterTitle: posterTitle,
        isPoster: true,
        conversationId: conversationId,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMessage])

      // 更新线程列表（刷新消息数）
      loadThreads()
    } catch (err) {
      setError(err.response?.data?.error || '生成失败，请重试')
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        text: `抱歉，生成海报时出现错误：${err.response?.data?.error || '未知错误'}`,
        isError: true,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-layout">
      <ThreadList
        threads={threads}
        currentThreadId={currentThreadId}
        onSelectThread={handleSelectThread}
        onCreateThread={handleCreateThread}
        onDeleteThread={handleDeleteThread}
      />

      <div className="chat-container">
        <div className="chat-header">
          <div className="header-left">
            <h1>活动海报生成器</h1>
            {currentThread && (
              <span className="thread-title-display">{currentThread.title}</span>
            )}
          </div>
          <div className="header-right">
            <span className="username">{user?.username}</span>
            <button onClick={handleLogout} className="logout-btn">退出</button>
          </div>
        </div>

        <div className="chat-messages">
          {!currentThreadId ? (
            <div className="welcome-message">
              <h3>欢迎使用活动海报生成器</h3>
              <p>选择一个对话主题，或创建新主题开始生成海报。</p>
              <p className="hint">每个主题可以多轮对话，直到生成满意的海报。</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="welcome-message">
              <h3>开始你的第一轮对话</h3>
              <p>描述你想要的海报内容，系统将为你生成。</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-content">
                  {msg.type === 'user' ? (
                    <div className="user-bubble">{msg.text}</div>
                  ) : (
                    <div className="assistant-bubble">
                      <p>{msg.text}</p>
                      {msg.posterUrl && (
                        <div className="poster-preview">
                          <img 
                            src={msg.posterUrl} 
                            alt={msg.posterTitle || msg.text || "Generated poster"} 
                            title={msg.posterTitle || msg.text || "Generated poster"}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="message assistant">
              <div className="assistant-bubble">
                <div className="loading">正在生成海报...</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="chat-input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentThreadId ? "继续描述你想要的海报内容..." : "请先选择一个对话主题"}
            rows="2"
            disabled={loading || !currentThreadId}
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || loading || !currentThreadId}
          >
            {loading ? '生成中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat
