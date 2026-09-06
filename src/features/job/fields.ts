import type { FieldConfig } from "../../core/sdk/types";

export const fields: FieldConfig[] = [
  // ─── Informations générales ───
  {
    key: "title",
    label: "Intitulé du poste",
    type: "text",
    required: true,
    group: "Informations générales",
    placeholder: "Ex: Développeur React Senior",
  },
  {
    key: "company",
    label: "Nom de l'entreprise",
    type: "text",
    required: true,
    group: "Informations générales",
    placeholder: "Ex: Débrouille SARL",
  },
  {
    key: "sector",
    label: "Secteur d'activité",
    type: "text",
    group: "Informations générales",
    placeholder: "Ex: Tech, Santé, Finance...",
  },
  {
    key: "description",
    label: "Description du poste",
    type: "textarea",
    required: true,
    group: "Informations générales",
    placeholder: "Décrivez le poste, les responsabilités, l'équipe...",
  },

  // ─── Localisation ───
  {
    key: "city",
    label: "Ville",
    type: "city",
    required: true,
    group: "Localisation",
    placeholder: "Ex: Kinshasa",
  },
  {
    key: "country",
    label: "Pays",
    type: "country",
    defaultValue: "Congo",
    group: "Localisation",
  },

  // ─── Rémunération ───
  {
    key: "salary",
    label: "Salaire",
    type: "currency",
    required: true,
    group: "Rémunération",
    placeholder: "Ex: 1200",
  },
  {
    key: "salaryMin",
    label: "Salaire minimum",
    type: "currency",
    group: "Rémunération",
    placeholder: "Ex: 1000",
  },
  {
    key: "salaryMax",
    label: "Salaire maximum",
    type: "currency",
    group: "Rémunération",
    placeholder: "Ex: 1500",
  },

  // ─── Contrat ───
  {
    key: "contract",
    label: "Type de contrat",
    type: "select",
    required: true,
    group: "Contrat",
    options: [
      { label: "CDI", value: "CDI" },
      { label: "CDD", value: "CDD" },
      { label: "Freelance", value: "Freelance" },
      { label: "Stage", value: "Stage" },
      { label: "Alternance", value: "Alternance" },
      { label: "Intérim", value: "Interim" },
      { label: "Journalier", value: "Journalier" },
    ],
  },
  {
    key: "workMode",
    label: "Modalité de travail",
    type: "select",
    required: true,
    group: "Contrat",
    options: [
      { label: "Sur site", value: "onsite" },
      { label: "À distance", value: "remote" },
      { label: "Hybride", value: "hybrid" },
    ],
  },
  {
    key: "remote",
    label: "Télétravail possible",
    type: "boolean",
    group: "Contrat",
  },
  {
    key: "remoteTimezone",
    label: "Fuseau horaire (si télétravail)",
    type: "select",
    group: "Contrat",
    options: [
      { label: "UTC+1", value: "UTC+1" },
      { label: "UTC+2", value: "UTC+2" },
      { label: "UTC+3", value: "UTC+3" },
    ],
    visibleIf: (values) => values.remote === true,
  },

  // ─── Compétences & Bénéfices ───
  {
    key: "skills",
    label: "Compétences",
    type: "tags",
    required: true,
    group: "Compétences & Bénéfices",
    placeholder: "Ex: React, TypeScript, Convex...",
  },
  {
    key: "benefits",
    label: "Avantages",
    type: "tags",
    group: "Compétences & Bénéfices",
    placeholder: "Ex: Ticket restaurant, Mutuelle...",
  },

  // ─── Contact ───
  {
    key: "contactEmail",
    label: "Email de contact",
    type: "email",
    group: "Contact",
    placeholder: "recrutement@debrouille.cd",
  },
  {
    key: "contactPhone",
    label: "Téléphone de contact",
    type: "phone",
    group: "Contact",
    placeholder: "+243 825 123 456",
  },

  // ─── Date limite ───
  {
    key: "deadline",
    label: "Date limite de candidature",
    type: "date",
    group: "Informations générales",
  },
];
