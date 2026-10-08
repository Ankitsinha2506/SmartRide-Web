import axios from 'axios'
import { env } from '../config/env'
export const api = axios.create({ baseURL: env.apiUrl, timeout: 15000 })
api.interceptors.request.use((config) => { const token = localStorage.getItem('smartride-token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })
api.interceptors.response.use((response) => response.data.data, (error) => { if (error.response?.status === 401) { localStorage.removeItem('smartride-token'); localStorage.removeItem('smartride-user'); if (location.pathname !== '/login') location.assign('/login') } return Promise.reject(new Error(error.response?.data?.message || 'Something went wrong')) })
