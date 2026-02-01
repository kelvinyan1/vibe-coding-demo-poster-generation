import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { setToken, setUser } from '../utils/auth'
import './Login.css'

function Login(props) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      console.log('Sending request to:', endpoint, formData)
      const response = await api.post(endpoint, formData)
      console.log('Response received:', response.data)
      
      if (response.data.token && response.data.user) {
        setToken(response.data.token)
        setUser(response.data.user)
        console.log('Token and user saved, navigating to /chat')
        // 先更新父组件的认证状态
        if (props.onLogin) {
          props.onLogin()
        }
        // 然后跳转
        navigate('/chat')
      } else {
        setError('响应数据格式错误')
      }
    } catch (err) {
      console.error('Registration/Login error:', err)
      console.error('Error response:', err.response)
      const errorMessage = err.response?.data?.error || err.message || '操作失败，请重试'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-section">
          <h1>活动海报生成器</h1>
          <p className="subtitle">AI驱动的智能海报设计平台</p>
        </div>
        <div className="toggle-buttons">
          <button 
            className={isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(true)}
          >
            登录
          </button>
          <button 
            className={!isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(false)}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="用户名"
            value={formData.username}
            onChange={handleChange}
            required
          />
          {!isLogin && (
            <input
              type="email"
              name="email"
              placeholder="邮箱"
              value={formData.email}
              onChange={handleChange}
              required
            />
          )}
          <input
            type="password"
            name="password"
            placeholder="密码"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
