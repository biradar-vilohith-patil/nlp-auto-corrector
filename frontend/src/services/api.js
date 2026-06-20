/**
 * services/api.js
 * ─────────────────
 * Axios wrapper for all WriteRight endpoints.
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  res => res,
  err => {
    const message =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)

export async function correctText(text) {
  // Removed all pipeline toggles for a cleaner, unified NLP pass
  const { data } = await http.post('/api/correct', { text })
  return data
}

export async function refineText(text, style = 'professional') {
  const { data } = await http.post('/api/refine', { text, style })
  return data
}

export async function getHealth() {
  const { data } = await http.get('/api/health')
  return data
}

export async function getStats() {
  const { data } = await http.get('/api/stats')
  return data
}