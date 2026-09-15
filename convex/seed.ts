import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed sample job listings for demo purposes
export const seedJobListings = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<number> => {
    const jobs = [
      { title: "Développeur React Senior", description: "Rejoignez notre équipe tech pour construire des applications web modernes.", company: "TechAfrique", category: "informatique", contractType: "cdi" as const, city: "Dakar", remote: true, skills: ["React", "TypeScript"], status: "open" as const },
      { title: "Médecin Généraliste", description: "Cabinet médical recherche un médecin pour consultations quotidiennes.", company: "Clinique Avicenne", category: "santé", contractType: "cdi" as const, city: "Abidjan", remote: false, skills: ["médecine", "consultation"], status: "open" as const },
      { title: "Agriculteur – Coopérative", description: "Gestion de la production agricole et coordination des équipes.", company: "Sahel Vert", category: "agriculture", contractType: "cdd" as const, city: "Bamako", remote: false, skills: ["agriculture", "gestion"], status: "open" as const },
      { title: "Comptable Certifié", description: "Gestion comptable complète pour une institution bancaire.", company: "Banque Atlantique", category: "finance", contractType: "cdi" as const, city: "Lomé", remote: false, skills: ["comptabilité", "Excel"], status: "open" as const },
    ];
    let count = 0;
    for (const job of jobs) {
      await ctx.db.insert("jobListings", {
        employerId: args.userId,
        ...job,
      });
      count++;
    }
    return count;
  },
});

// Seed sample properties
export const seedProperties = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<number> => {
    const props = [
      { title: "Appartement 3 pièces – Dakar Plateau", description: "Bel appartement meublé avec vue mer", type: "appartement" as const, transactionType: "location" as const, price: 250000, currency: "XAF", city: "Dakar", images: [] as string[], amenities: ["wifi", "parking"], status: "available" as const, featured: true },
      { title: "Villa moderne – Cocody Abidjan", description: "Villa avec piscine et jardin", type: "villa" as const, transactionType: "vente" as const, price: 45000000, currency: "XAF", city: "Abidjan", images: [] as string[], amenities: ["piscine", "jardin", "garage"], status: "available" as const, featured: false },
      { title: "Studio meublé – Bamako ACI", description: "Studio moderne tout équipé", type: "studio" as const, transactionType: "location" as const, price: 120000, currency: "XAF", city: "Bamako", images: [] as string[], amenities: ["wifi", "climatisation"], status: "available" as const, featured: false },
    ];
    let count = 0;
    for (const prop of props) {
      await ctx.db.insert("properties", { ownerId: args.userId, ...prop });
      count++;
    }
    return count;
  },
});

// Seed sample courses
export const seedCourses = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<number> => {
    const courses = [
      { title: "JavaScript pour débutants", description: "Apprenez JavaScript de zéro", category: "informatique", level: "debutant" as const, language: "fr", price: 0, currency: "XAF", isFree: true, lessonCount: 12, enrollmentCount: 0, tags: ["javascript", "web", "programmation"], status: "published" as const },
      { title: "Marketing Digital en Afrique", description: "Stratégies marketing adaptées au marché africain", category: "marketing", level: "intermediaire" as const, language: "fr", price: 25000, currency: "XAF", isFree: false, lessonCount: 8, enrollmentCount: 0, tags: ["marketing", "digital", "afrique"], status: "published" as const },
      { title: "Entrepreneuriat & Business Plan", description: "Créez votre entreprise pas à pas", category: "business", level: "debutant" as const, language: "fr", price: 15000, currency: "XAF", isFree: false, lessonCount: 10, enrollmentCount: 0, tags: ["entrepreneuriat", "business"], status: "published" as const },
    ];
    let count = 0;
    for (const course of courses) {
      await ctx.db.insert("courses", { instructorId: args.userId, ...course });
      count++;
    }
    return count;
  },
});

