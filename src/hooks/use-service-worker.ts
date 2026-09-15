// src/hooks/use-service-worker.ts
/**
 * ⚠️ Les service workers sont une API web-only (PWA).
 *
 * React Native n'a pas d'équivalent direct :
 *   - Pas de `navigator.serviceWorker`
 *   - Pas de `window.location.reload()`
 *   - Pas de cache HTTP persistant côté JS
 *
 * Pour les mises à jour OTA en RN, c'est `expo-updates` qui joue ce rôle
 * (géré automatiquement par le runtime Expo).
 *
 * Ce hook est conservé comme stub no-op pour compatibilité avec les
 * composants qui l'appellent (`useServiceWorker()` reste valide).
 */

export function useServiceWorker(): void {
  // No-op : aucune action en React Native.
  // Le système de mises à jour OTA d'Expo s'en charge automatiquement.
}

export default useServiceWorker;
