// src/features/network/constants/skills.ts
export const SKILLS = [
  // Tech & Digital
  { id: "javascript", label: "JavaScript", category: "tech" },
  { id: "typescript", label: "TypeScript", category: "tech" },
  { id: "python", label: "Python", category: "tech" },
  { id: "java", label: "Java", category: "tech" },
  { id: "php", label: "PHP", category: "tech" },
  { id: "react", label: "React", category: "tech" },
  { id: "vue", label: "Vue.js", category: "tech" },
  { id: "angular", label: "Angular", category: "tech" },
  { id: "nodejs", label: "Node.js", category: "tech" },
  { id: "nextjs", label: "Next.js", category: "tech" },
  { id: "tailwind", label: "Tailwind CSS", category: "tech" },
  { id: "mongodb", label: "MongoDB", category: "tech" },
  { id: "postgresql", label: "PostgreSQL", category: "tech" },
  { id: "mysql", label: "MySQL", category: "tech" },
  { id: "docker", label: "Docker", category: "tech" },
  { id: "kubernetes", label: "Kubernetes", category: "tech" },
  { id: "aws", label: "AWS", category: "tech" },
  { id: "gcp", label: "Google Cloud", category: "tech" },
  { id: "azure", label: "Azure", category: "tech" },
  { id: "devops", label: "DevOps", category: "tech" },
  { id: "cybersecurity", label: "Cybersécurité", category: "tech" },
  { id: "ux_design", label: "UX Design", category: "tech" },
  { id: "ui_design", label: "UI Design", category: "tech" },
  { id: "figma", label: "Figma", category: "tech" },
  { id: "sketch", label: "Sketch", category: "tech" },
  { id: "photoshop", label: "Photoshop", category: "tech" },
  { id: "illustrator", label: "Illustrator", category: "tech" },

  // Business & Marketing
  {
    id: "project_management",
    label: "Gestion de projet",
    category: "business",
  },
  { id: "agile", label: "Agile / Scrum", category: "business" },
  { id: "marketing_digital", label: "Marketing digital", category: "business" },
  { id: "seo", label: "SEO / Référencement", category: "business" },
  { id: "content_marketing", label: "Content marketing", category: "business" },
  { id: "social_media", label: "Réseaux sociaux", category: "business" },
  { id: "analytics", label: "Analytics", category: "business" },
  { id: "leadership", label: "Leadership", category: "business" },
  { id: "negotiation", label: "Négociation", category: "business" },
  { id: "sales", label: "Vente", category: "business" },
  {
    id: "business_development",
    label: "Développement business",
    category: "business",
  },
  { id: "finance", label: "Finance", category: "business" },
  { id: "accounting", label: "Comptabilité", category: "business" },

  // Language
  { id: "french", label: "Français", category: "language" },
  { id: "english", label: "Anglais", category: "language" },
  { id: "lingala", label: "Lingala", category: "language" },
  { id: "swahili", label: "Swahili", category: "language" },
  { id: "kikongo", label: "Kikongo", category: "language" },
  { id: "tshiluba", label: "Tshiluba", category: "language" },
  { id: "arabic", label: "Arabe", category: "language" },
  { id: "portuguese", label: "Portugais", category: "language" },
  { id: "spanish", label: "Espagnol", category: "language" },

  // Handy & Artisan
  { id: "plumbing", label: "Plomberie", category: "handy" },
  { id: "electricity", label: "Électricité", category: "handy" },
  { id: "carpentry", label: "Menuiserie", category: "handy" },
  { id: "welding", label: "Soudure", category: "handy" },
  { id: "masonry", label: "Maçonnerie", category: "handy" },
  { id: "painting", label: "Peinture", category: "handy" },
  { id: "gardening", label: "Jardinage", category: "handy" },
  { id: "cooking", label: "Cuisine", category: "handy" },
  { id: "baking", label: "Pâtisserie", category: "handy" },

  // Health
  { id: "first_aid", label: "Premiers secours", category: "health" },
  { id: "nursing", label: "Soins infirmiers", category: "health" },
  { id: "pharmacy", label: "Pharmacie", category: "health" },
  { id: "psychology", label: "Psychologie", category: "health" },
  { id: "nutrition", label: "Nutrition", category: "health" },

  // Education
  { id: "teaching", label: "Enseignement", category: "education" },
  { id: "tutoring", label: "Tutorat", category: "education" },
  { id: "training", label: "Formation", category: "education" },

  // Other
  { id: "driving", label: "Permis de conduire", category: "other" },
  { id: "public_speaking", label: "Prise de parole", category: "other" },
  { id: "writing", label: "Rédaction", category: "other" },
  { id: "photography", label: "Photographie", category: "other" },
  { id: "videography", label: "Vidéographie", category: "other" },
  { id: "music", label: "Musique", category: "other" },
  { id: "sports", label: "Sport", category: "other" },
] as const;

export type SkillId = (typeof SKILLS)[number]["id"];

export const SKILL_LABELS: Record<SkillId, string> = SKILLS.reduce(
  (acc, skill) => ({ ...acc, [skill.id]: skill.label }),
  {} as Record<SkillId, string>,
);

export const SKILL_CATEGORIES = [
  { id: "tech", label: "Tech & Digital" },
  { id: "business", label: "Business & Marketing" },
  { id: "language", label: "Langues" },
  { id: "handy", label: "Artisanat & Bricolage" },
  { id: "health", label: "Santé" },
  { id: "education", label: "Éducation" },
  { id: "other", label: "Autres" },
];
