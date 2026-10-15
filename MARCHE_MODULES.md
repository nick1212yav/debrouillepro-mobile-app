**# DébrouillePro --- La marche complète : du premier au dernier module**

**\*\*Version du document :\*\*** v0.9.0-rc1 --- Wave 0.4 Search V2 fermé\\

**\*\*Dernière mise à jour documentaire :\*\*** ajout du standard produit

mobile-first et traçabilité du blocage runtime Services.

\> **\*\*Principe directeur :\*\*** une fonctionnalité n'est considérée comme

\> livrée que lorsque son code réel, ses dépendances backend, son

\> parcours utilisateur et ses preuves de validation concordent. Une

\> intention, une maquette ou une ancienne validation ne remplace pas une

\> preuve actuelle.

**---**

**# 1. Protocole de validation**

**## Par module**

**### Étape 1 --- Backend Convex**

\`\`\`powershell

npx convex dev

\`\`\`

**\*\*Attendu :\*\*** \`√ Convex functions ready!\`

**### Étape 2 --- TypeScript ciblé sur le module**

\`\`\`powershell

npx tsc --noEmit 2>&1 | Select-String "features[/\\\\]\<module>"

\`\`\`

**\*\*Attendu :\*\*** aucune sortie correspondant au périmètre ciblé. Ce

contrôle filtré ne prouve pas que l'ensemble du projet passe TypeScript.

**### Étape 3 --- Test manuel**

\`\`\`powershell

npx expo start --dev-client -c

\`\`\`

**\*\*Attendu :\*\*** démarrage sans crash et vérification du parcours réel du

module.

Pour les validations Release Candidate, un \*\*build release Android

réel\*\* et des tests runtime peuvent être exigés en complément.

**### Étape 4 --- Commit dédié**

\`\`\`powershell

git add \<fichiers-du-module>

git diff --cached --check

git commit -m "\<type>(\<module>): close \<num> — \<résumé>"

git push

\`\`\`

Avant le commit, inspecter les fichiers staged et vérifier que les

modifications hors périmètre ne sont pas incluses. Ne pas utiliser

\`git add .\` à l'aveugle.

**### Étape 5 --- Verrouillage**

Un module ne passe à **\*\*🔒 CLOSED\*\*** que lorsque les critères convenus

sont prouvés. Documenter toute dette restante ; ne pas présenter une

vérification non réalisée comme réussie.

**## Règles transverses**

\- Aucun \`@ts-ignore\`.

\- Aucun \`@ts-expect-error\`.

\- Aucun \`as any\` introduit pour masquer une erreur.

\- Toute correction est faite à la source.

\- Le \`tsc\` complet est réservé à la fin du projet, selon le protocole

  global.

\- Une dette connue et explicitement reportée n'est pas présentée comme

  résolue.

\- Un résultat filtré ne doit pas être décrit comme une réussite

  TypeScript globale.

\- Une preuve ancienne ne valide pas automatiquement une modification

  récente.

**## Filtres TypeScript ciblés**

\- Auth → \`features[/\\\\]auth\`

\- Messages → \`features[/\\\\]messages\`

\- Services → \`features[/\\\\]service\` ou le chemin exact réellement

  utilisé par le module

\- Agri → \`features[/\\\\]agri\`

\- Transport → \`features[/\\\\]transport\`

\- Hébergement → \`features[/\\\\]hebergement\`

\- Restauration → \`features[/\\\\]restauration\`

\- Network → \`features[/\\\\]network\`

\- Community → \`features[/\\\\]community\`

Adapter le filtre à l'emplacement réel des fichiers et examiner la

commande utilisée avant de conclure.

**---**

**# 2. Standard produit --- l'ambition DébrouillePro**

Les références visuelles définissent une **\*\*direction produit\*\*** ; elles

ne prouvent pas que les écrans, interactions ou intégrations sont déjà

implémentés. Elles guident les décisions sans autoriser l'invention de

données ou de capacités.

**## Les quatre piliers obligatoires**

**### 2.1 Une carte claire pour chaque module**

\- Chaque module, service, annonce, profil ou objet métier doit avoir

  une carte adaptée à son contenu.

\- La carte présente d'abord l'information utile à la décision :

  identité, catégorie, statut, prix ou disponibilité lorsque ces

  données existent.

\- La densité, la taille et la disposition sont adaptées à l'importance

  de l'information ; éviter les cartes génériques interchangeables.

\- Les données absentes doivent être omises ou signalées proprement,

  jamais inventées.

\- Les cartes doivent rester lisibles sur petits écrans et avec les

  paramètres d'accessibilité du système.

**### 2.2 Des verbes d'action explicites**

Chaque carte expose des actions pertinentes pour son contexte, par

exemple **\*\*Voir\*\***, **\*\*Contacter\*\***, **\*\*Demander un devis\*\***, **\*\*Réserver\*\***,

**\*\*Payer\*\***, **\*\*Localiser\*\***, **\*\*Enregistrer\*\*** ou **\*\*Partager\*\***, uniquement si

l'action est réellement prise en charge.

\- L'action principale doit être immédiatement identifiable.

\- Les actions secondaires ne doivent pas rivaliser visuellement avec

  l'action principale.

\- Chaque bouton doit produire un résultat réel, avec états de

  chargement, succès et erreur appropriés.

\- Une action non disponible doit être désactivée ou expliquée ; elle

  ne doit pas simuler une intégration fonctionnelle.

\- Les actions sensibles (paiement, suppression, réservation) doivent

  avoir les validations et confirmations nécessaires.

**### 2.3 Une expérience React Native authentiquement native**

\- Concevoir d'abord pour les interactions mobiles : toucher, glisser,

  retour système, clavier, zones sûres, permissions et réseau

  variable.

\- Utiliser les composants et APIs React Native / Expo appropriés ; ne

  pas transposer simplement une page web dans un conteneur mobile.

\- Respecter les safe areas, le clavier, le contraste, les tailles

  tactiles, le défilement et les performances.

\- Utiliser les animations natives adaptées, sans sacrifier

  l'accessibilité ni la fluidité.

\- Vérifier les comportements sur un appareil ou build natif réel

  lorsque le protocole l'exige.

\- Éviter les patterns visuels web (mise en page de bureau compressée,

  boutons minuscules, surcharges de panneaux, interactions dépendant

  d'un pointeur).

**### 2.4 Une hiérarchie visuelle réfléchie**

\- Organiser chaque écran autour d'une tâche principale et d'une

  hiérarchie nette.

\- Maintenir la cohérence des espacements, typographies, icônes,

  couleurs, états et transitions.

\- Prévoir systématiquement les états \`loading\`, \`error\`, \`empty\` et

  \`data\`.

\- Préserver la lisibilité sur des appareils de tailles différentes et

  dans les conditions réseau réelles.

\- Favoriser une expérience premium, distinctive et cohérente, sans

  effets décoratifs qui gênent la compréhension ou les performances.

**\*\*Garde-fou produit :\*\*** les références visuelles guident le produit,

mais ne justifient jamais l'invention de données ou d'intégrations.

**\*\*Principe de qualité :\*\*** viser l'excellence africaine et internationale

par la fiabilité, l'utilité, la rapidité et le soin d'exécution --- pas

par des promesses non vérifiées.

**---**

**# 3. La méthode universelle d'audit et de clôture**

1\.  **\*\*AUDIT SOURCE\*\*** --- lire le code réel et les points d'entrée.

2\.  **\*\*SCHEMA\*\*** --- vérifier tables, champs, indexes et \`searchIndex\`.

3\.  **\*\*BACKEND\*\*** --- examiner queries, mutations, actions,

    authentification, validations et pagination.

4\.  **\*\*FRONTEND HOOKS\*\*** --- suivre les hooks \`useXxx()\` et leurs états.

5\.  **\*\*FRONTEND PAGES\*\*** --- vérifier \`loading\`, \`error\`, \`empty\` et

    \`data\`.

6\.  **\*\*MESSAGES\*\*** --- vérifier les points de contact réels et les

    autorisations.

7\.  **\*\*NOTIFICATIONS\*\*** --- relier les événements métier réels aux

    notifications.

8\.  **\*\*WALLET / PAYMENTS\*\*** --- vérifier transactions, idempotence et

    garde-fous.

9\.  **\*\*SEARCH V2\*\*** --- contrôler index → alimentation → registry →

    adapter → hook → UI.

10\. **\*\*TESTS MANUELS\*\*** --- exécuter un parcours réel de bout en bout.

11\. **\*\*PROTOCOLE DE VALIDATION\*\*** --- conserver les preuves et résultats.

12\. **\*\*DOCUMENTATION + COMMIT\*\*** --- mettre à jour le suivi, isoler le

    périmètre et pousser le commit dédié.

Ne déduire aucun comportement uniquement à partir du nom d'un fichier ou

d'un composant : suivre l'appel jusqu'à son effet réel.

**---**

**# 4. Vague 0 --- Fondations**

**## 🔒 0.1 --- AUTH / USERS --- CLOSED**

**\*\*Commit de référence :\*\*** \`9db49d1f4\`\\

**\*\*Statut documenté :\*\*** 🟢 CLOSED

\- Backend Convex : validé selon le suivi existant.

\- TypeScript Auth : 0 erreur ciblée selon le suivi existant.

\- Validation runtime : documentée comme validée.

\- Aucun raccourci TypeScript introduit selon le suivi existant.

**### Dettes documentées**

\- Des \`requireUser\` locaux subsistent à plusieurs endroits.

\- Deux conventions admin coexistent (\`isAdmin\` /

  \`roles.includes("admin")\`).

\- Quelques champs et helpers legacy restent présents.

Ces éléments sont hors périmètre de la clôture 0.1 et ne doivent pas

être considérés comme résolus.

**## 🔒 0.2 --- MESSAGES --- CLOSED PARTIEL**

**\*\*Commit final historique :\*\*** \`1786717b1\` --- poussé sur

\`origin/master\`\\

**\*\*Phase A :\*\*** \`096798893\` --- stabilisation compile\\

**\*\*Fichiers du commit final :\*\*** 14\\

**\*\*Diff documenté :\*\*** \`+1698 / -639\`\\

**\*\*TypeScript Messages :\*\*** 0 erreur ciblée selon le suivi\\

**\*\*Convex :\*\*** functions ready selon le suivi\\

**\*\*Expo :\*\*** démarrage validé selon le suivi

**### QA documentée --- 15/21**

Test Statut

**---**

Texte 🟢

Reply 🟢

Emoji 🟢

Photo 🟢

Caméra 🟢

Vidéo 🟢

Vocal 🟢

Localisation 🟢

Contact 🟢

Sondage 🟢

Paiement 🟢

Événement 🟢

Emploi 🟢

Immobilier 🟢

Réactions / Pins 🟢

**### Reportés au test final --- 6/21**

Test Statut Raison

**---**

Temps réel ⏳ Deux appareils et deux comptes nécessaires

Présence ⏳ Validation croisée A ↔ B

Typing ⏳ Validation croisée A ↔ B

Recherche 🟡 Recherche dans les messages à compléter

Sécurité ⏳ Blocage / signalement non testés

Appels A/V ⏳ Audio et vidéo bidirectionnels à valider

**### Dettes documentées**

\- Publication partagée : représentation actuelle via \`text\` +

  \`sharedPublicationId\`.

\- \`MessageAttachments.tsx\` : détail visuel documenté.

\- Transfert de message : hors périmètre actuel.

\- Migration \`navigator.geolocation\` → \`expo-location\` effectuée selon

  le suivi.

\- Permissions GPS et plugin \`expo-location\` configurés selon le suivi.

\- \`expo-video\` ajouté selon le suivi.

**\*\*Règle :\*\*** le module reste gelé et ne se rouvre qu'en cas de régression

démontrée ou lors de la QA finale prévue. Les preuves historiques

doivent être reconfirmées si les fichiers concernés changent.

**## 🔒 0.3 --- NOTIFICATIONS --- CLOSED (IN-APP)**

**\*\*Statut documenté :\*\*** 🟢 CLOSED --- Notifications In-App

**### Périmètre documenté**

\- \`convex/notifications.ts\`

\- Notifications Messages

\- Notifications Annonces

\- Notifications Community / Réservations

\- \`use-notifications.ts\`

\- \`NotificationCenter\`

\- \`NotificationsPage\`

\- Compteur de non-lus

\- Lecture individuelle

\- Marquage global comme lu

\- Dismiss / suppression logique

\- 18 types de notifications supportés

\- Chaîne backend → frontend documentée comme fonctionnelle

\- Aucun \`@ts-ignore\`, \`@ts-expect-error\` ou \`as any\` introduit selon

  le suivi

**### Architecture UI**

\`NotificationCenter\` et \`NotificationsPage\` coexistent volontairement :

1\.  **\*\*NotificationCenter\*\*** --- accès rapide depuis Home / Header.

2\.  **\*\*NotificationsPage\*\*** --- centre complet et consultation

    approfondie.

Ils ne constituent pas un doublon fonctionnel.

**### QA runtime release documentée**

🟢 Validée selon le suivi existant.

Preuve manuelle consignée : 46 notifications affichées, 37 non lues,

filtres par source, sections épinglées / récentes, actions contextuelles

visibles et aucun crash.

**### Dettes documentées**

**#### 🔴 0.3b --- Push natif Android / iOS**

Le backend expose les opérations de souscription, mais l'intégration

native complète n'est pas encore consommée par \`src/\`.

À intégrer lors du chantier dédié :

\- permission native ;

\- token Expo / FCM / APNs ;

\- enregistrement backend ;

\- delivery ;

\- tap / deep-link ;

\- foreground / background ;

\- validation Android et iOS.

**\*\*Décision :\*\*** report volontaire.

**#### 🟡 Services de notification des modules**

Les services Agri / Hébergement / Restauration / Transport restent des

préparations ou stubs. Ils ne sont pas présentés comme des intégrations

de notification production.

**#### 🟡 \`networkNotifications\`**

Table conservée. Son rôle sera réévalué lors de l'audit Network.

**## 🔒 0.4 --- SEARCH V2 --- CLOSED (INFRASTRUCTURE)**

**\*\*Statut documenté :\*\*** 🟢 Infrastructure prête --- intégration

progressive par module.

Search V2 est une couche transverse, pas un module métier indépendant.

**### Infrastructure documentée comme livrée**

\- \`convex/search.ts\` --- entry points publics

\- \`convex/search/engine.ts\`

\- \`convex/search/ranking.ts\`

\- \`convex/search/intent.ts\`

\- \`convex/search/location.ts\`

\- \`convex/search/normalize.ts\`

\- \`convex/search/entities.ts\`

\- \`convex/search/types.ts\`

\- \`convex/search/registry.ts\`

\- Adapters \`convex/search/sources/\*\`

\- 12 \`searchIndex\` déclarés dans \`schema.ts\`

\- \`searchV2\`

\- \`smartSearch\`

\- \`searchPublications\`

\- \`searchUsers\`

\- \`getTrendingTags\`

\- \`AdvancedSearch\`

\- \`SmartSearch\`

\- \`SearchBar\`

\- Recherche Messages dédiée

\- Hooks / recherches spécifiques présents dans plusieurs modules

**### Validation runtime documentée**

🟢 Validée sur le RC selon le suivi.

Test manuel consigné :

\- Recherche \`mais\`

\- 2 résultats agrégés observés

\- Modules : 1 résultat

\- Annonces : 2 résultats

\- Résultats distincts : \`Immobilier\`, \`Maison\`, \`Maison bota\`

\- Navigation par résultat visible

\- Aucun crash / écran blanc

**### Règle d'intégration**

Search V2 est validée fonctionnellement **\*\*module par module\*\***. La

clôture de chaque module métier devra vérifier :

1\.  \`searchIndex\`

2\.  alimentation réelle de l'index

3\.  registry

4\.  adapter

5\.  hook frontend

6\.  UI

7\.  recherche réelle

8\.  filtres / ranking applicables

9\.  test manuel

**### Dettes documentées**

\- Plusieurs \`as any\` subsistent dans certains composants / adapters

  Search.

\- \`AnnonceAISearch.tsx\` utilise \`window\.webkitSpeechRecognition\`,

  incompatible avec l'architecture native actuelle.

\- \`events/search.ts\` contient un cast temporaire.

\- Certains adapters backend utilisent encore des casts \`any\`.

\- La présence d'un \`searchIndex\` ne garantit pas à elle seule que

  toutes les écritures métier l'alimentent correctement.

\- La couverture de chaque index sera validée à la clôture du module

  correspondant.

\- Search Messages : infrastructure présente ; validation complète

  reportée à la QA finale Messages.

**\*\*Décision :\*\*** aucune réécriture globale de Search V2. Les corrections

spécifiques seront traitées avec les modules concernés.

**## 🟡 0.5 --- WALLET / PAYMENTS --- IN PROGRESS**

**\*\*Statut documenté :\*\*** 🟡 IN PROGRESS\\

**\*\*Périmètre :\*\*** Payment Core + Wallet + Stripe backend + Native Stripe.

**### État technique consigné**

\- 🟢 Payment Core

\- 🟢 Legacy frontend

\- 🟢 Stripe Backend

\- 🟢 Legacy deprecation

\- 🟡 Native Stripe --- E2E provider réel restant

**### Wallet --- état consigné**

\- 🟢 Ledger en lecture

\- 🟢 Solde sans faux crédit

\- 🟢 Envoi / réception UI validés

\- 🟢 Historique disponible

\- 🟢 Gestion d'erreurs utilisateur

\- 🟢 Recharges désactivées au lancement

**### Règle de recharge au lancement**

Le bouton **\*\*Recharger\*\*** reste visible mais affiche :

\> **\*\*Recharges bientôt disponibles\*\***\\

\> La recharge du portefeuille sera disponible prochainement.

Aucun provider n'est présenté comme opérationnel sans E2E réel.

**### Paiements**

\- Stripe backend : 🟢 implémenté selon le suivi

\- Webhook vérifié côté serveur : 🟢 selon le suivi

\- Idempotence : 🟢 selon le suivi

\- Crédit wallet après événement vérifié : 🟢 selon le suivi

\- Native Stripe : 🟡 E2E réel dépendant d'un provider juridiquement

  disponible pour l'entité RDC

**\*\*Important :\*\*** Wallet / Payments n'est pas déclaré production-ready

tant qu'un provider compatible avec l'entité RDC n'a pas été validé en

E2E réel.

**---**

**# 5. Release Candidate**

**## 🏆 DébrouillePro \`v0.9.0-rc1\`**

**\*\*Statut historique documenté :\*\*** 🟢 RELEASE CANDIDATE CERTIFIÉE

\- Tag annoté : \`v0.9.0-rc1\`

\- Commit référencé : \`b481aa359dd59c39ee2e0920fa43965d803fdd18\`

\- Tag local : cohérent au moment de la certification

\- Tag distant : cohérent au moment de la certification

\- Working tree : propre au moment de la certification

\- Release APK : build réussi selon le suivi

\- Runtime RC : validé selon le suivi

\- Search V2 : runtime validé selon le suivi

\- Notifications In-App : runtime validé selon le suivi

\- Wallet : garde-fous actifs selon le suivi

\- Recharge : désactivée au lancement

\- Payments E2E : en attente d'un provider compatible RDC

**### Dette RC conservée**

\- 1007 fichiers non conformes au format Prettier baseline ---

  alignement progressif post-RC.

\- Plusieurs usages historiques de \`error.message\`.

\- \`as any\` Search identifiés et reportés.

\- Push natif 0.3b non intégré.

\- Payments provider E2E non validé pour une entité RDC.

**\*\*Le tag \`v0.9.0-rc1\` est gelé.\*\*** Toute modification ultérieure doit

être évaluée sur son propre état de code et ses propres preuves. La

certification historique ne valide pas automatiquement le code actuel.

**---**

**# 6. Vague 1 --- Modules backend-ready**

**\*\*Statut global :\*\*** ⏳ progression module par module.\\

**\*\*Ordre recommandé :\*\*** Services d'abord, sans présumer de sa clôture.

**---**

                  Ordre Module           Base backend à auditer     Travail de

                                                                    clôture

**---**

                      1 Services         APIs et tables réelles du  Brancher les

                                         module Services            données, Search,

                                                                    Notifications,

                                                                    Messages et Pay

                                                                    lorsque les flux

                                                                    sont pertinents

                      2 Agri             \`convex/agri.ts\`           Audit complet,

                                                                    données réelles,

                                                                    hooks, pages et

                                                                    intégrations

                                                                    pertinentes

                      3 Transport        \`convex/transport.ts\`      Audit complet,

                                                                    données réelles,

                                                                    hooks, pages et

                                                                    intégrations

                                                                    pertinentes

                      4 Hébergement      \`convex/hebergement.ts\`    Audit complet,

                                                                    données réelles,

                                                                    hooks, pages et

                                                                    intégrations

                                                                    pertinentes

                      5 Restauration     \`convex/restauration.ts\`   Audit complet,

                                                                    données réelles,

                                                                    hooks, pages et

                                                                    intégrations

                                                                    pertinentes

                      6 Network          \`convex/network.ts\`        Audit complet,

                                                                    données réelles,

                                                                    hooks, pages et

                                                                    intégrations

                                                                    pertinentes

                      7 Community        \`convex/community.ts\`      Audit complet,

                                                                    données réelles,

                                                                    hooks, pages et

                                                                    intégrations

                                                                    pertinentes

**---**

Les chemins backend du tableau sont des points de départ issus du suivi

; confirmer les fichiers réellement utilisés avant toute modification.

Ne pas créer une intégration uniquement pour satisfaire une liste.

**---**

**# 7. Vague 2 --- Modules presque clos**

**---**

Module État documenté Reste à vérifier

**---**

Marketplace 10 appels recensés ; Revalider les appels

DetailPage signalée à 0 réels et le parcours de

appel dans l'audit détail

historique

Santé Module riche Verrouiller sur preuves

et intégrer Search

Éducation Module riche Verrouiller sur preuves

Emploi Module riche Verrouiller et intégrer

Search

Immobilier Module branché selon le Vérifier Search +

suivi Notifications et le

parcours réel

Voyages Module branché selon le Vérifier Search +

suivi Notifications et le

parcours réel

Urbanisme Module riche Verrouiller sur preuves

Événements Module branché selon le Vérifier Search +

suivi Notifications et le

parcours réel

**---**

Ces états sont des indications de travail, pas des validations

actuelles. Toute clôture doit suivre le protocole de la section 1.

**---**

**# 8. Vague 3 --- Contenu / expérience**

Périmètre de suivi : Media, Reels, Live, Stories, Series, Creator,

AIStudio, Templates et Éditeur.

Chaque sous-module est audité individuellement ; la richesse de

l'interface ne prouve ni la persistance backend, ni les permissions, ni

la qualité du runtime.

**---**

**# 9. Vague 4 --- Admin / outils / transverse**

Périmètre de suivi : Admin, Analytics, Settings, Reputation, Badges,

Parrainage, Tracking, Documents, Agenda, SOS, Finances, Revenus, Premium

et Subscriptions.

Les accès sensibles doivent être protégés côté serveur. Masquer un

bouton côté client ne constitue pas un contrôle d'autorisation

suffisant.

**---**

**# 10. Checklist de clôture**

Chaque case doit être accompagnée d'une preuve datée ou d'un résultat

observable.

\- [ ] 1. Audit : tous les fichiers backend + frontend du périmètre ont

     été lus.

\- [ ] 2. Schema : tables + indexes + \`searchIndex\` sont cohérents.

\- [ ] 3. Backend : queries / mutations / actions sont protégées par

     l'authentification et les validations nécessaires.

\- [ ] 4. Hooks : \`src/features/\<module>/\` expose les hooks réellement

     nécessaires.

\- [ ] 5. Pages : états \`loading\` + \`error\` + \`empty\` + \`data\` traités.

\- [ ] 6. Messages : \`Contacter\` utilise le parcours réel prévu,

     notamment \`getOrCreateDirect(userId)\` lorsque pertinent.

\- [ ] 7. Notifications : événement métier réel → \`createNotification\`

     lorsque pertinent.

\- [ ] 8. Wallet : transaction → \`createPaymentIntent\` lorsque le flux

     de paiement l'exige ; aucune réussite simulée.

\- [ ] 9. Search : adapter + source + registry + indexation réelle.

\- [ ] 10. Tests manuels : parcours bout-en-bout exécuté.

\- [ ] 11. \`npx convex dev\` : aucune erreur bloquante.

\- [ ] 12. TypeScript ciblé : aucune erreur dans le périmètre filtré.

\- [ ] 13. Aucun raccourci TypeScript introduit.

\- [ ] 14. \`npx expo start --dev-client -c\` : démarrage sans crash.

\- [ ] 15. Test runtime du parcours principal, sur appareil/build

      pertinent.

\- [ ] 16. Diff relu ; fichiers hors périmètre exclus.

\- [ ] 17. Commit dédié poussé sur \`origin/master\`.

\- [ ] 18. 🔒 MODULE FERMÉ uniquement après satisfaction des critères.

Les éléments non applicables doivent être justifiés ; ils ne doivent pas

être cochés par défaut.

**---**

**# 11. Règle de verrouillage**

Un module fermé ne se rouvre que pour :

\- une régression démontrée ;

\- une faille de sécurité ;

\- une dette explicitement planifiée dans un chantier ultérieur ;

\- une QA finale qui révèle un défaut réel.

Une clôture n'autorise pas à présenter les dettes reportées comme

résolues. \*\*Une preuve ancienne ne valide pas automatiquement une

modification récente.\*\* Après une modification, refaire au minimum les

contrôles touchés par le changement.

**---**

**# 12. État global**

**## Vague 0 --- Fondations**

\- [x] 0.1 Auth / Users --- 🔒 CLOSED (état historique documenté)

\- [x] 0.2 Messages --- 🔒 CLOSED PARTIEL (QA finale restante)

\- [x] 0.3 Notifications --- 🔒 CLOSED In-App (push natif reporté)

\- [x] 0.4 Search V2 --- 🔒 CLOSED Infrastructure (intégration métier

      progressive)

\- \\[\\\~\\] 0.5 Wallet / Payments --- 🟡 IN PROGRESS (E2E provider RDC

  restant)

**## Vague 1 --- Backend-ready**

\- \\[\\\~\\] Services --- priorité actuelle ; audit et blocage runtime en

  cours, non clos

\- [ ] Agri

\- [ ] Transport

\- [ ] Hébergement

\- [ ] Restauration

\- [ ] Network

\- [ ] Community

**## Vague 2 --- Presque clos**

\- [ ] Marketplace

\- [ ] Santé

\- [ ] Éducation

\- [ ] Emploi

\- [ ] Immobilier

\- [ ] Voyages

\- [ ] Urbanisme

\- [ ] Événements

**## Vague 3 --- Contenu / expérience**

\- [ ] Media / Reels / Live / Stories / Series / Creator / AIStudio /

      Templates / Éditeur

**## Vague 4 --- Admin / outils / transverse**

\- [ ] Admin / Analytics / Settings / Reputation / Badges / Parrainage

      / Tracking / Documents / Agenda / SOS / Finances / Revenus / Premium

      / Subscriptions

**---**

**# 13. Règles de mise à jour du document**

À chaque module fermé :

1\.  Passer le module à \`🔒 CLOSED\` uniquement avec les preuves requises.

2\.  Ajouter les preuves techniques et runtime réellement obtenues.

3\.  Documenter les dettes réellement connues.

4\.  Ne jamais déclarer une intégration non testée comme opérationnelle.

5\.  Mettre à jour l'état global.

6\.  Créer un commit documentaire ou module dédié, selon le périmètre.

7\.  Pousser le commit sur \`origin/master\` seulement après vérification.

8\.  Vérifier que les fichiers hors périmètre ne sont pas inclus.

9\.  Ne pas mélanger une mise à jour de suivi documentaire avec un

    correctif de code sans raison explicite.

10\. Ne pas réécrire l'historique du RC gelé pour donner l'impression

    qu'une vérification ancienne couvre le code actuel.

\*\*Aucune modification opportuniste ne doit être mélangée à une clôture

de module.\*\*

**---**

\*\*# 14. Chantiers techniques ouverts

## 🔴 Services — fiche prestataire : écran noir sur Android

**Route concernée :** `app/service/[id].tsx`  
**Statut :** bloquant — empêche la clôture du module Services.  
**Symptôme observé :** le journal de diagnostic indiquait `ROOT_LAYOUT { width: 0.3333, height: 804 }` avec une densité d’écran de 3. Le contenu semblait atteindre la phase de rendu, mais restait invisible. **La cause racine n’est pas confirmée.**

### Pistes testées lors du diagnostic précédent

Les essais ci-dessous sont consignés comme effectués, sans garantir qu’ils seraient concluants dans tout état futur du code :

- Remplacement temporaire du rendu de `[id].tsx` par des tests visuels rouge, vert et modal.
- Essais de contraintes de taille, dont `minWidth: 300`, puis `position: "absolute"` avec largeur et hauteur explicites.
- Vérification de l’adaptateur, des hooks, de la requête Convex et de `adaptServiceProvider`.
- Vérification de `DefaultProviders`, `UIBridge` et `ThemeProvider`.
- Ajout d’un wrapper `<View style={{ flex: 1 }}>` autour de `<Slot />`.
- Remplacement de `<Slot />` par `<Stack />` à la racine : le démarrage de l’application échouait ; ce changement a été restauré.
- Essais de `animation: "none"` et `slide_from_right` dans `app/service/_layout.tsx`.
- Déclaration explicite des `<Stack.Screen>` dans `app/service/_layout.tsx` : aucun effet observé.
- Comparaison avec `app/messages/_layout.tsx` : aucune différence exploitable identifiée.
- Vérification des routes du groupe Services : les routes examinées (`bookings`, `quotes`, `invoices`, `mine` et `[id]`) ont présenté le même symptôme d’écran noir dans le diagnostic consigné.

**Consigne :** ne pas relancer ces essais à l’identique sans nouvel élément concret ou changement pertinent du code, de la configuration ou du build.

### Piste restante — hypothèses non confirmées

Le symptôme pourrait venir de la mesure ou de la disposition native d’un conteneur, d’une interaction impliquant `react-native-screens`, Reanimated ou la Nouvelle Architecture Android (`newArchEnabled`). Il s’agit d’hypothèses, pas d’une cause établie.

Pour reprendre le diagnostic, obtenir d’abord un élément nouveau et reproductible, puis :

- Utiliser un build natif Android identifiable et reproductible.
- Examiner la hiérarchie des vues et les mesures natives, notamment via les outils Android/ADB adaptés.
- Identifier le parent exact où la largeur devient proche de zéro.
- Corréler les observations natives avec les journaux runtime et la configuration du build.

Un diagnostic JavaScript seul n’a pas permis d’établir la cause racine.

### Contraintes de travail

- Ne pas modifier `app/_layout.tsx` sans preuve ciblée ; conserver le `<Slot />` racine tant qu’aucune cause démontrée ne justifie un changement.
- Ne pas toucher aux composants Services sans examiner le diff existant et confirmer le périmètre du changement.
- Garder le suivi documentaire dans un commit distinct d’un correctif fonctionnel Services.
- Ne pas déclarer l’écran réparé avant un test runtime concluant sur Android.
- Conserver les résultats des nouveaux essais afin d’éviter de répéter les mêmes expériences.

### Critère de résolution

Le blocage ne sera marqué comme résolu qu’après affichage correct de la fiche prestataire, validation des états loading / erreur / données, vérification de la navigation retour et confirmation qu’aucune régression n’a été introduite. La clôture du module Services nécessite ensuite le reste de la checklist de la section 10.

---

**\*\*Document de pilotage :\*\*** ce fichier décrit le plan, les états

consignés et les critères. Il ne remplace ni l'audit du code présent, ni

les résultats de tests actuels, ni le diff Git.
