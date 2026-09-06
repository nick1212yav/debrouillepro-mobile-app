export interface ReservationFormInput {
  date: string; // Format "YYYY-MM-DD"
  time: string; // Format "HH:MM"
  guests: number;
  section: string;
}

export class ReservationValidator {
  /**
   * Valide une planification de réservation
   */
  public static validate(input: Partial<ReservationFormInput>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // 1. Validation de la date (doit être une date future)
    if (!input.date || input.date.trim() === "") {
      errors.date = "La date de réservation est obligatoire.";
    } else {
      const selectedDate = new Date(`${input.date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(selectedDate.getTime())) {
        errors.date = "Format de date incorrect. Utilisez AAAA-MM-JJ.";
      } else if (selectedDate < today) {
        errors.date =
          "La date de réservation ne peut pas être située dans le passé.";
      }
    }

    // 2. Validation de l'Heure
    if (!input.time || input.time.trim() === "") {
      errors.time = "L'heure d'arrivée est obligatoire.";
    } else {
      const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(input.time)) {
        errors.time = "Format d'heure incorrect. Utilisez HH:MM.";
      }
    }

    // 3. Validation du Nombre de Couverts
    if (input.guests === undefined || input.guests === null) {
      errors.guests = "Le nombre de personnes est requis.";
    } else if (isNaN(input.guests) || input.guests <= 0) {
      errors.guests = "Le nombre de couverts doit être supérieur à 0.";
    } else if (input.guests > 30) {
      errors.guests =
        "Pour des réservations de plus de 30 personnes, veuillez contacter le service événementiel.";
    }

    // 4. Validation de la Zone de la table
    const sections = ["standard", "terrace", "vip", "private_room"];
    if (!input.section || !sections.includes(input.section)) {
      errors.section = "Veuillez sélectionner un espace valide.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
