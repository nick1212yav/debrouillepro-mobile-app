// src/features/voyages/integrations/VoyagesBridge.ts
import { EventBus } from "@/core/sdk/events/EventBus"; // ✅ Utilisation de l'instance de production [1]

/**
 * Pont entre le module Voyages et le reste de l'application DébrouillePro.
 * Gère les communications inter-modules via l'EventBus global [1].
 */
export class VoyagesBridge {
  private eventBus = EventBus; // ✅ Correction : EventBus est déjà le singleton [1]

  /**
   * Initialise le pont d'intégration de voyages
   */
  async initialize(): Promise<void> {
    this.on("user:profile_updated", this.handleProfileUpdate.bind(this));
    console.log("[VoyagesBridge] Initialisé");
  }

  /**
   * Émet un événement vers un autre module via l'EventBus de production [1]
   */
  emit(event: string, payload: any): void {
    this.eventBus.publish({
      type: event,
      payload,
      timestamp: Date.now(),
    } as any);
  }

  /**
   * Abonne un handler à un événement (encapsule 'subscribe' pour s'adapter au Core SDK) [1]
   */
  on(event: string, handler: (payload: any) => void): () => void {
    return this.eventBus.subscribe(event, (evt: any) => {
      handler(evt?.payload ?? evt);
    });
  }

  private handleProfileUpdate(data: {
    userId: string;
    fields: string[];
  }): void {
    this.emit("voyages:profile_updated", data);
  }
}
