# DébrouillePro — Branding

Assets générés à partir du logo fourni :
- debrouillepro-logo.png : logo complet transparent
- debrouillepro-mark.png : symbole seul transparent
- debrouillepro-icon.png : icône carrée pour l'application
- debrouillepro-logo-premium.png : variante transparente du logo complet
- DebrouilleLogo.tsx : composant React Native / Expo réutilisable

Intégration recommandée :
1. Copier `branding/` dans `assets/branding/`.
2. Copier `DebrouilleLogo.tsx` dans `src/components/branding/`.
3. Utiliser `variant="full"` pour onboarding/auth.
4. Utiliser `variant="mark"` pour les headers compacts.
5. Utiliser `debrouillepro-icon.png` comme base de l'icône d'application.

Le composant ne crée aucune API et ne modifie pas le backend.
