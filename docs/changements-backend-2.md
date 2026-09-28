# Réponse du backend au retour du back-office

**Pour :** l'équipe front du back-office TransfertCM
**Date :** 28 septembre 2026
**Contexte :** réponse à `docs/corrections-backend-2.md`. Les corrections sont dans la PR backend **#21**, qui part de `main` et ajoute la migration **057**.

**Règle suivie :** tout ce qui ne concerne que le back-office est traité. Ce qui touche aussi l'app mobile est reporté à un chantier dédié (voir section 4).

---

## 1. À changer ou à vérifier côté front

| Écran | Ce qui change | À faire |
|---|---|---|
| UV : validation d'une recharge | Si la SIM choisie n'a pas assez de solde, la validation est refusée en **422** : `message` vaut « Solde de la SIM insuffisant : X UV disponibles, Y demandés ». La cabine n'est pas créditée. | Afficher `message`. |
| Commandes : remboursement | Le motif est obligatoire côté backend (422). Pour une commande **livrée** (`completed`), un compte autre que super_admin reçoit un **403**. | Masquer « Rembourser » sur une commande livrée si le rôle n'est pas `super_admin`. |
| Tableau de bord : répartition par réseau | `orders.byNetwork[].totalAmount` ne compte plus que les commandes livrées et payées, comme les cartes. Le nouveau champ `completed` donne leur nombre. `count` compte toujours toutes les commandes. | Vérifier les libellés : `count` = commandes créées, `totalAmount` = chiffre d'affaires. |
| Toutes les erreurs 422 | Sur les routes du back-office, `message` contient désormais le premier message utile (par ex. « Le champ nom complet est obligatoire »), au lieu de « Données invalides ». `errors` ne change pas. | Le toast peut afficher `message` directement. |
| Notifications | Un compte sans accès aux commandes ne voit plus les notifications de commande (nouvelle commande, paiement reçu, commande retournée). Un compte sans accès aux réclamations ne voit plus « Nouvelle réclamation ». Le compteur suit la même règle. | Rien à faire. |

---

## 2. Ce que vous pouvez brancher ou remettre

### 2.1 Cartes SIM

- **Création** : `POST /admin/uv/sim-cards` accepte `currentBalance` (entier, 0 ou plus). Proposez de saisir le solde réel dès la création.
- **Recharge ou correction** : `PATCH /admin/uv/sim-cards/:id/balance` avec `{ "delta": 5000, "description": "Achat UV MTN" }`.
  - `delta` est positif pour une recharge et négatif pour une correction.
  - Un ajustement qui rendrait le solde négatif est refusé (422).
- **Historique** : l'opération apparaît dans `GET /admin/uv/history` avec `transactionType` égal à `sim_recharge` ou `sim_adjustment`, `simCardId` renseigné et `cabinId` nul. Ajoutez ces deux types à vos libellés.

### 2.2 Réconciliation finance

Chaque commande renvoie maintenant `paidAt`, `refundedAt` et `refundAmount`. Vous pouvez remplacer « (date de commande) » par la vraie date de paiement.

### 2.3 Cabines

`PUT /cabins/:id` avec `{ "maxOrderAmount": null }` retire la limite. Ajoutez une option « Aucune limite ».

### 2.4 Liste des admins pour tous les rôles

`GET /admin/directory` est ouvert à tout admin connecté. Il renvoie `[{ id, fullName, role }]`, triés par nom : seulement les comptes actifs, sans comptes cabine et sans email.

Il débloque trois écrans :

| Écran | Comment |
|---|---|
| Salaires : enregistrer un paiement | Liste des admins via `/admin/directory`. Les réponses contiennent `adminName` (sessions et paiements) et `paidByName` (paiements). |
| Paramètres : assigner une ville | Choix de l'admin via `/admin/directory`. La liste des assignations contient `adminName`. L'action peut être ouverte à `canViewSettings`. |
| Messagerie : onglet Admins | `POST /admin/messaging/conversations` avec `{ "userId": "…" }` crée la conversation, ou renvoie celle qui existe (même `id`). La réponse contient `otherParticipantId` et `otherParticipantName`. Démarrer une conversation avec soi-même est refusé (422). |

### 2.5 Factures

- `paymentMethod` et `paymentReference` sont renvoyés dans la liste et après un changement de statut.
- `POST /admin/subscriptions/invoices` renvoie `cabinName`.

### 2.6 Agents promo

- `DELETE /admin/promo-agents/:id` **désactive** l'agent (statut `inactive`). Son historique et ses parrainages sont conservés. Libellé conseillé : « Désactiver » plutôt que « Supprimer ».
- `PUT /admin/promo-agents/:id` accepte `idNumber` et `idType`. Une valeur `null` les vide.

### 2.7 Profil : sessions

`ipAddress` est renseigné pour les connexions faites **après le déploiement** de la PR. Les sessions plus anciennes restent à `null` : affichez « — » dans ce cas.

### 2.8 Changement de mot de passe

Une confirmation différente renvoie « La confirmation ne correspond pas au nouveau mot de passe ».

---

## 3. Non traité, et pourquoi

| Point du retour | Décision |
|---|---|
| 3.1 Transmettre une réclamation à la cabine | Reporté au chantier mobile : il faut des routes côté cabine **et** un écran dans l'espace cabine de l'app. Gardez l'action masquée. |
| Recherche globale limitée par type | Pas bloquant, noté dans les restes à faire du backend. |
| Historique UV sans soldes avant le correctif | Donnée historique, pas de reprise pour l'instant. |

---

## 4. Reporté au chantier mobile

Pour information, ces points attendent le chantier mobile :

- les réclamations transmises à la cabine ;
- le message 422 des routes mobiles ;
- l'affichage des forfaits `credit` dans l'app ;
- le code de parrainage d'un agent désactivé, encore accepté à l'inscription.

---

## 5. À tester après le merge de #21

1. Créer une SIM avec un solde, la recharger, puis valider une recharge UV plus grosse que son solde : refus avec un message clair.
2. Rembourser une commande livrée avec un compte `admin` (refus), puis avec un `super_admin` (accepté).
3. Avec un compte `admin` non super_admin : enregistrer un paiement de salaire pour un collègue, et assigner une ville.
4. Démarrer une conversation entre deux admins, puis vérifier qu'une seconde tentative ouvre la même conversation.
5. Se connecter en prod, puis vérifier que l'IP affichée dans « Sessions actives » est la vôtre, et non une IP interne du serveur.
