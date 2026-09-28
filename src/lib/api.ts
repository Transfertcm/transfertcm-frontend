import axios from 'axios'
import { auth } from '$lib/stores/auth.svelte'
import { toast } from '$lib/stores/toast.svelte'
import { goto } from '$app/navigation'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL

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

// L'API renvoie tantôt { data: { data: X, meta } }, tantôt { data: X, metadata } :
// les deux sont ramenées à { data: X, meta }.
function normaliser(body: any) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !('data' in body)) return body
  const { data, metadata, meta, ...reste } = body
  const doubleEnveloppe =
    data && typeof data === 'object' && !Array.isArray(data) && 'data' in data &&
    metadata === undefined && meta === undefined && Object.keys(reste).length === 0
  if (doubleEnveloppe) return data
  return { ...reste, data, meta: meta ?? metadata }
}

api.interceptors.response.use(
  (res) => {
    res.data = normaliser(res.data)
    return res
  },
  (err) => {
    const status = err.response?.status
    const message = err.response?.data?.message ?? 'Une erreur est survenue'
    const url = err.config?.url ?? ''

    if ((status === 401 || status === 403) && url.endsWith('/auth/login')) {
      return Promise.reject(err)
    }

    if (status === 401) {
      const isCritical = !url.includes('notifications') && !url.includes('messages')
      if (isCritical) {
        auth.logout()
        sessionStorage.setItem('tcm_auth_error', 'Session expirée — veuillez vous reconnecter.')
        goto('/login')
        err.toastAffiche = true
      }
    } else if (status === 403) {
      if (!url.includes('notifications')) {
        toast.error('Accès refusé', message)
        err.toastAffiche = true
      }
    } else if (status === 422) {
      // Géré localement dans chaque page
    } else if (status >= 500) {
      toast.error('Erreur serveur', 'Veuillez réessayer plus tard.')
      err.toastAffiche = true
    } else if (!err.response) {
      // Serveur injoignable ou requête annulée : sans réponse, `status` est
      // indéfini et aucune branche ci-dessus ne se déclenchait.
      if (err.code !== 'ERR_CANCELED') {
        toast.error('Connexion impossible', 'Vérifiez votre connexion internet.')
        err.toastAffiche = true
      }
    }

    return Promise.reject(err)
  }
)

export default api
