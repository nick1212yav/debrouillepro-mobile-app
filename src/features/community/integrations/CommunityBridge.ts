// src/features/community/integrations/CommunityBridge.ts
// Ce fichier est temporairement désactivé car il utilise des API du SDK qui ont changé.
// Il sera réactivé lorsque le SDK sera mis à jour.

export class CommunityBridge {
  private static instance: CommunityBridge;

  private constructor() {
    console.warn("CommunityBridge: désactivé pour le moment.");
  }

  public static getInstance(): CommunityBridge {
    if (!CommunityBridge.instance) {
      CommunityBridge.instance = new CommunityBridge();
    }
    return CommunityBridge.instance;
  }

  // Toutes les méthodes sont désactivées
}
