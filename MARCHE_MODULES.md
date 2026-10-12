# DébrouillePro — La marche complète : du premier au dernier module

Dernière mise à jour : v0.9.0-rc1 — Wave 0 fermée (runtime release validée)

---

# RELEASE CANDIDATE

```text
Tag         : v0.9.0-rc1
Commit      : b481aa359dd59c39ee2e0920fa43965d803fdd18
Standalone  : ✅ bundle embarqué, aucune dépendance Metro
Smoke test  : ✅ 10/10 sur device Android réel
Tag distant : ✅ pushé sur origin/master
```

Politique RC :

- Wallet fonctionnel en lecture/ledger réel
- Aucun faux crédit, aucun faux paiement
- Recharge désactivée au lancement (B1-a.1)
- Aucun provider de paiement activé sans validation E2E

---

# PROTOCOLE DE VALIDATION (par module, identique à chaque fois)

Étape 1 — Backend Convex
npx convex dev
→ Attendu : "√ Convex functions ready!"

Étape 2 — TypeScript du module (filtré)
npx tsc --noEmit 2>&1 | Select-String "features[/\\]<module>"
→ Attendu : aucune sortie (0 erreur sur le module)

Étape 3 — Test manuel / Expo Dev Client
cd C:\p
npx expo start --dev-client -c
→ Attendu : démarre sans crash

Étape 4 — Commit dédié
git add <fichiers du module>
git commit -m "<type>(<module>): close <num> — <résumé>"
git push

Étape 5 — 🔒 MODULE FERMÉ

Règles transverses :

- Aucun @ts-ignore / @ts-expect-error / as any dans le module
- Chaque correction est faite à la source, jamais pour faire taire tsc
- Le tsc complet est réservé à la fin du projet

Filtres tsc par module :
Auth → features[/\\]auth
Messages → features[/\\]messages
Services → features[/\\]services
Agri → features[/\\]agri
Transport → features[/\\]transport
Hebergement → features[/\\]hebergement
Restauration→ features[/\\]restauration
Network → features[/\\]network
Community → features[/\\]community
... (adapter au module en cours)

---

# LA MÉTHODE UNIVERSELLE (par module)

1.  AUDIT SOURCE → lire tout le code réel du module
2.  SCHEMA → tables, champs, indexes, searchIndex
3.  BACKEND → convex/<module>.ts : queries, mutations,
    actions, auth, validations, pagination
4.  FRONTEND HOOKS → src/features/<module>/ : useXxx()
5.  FRONTEND PAGES → pages + composants + loading/error/empty
6.  MESSAGES → tout point de contact → api.messages.conversations
7.  NOTIFICATIONS → événements métier réels (pas inventés)
8.  WALLET/PAYMENTS → si transaction (réservation, commande, paiement)
9.  SEARCH V2 → adapter + registry + source
10. TESTS MANUELS → parcours réel bout-en-bout
11. → PROTOCOLE DE VALIDATION (ci-dessus)

---

# VAGUE 0 — Verrouillage des 5 fondations

## 🔒 0.1 — AUTH / USERS — CLOSED

Statut : CLOSED
Commit : 9db49d1f4 (pushed origin/master)
Fichiers : 37 modifiés (+2549 / -750)
Raccourcis : aucun (0 as any, 0 @ts-ignore, 0 @ts-expect-error)
convex dev : ✅ Convex functions ready
tsc (auth) : ✅ 0 erreur
expo dev : ✅ démarre sans crash

Changements livrés :

- Migration Web → RN incomplète corrigée
- Shim react-router-dom rétabli pour 7 fichiers
- motion/react résolu
- AuthGuard : prop morte requireEmailVerified retirée
- LiveStreamingPage : commentaire obsolète api.users.getMe nettoyé

Dettes documentées (non bloquantes, vague ultérieure "auth hardening") :

- ~50 requireUser locaux dupliqués
- isAdmin vs roles.includes("admin") : 2 conventions coexistantes
- permissions : champ jamais lu/écrit
- homePreferences, website : champs sans mutation
- by_phone : index sans query
- updateCurrentUser, getMyProfile, resolveCurrentUser : legacy
- AuthGuard : non branché sur les routes

---

## 🔒 0.2 — MESSAGES — CLOSED (partiel)

Statut : CLOSED partiel
Commit : 1786717b1 (pushed origin/master)
Fichiers : 14 modifiés (+1698 / -639)
Raccourcis : aucun
convex dev : ✅ Convex functions ready
tsc (msg) : ✅ 0 erreur
Runtime RC : ✅ liste + conversation validées sur APK standalone

### Validés en condition réelle (15/21)

