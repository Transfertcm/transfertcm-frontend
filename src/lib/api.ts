import axios from 'axios'
import { auth } from '$lib/stores/auth.svelte'
import { toast } from '$lib/stores/toast.svelte'
import { goto } from '$app/navigation'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3334/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Injecter le token Bearer automatiquement
api.interceptors.request.use((config) => {
  const token = auth.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Désencapsuler la double-couche { data: { data: X, meta: Y } } → { data: X, meta: Y }
api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      res.data = res.data.data
    }
    return res
  },
  (err) => {
    const status = err.response?.status
    const message = err.response?.data?.message ?? 'Une erreur est survenue'
    const url = err.config?.url ?? ''

    if (status === 401) {
      const isCritical = !url.includes('notifications') && !url.includes('messages')
      if (isCritical) {
        auth.logout()
        sessionStorage.setItem('tcm_auth_error', 'Session expirée — veuillez vous reconnecter.')
        goto('/login')
      }
    } else if (status === 403) {
      if (!url.includes('notifications')) {
        toast.error('Accès refusé', message)
      }
    } else if (status === 422) {
      // Géré localement dans chaque page
    } else if (status >= 500) {
      toast.error('Erreur serveur', 'Veuillez réessayer plus tard.')
    }

    return Promise.reject(err)
  }
)

export default api
