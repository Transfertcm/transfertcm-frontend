export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'service_client'
  | 'chef_agents_promo'
  | 'controleur_cabine'

export interface AuthUser {
  id: string
  email: string
  fullName: string | null
  role: AdminRole
  avatarUrl?: string | null
  initials: string
}

class AuthStore {
  user = $state<AuthUser | null>(null)
  token = $state<string | null>(null)
  loading = $state(false)

  init() {
    if (typeof localStorage === 'undefined') return
    const stored = localStorage.getItem('tcm_admin_auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        this.user = parsed.user
        this.token = parsed.token
      } catch {}
    }
  }

  login(u: AuthUser, t: string) {
    this.user = u
    this.token = t
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tcm_admin_auth', JSON.stringify({ user: u, token: t }))
    }
  }

  logout() {
    this.user = null
    this.token = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tcm_admin_auth')
    }
  }

  update(partial: Partial<AuthUser>) {
    if (!this.user) return
    this.user = { ...this.user, ...partial }
    if (typeof localStorage !== 'undefined' && this.token) {
      localStorage.setItem('tcm_admin_auth', JSON.stringify({ user: this.user, token: this.token }))
    }
  }

  getToken() { return this.token }
  getUser()  { return this.user }
  isAuthenticated() { return !!this.token && !!this.user }
}

export const auth = new AuthStore()
