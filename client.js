import axios from 'axios'

// One axios instance: attaches the JWT and logs the user out on 401.
const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || '') + '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const onAuthPage = ['/login', '/register'].includes(window.location.pathname)
    if (err.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem('token')
      window.location.assign('/login')
    }
    return Promise.reject(err)
  },
)

export const errorMessage = (err) => err.response?.data?.error || err.message || 'Something went wrong'
export default api
