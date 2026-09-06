// src/features/sante/fields.ts
import type { FieldConfig, FieldType } from "@/core/sdk/types/field.types";

// Type helper pour les champs avec options prédéfinies
export type SanteFieldConfig = FieldConfig & {
  // Propriétés additionnelles pour la gestion des options externes
  optionsKey?: string; // Référence à une liste globale (ex: "specialties")
  currency?: boolean; // Indicateur pour les champs monétaires
  min?: number; // Valeur minimale pour les champs numériques
  max?: number; // Valeur maximale pour les champs numériques
  repeatable?: boolean; // Indicateur pour les champs répétables
  itemFields?: FieldConfig[]; // Définition des sous-champs pour les champs répétables
  options?: { label: string; value: string }[]; // Options pour les champs de type select
};

// Mapping des types de champ vers FieldType
const mapType = (type: string): FieldType => {
  const mapping: Record<string, FieldType> = {
    string: "text",
    number: "number",
    boolean: "boolean",
    select: "select",
    multiselect: "multiselect",
    textarea: "textarea",
    email: "email",
    phone: "phone",
    date: "date",
    reference: "select", // ou "user" selon le cas
    array: "repeatable",
    // Ajoute d'autres mappings si nécessaire
  };
  return mapping[type] || "text";
};

export const SANTE_FIELDS: SanteFieldConfig[] = [
  // ─── Doctor ───────────────────────────────────────────────
  { key: "doctor.name", label: "Nom", type: "text", required: true },
  {
    key: "doctor.specialty",
    label: "Spécialité",
    type: "select",
    optionsKey: "specialties",
    options: [],
    required: true,
  },
  {
    key: "doctor.fees",
    label: "Tarif",
    type: "number",
    currency: true,
    min: 0,
  },
  { key: "doctor.rating", label: "Note", type: "number", min: 0, max: 5 },
  { key: "doctor.address", label: "Adresse", type: "text" },
  { key: "doctor.phone", label: "Téléphone", type: "phone" },
  { key: "doctor.email", label: "Email", type: "email" },
  { key: "doctor.bio", label: "Biographie", type: "textarea" },
  {
    key: "doctor.experience",
    label: "Expérience (années)",
    type: "number",
    min: 0,
  },
  {
    key: "doctor.languages",
    label: "Langues",
    type: "multiselect",
    optionsKey: "languages",
    options: [],
  },
  {
    key: "doctor.insurances",
    label: "Assurances acceptées",
    type: "multiselect",
    optionsKey: "insurances",
    options: [],
  },
  { key: "doctor.online", label: "En ligne", type: "boolean" },
  { key: "doctor.verified", label: "Vérifié", type: "boolean" },

  // ─── Hospital ─────────────────────────────────────────────
  { key: "hospital.name", label: "Nom", type: "text", required: true },
  {
    key: "hospital.type",
    label: "Type",
    type: "select",
    optionsKey: "hospitalTypes",
    options: [],
  },
  { key: "hospital.address", label: "Adresse", type: "text" },
  { key: "hospital.phone", label: "Téléphone", type: "phone" },
  { key: "hospital.beds", label: "Nombre de lits", type: "number", min: 0 },
  {
    key: "hospital.services",
    label: "Services",
    type: "multiselect",
    optionsKey: "hospitalServices",
    options: [],
  },
  { key: "hospital.emergency", label: "Urgences", type: "boolean" },
  { key: "hospital.rating", label: "Note", type: "number", min: 0, max: 5 },

  // ─── Pharmacy ─────────────────────────────────────────────
  { key: "pharmacy.name", label: "Nom", type: "text", required: true },
  { key: "pharmacy.address", label: "Adresse", type: "text" },
  { key: "pharmacy.phone", label: "Téléphone", type: "phone" },
  {
    key: "pharmacy.services",
    label: "Services",
    type: "multiselect",
    optionsKey: "pharmacyServices",
    options: [],
  },
  { key: "pharmacy.delivery", label: "Livraison", type: "boolean" },
  { key: "pharmacy.rating", label: "Note", type: "number", min: 0, max: 5 },

  // ─── Laboratory ───────────────────────────────────────────
  { key: "laboratory.name", label: "Nom", type: "text", required: true },
  { key: "laboratory.address", label: "Adresse", type: "text" },
  { key: "laboratory.phone", label: "Téléphone", type: "phone" },
  { key: "laboratory.tests", label: "Nombre de tests", type: "number", min: 0 },
  { key: "laboratory.rating", label: "Note", type: "number", min: 0, max: 5 },

  // ─── Appointment ──────────────────────────────────────────
  {
    key: "appointment.doctorId",
    label: "Médecin",
    type: "select",
    optionsKey: "doctors",
    options: [],
    required: true,
  },
  { key: "appointment.slot", label: "Créneau", type: "text", required: true },
  {
    key: "appointment.type",
    label: "Type",
    type: "select",
    options: [
      { label: "Consultation", value: "consultation" },
      { label: "Téléconsultation", value: "teleconsultation" },
    ],
    required: true,
  },
  { key: "appointment.date", label: "Date", type: "date", required: true },
  { key: "appointment.notes", label: "Notes", type: "textarea" },

  // ─── Prescription ─────────────────────────────────────────
  {
    key: "prescription.doctorId",
    label: "Médecin",
    type: "select",
    optionsKey: "doctors",
    options: [],
    required: true,
  },
  { key: "prescription.date", label: "Date", type: "date", required: true },
  {
    key: "prescription.medications",
    label: "Médicaments",
    type: "repeatable",
    repeatable: true,
    itemFields: [
      { key: "name", label: "Nom", type: "text", required: true },
      { key: "dosage", label: "Dosage", type: "text", required: true },
      { key: "frequency", label: "Fréquence", type: "text" },
      { key: "duration", label: "Durée", type: "text" },
    ],
  },
];
