// src/features/network/integrations/NetworkBridge.ts
import { EventBus } from "@/core/sdk/events/EventBus"; // ✅ Import direct de l'instance d'EventBus de production [1]

/**
 * Pont entre le module Network et le reste de l'application DébrouillePro.
 * Gère les communications inter-modules via l'EventBus global [1].
 */
export class NetworkBridge {
  private eventBus = EventBus; // ✅ Correction : EventBus est déjà le singleton de production [1]

  /**
   * Initialise le pont d'intégration
   */
  async initialize(): Promise<void> {
    // Écouter les événements des autres modules via la méthode subscribe de l'EventBus [1]
    this.on("user:profile_updated", this.handleProfileUpdate.bind(this));
    this.on("publication:created", this.handlePublicationCreated.bind(this));
    this.on("job:created", this.handleJobCreated.bind(this));
    this.on("service:created", this.handleServiceCreated.bind(this));
    console.log("[NetworkBridge] Initialisé");
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
      // Déballage sécurisé du payload de l'événement domaine
      handler(evt?.payload ?? evt);
    });
  }

  /**
   * Gère la mise à jour d'un profil utilisateur
   */
  private handleProfileUpdate(data: {
    userId: string;
    fields: string[];
  }): void {
    this.emit("network:profile_updated", data);
  }

  /**
   * Gère la création d'une publication dans le fil général
   */
  private handlePublicationCreated(data: {
    publicationId: string;
    authorId: string;
  }): void {
    this.emit("network:feed_updated", { type: "post", data });
  }

  /**
   * Gère la création d'une offre d'emploi
   */
  private handleJobCreated(data: { jobId: string; companyId: string }): void {
    this.emit("network:opportunity_created", { type: "job", data });
  }

  /**
   * Gère la création d'un service
   */
  private handleServiceCreated(data: {
    serviceId: string;
    providerId: string;
  }): void {
    this.emit("network:opportunity_created", {
      type: "service",
      data,
    });
  }
}