// Seed sample publications (petites annonces — one per type)
export const seedPublications = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<number> => {
    const publications: Array<{
      title: string;
      description: string;
      type: "immo" | "job" | "service" | "community" | "agri";
      status: "active";
      location?: string;
      price?: string;
      tags: string[];
      likeCount: number;
      viewCount: number;
      commentCount: number;
      images: string[];
      isHidden?: boolean;
      flagCount?: number;
    }> = [
      {
        title: "Vente terrain constructible – Thiès",
        description: "Terrain de 500m² viabilisé, proche du centre-ville, titre foncier disponible.",
        type: "immo",
        status: "active",
        location: "Thiès, Sénégal",
        price: "8 500 000 XAF",
        tags: ["terrain", "immobilier", "thiès"],
        likeCount: 4,
        viewCount: 120,
        commentCount: 2,
        images: [],
        isHidden: false,
        flagCount: 0,
      },
      {
        title: "Recherche chauffeur expérimenté – Douala",
        description: "Entreprise de logistique cherche chauffeur poids lourd avec 3 ans d'expérience minimum.",
        type: "job",
        status: "active",
        location: "Douala, Cameroun",
        tags: ["emploi", "chauffeur", "logistique"],
        likeCount: 2,
        viewCount: 85,
        commentCount: 0,
        images: [],
        isHidden: false,
        flagCount: 0,
      },
      {
        title: "Plomberie & Electricité – Intervention rapide",
        description: "Artisan qualifié disponible 7j/7 pour tous travaux de plomberie et électricité à domicile.",
        type: "service",
        status: "active",
        location: "Abidjan, Côte d'Ivoire",
        price: "À partir de 15 000 XAF",
        tags: ["plomberie", "electricité", "artisan"],
        likeCount: 9,
        viewCount: 210,
        commentCount: 5,
        images: [],
        isHidden: false,
        flagCount: 0,
      },
      {
        title: "Don de matériel scolaire – Bamako",
        description: "Association distribue des fournitures scolaires gratuitement aux enfants démunis. Inscriptions ouvertes.",
        type: "community",
        status: "active",
        location: "Bamako, Mali",
        price: "Gratuit",
        tags: ["solidarité", "éducation", "don"],
        likeCount: 35,
        viewCount: 540,
        commentCount: 12,
        images: [],
        isHidden: false,
        flagCount: 0,
      },
      {
        title: "Vente de riz local – Récolte 2025",
        description: "Producteur local propose du riz paddy de qualité supérieure, sacs de 50kg disponibles en grande quantité.",
        type: "agri",
        status: "active",
        location: "Ségou, Mali",
        price: "22 000 XAF / sac 50kg",
        tags: ["riz", "agriculture", "vente"],
        likeCount: 7,
        viewCount: 163,
        commentCount: 3,
        images: [],
        isHidden: false,
        flagCount: 0,
      },
    ];

    let count = 0;
    for (const pub of publications) {
      await ctx.db.insert("publications", {
        authorId: args.userId,
        ...pub,
      });
      count++;
    }
    return count;
  },
});

// Seed sample events
export const seedEvents = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<number> => {
    const events: Array<{
      title: string;
      description: string;
      category: "culturel" | "sportif" | "religieux" | "professionnel" | "communautaire" | "formation" | "festival" | "autre";
      location: string;
      startDate: string;
      endDate?: string;
      isFree: boolean;
      maxAttendees?: number;
      price?: string;
      tags: string[];
      status: "upcoming" | "ongoing" | "past" | "cancelled";
      coverImage?: string;
    }> = [
      {
        title: "Forum Emploi Afrique 2025",
        description: "Le plus grand forum emploi d'Afrique de l'Ouest réunissant 200+ entreprises et 5 000 candidats. Rencontrez des recruteurs, assistez à des ateliers CV et entretiens.",
        category: "professionnel",
        location: "Centre International de Conférences Abdou Diouf, Dakar",
        startDate: "2025-09-15T08:00:00.000Z",
        endDate: "2025-09-16T18:00:00.000Z",
        isFree: true,
        maxAttendees: 5000,
        tags: ["emploi", "recrutement", "networking", "dakar"],
        status: "upcoming",
      },
      {
        title: "Salon de l'Immobilier – Abidjan Expo",
        description: "Découvrez les meilleures opportunités immobilières en Côte d'Ivoire. Promoteurs, agents et investisseurs présents. Financement bancaire sur place.",
        category: "professionnel",
        location: "Palais des Congrès, Abidjan",
        startDate: "2025-10-03T09:00:00.000Z",
        endDate: "2025-10-05T19:00:00.000Z",
        isFree: false,
        price: "5 000 XAF",
        maxAttendees: 3000,
        tags: ["immobilier", "investissement", "habitat", "abidjan"],
        status: "upcoming",
      },
      {
        title: "Conférence Tech & Innovation Africaine",
        description: "Rejoignez les leaders technologiques d'Afrique pour deux jours de conférences, hackathon et pitchs de startups. Thème 2025 : IA et fintech au service du développement.",
        category: "formation",
        location: "Kigali Convention Centre, Kigali",
        startDate: "2025-11-20T08:30:00.000Z",
        endDate: "2025-11-21T17:00:00.000Z",
        isFree: false,
        price: "15 000 XAF",
        maxAttendees: 1500,
        tags: ["technologie", "ia", "startup", "innovation"],
        status: "upcoming",
      },
      {
        title: "Foire Agricole du Sahel",
        description: "Exposition des meilleures pratiques agricoles, nouvelles semences résistantes à la sécheresse, équipements modernes et rencontres entre producteurs et acheteurs.",
        category: "autre",
        location: "Parc des Expositions de Bamako, Mali",
        startDate: "2025-12-05T07:00:00.000Z",
        endDate: "2025-12-07T18:00:00.000Z",
        isFree: false,
        price: "2 000 XAF",
        maxAttendees: 8000,
        tags: ["agriculture", "sahel", "semences", "agroalimentaire"],
        status: "upcoming",
      },
    ];

    let count = 0;
    for (const event of events) {
      await ctx.db.insert("events", {
        authorId: args.userId,
        ...event,
      });
      count++;
    }
    return count;
  },
});

