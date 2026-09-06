import { OrderStatus } from "../types/enums";

export type OrderStateListener = (status: OrderStatus, metadata?: any) => void;

export class LiveOrderTracker {
  private static readonly STATE_SEQUENCE: OrderStatus[] = [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.RECEIVED,
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.IN_DELIVERY,
    OrderStatus.DELIVERED,
  ];

  private orderId: string;
  private currentStatus: OrderStatus;
  private listeners: Set<OrderStateListener> = new Set();

  constructor(
    orderId: string,
    initialStatus: OrderStatus = OrderStatus.RECEIVED,
  ) {
    this.orderId = orderId;
    this.currentStatus = initialStatus;
  }

  /**
   * S'abonne aux notifications de transition d'état de la commande
   */
  public subscribe(listener: OrderStateListener): () => void {
    this.listeners.add(listener);
    // Renvoie une fonction de désabonnement
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Modifie le statut actuel et notifie l'ensemble des observateurs
   */
  public updateStatus(newStatus: OrderStatus, metadata?: any): void {
    this.currentStatus = newStatus;
    this.listeners.forEach((listener) => {
      try {
        listener(newStatus, metadata);
      } catch (err) {
        console.error(
          `[LiveOrderTracker] Erreur d'exécution d'écouteur pour la commande ${this.orderId}:`,
          err,
        );
      }
    });
  }

  /**
   * Avance automatiquement d'une étape dans la chaîne logique de traitement
   */
  public advanceStep(metadata?: any): OrderStatus {
    const currentIndex = LiveOrderTracker.STATE_SEQUENCE.indexOf(
      this.currentStatus,
    );

    if (
      currentIndex !== -1 &&
      currentIndex < LiveOrderTracker.STATE_SEQUENCE.length - 1
    ) {
      const nextStatus = LiveOrderTracker.STATE_SEQUENCE[currentIndex + 1];
      this.updateStatus(nextStatus, metadata);
      return nextStatus;
    }

    return this.currentStatus;
  }

  public getStatus(): OrderStatus {
    return this.currentStatus;
  }

  public getOrderId(): string {
    return this.orderId;
  }
}
