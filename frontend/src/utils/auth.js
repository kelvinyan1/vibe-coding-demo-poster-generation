const TOKEN_KEY = 'poster_token'
const USER_KEY = 'poster_user'

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY)
  return userStr ? JSON.parse(userStr) : null
}