| #    | Test             | Statut |
| ---- | ---------------- | ------ |
| T.01 | Texte            | 🟢     |
| T.02 | Reply            | 🟢     |
| T.03 | Emoji            | 🟢     |
| T.04 | Photo            | 🟢     |
| T.05 | Caméra           | 🟢     |
| T.06 | Vidéo            | 🟢     |
| T.07 | Vocal            | 🟢     |
| T.08 | Localisation     | 🟢     |
| T.09 | Contact          | 🟢     |
| T.10 | Sondage          | 🟢     |
| T.11 | Paiement         | 🟢     |
| T.12 | Événement        | 🟢     |
| T.13 | Emploi           | 🟢     |
| T.14 | Immobilier       | 🟢     |
| T.18 | Réactions / Pins | 🟢     |

### Reportés au test final avant lancement (6/21)

| #    | Test       | Raison                                             |
| ---- | ---------- | -------------------------------------------------- |
| T.15 | Temps réel | Nécessite 2 devices avec 2 comptes distincts       |
| T.16 | Présence   | Idem — validation croisée A↔B                      |
| T.17 | Typing     | Idem — indicateur vu par l'autre                   |
| T.19 | Recherche  | Infra présente, recherche complète à finaliser     |
| T.20 | Sécurité   | Blocage / signalement — non testé                  |
| T.21 | Appels A/V | Audio + vidéo bidirectionnel — nécessite 2 devices |

### Dettes documentées

- **Bulle « publication partagée »** : envoie un `text` + `sharedPublicationId`
  (pas de `PublicationMessage.tsx` dédié). À brancher en V2.
- **`MessageAttachments.tsx`** : fond blanc/transparent `own`, correct sur les
  deux thèmes.
- **`ChatView.tsx`** : transfert de message retiré du menu (hors scope).
- **`useLocation.ts`** : migration `navigator.geolocation` → `expo-location`.
- **`app.json`** : permissions GPS + plugin `expo-location`.
- **`expo-video`** ajouté en dépendance.

---

## 🔒 0.3 — NOTIFICATIONS — CLOSED (In-App)

Statut : CLOSED In-App
Runtime RC : ✅ validé sur APK standalone
Périmètre : notifications in-app uniquement
Preuve : 46 notifications affichées, 37 non lues
Sections : Épinglées + Récentes
Catégories : Messages, Santé, Livraison, Paiements, Jobs, Agri, Transport
Actions : actions contextuelles Santé validées

### Périmètre validé

- ✅ Backend `convex/notifications.ts`
- ✅ Notifications Messages, Annonces, Community, Réservations
- ✅ Hook `use-notifications.ts`
- ✅ `NotificationCenter` — accès rapide
- ✅ `NotificationsPage` — centre complet
- ✅ Compteur non-lus
- ✅ Lecture individuelle + marquage global
- ✅ Dismiss / suppression logique
- ✅ 18 types de notifications
- ✅ Aucun `@ts-ignore`, `@ts-expect-error` ou `as any`

### Architecture UI

Deux interfaces coexistent volontairement :

1. `NotificationCenter` — accès rapide depuis Header/Home
2. `NotificationsPage` — vue complète, lazy-loaded

Il ne s'agit pas d'un doublon fonctionnel.

### Dettes documentées

#### 🔴 Push natif Android / iOS

Backend expose : `registerPush`, `unregisterPush`, `hasPushSubscription`.

Aucune intégration native consommée depuis `src/`.

Absence : `expo-notifications`, `getExpoPushTokenAsync`, enregistrement
automatique du token, pipeline FCM/APNs.

`pushSubscriptions` actuelle = structure Web Push (endpoint/p256dh/auth).

**Décision : report volontaire → 0.3b Push natif.**

#### 🟡 Services de notification des modules

Existants mais pas production-ready :

- `features/agri/services/AgriNotificationService.ts`
- `features/hebergement/services/NotificationService.ts`
- `features/restauration/services/NotificationService.ts`
- `features/transport/services/NotificationService.ts`

**Décision : report volontaire → à raccorder avec chaque module.**

#### 🟡 `networkNotifications`

Table présente, aucune consommation frontend identifiée.

**Décision : ne pas supprimer — rôle réévalué lors de l'audit Network.**

---

## 🔒 0.4 — SEARCH V2 — CLOSED (Infrastructure)

Statut : CLOSED Infrastructure
Runtime RC : ✅ validé sur APK standalone
Recherche : `mais`
Résultats : Modules + Annonces
Preuve : Immobilier, Maison, Maison bota
Navigation : résultats affichés avec affordance de navigation
Crash : aucun