// Seed all data in one call — inlines all inserts to avoid cross-mutation calls
export const seedAll = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<{
    jobs: number;
    properties: number;
    courses: number;
    publications: number;
    events: number;
  }> => {
    // --- Job listings ---
    const jobsData = [
      { title: "Développeur React Senior", description: "Rejoignez notre équipe tech pour construire des applications web modernes.", company: "TechAfrique", category: "informatique", contractType: "cdi" as const, city: "Dakar", remote: true, skills: ["React", "TypeScript"], status: "open" as const },
      { title: "Médecin Généraliste", description: "Cabinet médical recherche un médecin pour consultations quotidiennes.", company: "Clinique Avicenne", category: "santé", contractType: "cdi" as const, city: "Abidjan", remote: false, skills: ["médecine", "consultation"], status: "open" as const },
      { title: "Agriculteur – Coopérative", description: "Gestion de la production agricole et coordination des équipes.", company: "Sahel Vert", category: "agriculture", contractType: "cdd" as const, city: "Bamako", remote: false, skills: ["agriculture", "gestion"], status: "open" as const },
      { title: "Comptable Certifié", description: "Gestion comptable complète pour une institution bancaire.", company: "Banque Atlantique", category: "finance", contractType: "cdi" as const, city: "Lomé", remote: false, skills: ["comptabilité", "Excel"], status: "open" as const },
    ];
    let jobs = 0;
    for (const job of jobsData) {
      await ctx.db.insert("jobListings", { employerId: args.userId, ...job });
      jobs++;
    }

    // --- Properties ---
    const propsData = [
      { title: "Appartement 3 pièces – Dakar Plateau", description: "Bel appartement meublé avec vue mer", type: "appartement" as const, transactionType: "location" as const, price: 250000, currency: "XAF", city: "Dakar", images: [] as string[], amenities: ["wifi", "parking"], status: "available" as const, featured: true },
      { title: "Villa moderne – Cocody Abidjan", description: "Villa avec piscine et jardin", type: "villa" as const, transactionType: "vente" as const, price: 45000000, currency: "XAF", city: "Abidjan", images: [] as string[], amenities: ["piscine", "jardin", "garage"], status: "available" as const, featured: false },
      { title: "Studio meublé – Bamako ACI", description: "Studio moderne tout équipé", type: "studio" as const, transactionType: "location" as const, price: 120000, currency: "XAF", city: "Bamako", images: [] as string[], amenities: ["wifi", "climatisation"], status: "available" as const, featured: false },
    ];
    let properties = 0;
    for (const prop of propsData) {
      await ctx.db.insert("properties", { ownerId: args.userId, ...prop });
      properties++;
    }

    // --- Courses ---
    const coursesData = [
      { title: "JavaScript pour débutants", description: "Apprenez JavaScript de zéro", category: "informatique", level: "debutant" as const, language: "fr", price: 0, currency: "XAF", isFree: true, lessonCount: 12, enrollmentCount: 0, tags: ["javascript", "web", "programmation"], status: "published" as const },
      { title: "Marketing Digital en Afrique", description: "Stratégies marketing adaptées au marché africain", category: "marketing", level: "intermediaire" as const, language: "fr", price: 25000, currency: "XAF", isFree: false, lessonCount: 8, enrollmentCount: 0, tags: ["marketing", "digital", "afrique"], status: "published" as const },
      { title: "Entrepreneuriat & Business Plan", description: "Créez votre entreprise pas à pas", category: "business", level: "debutant" as const, language: "fr", price: 15000, currency: "XAF", isFree: false, lessonCount: 10, enrollmentCount: 0, tags: ["entrepreneuriat", "business"], status: "published" as const },
    ];
    let courses = 0;
    for (const course of coursesData) {
      await ctx.db.insert("courses", { instructorId: args.userId, ...course });
      courses++;
    }

    // --- Publications ---
    const publicationsData: Array<{
      title: string;
      description: string;
      type: "immo" | "job" | "service" | "community" | "agri";
      status: "active";
      location?: string;
      price?: string;
      tags: string[];
      likeCount: number;
      viewCount: number;
      commentCount: number;
      images: string[];
      isHidden?: boolean;
      flagCount?: number;
    }> = [
      { title: "Vente terrain constructible – Thiès", description: "Terrain de 500m² viabilisé, proche du centre-ville, titre foncier disponible.", type: "immo", status: "active", location: "Thiès, Sénégal", price: "8 500 000 XAF", tags: ["terrain", "immobilier", "thiès"], likeCount: 4, viewCount: 120, commentCount: 2, images: [], isHidden: false, flagCount: 0 },
      { title: "Recherche chauffeur expérimenté – Douala", description: "Entreprise de logistique cherche chauffeur poids lourd avec 3 ans d'expérience minimum.", type: "job", status: "active", location: "Douala, Cameroun", tags: ["emploi", "chauffeur", "logistique"], likeCount: 2, viewCount: 85, commentCount: 0, images: [], isHidden: false, flagCount: 0 },
      { title: "Plomberie & Electricité – Intervention rapide", description: "Artisan qualifié disponible 7j/7 pour tous travaux de plomberie et électricité à domicile.", type: "service", status: "active", location: "Abidjan, Côte d'Ivoire", price: "À partir de 15 000 XAF", tags: ["plomberie", "electricité", "artisan"], likeCount: 9, viewCount: 210, commentCount: 5, images: [], isHidden: false, flagCount: 0 },
      { title: "Don de matériel scolaire – Bamako", description: "Association distribue des fournitures scolaires gratuitement aux enfants démunis. Inscriptions ouvertes.", type: "community", status: "active", location: "Bamako, Mali", price: "Gratuit", tags: ["solidarité", "éducation", "don"], likeCount: 35, viewCount: 540, commentCount: 12, images: [], isHidden: false, flagCount: 0 },
      { title: "Vente de riz local – Récolte 2025", description: "Producteur local propose du riz paddy de qualité supérieure, sacs de 50kg disponibles en grande quantité.", type: "agri", status: "active", location: "Ségou, Mali", price: "22 000 XAF / sac 50kg", tags: ["riz", "agriculture", "vente"], likeCount: 7, viewCount: 163, commentCount: 3, images: [], isHidden: false, flagCount: 0 },
    ];
    let publications = 0;
    for (const pub of publicationsData) {
      await ctx.db.insert("publications", { authorId: args.userId, ...pub });
      publications++;
    }

    // --- Events ---
    const eventsData: Array<{
      title: string;
      description: string;
      category: "culturel" | "sportif" | "religieux" | "professionnel" | "communautaire" | "formation" | "festival" | "autre";
      location: string;
      startDate: string;
      endDate?: string;
      isFree: boolean;
      maxAttendees?: number;
      price?: string;
      tags: string[];
      status: "upcoming" | "ongoing" | "past" | "cancelled";
      coverImage?: string;
    }> = [
      { title: "Forum Emploi Afrique 2025", description: "Le plus grand forum emploi d'Afrique de l'Ouest réunissant 200+ entreprises et 5 000 candidats.", category: "professionnel", location: "Centre International de Conférences Abdou Diouf, Dakar", startDate: "2025-09-15T08:00:00.000Z", endDate: "2025-09-16T18:00:00.000Z", isFree: true, maxAttendees: 5000, tags: ["emploi", "recrutement", "networking", "dakar"], status: "upcoming" },
      { title: "Salon de l'Immobilier – Abidjan Expo", description: "Découvrez les meilleures opportunités immobilières en Côte d'Ivoire.", category: "professionnel", location: "Palais des Congrès, Abidjan", startDate: "2025-10-03T09:00:00.000Z", endDate: "2025-10-05T19:00:00.000Z", isFree: false, price: "5 000 XAF", maxAttendees: 3000, tags: ["immobilier", "investissement", "habitat", "abidjan"], status: "upcoming" },
      { title: "Conférence Tech & Innovation Africaine", description: "Rejoignez les leaders technologiques d'Afrique pour deux jours de conférences et hackathon.", category: "formation", location: "Kigali Convention Centre, Kigali", startDate: "2025-11-20T08:30:00.000Z", endDate: "2025-11-21T17:00:00.000Z", isFree: false, price: "15 000 XAF", maxAttendees: 1500, tags: ["technologie", "ia", "startup", "innovation"], status: "upcoming" },
      { title: "Foire Agricole du Sahel", description: "Exposition des meilleures pratiques agricoles et rencontres entre producteurs et acheteurs.", category: "autre", location: "Parc des Expositions de Bamako, Mali", startDate: "2025-12-05T07:00:00.000Z", endDate: "2025-12-07T18:00:00.000Z", isFree: false, price: "2 000 XAF", maxAttendees: 8000, tags: ["agriculture", "sahel", "semences", "agroalimentaire"], status: "upcoming" },
    ];
    let events = 0;
    for (const event of eventsData) {
      await ctx.db.insert("events", { authorId: args.userId, ...event });
      events++;
    }

    return { jobs, properties, courses, publications, events };
  },
});
