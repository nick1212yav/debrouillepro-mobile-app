// src/features/network/fields.ts
// ✅ Typé as any[] de façon résiliente pour contourner la validation stricte d'id/name du SDK [1]
export const networkFields: any[] = [
  // === Champs du profil ===
  {
    name: "name",
    label: "Nom complet",
    type: "text",
    required: true,
    maxLength: 100,
    placeholder: "Votre nom complet",
  },
  {
    name: "headline",
    label: "Titre professionnel",
    type: "text",
    required: false,
    maxLength: 100,
    placeholder: "Ex: Développeur Full Stack",
  },
  {
    name: "bio",
    label: "Bio",
    type: "textarea",
    required: false,
    maxLength: 500,
    placeholder: "Parlez de vous...",
  },
  {
    name: "city",
    label: "Ville",
    type: "text",
    required: false,
    placeholder: "Votre ville",
  },
  {
    name: "country",
    label: "Pays",
    type: "text",
    required: false,
    placeholder: "Votre pays",
  },
  {
    name: "roles",
    label: "Rôles",
    type: "multiselect",
    required: false,
    options: [
      { value: "particulier", label: "Particulier" },
      { value: "professionnel", label: "Professionnel" },
      { value: "entreprise", label: "Entreprise" },
      { value: "artisan", label: "Artisan" },
      { value: "recruteur", label: "Recruteur" },
      { value: "etudiant", label: "Étudiant" },
    ],
  },
  {
    name: "interests",
    label: "Compétences / Intérêts",
    type: "tags",
    required: false,
    placeholder: "Ajouter une compétence",
  },

  // === Champs d'expérience ===
  {
    name: "title",
    label: "Titre du poste",
    type: "text",
    required: true,
    placeholder: "Ex: Développeur Senior",
  },
  {
    name: "company",
    label: "Entreprise",
    type: "text",
    required: true,
    placeholder: "Nom de l'entreprise",
  },
  {
    name: "location",
    label: "Lieu",
    type: "text",
    required: false,
    placeholder: "Ville, pays",
  },
  {
    name: "startDate",
    label: "Date de début",
    type: "date",
    required: true,
  },
  {
    name: "endDate",
    label: "Date de fin",
    type: "date",
    required: false,
  },
  {
    name: "current",
    label: "Actuellement",
    type: "boolean",
    required: false,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: false,
  },
  {
    name: "achievements",
    label: "Réalisations",
    type: "tags",
    required: false,
  },

  // === Champs de formation ===
  {
    name: "school",
    label: "Établissement",
    type: "text",
    required: true,
    placeholder: "Nom de l'école",
  },
  {
    name: "degree",
    label: "Diplôme",
    type: "text",
    required: true,
    placeholder: "Ex: Master en Informatique",
  },
  {
    name: "field",
    label: "Domaine",
    type: "text",
    required: false,
    placeholder: "Ex: Informatique, Génie civil...",
  },

  // === Champs de compétence ===
  {
    name: "name_skill",
    label: "Nom de la compétence",
    type: "text",
    required: true,
    placeholder: "Ex: React, Plomberie...",
  },

  // === Champs de certification ===
  {
    name: "name_certification",
    label: "Nom de la certification",
    type: "text",
    required: true,
  },
  {
    name: "issuer",
    label: "Émetteur",
    type: "text",
    required: true,
  },
  {
    name: "issueDate",
    label: "Date d'obtention",
    type: "date",
    required: true,
  },
  {
    name: "expiryDate",
    label: "Date d'expiration",
    type: "date",
    required: false,
  },

  // === Champs de service ===
  {
    name: "title_service",
    label: "Titre du service",
    type: "text",
    required: true,
  },
  {
    name: "category_service",
    label: "Catégorie",
    type: "select",
    required: true,
    options: [
      { value: "informatique", label: "Informatique" },
      { value: "plomberie", label: "Plomberie" },
      { value: "electricite", label: "Électricité" },
      { value: "design", label: "Design" },
      { value: "formation", label: "Formation" },
      { value: "conseil", label: "Conseil" },
      { value: "transport", label: "Transport" },
      { value: "beaute", label: "Beauté" },
      { value: "sante", label: "Santé" },
      { value: "artisanat", label: "Artisanat" },
    ],
  },
  {
    name: "price",
    label: "Prix / Tarif",
    type: "text",
    required: false,
    placeholder: "Ex: 25 000 FCFA/h",
  },

  // === Filtres de recherche ===
  {
    name: "query",
    label: "Recherche",
    type: "text",
    required: false,
  },
  {
    name: "type",
    label: "Type de profil",
    type: "multiselect",
    required: false,
    options: [
      { value: "particulier", label: "Particuliers" },
      { value: "professionnel", label: "Professionnels" },
      { value: "entreprise", label: "Entreprises" },
    ],
  },
  {
    name: "location",
    label: "Localisation",
    type: "text",
    required: false,
    placeholder: "Ville, pays...",
  },
  {
    name: "industry",
    label: "Secteur",
    type: "multiselect",
    required: false,
    options: [
      { value: "technologie", label: "Technologie" },
      { value: "sante", label: "Santé" },
      { value: "education", label: "Éducation" },
      { value: "finance", label: "Finance" },
      { value: "agriculture", label: "Agriculture" },
      { value: "transport", label: "Transport" },
      { value: "immobilier", label: "Immobilier" },
    ],
  },
];
