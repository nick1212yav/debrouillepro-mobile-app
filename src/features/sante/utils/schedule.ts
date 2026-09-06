// src/features/sante/utils/schedule.ts

export interface TimeSlot {
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface DaySchedule {
  day: string; // "monday", "tuesday", ...
  slots: TimeSlot[];
}

/**
 * Convertit une heure (HH:MM) en minutes depuis minuit
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convertit des minutes depuis minuit en chaîne HH:MM
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Vérifie si un créneau horaire est disponible dans une liste de créneaux
 */
export function isSlotAvailable(
  slot: string,
  availableSlots: string[],
): boolean {
  return availableSlots.includes(slot);
}

/**
 * Génère des créneaux horaires à partir d'une plage horaire et d'une durée
 */
export function generateSlots(
  start: string,
  end: string,
  durationMinutes: number = 30,
): string[] {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  const slots: string[] = [];
  for (let t = startMin; t + durationMinutes <= endMin; t += durationMinutes) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

/**
 * Vérifie si un horaire est dans les heures d'ouverture
 */
export function isWithinWorkingHours(
  time: string,
  schedule: DaySchedule[],
): boolean {
  const day = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const daySchedule = schedule.find((s) => s.day === day);
  if (!daySchedule) return false;
  const minutes = timeToMinutes(time);
  return daySchedule.slots.some(
    (slot) =>
      minutes >= timeToMinutes(slot.start) && minutes < timeToMinutes(slot.end),
  );
}

/**
 * Calcule le temps d'attente estimé en fonction du nombre de patients
 */
export function estimateWaitTime(
  patientsAhead: number,
  averageConsultationMinutes: number = 20,
): number {
  return patientsAhead * averageConsultationMinutes;
}

/**
 * Vérifie si deux plages horaires se chevauchent
 */
export function overlaps(slot1: TimeSlot, slot2: TimeSlot): boolean {
  const start1 = timeToMinutes(slot1.start);
  const end1 = timeToMinutes(slot1.end);
  const start2 = timeToMinutes(slot2.start);
  const end2 = timeToMinutes(slot2.end);
  return start1 < end2 && end1 > start2;
}

/**
 * Fusionne des plages horaires consécutives
 */
export function mergeSlots(slots: TimeSlot[]): TimeSlot[] {
  if (slots.length <= 1) return slots;
  const sorted = [...slots].sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
  );
  const merged: TimeSlot[] = [];
  let current = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (timeToMinutes(current.end) >= timeToMinutes(sorted[i].start)) {
      current.end = minutesToTime(
        Math.max(timeToMinutes(current.end), timeToMinutes(sorted[i].end)),
      );
    } else {
      merged.push(current);
      current = sorted[i];
    }
  }
  merged.push(current);
  return merged;
}
