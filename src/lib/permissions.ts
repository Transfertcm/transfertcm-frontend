export type Permission =
  | 'canViewOrders'
  | 'canAssignOrders'
  | 'canValidatePayments'
  | 'canRefundOrders'
  | 'canManageCabins'
  | 'canManageSubscriptions'
  | 'canAccessUv'
  | 'canAccessFraud'
  | 'canViewPromoAgents'
  | 'canAccessComplaints'
  | 'canAccessCallCenter'
  | 'canMessageCabins'
  | 'canViewReports'
  | 'canValidateReports'
  | 'canViewSettings'
  | 'canViewSalaries'

export type Permissions = Partial<Record<Permission, boolean>>

export type Acces = Permission | 'super_admin' | null

const accesParPage: Record<string, Acces> = {
  '/admin/tableau-de-bord': null,
  '/admin/notifications': null,
  '/admin/messagerie': null,
  '/admin/salaires': null,
  '/admin/profil': null,
  '/admin/commandes': 'canViewOrders',
  '/admin/finance': 'canRefundOrders',
  '/admin/cabines': 'canManageCabins',
  '/admin/abonnements': 'canManageSubscriptions',
  '/admin/remunerations': 'canManageSubscriptions',
  '/admin/uv': 'canAccessUv',
  '/admin/fraude': 'canAccessFraud',
  '/admin/agents-promo': 'canViewPromoAgents',
  '/admin/reclamations': 'canAccessComplaints',
  '/admin/support': 'canAccessComplaints',
  '/admin/call-center': 'canAccessCallCenter',
  '/admin/taches': 'canViewReports',
  '/admin/rapports': 'canViewReports',
  '/admin/parametres': 'canViewSettings',
  '/admin/packages': 'canViewSettings',
  '/admin/equipe': 'super_admin',
}

export function accesDePage(chemin: string): Acces {
  const cle = Object.keys(accesParPage)
    .filter((p) => chemin === p || chemin.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length)[0]
  return cle ? accesParPage[cle] : null
}
