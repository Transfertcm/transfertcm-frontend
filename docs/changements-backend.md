# Changements backend à répercuter dans le back-office

**Pour :** l'équipe front du back-office TransfertCM
**Date :** 28 septembre 2026
**Contexte :** réponse à `docs/corrections-backend.md`. Les corrections sont dans une pile de 4 PR du dépôt backend, qui seront mergées ensemble :

| PR | Contenu |
|---|---|
| #16 | Sécurité : permissions par rôle, support, désactivation, sessions, salaires |
| #17 | Fonctions cassées et chiffres faux (P1) + réconciliation finance |
| #18 | Contrat d'API (P2) |
| #19 | Fonctions P3 à faible risque |

Le document est en trois parties : ce qu'il **faut** changer au merge, ce que vous **pouvez remettre**, et les **nouveautés** disponibles.

---

## 1. À changer au moment du merge

Une seule modification casse sans intervention. Les autres évitent des écrans incohérents.

### 1.1 Page Fraude : liste noire (bloquant)

La liste noire perd sa triple enveloppe. Après la normalisation de `api.ts`, elle arrive comme toutes les listes.

```ts
// avant
const d = blRes.data?.data
blacklist = Array.isArray(d?.data) ? d.data : []
metaBl = d?.meta ?? null

// après
blacklist = Array.isArray(blRes.data?.data) ? blRes.data.data : []
metaBl = blRes.data?.meta ?? null
```

### 1.2 Accès refusés (403) selon les permissions

Toutes les routes vérifient désormais les permissions. Un compte au rôle limité reçoit un **403** dès qu'il appelle une route hors de son périmètre, et `api.ts` affiche alors le toast « Accès refusé ».

- **Menus** : ceux du Sidebar correspondent déjà aux modèles de rôle. Rien ne change pour un compte non personnalisé.
- **Pages à vérifier avec un compte limité** : les pages qui appellent plusieurs routes. C'est surtout le cas du tableau de bord, du détail d'une commande (scores, remboursement), des cabines (UV) et de la messagerie. Masquez les actions que le compte n'a pas le droit de faire (voir 3.1).
- **Liste des cabines** (`GET /cabins`, `/cabins/online`) : elle reste lisible par tous les rôles qui en ont besoin (attribution, UV, réclamations, abonnements, messagerie cabines). Seules les modifications exigent la gestion des cabines.

### 1.3 Compte désactivé ou session révoquée

Un admin désactivé, ou dont la session a été révoquée, reçoit un **401** sur la requête suivante. `api.ts` le déconnecte déjà : rien à faire, sauf éventuellement afficher le `message` renvoyé (« Compte désactivé… ») sur l'écran de connexion.

### 1.4 Champs renommés, anciens noms conservés pour l'instant

| Où | Ancien champ | Nouveau champ | Remarque |
|---|---|---|---|
| Stats fraude | `blockedOrders` | `rejectedOrCancelledOrders` | même valeur ; l'ancien sera supprimé |
| Tableau de bord `payments` | `totalRevenue` | `totalCollected` | montant encaissé frais compris ; l'ancien sera supprimé |
| Dashboard financier `totals` | `totalRevenue` | `totalCollected` | idem |

### 1.5 Chiffres qui changent de sens

- `orders.totals.totalAmount` (tableau de bord) et `totalAmount` des stats cabine ne comptent plus que les commandes **complétées et payées**. Les montants baissent donc : c'est normal, les commandes annulées ou non payées ne sont plus comptées.
- `orders.totals.total` compte toujours toutes les commandes créées. Le nouveau champ `orders.totals.completed` donne le nombre de commandes complétées et payées.
- **Nouveau** : `feesCollected` donne les frais perçus, dans `payments` (tableau de bord), dans `totals` (financier) et dans les stats cabine.

---

## 2. Ce que vous pouvez remettre

Reprise de la section 5 de `corrections-backend.md`.

