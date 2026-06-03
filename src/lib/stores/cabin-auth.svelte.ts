export interface CabinUser {
  id: string
  email: string
  cabinName: string
  managerName: string | null
  type: 'standard' | 'premium' | 'basic'
  status: 'active' | 'suspended' | 'paused' | 'inactive'
  uvBalance: number
  dailyOrdersCount: number
  maxDailyOrders: number
  mtnNumber?: string | null
  orangeNumber?: string | null
  city?: string | null
  paused?: boolean
}

class CabinAuthStore {
  user = $state<CabinUser | null>(null)
  token = $state<string | null>(null)

  init() {
    if (typeof localStorage === 'undefined') return
    const stored = localStorage.getItem('tcm_cabin_auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        this.user = parsed.user
        this.token = parsed.token
      } catch {}
    }
  }

  login(u: CabinUser, t: string) {
    this.user = u
    this.token = t
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tcm_cabin_auth', JSON.stringify({ user: u, token: t }))
    }
  }

  logout() {
    this.user = null
    this.token = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tcm_cabin_auth')
    }
  }

  update(partial: Partial<CabinUser>) {
    if (!this.user) return
    this.user = { ...this.user, ...partial }
    if (typeof localStorage !== 'undefined' && this.token) {
      localStorage.setItem('tcm_cabin_auth', JSON.stringify({ user: this.user, token: this.token }))
    }
  }

  getToken() { return this.token }
  isAuthenticated() { return !!this.token && !!this.user }
}

export const cabinAuth = new CabinAuthStore()
