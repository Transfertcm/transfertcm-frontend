import type { Acces, Permission, Permissions } from '$lib/permissions'

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
  permissions = $state<Permissions | null>(null)
  loading = $state(false)

  init() {
    if (typeof localStorage === 'undefined') return
    const stored = localStorage.getItem('tcm_admin_auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        this.user = parsed.user
        this.token = parsed.token
        this.permissions = parsed.permissions ?? null
      } catch {}
    }
  }

  login(u: AuthUser, t: string) {
    this.user = u
    this.token = t
    this.permissions = null
    this.sauvegarder()
  }

  logout() {
    this.user = null
    this.token = null
    this.permissions = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tcm_admin_auth')
    }
  }

  update(partial: Partial<AuthUser>) {
    if (!this.user) return
    this.user = { ...this.user, ...partial }
    this.sauvegarder()
  }

  definirPermissions(p: Permissions) {
    this.permissions = p
    this.sauvegarder()
  }

  peut(p: Permission) {
    if (this.user?.role === 'super_admin') return true
    return this.permissions?.[p] === true
  }

  aAcces(acces: Acces) {
    if (acces === null) return true
    if (acces === 'super_admin') return this.user?.role === 'super_admin'
    return this.peut(acces)
  }

  private sauvegarder() {
    if (typeof localStorage === 'undefined' || !this.token) return
    localStorage.setItem('tcm_admin_auth', JSON.stringify({ user: this.user, token: this.token, permissions: this.permissions }))
  }

  getToken() { return this.token }
  getUser()  { return this.user }
  isAuthenticated() { return !!this.token && !!this.user }
}

export const auth = new AuthStore()