| Élément retiré | État backend | Comment le remettre |
|---|---|---|
| « Nouveau mot de passe » dans la modification d'un admin | ✅ corrigé (#17) | `PUT /admin/team/:id` avec `password` : le mot de passe fonctionne à la connexion. |
| Bloc « Sessions actives » et « Révoquer » du profil | ✅ corrigé (#16) | Voir 3.3. |
| Réactivation des forfaits, filtre « Désactivés » | ✅ corrigé (#17) | Lister avec `GET /admin/packages?active=true\|false` (champ `isActive`), réactiver avec `PUT /packages/:id` `{ isActive: true }`. |
| Filtre « En pause » des cabines | ✅ ajouté (#19) | `GET /cabins?paused=true` |
| Filtres « Expirés » des abonnements | ✅ possible (#17) | Un job passe désormais les abonnements échus en `expired` toutes les 15 min : `GET /admin/subscriptions?status=expired` renvoie des résultats. |
| Filtre « Suspendus » des abonnements | ⚠️ inchangé | La suspension est un statut de la cabine, pas de l'abonnement : utiliser `GET /cabins?status=suspended`. |
| Champs de cabine : montant max, quota, notification, raison de suspension, renouvellement auto | ✅ exposés (#18) | `GET /cabins` et `/cabins/:id` renvoient `maxOrderAmount`, `totalOrdersQuota`, `quotaBlocked`, `notificationType`, `autoRenew`, `suspensionReason`, `suspensionDate`, `pausedAt`, `reactivatedAt`. `autoRenew` n'a encore aucun effet : l'afficher en lecture seule. |
| Recherche libre des commandes | ✅ ajoutée (#19) | `GET /admin/orders?search=` accepte une partie du code commande ou d'un numéro (client ou bénéficiaire). |
| Section « Vérifier un reçu (OCR) » | ❌ toujours un bouchon | Laisser retiré. |
| Onglet « Plans », choix du plan à la création d'une cabine | ❌ non implémenté | Laisser retiré (décision métier en attente). |
| Type de cabine modifiable | ❌ pas de route | Laisser en lecture seule. |
| Frais en pourcentage, par réseau, Viettel Cash et Wave | ❌ inchangé | Un seul frais fixe en XAF. Une valeur non entière est maintenant refusée en 422. |

---

## 3. Nouveautés disponibles

### 3.1 Permissions de l'admin connecté

`GET /account/profile` renvoie :

```json
{
  "permissions": {
    "canViewOrders": true, "canAssignOrders": true, "canValidatePayments": true,
    "canRefundOrders": false, "canManageCabins": true, "canManageSubscriptions": true,
    "canAccessUv": false, "canAccessFraud": false, "canViewPromoAgents": false,
    "canAccessComplaints": false, "canAccessCallCenter": false, "canMessageCabins": false,
    "canViewReports": false, "canValidateReports": false, "canViewSettings": false,
    "canViewSalaries": false
  },
  "permissionsCustomized": false
}
```

Ce sont les permissions **effectives** : celles du rôle, ou celles personnalisées par le super_admin. Le Sidebar et les boutons d'action peuvent s'appuyer dessus plutôt que sur des listes de rôles écrites en dur. C'est nécessaire dès qu'un admin est personnalisé.

Voici à quoi sert chaque permission :

| Permission | Écrans et actions |
|---|---|
| `canViewOrders` | Commandes : liste, détail, création, changement de statut, lien de paiement |
| `canAssignOrders` | Attribuer une commande, voir les scores des cabines |
| `canValidatePayments` | Valider un paiement manuellement |
| `canRefundOrders` | Rembourser ; page de réconciliation finance |
| `canManageCabins` | Cabines : création, modification, suspension, pause, UV de la cabine, pièce d'identité |
| `canManageSubscriptions` | Abonnements, factures, demandes d'upgrade, rémunérations des cabines |
| `canAccessUv` | Page UV |
| `canAccessFraud` | Page Fraude |
| `canViewPromoAgents` | Agents promo |
| `canAccessComplaints` | Réclamations et support client |
| `canAccessCallCenter` | Call center |
| `canMessageCabins` | Onglet messagerie avec les cabines |
| `canViewReports` | Tâches, rapports, budgets |
| `canValidateReports` | Valider ou rejeter un rapport, approuver un budget |
| `canViewSettings` | Paramètres, frais, forfaits (écriture), diffusion de notification |
| `canViewSalaries` | Configuration des salaires, enregistrement d'un paiement, sessions et paiements de toute l'équipe |

Restent ouverts à tous : le tableau de bord, les notifications, la messagerie interne (admins et groupe), la recherche globale, ses propres salaires et le profil. La gestion de l'équipe reste réservée au super_admin.

Par défaut, un `admin` a toutes les permissions sauf `canViewSalaries`.

### 3.2 Écran « Permissions » dans l'équipe (super_admin)

| Route | Effet |
|---|---|
| `GET /admin/team/:id/permissions` | `{ userId, role, customized, permissions, roleDefaults, labels }` ; `labels` donne un libellé français par permission |
| `PUT /admin/team/:id/permissions` | Corps partiel, ex. `{ "canAccessFraud": true }` ; renvoie le même objet |
| `DELETE /admin/team/:id/permissions` | Revient aux permissions par défaut du rôle |

Changer le rôle d'un admin efface sa personnalisation. Les permissions d'un super_admin ne se modifient pas (403).

### 3.3 Sessions actives du profil

- **Liste** : `GET /account/sessions` renvoie `[{ id, userAgent, ipAddress: null, createdAt, lastUsedAt, expiresAt, isExpired, isCurrent }]`. Elle est aussi disponible dans `activeSessions` du profil, limitée à 5.
- **Révoquer une session** : `DELETE /account/sessions/:id` déconnecte réellement l'appareil concerné.
- **Déconnecter les autres appareils** : `DELETE /account/sessions` garde la session courante.
- **Changement de mot de passe** : il déconnecte les autres appareils. Le message renvoyé l'indique.

### 3.4 Réconciliation finance (nouvelle page)

`GET /admin/finance/reconciliation?category=to_deliver|to_refund|refunded&date_from=AAAA-MM-JJ&date_to=AAAA-MM-JJ&page=&per_page=` (permission `canRefundOrders`)

| Catégorie | Contenu |
|---|---|
| `to_deliver` (défaut) | Commandes payées, pas encore livrées |
| `to_refund` | Commandes payées puis rejetées, annulées ou expirées, pas encore remboursées |
| `refunded` | Commandes remboursées |

La réponse contient `{ data: [commandes], meta, summary, category }`, où `summary` vaut `{ to_deliver: { count, amount }, to_refund: {…}, refunded: {…} }`. Le montant est le total encaissé, frais compris ; pour `refunded`, c'est le montant remboursé. Les dates filtrent sur la date de paiement.

Suggestion : trois onglets avec les compteurs de `summary`, et un bouton « Rembourser » sur l'onglet `to_refund` (`POST /admin/orders/:id/refund`).

### 3.5 Autres nouveautés

| Sujet | Détail |
|---|---|
| Messages de validation | Les 422 arrivent en français avec des libellés lisibles (« Le champ mot de passe doit contenir au moins 8 caractères »). La traduction au cas par cas du front peut être retirée. `field` et `rule` sont inchangés. |
| Création d'un admin avec un email pris | **409** avec `message` (au lieu d'un 200 avec `error`). |
| Identifiant invalide dans une URL | **404** au lieu de 500, sur toute l'API. |
| Recherche globale | Ne renvoie plus d'erreur 500. Chaque résultat a un `status`. Les URL des réclamations et des agents promo pointent vers leur liste. Les résultats sont filtrés selon les permissions. |
| Messagerie | Conversations : `otherParticipantId`, `otherParticipantName`, `user1Name`, `user2Name`. Messages directs et de groupe : `senderName`. Plus besoin d'appeler `/admin/team`. |
| Call center | `calledByName` dans le journal, `agentName` dans `byAgent` des stats. |
| Historique UV | `cabinId`, `cabinName`, `simCardId`. La validation d'une recharge remplit maintenant les soldes avant et après, et débite la SIM choisie. |
| Factures | `cabinName` dans la liste. **Nouveau** : `PATCH /admin/subscriptions/invoices/:id/status` avec `{ status: paid\|overdue\|cancelled, paymentMethod?, paymentReference? }` ; une facture en attente peut être marquée payée, en retard ou annulée, et une facture en retard payée ou annulée. |
| Agents promo | `totalReferrals` et `totalOrders` dans la liste ; `idNumber` dans la fiche seulement ; recherche `?search=`. |
| Équipe | `GET /admin/team` n'inclut plus les comptes cabine. |
| Forfaits | Le type `credit` est accepté à la création. L'app mobile n'affiche pas encore ces forfaits. |
| Frais | Un nouveau montant s'applique immédiatement (plus d'attente de 5 minutes). |
| Vérification de numéro | Un numéro en liste noire renvoie `recommendation: "block"` et `riskScore: 100`. |
| Support | Le compteur non lu repasse à 0 quand un admin ouvre la conversation. |
| Notifications | Une seule notification par nouvelle commande. La notification « Nouvelle réclamation » affiche un libellé français. |
| Salaires | `GET /admin/salary/sessions/active` renvoie la session en cours ou `null`, ce qui évite de chercher dans la liste. Sans `canViewSalaries`, les listes ne contiennent que les sessions et paiements de l'admin connecté. |
| Villes | `DELETE /admin/settings/city-assignments/:id` |
| Profil | `PUT /account/profile` accepte `phone: null` et `avatarUrl: null` pour les vider. |
| Diffusion aux cabines | `POST /admin/notifications/broadcast` exige `title` (3 caractères min.) et `message` ; `type` vaut `info`, `warning` ou `urgent`. |

### 3.6 Normalisation de `api.ts`

Toutes les routes admin utilisent maintenant `{ data, metadata }`. La normalisation reste utile, parce que des réponses « message seul » gardent la forme `{ data: { message } }`, mais elle n'a plus à gérer les doubles et triples enveloppes. Rien ne presse pour la simplifier.

---

## 4. À tester après le merge

1. Connexion avec un compte de chaque rôle (`admin`, `service_client`, `chef_agents_promo`, `controleur_cabine`) : parcourir les pages du menu et vérifier qu'aucun toast « Accès refusé » n'apparaît sur une page autorisée.
2. Page Fraude : la liste noire s'affiche.
3. Désactiver un admin connecté dans un autre navigateur : il est déconnecté à sa requête suivante.
4. Tableau de bord : les montants excluent les commandes annulées et non payées.
5. Lien de paiement en prod : non vérifiable en local (fournisseur simulé).
