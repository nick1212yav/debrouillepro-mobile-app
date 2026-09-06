// src/features/voyages/utils/voyage-format.utils.ts
import type { VoyageTrip } from "../types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formate une date pour l'affichage
 */
export function formatVoyageDate(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, "EEEE d MMMM yyyy", { locale: fr });
}

/**
 * Formate une durée en heures et minutes
 */
export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${minutes}`;
}

/**
 * Formate un prix
 */
export function formatPrice(amount: number, currency: string = "FCFA"): string {
  return `${amount.toLocaleString()} ${currency}`;
}

/**
 * Abrège un nom d'opérateur si trop long
 */
export function truncateOperatorName(
  name: string,
  maxLength: number = 20,
): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + "…";
}

/**
 * Formate la date de départ en format court
 */
export function formatShortDepartureDate(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, "dd/MM/yyyy", { locale: fr });
}

/**
 * Formate l'heure de départ
 */
export function formatDepartureTime(timeStr: string): string {
  // Si timeStr est au format "HH:MM" ou "HH:MM:SS"
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

/**
 * Calcule le nombre de jours restants avant le départ
 */
export function getDaysUntilDeparture(departureDateStr: string): number {
  const now = new Date();
  const departure = new Date(departureDateStr);
  const diff = departure.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Vérifie si un voyage est complet
 */
export function isTripFull(trip: VoyageTrip): boolean {
  return (trip.availableSeats ?? 0) <= 0;
}

/**
 * Vérifie si un voyage est à venir
 */
export function isTripUpcoming(trip: VoyageTrip): boolean {
  const now = new Date();
  const departure = new Date(trip.departureDate);
  return departure > now;
}

/**
 * Obtient le statut d'un voyage
 */
export function getTripStatus(
  trip: VoyageTrip,
): "upcoming" | "full" | "available" | "past" {
  if (isTripFull(trip)) return "full";
  if (!isTripUpcoming(trip)) return "past";
  return "available";
}

/**
 * Obtient une couleur de statut
 */
export function getTripStatusColor(
  status: ReturnType<typeof getTripStatus>,
): string {
  switch (status) {
    case "upcoming":
      return "text-blue-400";
    case "available":
      return "text-emerald-400";
    case "full":
      return "text-red-400";
    case "past":
      return "text-white/30";
    default:
      return "text-white/40";
  }
}

/**
 * Obtient une étiquette de statut
 */
export function getTripStatusLabel(
  status: ReturnType<typeof getTripStatus>,
): string {
  switch (status) {
    case "upcoming":
      return "À venir";
    case "available":
      return "Disponible";
    case "full":
      return "Complet";
    case "past":
      return "Passé";
    default:
      return "";
  }
}
