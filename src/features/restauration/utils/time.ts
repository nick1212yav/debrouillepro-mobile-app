export interface TimeRange {
  open: string; // Format "HH:MM" (ex: "18:00")
  close: string; // Format "HH:MM" (ex: "02:30")
}

export class TimeUtils {
  /**
   * Convertit une chaîne "HH:MM" en minutes écoulées depuis le début de la journée
   */
  private static parseTimeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Détermine si l'heure actuelle se situe dans la plage d'ouverture de l'établissement
   */
  public static isCurrentlyOpen(
    range: TimeRange,
    comparisonTime?: string,
  ): boolean {
    let currentMinutes: number;

    if (comparisonTime) {
      currentMinutes = this.parseTimeToMinutes(comparisonTime);
    } else {
      const now = new Date();
      currentMinutes = now.getHours() * 60 + now.getMinutes();
    }

    const openMinutes = this.parseTimeToMinutes(range.open);
    const closeMinutes = this.parseTimeToMinutes(range.close);

    // Cas standard : Fermeture le jour même (ex: 08:00 - 22:00)
    if (openMinutes <= closeMinutes) {
      return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    }

    // Cas nocturne : Fermeture après minuit (ex: 18:00 - 02:30)
    // L'établissement est ouvert si on est après l'ouverture OU avant la fermeture du matin
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }

  /**
   * Renvoie un descriptif textuel du temps de préparation restant (ex: "15 min")
   */
  public static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) {
      return `${hours} h`;
    }
    return `${hours} h ${remainingMins} min`;
  }
}
