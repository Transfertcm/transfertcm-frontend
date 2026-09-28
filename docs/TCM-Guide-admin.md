# TCM — Guide du back-office

**TRANSFERTCM**

Pour l'équipe TransfertCM qui gère la plateforme au quotidien : administrateurs, service client, contrôleurs de cabines et chef des agents promo.

*Guide de l'administration*

---

Le back-office est l'outil de pilotage de TransfertCM. Il s'ouvre dans un navigateur, à l'adresse **transfertcm.miaba.africa**. Avec lui, vous pouvez :

- **suivre** les commandes des clients (crédit, forfaits, transferts) et les **attribuer** aux cabines partenaires ;
- **valider** les paiements, **rembourser** et **réconcilier** ce qui a été encaissé ;
- **gérer** les cabines : abonnements, factures, solde UV, recharges, rémunérations ;
- **répondre** aux clients : réclamations, support en direct, call center ;
- **protéger** la plateforme contre la fraude ;
- **organiser** l'équipe : tâches, rapports, salaires, comptes et permissions.

Ce que vous voyez dépend de votre rôle : certaines pages ou certains boutons n'apparaissent que si votre compte en a le droit (voir [section 3](#3-rôles-et-permissions)).

## Sommaire

1. [Vous connecter](#1-vous-connecter)
2. [Découvrir le back-office](#2-découvrir-le-back-office)
3. [Rôles et permissions](#3-rôles-et-permissions)
4. [Le tableau de bord](#4-le-tableau-de-bord)
5. [Les commandes](#5-les-commandes)
6. [La réconciliation](#6-la-réconciliation)
7. [Les cabines](#7-les-cabines)
8. [Abonnements et factures](#8-abonnements-et-factures)
9. [Les UV](#9-les-uv)
10. [Les forfaits](#10-les-forfaits)
11. [Les rémunérations des cabines](#11-les-rémunérations-des-cabines)
12. [Les agents promo](#12-les-agents-promo)
13. [La relation client](#13-la-relation-client)
14. [L'anti-fraude](#14-lanti-fraude)
15. [Les notifications](#15-les-notifications)
16. [Tâches et rapports](#16-tâches-et-rapports)
17. [Les salaires](#17-les-salaires)
18. [L'équipe (super administrateur)](#18-léquipe-super-administrateur)
19. [Les paramètres](#19-les-paramètres)
20. [Votre profil et votre sécurité](#20-votre-profil-et-votre-sécurité)
21. [Les règles à connaître](#21-les-règles-à-connaître)
22. [Questions fréquentes](#22-questions-fréquentes)

---

## 1. Vous connecter

Votre compte est créé par un **super administrateur**, qui vous communique votre adresse e-mail et un mot de passe temporaire. Il n'y a pas d'inscription libre.

1. Ouvrez **transfertcm.miaba.africa/login** dans votre navigateur.
2. Saisissez votre **Adresse email** et votre **Mot de passe**. L'icône en forme d'œil affiche le mot de passe pour vérifier votre saisie.
3. Cliquez sur **Continuer**.

Vous arrivez sur le **Tableau de bord**. Si vous étiez déjà connecté, le back-office s'ouvre directement.

> **ASTUCE**
> Dès votre première connexion, remplacez le mot de passe temporaire par le vôtre : **Mon profil → Changer le mot de passe** (voir [section 20](#20-votre-profil-et-votre-sécurité)).

### Si la connexion est refusée

| Message | Que faire ? |
|---|---|
| *Email ou mot de passe incorrect.* | Vérifiez votre saisie avec l'icône œil. |
| *Compte désactivé. Contactez un super administrateur.* | Votre compte a été désactivé : contactez un super administrateur. |
| *Ce compte est un compte cabine. Connectez-vous depuis l'espace cabine.* | Ce compte appartient à une cabine partenaire : il s'utilise dans l'application TCM, pas dans le back-office. |
| *Connexion impossible — Vérifiez votre connexion internet.* | Le serveur n'est pas joignable : vérifiez votre connexion et réessayez. |

### « Vous avez été déconnecté »

Le back-office peut vous renvoyer sur l'écran de connexion avec ce message :

- **« Session expirée — veuillez vous reconnecter. »** : par sécurité, votre connexion expire au bout d'un moment. Reconnectez-vous.
- **« Compte désactivé… »** : votre compte vient d'être désactivé par un super administrateur.
- La session a aussi pu être fermée depuis un autre appareil (**Mon profil → Sessions actives**), ou après un changement de mot de passe.

### Mot de passe oublié

Il n'y a pas de lien « mot de passe oublié ». Demandez à un super administrateur : il peut vous attribuer un nouveau mot de passe depuis la page **Équipe** (voir [section 18](#18-léquipe-super-administrateur)).

### Vous déconnecter

En bas du menu de gauche, cliquez sur **Déconnexion**. Pensez-y sur un ordinateur partagé.

---

## 2. Découvrir le back-office

### Le menu de gauche

Le menu regroupe les pages par thème. Seules les pages auxquelles vous avez accès apparaissent.

| Menu | Pages |
|---|---|
| **Tableau de bord** | Votre vue d'ensemble |
| **Paramètres** | Frais de service, numéros du service client, villes |
| **Réseau de cabines** | Abonnements, Cabines, UV |
| **Opérations** | Commandes, Réconciliation, Forfaits, Agents promo |
| **Relation client** | Réclamations, Messagerie, Support, Call Center, Fraude |
| **Suivi & reporting** | Notifications, Tâches, Rapports |
| **Équipe** | Salaires, Rémunérations, Équipe |

Tout en bas : votre nom et votre rôle (cliquez pour ouvrir **Mon profil**), **Voir le site** et **Déconnexion**.

> **ASTUCE**
> Le bouton **☰** en haut à gauche réduit le menu pour gagner de la place : il ne reste que les icônes. Sur téléphone, le menu s'ouvre et se ferme avec ce même bouton.

### La barre du haut

| Élément | À quoi il sert |
|---|---|
| **Rechercher...** | Recherche rapide dans les commandes, les cabines, les réclamations et les agents promo (sur ordinateur). |
| **Cabines en ligne** | Les cabines connectées en ce moment, et les commandes en attente d'attribution. |
| **Cloche** | Vos dernières notifications. |
| **Mode sombre / Mode clair** | Change l'apparence ; votre choix est mémorisé. |
| **Votre prénom** | Ouvre **Mon profil**. |

### La recherche rapide

Tapez au moins **2 caractères** : un code commande, un numéro de téléphone, un nom de cabine, un code de parrainage… Les résultats apparaissent au fil de la frappe, avec des filtres **Tous**, **Commandes**, **Cabines**, **Réclamations** et **Agents**. Cliquez sur un résultat pour l'ouvrir. **Échap** ferme la recherche.

La recherche ne montre que ce que votre compte a le droit de voir.

### Le panneau « Cabines en ligne »

Le bouton affiche le nombre de cabines connectées (pastille verte) et, en orange, le nombre de commandes en attente. En cliquant dessus :

- chaque cabine connectée apparaît avec sa charge du jour (commandes du jour / maximum) et **« N en cours »** ou **« Libre »** ;
- **N à assigner** ouvre directement la liste des commandes en révision ;
- **Toutes les cabines** ouvre la page Cabines.

La liste se met à jour toute seule toutes les 30 secondes ; **Rafraîchir** la met à jour tout de suite.

### « Accès refusé »

Si vous ouvrez une page hors de votre périmètre (par un lien ou une adresse tapée à la main), le back-office affiche **Accès refusé** : *« Votre compte n'a pas les droits nécessaires pour ouvrir cette page. »* Cliquez sur **Retour au tableau de bord**. Si vous avez besoin de cette page, demandez à un super administrateur d'ajuster vos permissions.

---

## 3. Rôles et permissions

Chaque compte a un **rôle**, qui lui donne un ensemble de permissions par défaut :

| Rôle | Accès par défaut |
|---|---|
| **Super admin** | Tout, y compris la gestion de l'équipe et des permissions. |
| **Admin** | Tout, sauf la gestion de l'équipe et les salaires de l'équipe. |
| **Service client** | Réclamations et support client, call center, messagerie avec les cabines. |
| **Chef agents promo** | Agents promo. |
| **Contrôleur cabine** | Commandes (attribution, validation de paiement), cabines, abonnements et rémunérations. |

**Pour tous les rôles** : le tableau de bord, les notifications, la messagerie interne, vos propres salaires et votre profil.

Un super administrateur peut **personnaliser** les permissions d'un compte, par exemple donner l'accès à l'anti-fraude à un membre du service client. Vos permissions exactes sont visibles dans **Mon profil → Permissions**, avec la mention **Personnalisées** si elles diffèrent de votre rôle.

<details>
<summary>Les 16 permissions</summary>

| Permission | Ce qu'elle ouvre |
|---|---|
| Voir et créer les commandes | Page Commandes : liste, fiche, création, changement de statut, lien de paiement |
| Attribuer les commandes aux cabines | Bouton **Assigner** et **Scores cabines** |
| Valider un paiement manuellement | Bouton **Valider paiement** |
| Rembourser une commande | Bouton **Rembourser** et page **Réconciliation** |
| Gérer les cabines | Page Cabines : création, modification, pause, suspension, UV, pièce d'identité |
| Gérer les abonnements, factures et rémunérations des cabines | Pages Abonnements et Rémunérations |
| Gérer les UV | Page UV |
| Gérer l'anti-fraude | Page Fraude |
| Gérer les agents promo | Page Agents promo |
| Traiter les réclamations et le support client | Pages Réclamations et Support |
| Accéder au call center | Page Call Center |
| Échanger avec les cabines | Onglet **Cabines** de la messagerie |
| Gérer les tâches, rapports et budgets | Pages Tâches et Rapports |
| Valider les rapports et approuver les budgets | Boutons **Valider**, **Rejeter** et **Approuver** |
| Modifier les paramètres, frais et forfaits | Pages Paramètres et Forfaits, diffusion de notifications |
| Gérer les salaires de toute l'équipe | Configuration des salaires et enregistrement des paiements |

</details>

---

## 4. Le tableau de bord

Il s'ouvre après la connexion : **« Bonjour, {prénom}. »** Choisissez la période en haut à droite : **Aujourd'hui**, **Cette semaine** (depuis lundi) ou **Ce mois**.

### Les chiffres clés

| Carte | Ce qu'elle compte |
|---|---|
| **Commandes** | Les commandes créées sur la période. En dessous : combien sont livrées et payées. |
| **Volume livré** | Le montant des commandes livrées et payées, **hors frais**. |
| **Montant encaissé** | Ce que les clients ont payé sur la période, **frais compris**. |
| **Revenus (frais)** | Les frais de service perçus sur les commandes livrées. C'est le revenu de TransfertCM. |

En dessous : une carte par statut de commande sur la période, puis **Cabines actives** et **Suspendues** (toutes périodes confondues).

### Les blocs

- **Commandes récentes** : les 8 dernières commandes. Cliquez sur une ligne pour ouvrir la commande, ou sur **Voir tout**.
- **Cabines actives** : les cabines qui reçoivent des commandes, avec leurs commandes du jour et leur **solde UV**. Un solde en **rouge** est inférieur à 1 000 UV : la cabine devra bientôt recharger.
- **Répartition par opérateur** : pour MTN et Orange, le nombre de commandes créées et le chiffre d'affaires des commandes livrées.

---

## 5. Les commandes

Menu **Opérations → Commandes**.

### Le parcours d'une commande

Le client commande dans l'application TCM (crédit, forfait ou transfert), paie, puis une **cabine partenaire** réalise l'opération sur le réseau MTN ou Orange. Le back-office vous permet de suivre et de débloquer chaque étape.

| Statut | Signification | Votre rôle |
|---|---|---|
| **En attente** | Commande reçue | — |
| **En révision** | À vérifier par l'administration | Vérifier, puis **Assigner** (ou laisser l'attribution automatique) |
| **Approuvée** | Validée par l'administration | **Assigner** à une cabine |
| **Paiement attendu** / **Paiement en attente** | Le client n'a pas encore payé | Envoyer un **lien de paiement** ou **valider** un paiement reçu |
| **Assignée** | Confiée à une cabine | Suivre |
| **En cours** | La cabine réalise l'opération | Suivre |
| **Complétée** | Livrée au bénéficiaire | — |
| **Retournée** | La cabine n'a pas pu la traiter | **Assigner** à nouveau, ou rejeter / annuler |
| **Annulée** / **Rejetée** / **Expiré** | Non réalisée | Si le client a payé : **rembourser** |
| **Paiement échoué** / **Délai de paiement dépassé** | Le paiement n'a pas abouti | Si un débit a eu lieu : **rembourser** |
| **Remboursée** | La somme a été rendue au client | — |

> **À SAVOIR**
> Une commande laissée **En révision** est attribuée **automatiquement** à la meilleure cabine disponible après **5 minutes**.

### Trouver une commande

- **Recherche** : une partie du code commande, du numéro du client ou du bénéficiaire.
- **Filtres** : statut, réseau (MTN Mobile Money, Orange Money) et service (Crédit, Forfait, Transfert).

Chaque ligne affiche le code, le client, le destinataire, le réseau, le montant, le service et le statut. L'icône **Voir** ouvre la fiche.

### Attribuer une commande à une cabine

Sur une commande **En révision**, **Approuvée** ou **Retournée**, cliquez sur **Assigner** :

- **Meilleure cabine automatique** : *« Le système choisit selon performance et charge »*. C'est le choix conseillé.
- Ou choisissez une **cabine connectée** dans la liste, selon sa charge.

Cliquez sur **Assigner automatiquement** ou **Assigner à cette cabine**. La cabine reçoit la commande dans son application.

> **ASTUCE**
> Même si aucune cabine n'est connectée, l'attribution automatique fonctionne : le système choisit la meilleure cabine **éligible** (active, abonnement valide, quota disponible).

Sur la fiche d'une commande, **Scores cabines** montre le classement des cabines éligibles (taux de complétion, charge, score).

### Le paiement

- **Lien de paiement** (icône lien, ou bouton **Lien paiement** sur la fiche) : génère un lien à envoyer au client. Cliquez sur **Copier**, puis partagez-le (SMS, WhatsApp…).
- **Valider paiement** : si le client a payé autrement et que vous avez vérifié le paiement, validez-le manuellement. Sur la fiche, vous pouvez indiquer l'**ID de transaction** et des **notes**. La commande passe **Approuvée**.

> **ATTENTION**
> Ne validez un paiement qu'après l'avoir **vérifié** (message de l'opérateur, relevé). Cette action marque le paiement comme reçu, au nom de votre compte.

### Créer une commande

Cliquez sur **Nouvelle commande** :

| Champ | Ce qu'il faut saisir |
|---|---|
| **Téléphone client *** | Le numéro du client (6XXXXXXXX) |
| **Téléphone destinataire *** | Le numéro à recharger ou à créditer |
| **Service *** | Crédit, Forfait ou Transfert |
| **Réseau *** | MTN Mobile Money ou Orange Money |
| **Forfait** | Si Forfait : choisissez-le, le montant se remplit tout seul |
| **Montant (XAF)** | 100 XAF minimum |
| **Méthode de paiement** | Mobile Money ou Espèces |
| **Téléphone payeur attendu** | Facultatif : le numéro qui va payer, s'il est différent |

Cliquez sur **Créer**. Si un lien de paiement est généré, il s'affiche aussitôt.

### La fiche d'une commande

Elle regroupe : **Détails du service** (montant, frais, total), **Parties impliquées** (client, destinataire), **Paiement**, **Cabine** et **Chronologie** (toutes les étapes datées, avec le motif d'annulation ou de retour).

**Changer statut** propose uniquement les changements autorisés depuis le statut actuel. Par exemple, une commande **En cours** peut passer **Complétée**, **Retournée** ou **Annulée**. Indiquez une **Raison** si besoin, puis **Confirmer**.

### Rembourser une commande

Le bouton **Rembourser** apparaît sur une commande **payée** et pas encore remboursée, au statut Complétée, En cours, Rejetée, Annulée, Expiré, Paiement échoué ou Délai de paiement dépassé.

1. Cliquez sur **Rembourser**.
2. Saisissez la **Raison du remboursement** (3 caractères minimum).
3. Cliquez sur **Rembourser**.

Le client est remboursé du **montant payé, frais compris**.

> **ATTENTION**
> Le remboursement est **irréversible**. Une commande déjà **Complétée** (livrée) ne peut être remboursée que par un **super administrateur**.

---

## 6. La réconciliation

Menu **Opérations → Réconciliation**. Elle répond à une question simple : **tout ce qui a été payé a-t-il été livré ou rendu ?**

Trois onglets, avec le nombre de commandes et le montant de chacun :

| Onglet | Contenu | Action |
|---|---|---|
| **À livrer** | Payées, pas encore livrées | Surveiller : elles doivent aboutir |
| **À rembourser** | Payées puis rejetées, annulées ou expirées | **Rembourser** |
| **Remboursées** | Déjà remboursées, avec le montant et la date | Contrôle |

Filtrez par **date de paiement** avec **Payées du … au …**. Les montants sont **frais compris**. Cliquez sur un code pour ouvrir la commande.

> **ASTUCE**
> Consultez l'onglet **À rembourser** chaque jour : chaque ligne est un client qui a payé sans recevoir son crédit, son forfait ou son argent.

---

## 7. Les cabines

Menu **Réseau de cabines → Cabines**. Les cabines partenaires réalisent les commandes sur le réseau. Chacune a un **solde UV** : son crédit, débité à chaque commande qu'elle complète.

### Trouver une cabine

Recherchez par nom, responsable ou ville, et filtrez par statut (**Active**, **En pause**, **Suspendue**, **Inactive**), type (Basic, Standard, Premium) ou ville.

### Créer une cabine

Cliquez sur **Nouvelle cabine** :

- **Obligatoires** : Nom de la cabine, Responsable, Email, Mot de passe (8 caractères minimum). L'email et le mot de passe sont les identifiants de connexion de la cabine dans l'application TCM.
- **Facultatifs** : Téléphone, Ville, Type, Adresse / Localisation, numéros **MTN Mobile Money** et **Orange Money**.

Cliquez sur **Créer**, puis transmettez ses identifiants à la cabine.

> **ATTENTION**
> Une nouvelle cabine est créée **sans abonnement actif** et ne reçoit **aucune commande** tant qu'il n'est pas activé. Ouvrez sa fiche et cliquez sur **Activer l'abonnement**.

### La fiche d'une cabine

Elle affiche : commandes du jour, solde UV, total des commandes, chiffre d'affaires (commandes complétées et payées, avec les frais perçus), puis les informations, les numéros Mobile Money, les **limites & quotas**, la répartition des commandes, l'**abonnement**, la **pièce d'identité** et l'historique.

| Action | Effet |
|---|---|
| **Modifier** | Nom, responsable, coordonnées, numéros Mobile Money, **Max commandes/jour**, **Montant max par commande** (cochez **Aucune limite** pour retirer le plafond). Le type n'est pas modifiable après la création. |
| **Ajuster UV** | Ajoute (nombre positif) ou retire (nombre négatif) des UV, avec une **description** obligatoire. Le nouveau solde est affiché avant de confirmer. |
| **Mettre en pause** | Arrête temporairement l'envoi de nouvelles commandes, avec une raison. **Reprendre** relance la cabine. |
| **Suspendre** | *« La cabine ne pourra plus recevoir de commandes tant qu'elle est suspendue. »* Raison obligatoire. **Réactiver** la remet en service. |
| **Activer l'abonnement** | Active l'abonnement dès aujourd'hui, pour 1, 3, 6 ou 12 mois. |
| **Pièce d'identité** | **Approuver**, ou **Voir & Rejeter** avec un motif (ex. « Photo floue »). La cabine en est informée. |

> **À SAVOIR**
> Dans **Modifier**, vider un champ n'efface pas l'ancienne valeur : saisissez la nouvelle valeur à la place.

### Quelles cabines reçoivent des commandes ?

Une cabine reçoit des commandes seulement si elle est **active**, **pas en pause**, avec un **abonnement actif et non expiré**, son **quota du jour** non atteint, le **réseau** de la commande disponible et le **montant maximum** respecté.

---

## 8. Abonnements et factures

Menu **Réseau de cabines → Abonnements**. Trois onglets.

### Abonnements

La liste montre chaque cabine, le statut de son abonnement et son expiration : **« Dans N jours »** (en orange à 7 jours ou moins), ou **Expiré** en rouge. Filtrez par **Actifs**, **Expirés** ou **Inactifs**, ou cochez **Expire bientôt**.

**Renouveler** : choisissez la cabine, le plan, la **durée** (1 à 24 mois), le **montant payé** et la **méthode de paiement** (Espèces, MTN Mobile Money, Orange Money, Virement bancaire). L'expiration est prolongée à partir de la date actuelle d'expiration, ou d'aujourd'hui si elle est déjà dépassée.

> **À SAVOIR**
> Un abonnement échu passe automatiquement **Expiré**, et la cabine cesse de recevoir des commandes jusqu'au renouvellement.

### Factures

**Nouvelle facture** : Cabine, Plan, Montant (champ « Montant payé »), Date d'échéance, Début et Fin de période. **Tous les champs sont nécessaires.**

Le bouton **Statut** d'une facture propose :

| Statut actuel | Changements possibles |
|---|---|
| En attente | Payée, En retard, Annulée |
| En retard | Payée, Annulée |

Pour **Payée**, indiquez si vous le souhaitez la méthode et la **référence** du paiement : elles s'affichent ensuite sous le montant. **Payée** et **Annulée** sont définitifs.

### Demandes upgrade

Les demandes de changement de formule envoyées par les cabines : cabine, « formule actuelle → formule demandée », urgence et justification. **Traiter** permet d'**Approuver** (avec des notes) ou de **Rejeter** (avec une raison).

> **À SAVOIR**
> Approuver une demande **enregistre la décision** : cela ne change pas automatiquement la formule de la cabine.

Depuis la fiche d'une cabine, **Gérer l'abonnement →** ouvre cette page filtrée sur cette seule cabine. **Afficher toutes les cabines** retire le filtre.

---

## 9. Les UV

Menu **Réseau de cabines → UV**. Le solde UV est le crédit prépayé d'une cabine : il est débité du montant exact de chaque commande qu'elle complète. Sans solde suffisant, la cabine ne peut pas terminer ses commandes.

### Les demandes de recharge

Une cabine envoie son paiement puis une demande de recharge depuis son application. Onglet **Demandes** :

1. Vérifiez la **preuve de paiement** affichée : montant payé, opérateur, numéro Mobile Money de la cabine, note, référence.
2. Cliquez sur **Valider**. Vous pouvez choisir la **SIM Card utilisée** pour transférer les UV.
3. Confirmez.

Le solde de la cabine est **crédité immédiatement** du montant demandé. Si une SIM est choisie, elle est débitée du même montant.

Sinon, cliquez sur **Rejeter** et indiquez la raison : aucun solde n'est modifié et la cabine voit le motif.

> **ATTENTION**
> Validez seulement après avoir **vérifié la réception du paiement** de la cabine. Si la SIM choisie n'a pas assez de solde, la validation est refusée : *« Solde de la SIM insuffisant… »*.

### Les cartes SIM

Onglet **SIM Cards** : les cartes SIM utilisées pour les UV, avec leur réseau, leur cabine éventuelle et leur **solde**.

- **Nouvelle SIM card** : Réseau, Téléphone, Nom de la carte, **Solde initial (UV)** (le solde réel au moment de l'ajout) et, si besoin, la cabine assignée.
- **Recharger / corriger le solde** : choisissez **Recharge (ajouter)** ou **Correction (retirer)**, le nombre d'UV et un **motif** obligatoire. Le nouveau solde est calculé avant l'enregistrement, et une correction qui rendrait le solde négatif est refusée.

### L'historique

Onglet **Historique** : chaque mouvement avec la cabine (ou la SIM), le type (**Recharge**, **Déduction**, **Ajustement**, **Recharge SIM**, **Correction SIM**), la date, le montant et le solde **avant → après**.

---

## 10. Les forfaits

Menu **Opérations → Forfaits**. C'est le catalogue des forfaits proposés aux clients dans l'application.

- **Filtres** : **Actifs** (par défaut), **Désactivés** ou **Tous** ; réseau ; type (Data, Appels, SMS, Combo, Crédit).
- **Nouveau forfait** : nom, réseau, type, **prix** (100 FCFA minimum) et description facultative.
- **Modifier** : nom, prix et description. Le réseau et le type ne changent pas.
- **Désactiver** : le forfait n'est plus proposé aux clients. Il reste visible dans le filtre **Désactivés**, d'où vous pouvez le **Réactiver** à tout moment.

> **À SAVOIR**
> Les forfaits de type **Crédit** ne sont pas encore affichés dans l'application mobile.

---

## 11. Les rémunérations des cabines

Menu **Équipe → Rémunérations**. Pour payer chaque cabine selon son activité du jour.

1. Choisissez la **date** (aujourd'hui par défaut).
2. Le tableau affiche, par cabine, les commandes traitées (assignées, en cours ou terminées), le **volume traité** et l'état du paiement. Les cabines non payées apparaissent en premier.
3. Cliquez sur **Payer**, saisissez le **montant**, la **méthode** (MTN Mobile Money, Orange Money, Espèces, Virement) et une note éventuelle.
4. Cliquez sur **Confirmer le paiement**.

> **À SAVOIR**
> Une cabine ne peut être payée **qu'une fois par jour**. Le montant est libre : il n'est pas calculé automatiquement.

---

## 12. Les agents promo

Menu **Opérations → Agents promo**. Les agents de terrain recrutent des clients grâce à leur **code de parrainage**.

- La liste affiche chaque agent avec son code, son statut, sa ville, ses **parrainages** et ses **commandes**. Recherchez par nom, téléphone ou code, et filtrez par statut ou par ville.
- **Nouvel agent** : Prénom, Nom et Téléphone obligatoires ; ville, quartier et pièce d'identité facultatifs. Le **code de parrainage est généré automatiquement**.
- **Fiche d'un agent** (cliquez sur sa carte) : coordonnées, **statistiques** (parrainages, commandes, volume) et meilleurs clients. La **pièce d'identité** se modifie avec l'icône crayon.
- **Désactiver** : l'agent passe **Inactif**. Son historique et ses parrainages sont conservés.

---

## 13. La relation client

### Les réclamations

Menu **Relation client → Réclamations**. Les clients signalent un problème depuis l'application : **Transfert non reçu**, **Mauvais produit** ou **Autre**.

1. Filtrez par statut : **En attente**, **En vérification**, **Résolues**, **Rejetées**.
2. Cliquez sur **Traiter** : vous voyez le client, le type, la description et la commande liée (cliquez sur son code pour l'ouvrir).
3. Deux possibilités :
   - **Résoudre** : choisissez le **type de résolution** (Remboursement, Nouvelle tentative, Explication fournie, Autre), écrivez vos **notes** (obligatoires), puis **Marquer comme résolue**.
   - **Rejeter** : expliquez la raison, puis **Rejeter**.
4. Une réclamation traitée peut être **archivée**.

> **ASTUCE**
> Si la solution est un remboursement, remboursez d'abord la commande depuis sa fiche ([section 5](#rembourser-une-commande)), puis résolvez la réclamation avec le type **Remboursement**.

### Le support client

Menu **Relation client → Support**. Le chat en direct avec les clients de l'application.

- Filtrez **Toutes**, **Ouvertes** ou **Résolues**, puis cliquez sur une conversation.
- Écrivez dans **Répondre au client...** et envoyez avec **Entrée**.
- Quand la demande est réglée, cliquez sur **Résoudre**. La conversation ne peut alors plus recevoir de réponse.

### Le call center

Menu **Relation client → Call Center**.

- **Demandes urgentes** : les clients qui demandent à être rappelés. Après l'appel, cliquez sur **Traiter** ; la ligne indique qui l'a traitée.
- **Enregistrer un appel** : numéro appelé, **résultat** (**Joint**, **Injoignable**, **Rappel prévu**), durée et notes facultatives.
- **Historique** : tous les appels, avec l'agent qui les a passés.
- **Statistiques** : total de la semaine, durée moyenne, résultats et performance par agent.

### La messagerie

Menu **Relation client → Messagerie**. Trois onglets :

| Onglet | Avec qui |
|---|---|
| **Cabines** | Les cabines partenaires (selon votre permission) |
| **Admins** | Un autre membre de l'équipe |
| **Groupe** | Toute l'équipe à la fois |

Pour écrire à un collègue : onglet **Admins**, bouton **Nouvelle**, puis choisissez la personne. Si une conversation existe déjà avec elle, elle se rouvre.

Les nouveaux messages de la conversation ouverte s'affichent automatiquement, **toutes les 20 secondes environ**.

---

## 14. L'anti-fraude

Menu **Relation client → Fraude**.

Les cartes du haut affichent les **numéros bloqués**, les **commandes bloquées pour fraude** du mois et les **commandes rejetées ou annulées** du mois.

### La liste noire

Un numéro bloqué **ne peut plus passer de commande** : il reçoit un refus avec la raison du blocage.

- **Bloquer un numéro** : **Téléphone** (numéro camerounais, 9 chiffres commençant par 6), **Raison** (5 caractères minimum) et **Expiration** en jours. Laissez l'expiration vide pour un blocage **permanent**.
- **Débloquer** : retire le numéro de la liste immédiatement.

### Vérifier un numéro

Onglet **Vérifier** : saisissez un numéro pour obtenir :

- **Numéro OK** ou **Numéro BLOQUÉ** (avec la raison) ;
- un **Score de risque** sur 100 (orange au-delà de 40, rouge au-delà de 70) ;
- une **Recommandation** : **Autoriser**, **À vérifier manuellement** ou **Bloquer** ;
- les **signaux détectés**.

---

## 15. Les notifications

La **cloche** en haut de l'écran affiche le nombre de notifications non lues et les 8 dernières. **Voir toutes les notifications →** ouvre la page complète (menu **Suivi & reporting → Notifications**).

- Cochez **Non lues seulement** pour filtrer.
- **Lire** marque une notification comme lue ; **Tout marquer lu** les marque toutes.

Vous ne recevez que les notifications utiles à votre rôle : par exemple, les nouvelles commandes ne sont envoyées qu'aux comptes qui ont accès aux commandes.

### Diffuser un message aux cabines

Avec la permission des paramètres, le bouton **Diffuser** envoie une notification à **toutes les cabines actives** :

1. Choisissez le **Type** : Information, Avertissement ou Urgent.
2. Saisissez un **Titre** (3 caractères minimum) et le **Message**.
3. Cliquez sur **Envoyer**. Le back-office indique combien de cabines l'ont reçue.

---

## 16. Tâches et rapports

### Les tâches

Menu **Suivi & reporting → Tâches**. Les tâches internes de l'équipe.

- **Nouvelle tâche** : **Titre**, description, **Date début** et **Échéance** (obligatoires), priorité (**Faible**, **Moyenne**, **Haute**, **Urgente**). Un super administrateur choisit la personne assignée ; pour les autres, la tâche leur est assignée.
- Cliquez sur l'**icône de statut** pour faire avancer une tâche : **À faire → En cours → Terminé**. Le crayon permet de la modifier, y compris de l'**annuler**.
- Chacun voit les tâches qui lui sont assignées ; un super administrateur voit toutes les tâches.

### Les rapports

Menu **Suivi & reporting → Rapports**. Trois onglets :

- **Finances** : pour **Ce mois**, **Cette année** ou une période **Personnalisée** : total encaissé (frais inclus), montant transféré, frais de service perçus, commandes complétées, avec la répartition **par réseau**, **par service** et les **meilleures cabines**.
- **Rapports** : **Nouveau rapport** (titre, introduction, travaux réalisés, conclusions), puis **Soumettre**. Un responsable peut le **Valider** ou le **Rejeter** avec une raison.
- **Budgets** : **Demande de budget** (objet, montant estimé, priorité, justification). Un responsable peut l'**Approuver**.

---

## 17. Les salaires

Menu **Équipe → Salaires**. Chaque membre de l'équipe pointe ses heures de travail.

### Votre session de travail

1. En début de travail, cliquez sur **Démarrer** : le chronomètre tourne (**● En cours**).
2. Pendant une pause, cliquez sur **Pause**, puis **Reprendre**.
3. En fin de travail, cliquez sur **Arrêter**. Le montant gagné pour la session s'affiche.

Le bas du bloc indique le **budget hebdomadaire** et le **taux horaire estimé**.

> **À SAVOIR**
> Vous ne pouvez avoir qu'**une seule session** ouverte à la fois. Si vous quittez la page, la session continue : elle s'affiche à votre retour.

### Sessions et paiements

L'onglet **Sessions** liste les sessions de travail (statut, début, durée, montant gagné) ; l'onglet **Paiements**, les salaires versés, avec la méthode et qui a payé. Vous voyez les vôtres ; les responsables des salaires voient toute l'équipe.

### Pour les responsables des salaires

- **Configuration** : budget hebdomadaire, jour de début de semaine et emails éligibles.
- **Enregistrer paiement** : choisissez l'**admin**, le **montant**, la **méthode** (Espèces, MTN MoMo, Orange Money, Virement) et des notes.

---

## 18. L'équipe (super administrateur)

Menu **Équipe → Équipe**. Réservé aux super administrateurs.

### Créer un compte

**Ajouter un admin** : **Nom complet**, **Email**, **Mot de passe temporaire** (8 caractères minimum) et **Rôle** (Admin, Service client, Chef agents promo, Contrôleur cabine). Transmettez ses identifiants à la personne et demandez-lui de changer son mot de passe.

### Modifier un compte

Le crayon **Modifier** permet de changer le nom, le rôle, le **statut du compte** (**Actif** / **Désactivé**) et d'attribuer un **nouveau mot de passe** (laisser vide pour ne pas le changer). C'est aussi la solution quand quelqu'un a oublié son mot de passe.

> **À SAVOIR**
> Un compte **Désactivé** est déconnecté dès sa prochaine action et ne peut plus se connecter. Préférez la désactivation à la suppression : elle est réversible.

### Personnaliser les permissions

Le bouclier **Permissions** ouvre la liste des 16 permissions du compte, chacune avec un interrupteur :

1. Activez ou désactivez les permissions voulues. **« Rôle : oui/non »** rappelle la valeur par défaut du rôle, et **« · modifié »** signale un changement.
2. Cliquez sur **Enregistrer**. Les nouvelles permissions s'appliquent dès la prochaine action de la personne.
3. **Revenir aux permissions du rôle** annule toute personnalisation.

> **ATTENTION**
> Changer le **rôle** d'un compte efface sa personnalisation : ses permissions redeviennent celles du nouveau rôle.

### Supprimer un compte

La corbeille **Supprimer** demande une confirmation : *« Le compte de {nom} sera supprimé définitivement. Cette action est irréversible. »*

Les comptes super administrateur, et votre propre compte, ne se modifient pas depuis cette page.

---

## 19. Les paramètres

Menu **Paramètres**.

| Onglet | Ce que vous réglez |
|---|---|
| **Frais de service** | Le **frais fixe par commande**, en XAF, ajouté à chaque commande (crédit, forfait, transfert), identique pour MTN et Orange. 20 XAF par défaut. |
| **Téléphones service** | Les numéros du service client proposés aux clients, avec un libellé et un **numéro principal**. |
| **Villes** | L'admin responsable de chaque ville. |
| **Général** | Autres réglages, comme les frais de dépôt sur le portefeuille et les frais de transfert entre membres. |

Pour changer une valeur, cliquez sur le **crayon**, saisissez la nouvelle valeur, puis **Enregistrer** (ou **OK**).

> **ATTENTION**
> Un nouveau frais de service s'applique **immédiatement** à toutes les nouvelles commandes. L'exemple affiché (commande de 10 000 XAF) vous montre le total que paiera le client.

---

## 20. Votre profil et votre sécurité

Cliquez sur votre nom en bas du menu, ou sur votre prénom en haut à droite.

- **Informations personnelles** : prénom, nom, téléphone, photo (adresse de l'image). Cliquez sur **Sauvegarder**.
- **Changer le mot de passe** : mot de passe actuel, nouveau mot de passe (8 à 64 caractères) et confirmation. Vos **autres appareils sont déconnectés** ; celui-ci reste connecté.
- **Permissions** : ce que votre compte peut faire, avec la mention **Personnalisées** le cas échéant.
- **Sessions actives** : les appareils connectés à votre compte (navigateur, adresse IP, dernière activité). **Cet appareil** désigne celui que vous utilisez. **Déconnecter** ferme une session à distance ; **Déconnecter les autres appareils** les ferme toutes sauf celle-ci.

### Nos conseils de sécurité

- Choisissez un mot de passe **personnel et difficile à deviner**, et ne le communiquez jamais, même à un collègue.
- Si un appareil inconnu apparaît dans **Sessions actives**, déconnectez-le, puis changez votre mot de passe.
- Sur un ordinateur partagé, cliquez toujours sur **Déconnexion** en partant.

---

## 21. Les règles à connaître

- **Frais de service** : un montant fixe par commande (20 XAF par défaut), payé par le client en plus du montant.
- **Attribution automatique** : une commande en révision est attribuée seule après **5 minutes**.
- **Cabines éligibles** : active, pas en pause, abonnement actif et non expiré, quota du jour non atteint, réseau disponible, montant maximum respecté.
- **Solde UV** : débité uniquement quand la cabine **complète** une commande, du montant exact.
- **Recharge UV** : valider crédite la cabine tout de suite ; ne validez qu'après avoir vérifié le paiement.
- **Remboursement** : irréversible, frais compris ; une commande livrée ne se rembourse que par un super administrateur.
- **Liste noire** : un numéro bloqué ne peut plus commander, jusqu'à l'expiration ou au déblocage.
- **Permissions** : ce que vous voyez dépend de votre rôle et de vos permissions ; un super administrateur peut les ajuster.

---

## 22. Questions fréquentes

**Une page affiche « Accès refusé ».** Votre compte n'a pas la permission correspondante. Demandez à un super administrateur de l'ajouter si vous en avez besoin.

**Un bouton décrit dans ce guide n'apparaît pas chez moi.** Il dépend d'une permission ou du statut de la commande. Par exemple, **Assigner** n'apparaît que sur une commande En révision, Approuvée ou Retournée, et **Rembourser** seulement sur une commande payée.

**Une commande reste « En révision ».** Attribuez-la avec **Assigner** → **Meilleure cabine automatique**. Sans action, elle est attribuée automatiquement après 5 minutes. Si elle échoue, vérifiez qu'au moins une cabine est éligible : active, abonnement valide, quota disponible.

**Une nouvelle cabine ne reçoit aucune commande.** Son abonnement n'est sans doute pas activé : ouvrez sa fiche et cliquez sur **Activer l'abonnement**. Vérifiez aussi qu'elle n'est ni en pause ni suspendue.

**Une cabine dit ne pas pouvoir terminer ses commandes.** Son solde UV est insuffisant. Vérifiez ses demandes de recharge dans **UV → Demandes**.

**Le client a payé mais sa commande est toujours « Paiement attendu ».** Vérifiez le paiement (message de l'opérateur, référence). S'il est confirmé, utilisez **Valider paiement** sur la commande.

**Un client a payé mais n'a rien reçu.** Cherchez sa commande. Si elle est rejetée, annulée ou expirée, elle apparaît dans **Réconciliation → À rembourser** : remboursez-la. Si elle est « Complétée » mais que le bénéficiaire n'a rien reçu, traitez sa réclamation et, si besoin, demandez le remboursement à un super administrateur.

**La validation d'une recharge UV est refusée.** La SIM choisie n'a pas assez de solde. Rechargez la SIM dans **UV → SIM Cards → Recharger / corriger le solde**, ou validez sans choisir de SIM.

**J'ai oublié mon mot de passe.** Demandez à un super administrateur de vous en attribuer un nouveau depuis la page **Équipe**, puis changez-le dans **Mon profil**.

**J'ai été déconnecté sans raison.** Votre session a expiré, ou votre mot de passe a été changé, ou une session a été fermée depuis un autre appareil. Reconnectez-vous. Si le message indique « Compte désactivé », contactez un super administrateur.

**La recherche rapide n'apparaît pas.** Elle est disponible sur ordinateur. Sur téléphone, utilisez la recherche et les filtres de chaque page (Commandes, Cabines…).

---

> **Support technique TransfertCM :** *à compléter (téléphone, WhatsApp, e-mail)*
