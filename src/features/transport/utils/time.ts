// src/features/transport/utils/time.ts

export class TimeService {
  /**
   * Formater des minutes en format de lecture humaine (ex: 75 -> "1h 15min")
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  }

  /**
   * Déterminer si l'heure donnée correspond à un pic de trafic routier
   */
  static isPeakHour(timeString: string): boolean {
    const [hour] = timeString.split(":").map(Number);
    if (isNaN(hour)) return false;

    // Matin (07:00 - 09:00) et Soir (16:30 - 19:30)
    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  }

  /**
   * Calculer l'heure estimée d'arrivée à destination (ETA)
   */
  static calculateETA(departureTime: string, durationMinutes: number): string {
    const [depHour, depMin] = departureTime.split(":").map(Number);
    if (isNaN(depHour) || isNaN(depMin)) return "--:--";

    const totalMinutes = depHour * 60 + depMin + durationMinutes;
    const arrivalHour = Math.floor(totalMinutes / 60) % 24;
    const arrivalMin = totalMinutes % 60;

    const formattedHour = arrivalHour.toString().padStart(2, "0");
    const formattedMin = arrivalMin.toString().padStart(2, "0");

    return `${formattedHour}:${formattedMin}`;
  }
}
