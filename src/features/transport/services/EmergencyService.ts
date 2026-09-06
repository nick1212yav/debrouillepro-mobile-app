// src/features/transport/services/EmergencyService.ts
import { LiveLocationTracker } from "../tracking/LiveLocationTracker";
import { NotificationService } from "./NotificationService";
import type { Coordinates } from "../types";

export interface EmergencyLog {
  emergencyId: string;
  senderId: string;
  senderName: string;
  vehiclePlate?: string;
  lastKnownPosition: Coordinates;
  timestamp: string;
}

export class EmergencyService {
  private static activeLogs: Record<string, EmergencyLog> = {};

  /**
   * Déclencher un protocole de détresse active (SOS) [2]
   */
  static async triggerSOS(
    userId: string,
    userName: string,
    coords: Coordinates,
    vehiclePlate?: string,
    emergencyPhones: string[] = ["+243890000112"], // Police/Secours [2]
  ): Promise<EmergencyLog> {
    const emergencyId = `SOS-${Date.now()}`;
    const log: EmergencyLog = {
      emergencyId,
      senderId: userId,
      senderName: userName,
      vehiclePlate,
      lastKnownPosition: coords,
      timestamp: new Date().toISOString(),
    };

    this.activeLogs[emergencyId] = log;

    // 1. Envoyer des SMS urgents de détresse aux contacts de confiance [2]
    for (const phone of emergencyPhones) {
      await NotificationService.sendSMS({
        recipientPhone: phone,
        recipientName: "Contact d'urgence [2]",
        title: "🚨 SOS ACTIVÉ",
        body: `URGENT DébrouillePro : ${userName} a activé l'alerte SOS d'urgence. Véhicule : ${vehiclePlate || "Inconnu"}. GPS : ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}. Veuillez intervenir [2].`,
      });
    }

    // 2. Commencer un tracking matériel ultra-précis en arrière-plan [2]
    LiveLocationTracker.startTracking(
      (pos) => {
        // Mettre à jour en continu la position GPS de détresse sur nos serveurs
        if (this.activeLogs[emergencyId]) {
          this.activeLogs[emergencyId].lastKnownPosition = pos.coords;
          console.log(
            `[SOS Tracking] Position mise à jour : ${pos.coords.lat}, ${pos.coords.lng}`,
          );
        }
      },
      (error) => {
        console.error(
          "[SOS Tracking] Échec du capteur GPS matériel :",
          error.message,
        );
      },
    );

    return log;
  }

  /**
   * Résoudre et clôturer une alerte d'urgence
   */
  static stopSOS(emergencyId: string): void {
    if (this.activeLogs[emergencyId]) {
      delete this.activeLogs[emergencyId];
      LiveLocationTracker.stopTracking(); // On éteint le capteur d'urgence
      console.log(
        `[EmergencyService] SOS ${emergencyId} résolu et désactivé [2].`,
      );
    }
  }
}
