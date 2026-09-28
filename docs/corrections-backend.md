# Corrections backend demandées par le back-office

**Pour :** l'équipe backend TransfertCM (AdonisJS, dépôt `transfertcm`)
**Date :** 28 septembre 2026
**Contexte :** le back-office web a été audité puis corrigé côté front. Les points ci-dessous ne peuvent pas être réglés dans le front : ils demandent un changement dans l'API.

Chaque point a été constaté soit en appelant l'API en local (base de test, code à jour avec `main`, commit `e9e54a6`), soit en lisant le code. Les chemins de fichiers sont relatifs à la racine du dépôt backend.

Priorités :

- **P0 :** sécurité, à corriger avant tout.
- **P1 :** donnée fausse ou fonction cassée, visible par les utilisateurs.
- **P2 :** incohérence de contrat. Le front la contourne pour l'instant, à nettoyer.
- **P3 :** amélioration.

## Sommaire

1. [P0 — Sécurité](#1-p0--sécurité)
2. [P1 — Fonctions cassées ou données fausses](#2-p1--fonctions-cassées-ou-données-fausses)
3. [P2 — Contrat d'API incohérent](#3-p2--contrat-dapi-incohérent)
4. [P3 — Fonctions à compléter](#4-p3--fonctions-à-compléter)
5. [Ce que le front a retiré en attendant](#5-ce-que-le-front-a-retiré-en-attendant)

---

## 1. P0 — Sécurité

### 1.1 Les rôles admin ne sont vérifiés que pour `/admin/team`

- **Constat :** dans `start/routes/admin.routes.ts`, `middleware.requireRole` n'est appliqué qu'au groupe `/admin/team`. Toutes les autres routes `/admin/*` et `/cabins/*` acceptent n'importe quel compte admin connecté. Le back-office masque des menus selon le rôle, mais il suffit de connaître l'URL.
- **Exemples :**
  - Un compte `service_client` peut modifier les frais de service (`PUT /admin/settings/transaction_fees`).
  - Il peut aussi valider une recharge UV (`POST /admin/uv/requests/:id/validate`) ou rembourser une commande.
  - Un compte `chef_agents_promo` a accès aux commandes, aux cabines et aux paramètres.
- **Attendu :** appliquer `requireRole`, ou les permissions de `/account/profile`, route par route, selon la matrice ci-dessous. C'est celle affichée dans l'écran Équipe du back-office.

| Rôle | Périmètre attendu |
|---|---|
| `super_admin` | Tout, y compris l'équipe |
| `admin` | Tout sauf la gestion de l'équipe |
| `service_client` | Réclamations, messagerie, support, call center |
| `chef_agents_promo` | Agents promo |
| `controleur_cabine` | Cabines, commandes, abonnements |

Le tableau de bord, les notifications, les salaires (ses propres sessions) et le profil restent ouverts à tous les rôles.

### 1.2 Messages du support lisibles sans être connecté

- **Fichier :** `start/routes/support.routes.ts`
- **Constat :** `GET /support/conversations/:id/messages` et `POST /support/conversations/:id/messages` sont déclarées hors du groupe `middleware.auth()`. Il suffit de l'identifiant d'une conversation pour en lire les messages, qui contiennent les numéros et les échanges des clients. À vérifier aussi : l'envoi d'un message sans authentification.
- **Attendu :** accès réservé à un admin authentifié ou au membre propriétaire de la conversation.

### 1.3 Désactiver un admin ne coupe pas son accès

- **Fichier :** `app/middleware/auth_middleware.ts` et `app/controllers/admin/team_controller.ts`
- **Constat :** passer un compte en « Désactivé » bloque seulement la prochaine connexion. Le jeton déjà émis continue de fonctionner sur toutes les routes, sauf `/admin/team`.
- **Attendu :** à la désactivation, révoquer ses jetons d'accès, ou vérifier `isActive` dans le middleware d'authentification.

### 1.4 Changer de mot de passe ne révoque rien

- **Fichier :** `app/controllers/admin/profile_controller.ts`
- **Constat :**
  - `POST /account/change-password` ne révoque pas les autres jetons d'accès.
  - La table `admin_sessions` n'est alimentée nulle part : `GET /account/sessions` renvoie toujours une liste vide, et « révoquer une session » n'invalide aucun jeton.
- **Attendu :** au changement de mot de passe, révoquer les autres jetons. Soit brancher réellement `admin_sessions` sur les jetons, soit retirer ces routes.

### 1.5 Salaires : routes sensibles ouvertes à tous

- **Fichier :** `app/controllers/admin/salary_controller.ts`
- **Constat :**
  - N'importe quel admin peut enregistrer un paiement de salaire (`POST /admin/salary/payments`) ou modifier la configuration (`PUT /admin/salary/config`).
  - Chacun peut aussi lister les sessions et les paiements de tous les autres (`GET /admin/salary/sessions`, `GET /admin/salary/payments`).
- **Attendu :**
  - Réserver la configuration et les paiements au `super_admin`.
  - Filtrer les listes sur l'utilisateur connecté pour les autres rôles.

---

## 2. P1 — Fonctions cassées ou données fausses

### 2.1 Recherche globale en erreur 500

- **Fichier :** `app/controllers/admin/search_controller.ts`
- **Constat :**
  - `GET /admin/search?q=…` renvoie 500 : `LOWER(id) LIKE ?` sur une colonne `uuid` provoque l'erreur « function lower(uuid) does not exist ».
  - Une fois ce point corrigé, la requête sur `customer_complaints` utilise une colonne `subject` qui n'existe pas (colonnes réelles : `complaint_type`, `description`…).
- **Attendu :**
  - Écrire `LOWER(id::text)`, ou ne pas chercher sur l'identifiant.
  - Utiliser les vraies colonnes.
  - Renvoyer un `status` pour chaque résultat.
  - Renvoyer des URL qui existent : `/admin/reclamations` et `/admin/agents-promo`, sans identifiant, car il n'y a pas de page de détail.

### 2.2 Création d'un admin avec un email déjà pris : réponse 200

- **Fichier :** `app/controllers/admin/team_controller.ts`, méthode `store`
- **Constat :** `POST /admin/team` avec un email existant répond **200** `{ data: { error: "Un compte avec cet email existe déjà." } }`.
- **Attendu :** 409 ou 422 avec un champ `message`.

### 2.3 Modifier le mot de passe d'un admin rend le compte inutilisable

- **Fichier :** `app/controllers/admin/team_controller.ts`, méthode `update`
- **Constat :** `PUT /admin/team/:id` avec `password` hache le mot de passe deux fois : une fois par `hash.make`, une autre par le hook de `withAuthFinder`. Le nouveau mot de passe est ensuite refusé à la connexion (401, testé).
- **Attendu :** assigner le mot de passe en clair et laisser le hook le hacher.
- **En attendant :** le front a retiré ce champ du formulaire.

### 2.4 Une cabine sans abonnement actif peut recevoir des commandes

- **Fichiers :** `app/services/assignment_engine.ts` (`getEligibleCabins`), traitements d'abonnement
- **Constat :**
  - Une cabine créée a un abonnement `inactive` avec une expiration nulle. `getEligibleCabins` ne regarde que `subscription_expiry`, et laisse passer les dates nulles.
  - Aucun traitement ne passe `subscription_status` à `expired` : une cabine expirée depuis des semaines reste « active ».
- **Attendu :**
  - Exclure de l'attribution les cabines dont l'abonnement n'est pas actif, ou dont l'expiration est nulle ou passée.
  - Passer automatiquement les abonnements expirés en `expired`.

### 2.5 Validation d'une recharge UV : historique et SIM incomplets

- **Fichier :** `app/controllers/admin/uv_controller.ts`, méthode `validateRequest`
- **Constat :**
  - La ligne d'historique est créée sans `balanceBefore` ni `balanceAfter` (valeurs nulles).
  - Le solde de la carte SIM utilisée n'est pas mis à jour.
- **Attendu :** renseigner les soldes avant et après, et débiter ou créditer la SIM concernée.

### 2.6 Chaque commande crée deux notifications admin

- **Fichiers :** `app/controllers/admin/orders_controller.ts` (`store`) et `app/services/order_service.ts` (`createOrder`)
- **Constat :** `notifyAdminsNewOrder` est appelé aux deux endroits, donc la cloche affiche chaque nouvelle commande en double.
- **Attendu :** un seul appel, dans le service.

### 2.7 Le changement de frais met jusqu'à 5 minutes à s'appliquer

- **Fichiers :** `app/controllers/admin/settings_controller.ts` (`upsert`) et `app/services/fees_service.ts`
- **Constat :**
  - `upsert` n'appelle pas `FeesService.invalidateCache()`.
  - Une valeur non entière dans `transaction_fees` retombe silencieusement sur 20 XAF.
- **Attendu :** invalider le cache à l'écriture, et refuser (422) une valeur qui n'est pas un entier positif.

### 2.8 Vérification de numéro : « autoriser » un numéro en liste noire

- **Fichiers :** `app/controllers/admin/fraud_controller.ts` (`checkPhone`) et `app/services/anti_fraud_service.ts` (`calculateRiskScore`)
- **Constat :** `POST /admin/fraud/check-phone` renvoie `recommendation: "allow"` et `riskScore: 5` pour un numéro qui est en liste noire.
- **Attendu :** `recommendation: "block"` quand `blacklisted` vaut `true`.

### 2.9 Chiffres du tableau de bord et des stats cabine

- **Fichiers :** `app/controllers/admin/dashboard_controller.ts` et stats cabine (`GET /cabins/:id/stats`)
- **Constat :**
  - `payments.totalRevenue` est la somme de `total_amount_with_fees`, c'est-à-dire le montant encaissé frais compris, pas le revenu des frais. Aucune donnée ne donne les frais perçus.
  - `orders.totals.totalAmount` compte toutes les commandes créées, y compris annulées ou non payées.
  - `totalAmount` des stats cabine additionne aussi les commandes annulées et remboursées.
- **Attendu :**
  - Ajouter `SUM(transaction_fees)` sur les commandes payées.
  - Ne compter dans les chiffres d'affaires que les commandes payées ou complétées.

### 2.10 Les notes « non lues » du support ne repassent jamais à zéro

- **Fichier :** `app/controllers/admin/support_controller.ts`, méthode `messages`
- **Constat :** `unreadByAdmin` ne revient pas à 0 quand un admin ouvre la conversation. Le badge reste affiché.
- **Attendu :** remise à zéro à la lecture, comme le fait déjà `cabinMessages` pour les conversations cabine.

### 2.11 La réactivation d'un forfait est impossible

- **Fichiers :** `app/controllers/packages_controller.ts` et le transformer des forfaits
- **Constat :**
  - `GET /packages` ne renvoie que les forfaits actifs, même pour un admin, et n'expose pas `isActive`. Un forfait désactivé disparaît définitivement du back-office, alors que `PUT /packages/:id` accepte `isActive`.
  - `PUT /packages/:id` n'a pas de validateur (`request.only` direct).
  - Le type `credit` existe en base mais est refusé par `createPackageValidator`.
- **Attendu :**
  - Une liste admin qui inclut les forfaits inactifs, avec `isActive`.
  - Un validateur sur la mise à jour.
  - Un choix clair sur le type `credit`.

---

## 3. P2 — Contrat d'API incohérent

### 3.1 Deux formats d'enveloppe coexistent

- **Constat :** selon les routes, la réponse est :
  - soit `{ data: { data: X, meta } }` : commandes, équipe, fraude ;
  - soit `{ data: X, metadata }` : la majorité des routes (`serialize.withoutWrapping`) ;
  - soit `{ data: { data: { meta, data } } }` : liste noire de la fraude.

  C'est la cause principale des écrans vides du back-office. Le front normalise désormais les trois formes dans son client HTTP.
- **Attendu :** un seul format pour toute l'API, par exemple `{ data, meta }`. Prévenir l'équipe front avant de changer, pour retirer la normalisation au même moment.

### 3.2 Messages de validation en anglais

- **Constat :** les erreurs 422 de VineJS arrivent en anglais (« The fullName field must be defined »). Le front les traduit au cas par cas.
- **Attendu :** configurer les messages VineJS en français (`vine.messagesProvider`).

### 3.3 Noms et identifiants manquants dans les réponses

| Route | Manque | Conséquence |
|---|---|---|
| `GET /admin/messaging/conversations`, `/admin/messaging/group` | nom de l'expéditeur et de l'autre participant | le front doit appeler `/admin/team`, réservé au super_admin |
| `GET /admin/call-center/logs` et `/stats` | nom de l'agent (seul `calledBy` est renvoyé) | même dépendance à `/admin/team` |
| `GET /admin/uv/history` | `cabinId` et `cabinName` (le transformer utilisé est celui de la cabine) | impossible de savoir quelle cabine est concernée |
| `GET /admin/subscriptions/invoices` | nom de la cabine (seul `cabinId`) | le front recroise avec `/cabins` |
| `GET /admin/promo-agents` | nombre de parrainages ; `idNumber` jamais exposé | colonne retirée de la liste |
| `GET /admin/team` | renvoie aussi les comptes `cabin` | le front les filtre ; attendu : seulement les comptes du back-office |

### 3.4 Champs de cabine non exposés

- **Fichier :** `app/transformers/core/cabin_transformer.ts`
- **Constat :** ne sont pas renvoyés : `maxOrderAmount`, `notificationType`, `totalOrdersQuota`, `quotaBlocked`, `autoRenew`, `suspensionReason`, `suspensionDate`, `pausedAt`, `reactivatedAt`.
  - `quotaBlocked` exclut la cabine de l'attribution automatique sans que l'admin puisse le voir.
  - `maxOrderAmount` est modifiable par `PUT /cabins/:id` mais jamais relu.
- **Attendu :** exposer ces champs dans la réponse admin.

### 3.5 Doublons dans le type de service

- **Constat :** l'enum `ServiceType` contient `package` et `forfait`, ainsi que `credit` et `topup`, qui désignent la même chose.
- **Attendu :** choisir une valeur de référence pour chaque service. Le back-office ne propose que `credit`, `package` et `transfer`.

### 3.6 Textes techniques dans les notifications

- **Fichier :** `app/controllers/client/complaints_controller.ts`, méthode `store`
- **Constat :** la notification « Nouvelle réclamation » contient le code brut, par exemple « Réclamation de 699000077 : wrong_product ».
- **Attendu :** un libellé français (« Mauvais produit »).

### 3.7 Réponses d'erreur à revoir

- `PUT /admin/team/:id` avec un identifiant qui n'est pas un UUID renvoie **500** (erreur SQL) au lieu de 404.
- `POST /admin/notifications/broadcast` n'a pas de validateur : un titre et un message vides sont acceptés, et `type` est libre.
- `/admin/fraud/stats` : le champ `blockedOrders` compte en réalité les commandes rejetées ou annulées du mois. Le nom est trompeur.
- `GET /admin/settings/subscription_plans` renvoie 404 : la clé n'existe pas et n'est lue nulle part.

---

## 4. P3 — Fonctions à compléter

Le back-office n'expose pas ces fonctions tant que le backend ne les porte pas.

| Sujet | Manque | Fichier |
|---|---|---|
| Filtre des cabines en pause | `GET /cabins` n'accepte pas `?paused=true`, et le statut `paused` n'est jamais écrit (seul le booléen `paused` l'est) | `app/services/cabins/cabin_service.ts` |
| Plan à la création d'une cabine | `subscriptionType` est validé puis ignoré ; l'abonnement reste `inactive` | `cabins_controller.store` |
| Changement de type de cabine | aucune route ; approuver une demande d'upgrade ne change que le statut de la demande | `subscriptions_controller.approveUpgrade` |
| Plans d'abonnement | la clé `subscription_plans` n'est utilisée par aucun code : l'implémenter (prix, quotas) ou la supprimer | — |
| Renouvellement automatique | `autoRenew` est exposé (défaut `true`) mais aucun traitement ne l'utilise | — |
| Factures | seul le statut `pending` est écrit ; aucune route pour marquer une facture payée ou en retard | `subscriptions_controller` |
| Budgets | toujours créés en `draft` ; pas de route de soumission ni de rejet ; `approve` accepte un brouillon | `reports_controller.ts` |
| Réclamations | `PATCH /admin/complaints/:id/assign-cabin` existe mais le statut « En vérification » n'est pas documenté pour le front | `complaints_controller.ts` |
| Recherche des commandes | seul `customer_phone` en égalité stricte ; pas de recherche par code commande ni par numéro partiel | `order_service.listOrders` |
| Recherche des agents promo | pas de paramètre de recherche texte | `promo_agents_controller` |
| Villes | pas de route pour supprimer une assignation | `settings_controller.ts` |
| Salaires | pas de route « ma session active » ; `weekStartDay` et `eligibleEmails` sont enregistrés mais jamais utilisés | `salary_controller.ts` |
| Profil | `PUT /account/profile` ne permet pas de vider le téléphone ni l'avatar (`payload.x ?? existant`) | `profile_controller.ts` |
| Conversations entre admins | aucune route pour en démarrer une | messagerie |
| Vérification de reçu (OCR) | `verifyReceipt` est un bouchon qui renvoie toujours « validation manuelle requise » | `anti_fraud_service.ts` |
| Scores des cabines | `getCabinScoresForOrder` ignore `serviceType` et le bonus « connectée » : le classement affiché peut différer du choix réel | moteur d'attribution |
| Lien de paiement en local | avec le fournisseur `mock`, le paiement est confirmé immédiatement (`paymentUrl: null`) ; prévoir un mode qui renvoie une URL de test | fournisseur de paiement |

---

## 5. Ce que le front a retiré en attendant

Pour ne pas afficher de fonction qui ne marche pas, ces éléments ont été retirés ou rendus non modifiables dans le back-office. Ils pourront revenir quand le point backend correspondant sera traité.

| Élément retiré | Point backend |
|---|---|
| Champ « Nouveau mot de passe » dans la modification d'un admin | 2.3 |
| Bloc « Sessions actives » et bouton « Révoquer » du profil | 1.4 |
| Réactivation des forfaits, filtre « Désactivés » | 2.11 |
| Section « Vérifier un reçu (OCR) » | 4 (OCR) |
| Onglet « Plans » des abonnements, choix du plan à la création d'une cabine | 3.7, 4 |
| Filtre « En pause » des cabines ; filtres « Expirés » et « Suspendus » des abonnements | 4, 2.4 |
| Champs de cabine : montant max, quota, notification, raison de suspension, renouvellement auto | 3.4 |
| Type de cabine modifiable (désormais en lecture seule) | 4 |
| Frais en pourcentage et par réseau, Viettel Cash et Wave (un seul frais fixe en XAF) | 2.7 |
| Recherche libre des commandes (remplacée par « N° client exact ») | 4 |
