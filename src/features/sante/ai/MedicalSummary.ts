// src/features/sante/ai/MedicalSummary.ts

export interface MedicalRecord {
  id: string;
  type: "prescription" | "lab" | "imaging" | "vaccination" | "visit";
  date: Date;
  doctor?: string;
  content: any; // structure variable selon type
}

export interface SummarySection {
  title: string;
  content: string;
  items?: string[];
}

export interface MedicalSummary {
  patient: string;
  generatedAt: Date;
  sections: SummarySection[];
  warnings: string[];
}

/**
 * Génère un résumé lisible d'un dossier médical.
 */
export class MedicalSummarizer {
  /**
   * Crée un résumé structuré à partir d'une liste d'enregistrements.
   */
  summarize(records: MedicalRecord[], patientName: string): MedicalSummary {
    const sections: SummarySection[] = [];
    const warnings: string[] = [];

    // Regrouper par type
    const prescriptions = records.filter((r) => r.type === "prescription");
    const labs = records.filter((r) => r.type === "lab");
    const imaging = records.filter((r) => r.type === "imaging");
    const vaccinations = records.filter((r) => r.type === "vaccination");
    const visits = records.filter((r) => r.type === "visit");

    // Ordonnances
    if (prescriptions.length > 0) {
      const meds = prescriptions.flatMap((p) => p.content.medications || []);
      sections.push({
        title: "Ordonnances en cours",
        content: `${prescriptions.length} ordonnance(s) récente(s)`,
        items: meds.map((m: any) => `${m.name} ${m.dosage || ""}`),
      });
    }

    // Analyses de laboratoire
    if (labs.length > 0) {
      const latest = labs.sort(
        (a, b) => b.date.getTime() - a.date.getTime(),
      )[0];
      sections.push({
        title: "Dernière analyse de laboratoire",
        content: `Date : ${latest.date.toLocaleDateString()}`,
        items: Object.entries(latest.content.results || {}).map(
          ([key, val]) => `${key}: ${val}`,
        ),
      });
    }

    // Imagerie
    if (imaging.length > 0) {
      sections.push({
        title: "Examens d'imagerie",
        content: `${imaging.length} examen(s)`,
        items: imaging.map(
          (i) => `${i.content.type} - ${i.date.toLocaleDateString()}`,
        ),
      });
    }

    // Vaccinations
    if (vaccinations.length > 0) {
      const vaccineNames = vaccinations.map((v) => v.content.vaccine);
      sections.push({
        title: "Vaccinations",
        content: `${vaccinations.length} vaccination(s)`,
        items: vaccineNames,
      });
    }

    // Visites
    if (visits.length > 0) {
      const reasons = visits.map((v) => v.content.reason || "Consultation");
      sections.push({
        title: "Consultations récentes",
        content: `${visits.length} visite(s)`,
        items: visits.map(
          (v) =>
            `${v.date.toLocaleDateString()} - ${v.doctor || "Médecin"} : ${v.content.reason || ""}`,
        ),
      });
    }

    // Alertes / warnings (ex: allergies, interactions)
    // Exemple : on détecte si un patient a une allergie notée
    const allergies = records
      .flatMap((r) => r.content.allergies || [])
      .filter(Boolean);
    if (allergies.length > 0) {
      warnings.push(`Allergies signalées : ${allergies.join(", ")}.`);
    }

    // Interactions potentielles (simulé)
    const allMeds = prescriptions.flatMap((p) => p.content.medications || []);
    const drugNames = allMeds.map((m: any) => m.name.toLowerCase());
    if (drugNames.includes("warfarin") && drugNames.includes("aspirine")) {
      warnings.push(
        "Association warfarine + aspirine : risque hémorragique. Vérifier avec le médecin.",
      );
    }

    if (sections.length === 0) {
      sections.push({
        title: "Aucun enregistrement médical",
        content: "Aucune donnée disponible pour générer un résumé.",
      });
    }

    return {
      patient: patientName,
      generatedAt: new Date(),
      sections,
      warnings,
    };
  }

  /**
   * Résume un long texte médical en quelques phrases clés.
   */
  summarizeText(text: string): string {
    // Simulation : extrait les 2 premières phrases
    const sentences = text.split(/[.!?]\s+/);
    return sentences.slice(0, 2).join(". ") + ".";
  }
}
