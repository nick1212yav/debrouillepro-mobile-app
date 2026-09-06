// src/features/sante/utils/medical.ts

/**
 * Calcule l'IMC (Indice de Masse Corporelle)
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Interprète l'IMC
 */
export function interpretBMI(bmi: number): { category: string; color: string } {
  if (bmi < 18.5) return { category: "Maigreur", color: "#F59E0B" };
  if (bmi < 25) return { category: "Normal", color: "#10B981" };
  if (bmi < 30) return { category: "Surpoids", color: "#F59E0B" };
  if (bmi < 35) return { category: "Obésité modérée", color: "#EF4444" };
  if (bmi < 40) return { category: "Obésité sévère", color: "#EF4444" };
  return { category: "Obésité morbide", color: "#B91C1C" };
}

/**
 * Calcule le rythme cardiaque maximum théorique
 */
export function calculateMaxHeartRate(age: number): number {
  return 220 - age;
}

/**
 * Calcule les zones de fréquence cardiaque
 */
export function getHeartRateZones(
  age: number,
): { zone: string; min: number; max: number }[] {
  const max = calculateMaxHeartRate(age);
  return [
    { zone: "Repos", min: 0, max: Math.round(max * 0.5) },
    {
      zone: "Échauffement",
      min: Math.round(max * 0.5) + 1,
      max: Math.round(max * 0.6),
    },
    {
      zone: "Cardio",
      min: Math.round(max * 0.6) + 1,
      max: Math.round(max * 0.7),
    },
    {
      zone: "Intense",
      min: Math.round(max * 0.7) + 1,
      max: Math.round(max * 0.85),
    },
    { zone: "Maximum", min: Math.round(max * 0.85) + 1, max: max },
  ];
}

/**
 * Estime la date de conception à partir de la date d'accouchement
 */
export function estimateConceptionDate(deliveryDate: Date): Date {
  const d = new Date(deliveryDate);
  d.setDate(d.getDate() - 280);
  return d;
}

/**
 * Calcule l'âge gestationnel en semaines à partir de la date des dernières règles
 */
export function calculateGestationalAge(lastPeriodDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - lastPeriodDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays / 7);
}

/**
 * Convertit une température entre Celsius et Fahrenheit
 */
export function convertTemperature(
  value: number,
  from: "C" | "F",
  to: "C" | "F",
): number {
  if (from === to) return value;
  if (from === "C" && to === "F") return (value * 9) / 5 + 32;
  if (from === "F" && to === "C") return ((value - 32) * 5) / 9;
  return value;
}

/**
 * Vérifie si une pression artérielle est normale
 */
export function isBloodPressureNormal(
  systolic: number,
  diastolic: number,
): boolean {
  return (
    systolic >= 90 && systolic <= 120 && diastolic >= 60 && diastolic <= 80
  );
}

/**
 * Interprète une pression artérielle
 */
export function interpretBloodPressure(
  systolic: number,
  diastolic: number,
): string {
  if (systolic < 90 || diastolic < 60) return "Hypotension";
  if (systolic >= 140 || diastolic >= 90) return "Hypertension";
  if (systolic >= 130 || diastolic >= 85) return "Pré-hypertension";
  return "Normale";
}