Search V2 est une **couche transverse**, pas un module métier indépendant.

### Infrastructure livrée

- ✅ `convex/search.ts` — entry points publics
- ✅ `convex/search/engine.ts`, `ranking.ts`, `intent.ts`, `location.ts`,
  `normalize.ts`, `entities.ts`, `types.ts`, `registry.ts`
- ✅ Adapters `convex/search/sources/*`
- ✅ 12 `searchIndex` déclarés dans `schema.ts`
- ✅ `searchV2`, `smartSearch`, `searchPublications`, `searchUsers`,
  `getTrendingTags`
- ✅ Frontend : `AdvancedSearch`, `SmartSearch`, `SearchBar`
- ✅ Hooks / recherches spécifiques dans plusieurs modules

### Stratégie d'intégration

Search V2 sera validée fonctionnellement **module par module**.

La clôture d'un module métier devra vérifier :

1. searchIndex
2. alimentation de l'index
3. registry
4. adapter
5. hook frontend
6. UI
7. recherche réelle
8. filtres / ranking applicables
9. test manuel

La présence d'un `searchIndex` dans le schéma ne constitue pas une preuve
de couverture fonctionnelle complète.

### Dettes documentées

- 🟡 Plusieurs `as any` subsistent dans des composants/adapters Search.
- 🟡 `AnnonceAISearch.tsx` utilise `window.webkitSpeechRecognition`,
  incompatible avec l'architecture native.
- 🟡 `events/search.ts` contient encore un cast temporaire.
- 🟡 Certains adapters backend utilisent encore des casts `any`.
- 🟡 La présence d'un `searchIndex` ne garantit pas que toutes les écritures
  métier l'alimentent correctement.
- 🟡 Couverture fonctionnelle de chaque index validée à la clôture du
  module correspondant.

---

## 🟡 0.5 — WALLET / PAYMENTS — IN PROGRESS

Statut : IN PROGRESS
Runtime RC : ✅ garde-fous validés sur APK standalone

### Wallet

- ✅ Lecture du ledger réel
- ✅ Solde réel (0 CDF au boot)
- ✅ Aucun faux crédit
- ✅ Aucun faux paiement
- ✅ Historique fonctionnel

### Recharger

- ✅ Désactivé au lancement (B1-a.1)
- ✅ Alerte « Recharges bientôt disponibles »

### Envoyer / Recevoir

- ✅ Bloqués tant que le Payment Core outbound n'est pas disponible
- ✅ Messages clairs, aucun débit fictif

### Stripe

- ✅ Intégré côté technique (adapter, webhook, provider dormant)
- ⏸️ Non testé E2E (compte Stripe indisponible pour entité RDC)
- 🟡 `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` non posés en dev

### Mobile Money

- ⏸️ Aucun provider activé
- 🟡 Nécessite credentials + test E2E réel
- 🟡 `PROVIDER_NOT_CONFIGURED` par design pour les 4 providers

### Règles absolues

- Aucun provider activé sans E2E réel validé
- Aucun crédit ledger sans webhook vérifié
- Aucun faux succès
- `clientSecret` jamais persisté
- Tolérance timestamp ±300s sur webhook Stripe

### Chantiers post-RC pour clôturer 0.5

1. Provider accessible à une entité RDC (Stripe Atlas, Flutterwave, etc.)
2. Credentials posés en env
3. Test E2E complet : intent → provider → webhook → ledger
4. Validation 3DS + carte refusée + idempotence webhook
5. Réactivation B1-a.1 (retrait du guard UI)

---

# VAGUE 1 — Modules backend-ready, frontend à brancher (7 modules)

Ordre : Services d'abord.

| #   | Module       | Backend                    | Frontend à faire                      |
| --- | ------------ | -------------------------- | ------------------------------------- |
| 1   | Services     | convex/serviceProviders.ts | brancher + Search + Notif + Msg + Pay |
| 2   | Agri         | convex/agri.ts             | tout                                  |
| 3   | Transport    | convex/transport.ts        | tout                                  |
| 4   | Hebergement  | convex/hebergement.ts      | tout                                  |
| 5   | Restauration | convex/restauration.ts     | tout                                  |
| 6   | Network      | convex/network.ts          | tout                                  |
| 7   | Community    | convex/community.ts        | tout                                  |

---

# VAGUE 2 — Modules presque clos à finaliser (8 modules)

