// src/features/network/constants/industries.ts
export const INDUSTRIES = [
  { id: "technology", label: "Technologie", icon: "💻" },
  { id: "healthcare", label: "Santé", icon: "🏥" },
  { id: "education", label: "Éducation", icon: "📚" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "agriculture", label: "Agriculture", icon: "🌾" },
  { id: "transport", label: "Transport", icon: "🚚" },
  { id: "real_estate", label: "Immobilier", icon: "🏠" },
  { id: "energy", label: "Énergie", icon: "⚡" },
  { id: "hospitality", label: "Hôtellerie", icon: "🏨" },
  { id: "restaurant", label: "Restauration", icon: "🍽️" },
  { id: "media", label: "Médias", icon: "📺" },
  { id: "construction", label: "Construction", icon: "🔨" },
  { id: "fashion", label: "Mode", icon: "👗" },
  { id: "beauty", label: "Beauté", icon: "💄" },
  { id: "automotive", label: "Automobile", icon: "🚗" },
  { id: "logistics", label: "Logistique", icon: "📦" },
  { id: "retail", label: "Commerce", icon: "🛍️" },
  { id: "consulting", label: "Conseil", icon: "📊" },
  { id: "legal", label: "Juridique", icon: "⚖️" },
  { id: "nonprofit", label: "ONG / Association", icon: "🤝" },
  { id: "art", label: "Art & Culture", icon: "🎨" },
  { id: "sports", label: "Sport", icon: "⚽" },
  { id: "mining", label: "Mines", icon: "⛏️" },
  { id: "telecom", label: "Télécommunications", icon: "📡" },
  { id: "pharmaceutical", label: "Pharmaceutique", icon: "💊" },
  { id: "other", label: "Autre", icon: "📌" },
] as const;

export type IndustryId = (typeof INDUSTRIES)[number]["id"];

export const INDUSTRY_LABELS: Record<IndustryId, string> = INDUSTRIES.reduce(
  (acc, industry) => ({ ...acc, [industry.id]: industry.label }),
  {} as Record<IndustryId, string>,
);

export const INDUSTRY_ICONS: Record<IndustryId, string> = INDUSTRIES.reduce(
  (acc, industry) => ({ ...acc, [industry.id]: industry.icon }),
  {} as Record<IndustryId, string>,
);
