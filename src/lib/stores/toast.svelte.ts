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

  private minuteries = new Map<string, ReturnType<typeof setTimeout>>()

  ajouter(toast: Omit<Toast, 'id'>) {
    const duree = toast.duree ?? 4000

    // Un même message déclenché deux fois de suite (l'intercepteur puis le
    // catch de la page) ne doit pas empiler deux fois la même carte : on
    // relance la minuterie de celle qui est déjà à l'écran.
    const existant = this.toasts.find(
      (t) => t.type === toast.type && t.titre === toast.titre && t.message === toast.message
    )
    if (existant) {
      this.armer(existant.id, duree)
      return existant.id
    }

    const id = Math.random().toString(36).slice(2)
    // Au-delà de quatre cartes, la pile déborde de l'écran.
    const pile = [...this.toasts, { ...toast, id }]
    for (const perime of pile.slice(0, -4)) this.annuler(perime.id)
    this.toasts = pile.slice(-4)
    this.armer(id, duree)
    return id
  }

  private armer(id: string, duree: number) {
    this.annuler(id)
    if (duree > 0) {
      this.minuteries.set(id, setTimeout(() => this.supprimer(id), duree))
    }
  }

  private annuler(id: string) {
    const m = this.minuteries.get(id)
    if (m) {
      clearTimeout(m)
      this.minuteries.delete(id)
    }
  }

  supprimer(id: string) {
    this.annuler(id)
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
