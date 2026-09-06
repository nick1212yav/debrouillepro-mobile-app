// src/features/voyages/constants/voyage-countries.ts

export interface Country {
  id: string;
  name: string;
  code: string;
  flag: string;
  capital?: string;
  continent: "Africa" | "Europe" | "Asia" | "Americas" | "Oceania";
  currency: string;
  languages: string[];
  phonePrefix: string;
}

/**
 * Liste des pays africains (principaux) et quelques autres pour les voyages
 */
export const COUNTRIES: Country[] = [
  // Afrique de l'Ouest
  {
    id: "ci",
    name: "Côte d'Ivoire",
    code: "CI",
    flag: "🇨🇮",
    capital: "Abidjan",
    continent: "Africa",
    currency: "FCFA",
    languages: ["Français"],
    phonePrefix: "+225",
  },
  {
    id: "sn",
    name: "Sénégal",
    code: "SN",
    flag: "🇸🇳",
    capital: "Dakar",
    continent: "Africa",
    currency: "FCFA",
    languages: ["Français", "Wolof"],
    phonePrefix: "+221",
  },
  {
    id: "ng",
    name: "Nigeria",
    code: "NG",
    flag: "🇳🇬",
    capital: "Abuja",
    continent: "Africa",
    currency: "NGN",
    languages: ["Anglais"],
    phonePrefix: "+234",
  },
  {
    id: "gh",
    name: "Ghana",
    code: "GH",
    flag: "🇬🇭",
    capital: "Accra",
    continent: "Africa",
    currency: "GHS",
    languages: ["Anglais"],
    phonePrefix: "+233",
  },
  // Afrique Centrale
  {
    id: "cd",
    name: "République Démocratique du Congo",
    code: "CD",
    flag: "🇨🇩",
    capital: "Kinshasa",
    continent: "Africa",
    currency: "CDF",
    languages: ["Français", "Lingala", "Swahili"],
    phonePrefix: "+243",
  },
  {
    id: "cg",
    name: "Congo-Brazzaville",
    code: "CG",
    flag: "🇨🇬",
    capital: "Brazzaville",
    continent: "Africa",
    currency: "FCFA",
    languages: ["Français"],
    phonePrefix: "+242",
  },
  {
    id: "cm",
    name: "Cameroun",
    code: "CM",
    flag: "🇨🇲",
    capital: "Yaoundé",
    continent: "Africa",
    currency: "FCFA",
    languages: ["Français", "Anglais"],
    phonePrefix: "+237",
  },
  {
    id: "ga",
    name: "Gabon",
    code: "GA",
    flag: "🇬🇦",
    capital: "Libreville",
    continent: "Africa",
    currency: "FCFA",
    languages: ["Français"],
    phonePrefix: "+241",
  },
  // Afrique de l'Est
  {
    id: "ke",
    name: "Kenya",
    code: "KE",
    flag: "🇰🇪",
    capital: "Nairobi",
    continent: "Africa",
    currency: "KES",
    languages: ["Swahili", "Anglais"],
    phonePrefix: "+254",
  },
  {
    id: "tz",
    name: "Tanzanie",
    code: "TZ",
    flag: "🇹🇿",
    capital: "Dodoma",
    continent: "Africa",
    currency: "TZS",
    languages: ["Swahili", "Anglais"],
    phonePrefix: "+255",
  },
  {
    id: "ug",
    name: "Ouganda",
    code: "UG",
    flag: "🇺🇬",
    capital: "Kampala",
    continent: "Africa",
    currency: "UGX",
    languages: ["Anglais", "Swahili"],
    phonePrefix: "+256",
  },
  {
    id: "rw",
    name: "Rwanda",
    code: "RW",
    flag: "🇷🇼",
    capital: "Kigali",
    continent: "Africa",
    currency: "RWF",
    languages: ["Kinyarwanda", "Français", "Anglais"],
    phonePrefix: "+250",
  },
  // Afrique Australe
  {
    id: "za",
    name: "Afrique du Sud",
    code: "ZA",
    flag: "🇿🇦",
    capital: "Pretoria",
    continent: "Africa",
    currency: "ZAR",
    languages: ["Afrikaans", "Anglais", "Zoulou"],
    phonePrefix: "+27",
  },
  {
    id: "zm",
    name: "Zambie",
    code: "ZM",
    flag: "🇿🇲",
    capital: "Lusaka",
    continent: "Africa",
    currency: "ZMW",
    languages: ["Anglais"],
    phonePrefix: "+260",
  },
  {
    id: "zw",
    name: "Zimbabwe",
    code: "ZW",
    flag: "🇿🇼",
    capital: "Harare",
    continent: "Africa",
    currency: "USD",
    languages: ["Anglais", "Shona", "Ndebele"],
    phonePrefix: "+263",
  },
  // Afrique du Nord
  {
    id: "ma",
    name: "Maroc",
    code: "MA",
    flag: "🇲🇦",
    capital: "Rabat",
    continent: "Africa",
    currency: "MAD",
    languages: ["Arabe", "Berbère", "Français"],
    phonePrefix: "+212",
  },
  {
    id: "tn",
    name: "Tunisie",
    code: "TN",
    flag: "🇹🇳",
    capital: "Tunis",
    continent: "Africa",
    currency: "TND",
    languages: ["Arabe", "Français"],
    phonePrefix: "+216",
  },
  {
    id: "eg",
    name: "Égypte",
    code: "EG",
    flag: "🇪🇬",
    capital: "Le Caire",
    continent: "Africa",
    currency: "EGP",
    languages: ["Arabe"],
    phonePrefix: "+20",
  },
  // Europe
  {
    id: "fr",
    name: "France",
    code: "FR",
    flag: "🇫🇷",
    capital: "Paris",
    continent: "Europe",
    currency: "EUR",
    languages: ["Français"],
    phonePrefix: "+33",
  },
  {
    id: "be",
    name: "Belgique",
    code: "BE",
    flag: "🇧🇪",
    capital: "Bruxelles",
    continent: "Europe",
    currency: "EUR",
    languages: ["Français", "Néerlandais", "Allemand"],
    phonePrefix: "+32",
  },
  {
    id: "ch",
    name: "Suisse",
    code: "CH",
    flag: "🇨🇭",
    capital: "Berne",
    continent: "Europe",
    currency: "CHF",
    languages: ["Français", "Allemand", "Italien", "Romanche"],
    phonePrefix: "+41",
  },
  // Autres
  {
    id: "us",
    name: "États-Unis",
    code: "US",
    flag: "🇺🇸",
    capital: "Washington, D.C.",
    continent: "Americas",
    currency: "USD",
    languages: ["Anglais"],
    phonePrefix: "+1",
  },
  {
    id: "ae",
    name: "Émirats Arabes Unis",
    code: "AE",
    flag: "🇦🇪",
    capital: "Abu Dhabi",
    continent: "Asia",
    currency: "AED",
    languages: ["Arabe", "Anglais"],
    phonePrefix: "+971",
  },
];

/**
 * Map des pays par code
 */
export const COUNTRIES_MAP = COUNTRIES.reduce(
  (acc, country) => {
    acc[country.code] = country;
    return acc;
  },
  {} as Record<string, Country>,
);

/**
 * Récupère un pays par son code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES_MAP[code];
}

/**
 * Récupère les pays par continent
 */
export function getCountriesByContinent(
  continent: Country["continent"],
): Country[] {
  return COUNTRIES.filter((c) => c.continent === continent);
}

/**
 * Recherche des pays par nom
 */
export function searchCountries(query: string): Country[] {
  const q = query.toLowerCase();
  return COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.capital?.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q),
  );
}
