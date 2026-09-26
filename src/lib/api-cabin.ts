import axios from 'axios'
import { cabinAuth } from '$lib/stores/cabin-auth.svelte'
import { toast } from '$lib/stores/toast.svelte'
import { goto } from '$app/navigation'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL

const apiCabin = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Injecter le token Bearer automatiquement
apiCabin.interceptors.request.use((config) => {
  const token = cabinAuth.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Désencapsuler la double-couche { data: { data: X } } → { data: X }
apiCabin.interceptors.response.use(
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

    if ((status === 401 || status === 403) && url.endsWith('/cabin/auth/login')) {
      return Promise.reject(err)
    }

    if (status === 401) {
      if (!url.includes('notifications')) {
        cabinAuth.logout()
        // Le message est remis à l'écran de connexion : un toast émis pendant
        // la navigation disparaît avec la page qu'il quitte.
        sessionStorage.setItem('tcm_auth_error', 'Session expirée — veuillez vous reconnecter.')
        goto('/login')
        err.toastAffiche = true
      }
    } else if (status === 403) {
      toast.erreur('Accès refusé', message)
      err.toastAffiche = true
    } else if (status === 422) {
      // Géré localement
    } else if (status >= 500) {
      toast.erreur('Erreur serveur', 'Veuillez réessayer plus tard.')
      err.toastAffiche = true
    } else if (!err.response) {
      if (err.code !== 'ERR_CANCELED') {
        toast.erreur('Connexion impossible', 'Vérifiez votre connexion internet.')
        err.toastAffiche = true
      }
    }

    return Promise.reject(err)
  }
)

export default apiCabin
