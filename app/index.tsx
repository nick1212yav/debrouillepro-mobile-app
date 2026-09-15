// app/index.tsx
// Route racine "/" — rend le composant HomePage.
//
// Note : le gate onboarding (OnboardingScreen vs Home réel) est géré
// DANS HomePage via un early return (voir src/pages/home/page.tsx),
// pas ici. Ça évite la duplication de state et de storage.

import HomePage from "@/pages/home/page";

export default function Index() {
  return <HomePage />;
}
