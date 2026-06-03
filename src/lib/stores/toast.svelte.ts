export type TypeToast = 'succes' | 'erreur' | 'avertissement' | 'info'

export interface Toast {
  id: string
  type: TypeToast
  titre: string
  message?: string
  duree?: number
}

class ToastStore {
  toasts = $state<Toast[]>([])

  ajouter(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).slice(2)
    const duree = toast.duree ?? 4000
    this.toasts = [...this.toasts, { ...toast, id }]
    if (duree > 0) setTimeout(() => this.supprimer(id), duree)
    return id
  }

  supprimer(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
  }

  succes(titre: string, message?: string) {
    return this.ajouter({ type: 'succes', titre, message })
  }
  erreur(titre: string, message?: string) {
    return this.ajouter({ type: 'erreur', titre, message, duree: 6000 })
  }
  avertissement(titre: string, message?: string) {
    return this.ajouter({ type: 'avertissement', titre, message })
  }
  info(titre: string, message?: string) {
    return this.ajouter({ type: 'info', titre, message })
  }

  // Alias anglais pour compatibilité avec api.ts
  error(titre: string, message?: string) { return this.erreur(titre, message) }
  success(titre: string, message?: string) { return this.succes(titre, message) }
}

export const toast = new ToastStore()
