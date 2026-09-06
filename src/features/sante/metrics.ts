// src/features/sante/metrics.ts
import type { ModuleMetric } from "@/core/sdk/types/manifest.types";

// Type étendu pour ajouter des propriétés spécifiques aux métriques Santé
type SanteMetricConfig = ModuleMetric & {
  description?: string;
  type?: "counter" | "gauge" | "percentage" | "currency" | "avg";
  aggregation?: "sum" | "avg" | "latest" | "count";
};

export const SANTE_METRICS: SanteMetricConfig[] = [
  {
    key: "sante.doctors.total",
    label: "Nombre total de médecins",
    description: "Nombre de médecins enregistrés dans la plateforme",
    type: "counter",
    aggregation: "sum",
    icon: "👨‍⚕️",
    format: (value) => value.toLocaleString(),
  },
  {
    key: "sante.doctors.online",
    label: "Médecins en ligne",
    description: "Nombre de médecins actuellement en ligne",
    type: "gauge",
    aggregation: "latest",
    icon: "🟢",
    unit: "médecins",
  },
  {
    key: "sante.appointments.total",
    label: "Rendez-vous totaux",
    description: "Nombre total de rendez-vous pris",
    type: "counter",
    aggregation: "sum",
    icon: "📅",
    format: (value) => value.toLocaleString(),
  },
  {
    key: "sante.appointments.completed",
    label: "Rendez-vous réalisés",
    description: "Nombre de rendez-vous terminés",
    type: "counter",
    aggregation: "sum",
    icon: "✅",
    format: (value) => value.toLocaleString(),
  },
  {
    key: "sante.appointments.cancellationRate",
    label: "Taux d'annulation",
    description: "Pourcentage de rendez-vous annulés",
    type: "percentage",
    aggregation: "avg",
    icon: "📊",
    unit: "%",
    format: (value) => (value * 100).toFixed(1) + "%",
  },
  {
    key: "sante.revenue.total",
    label: "Chiffre d'affaires total",
    description: "Revenu total généré par le module Santé",
    type: "currency",
    aggregation: "sum",
    icon: "💰",
    unit: "€",
    format: (value) =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(value),
  },
  {
    key: "sante.revenue.averagePerConsultation",
    label: "Revenu moyen par consultation",
    description: "Revenu moyen généré par consultation",
    type: "currency",
    aggregation: "avg",
    icon: "💶",
    unit: "€",
    format: (value) =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(value),
  },
  {
    key: "sante.emergency.calls",
    label: "Appels d'urgence",
    description: "Nombre d'appels d'urgence effectués",
    type: "counter",
    aggregation: "sum",
    icon: "🚑",
    format: (value) => value.toLocaleString(),
  },
  {
    key: "sante.telemedicine.sessions",
    label: "Sessions de téléconsultation",
    description: "Nombre de téléconsultations réalisées",
    type: "counter",
    aggregation: "sum",
    icon: "📹",
    format: (value) => value.toLocaleString(),
  },
  {
    key: "sante.pharmacy.orders",
    label: "Commandes en pharmacie",
    description: "Nombre total de commandes passées",
    type: "counter",
    aggregation: "sum",
    icon: "💊",
    format: (value) => value.toLocaleString(),
  },
];