| #   | Module      | État actuel | Reste à faire        |
| --- | ----------- | ----------- | -------------------- |
| 1   | Marketplace | 10 appels   | DetailPage = 0 appel |
| 2   | Santé       | très riche  | verrouiller + Search |
| 3   | Éducation   | riche       | verrouiller          |
| 4   | Emploi      | riche       | verrouiller + Search |
| 5   | Immo        | branché     | Search + Notif       |
| 6   | Voyages     | branché     | Search + Notif       |
| 7   | Urbanisme   | riche       | verrouiller          |
| 8   | Événements  | branché     | Search + Notif       |

---

# VAGUE 3 — Contenu / expérience

Media, Reels, Live (V2.1 déjà fait), Stories, Series, Creator,
AIStudio, Templates, Editeur.

---

# VAGUE 4 — Admin / outils / transverse

Admin, Analytics, Settings, Reputation, Badges, Parrainage, Tracking,
Documents, Agenda, SOS, Finances, Revenus, Premium, Subscriptions.

---

# CHECKLIST DE CLÔTURE (par module)

[ ] 1. Audit : tous les fichiers backend + frontend lus
[ ] 2. Schema : tables + indexes + searchIndex cohérents
[ ] 3. Backend : queries/mutations/actions protégés par auth
[ ] 4. Hooks : src/features/<module>/ avec useXxx()
[ ] 5. Pages : loading + error + empty + data
[ ] 6. Messages : "Contacter" → getOrCreateDirect(userId)
[ ] 7. Notifications : chaque événement métier → createNotification
[ ] 8. Wallet : si transaction → createPaymentIntent
[ ] 9. Search : adapter + source + registry
[ ] 10. Tests manuels : parcours réel bout-en-bout
[ ] 11. npx convex dev → 0 erreur
[ ] 12. npx tsc --noEmit (filtré) → 0 erreur
[ ] 13. Aucun raccourci : 0 as any, 0 @ts-ignore, 0 @ts-expect-error
[ ] 14. npx expo start --dev-client -c → démarre sans crash
[ ] 15. Commit dédié poussé
[ ] 16. 🔒 MODULE FERMÉ

Aucune case ne se coche par supposition. Chaque case a une preuve.

---

# RÈGLE DE VERROUILLAGE

MODULE FERMÉ =
aucune dette technique connue

- aucun TODO critique
- aucun placeholder
- aucun bouton cosmétique
- aucune page vide
- toutes les dépendances (Messages, Notif, Wallet, Search) branchées

Un module clos ne se rouvre plus, sauf régression détectée.

---

# ÉTAT GLOBAL

Vague 0 :
[x] 0.1 Auth 🔒 CLOSED (9db49d1f4)
[x] 0.2 Messages 🔒 CLOSED (partiel) (1786717b1)
[x] 0.3 Notifications 🔒 CLOSED (In-App) — runtime release validé
[x] 0.4 Search V2 🔒 CLOSED (Infra) — runtime release validé
[~] 0.5 Wallet/Payments 🟡 IN PROGRESS — garde-fous runtime validés

Release Candidate :
v0.9.0-rc1
Commit : b481aa359
Standalone : ✅
Smoke test : ✅ 10/10
Tag distant : ✅ pushé

Vague 1 : [ ] non démarrée
Vague 2 : [ ] non démarrée
Vague 3 : [ ] non démarrée
Vague 4 : [ ] non démarrée

---

# DETTES TRANSVERSES (tracées, non bloquantes)

- 🟡 ~1007 fichiers non-conformes à la config Prettier (80 + auto)
  → baseline progressive post-RC
- 🟡 Push natif Android / iOS — chantier 0.3b
- 🟡 Providers Mobile Money — E2E réel non effectué
- 🟡 Stripe E2E — compte RDC non disponible
- 🟡 `as any` résiduels dans Search (adapters + 2 composants frontend)
- 🟡 `window.webkitSpeechRecognition` dans `AnnonceAISearch.tsx` (Web-only)
- 🟡 ~80 fichiers `error.message` en catch (B3 post-RC)
- 🟡 `ReportButton.tsx` sanitization (P0 B3)
- 🟡 `networkNotifications` non consommé

---

# RÈGLES DE MISE À JOUR DE CE FICHIER

À chaque module fermé :

1. Passer le module de 🔄 EN COURS à 🔒 CLOSED
2. Sous sa section, ajouter :
   - commit SHA
   - nb fichiers touchés
   - preuve `convex dev` (✅)
   - preuve `tsc` filtré (✅ 0 erreur)
   - preuve `expo start --dev-client -c` (✅)
   - liste des dettes documentées
3. Passer le module suivant à 🔄 EN COURS
4. Mettre à jour la section ÉTAT GLOBAL

Aucune autre modification. La méthode, la marche et les règles de
verrouillage restent stables sauf décision explicite.
