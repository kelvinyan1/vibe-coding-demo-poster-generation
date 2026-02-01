// 输入验证工具函数

// 验证用户名
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: '用户名不能为空' };
  }
  
  if (username.length < 3 || username.length > 20) {
    return { valid: false, error: '用户名长度必须在 3-20 个字符之间' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: '用户名只能包含字母、数字和下划线' };
  }
  
  return { valid: true };
};

// 验证邮箱
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: '邮箱不能为空' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: '邮箱格式不正确' };
  }
  
  if (email.length > 100) {
    return { valid: false, error: '邮箱长度不能超过 100 个字符' };
  }
  
  return { valid: true };
};

// 验证密码（仅检查长度，不检查复杂度）
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: '密码不能为空' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: '密码长度至少为 6 个字符' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: '密码长度不能超过 128 个字符' };
  }
  
  return { valid: true };
};

// 验证主题标题
const validateThreadTitle = (title) => {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: '主题标题不能为空' };
  }
  
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: '主题标题不能为空' };
  }
  
  if (trimmed.length > 200) {
    return { valid: false, error: '主题标题长度不能超过 200 个字符' };
  }
  
  return { valid: true, value: trimmed };
};

// 验证消息内容
const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: '消息内容不能为空' };
  }
  
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: '消息内容不能为空' };
  }
  
  if (trimmed.length > 5000) {
    return { valid: false, error: '消息内容长度不能超过 5000 个字符' };
  }
  
  return { valid: true, value: trimmed };
};

module.exports = {
  validateUsername,
  validateEmail,
  validatePassword,
  validateThreadTitle,
  validateMessage
};
