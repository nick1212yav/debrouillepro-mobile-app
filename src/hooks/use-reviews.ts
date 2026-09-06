import { useState, useCallback } from "react";

export type Review = {
  id: string;
  author: string;
  avatar: string;
  rating: number;        // 1–5
  comment: string;
  date: string;          // ISO string
  verified: boolean;
};

export type ReviewTarget = {
  module: string;        // e.g. "immo"
  itemId: string;        // e.g. "immo-1"
};

const STORAGE_KEY = "debrouille_reviews";

// Seed data so modules aren't empty on first load
const SEED_REVIEWS: Record<string, Review[]> = {
  "immo-1": [
    { id: "r1", author: "Grâce M.", avatar: "https://i.pravatar.cc/40?img=47", rating: 5, comment: "Propriétaire très réactif, logement conforme aux photos. Je recommande !", date: "2025-05-20T10:00:00Z", verified: true },
    { id: "r2", author: "Patrick K.", avatar: "https://i.pravatar.cc/40?img=11", rating: 4, comment: "Bon rapport qualité-prix pour le quartier. Voisinage calme.", date: "2025-05-15T14:00:00Z", verified: true },
    { id: "r3", author: "Amina D.", avatar: "https://i.pravatar.cc/40?img=32", rating: 5, comment: "Visite rapide organisée. Très satisfaite de mon expérience.", date: "2025-04-30T09:00:00Z", verified: false },
  ],
  "immo-2": [
    { id: "r4", author: "Joel N.", avatar: "https://i.pravatar.cc/40?img=53", rating: 4, comment: "Belle villa, quartier résidentiel. Prix légèrement élevé.", date: "2025-05-10T08:00:00Z", verified: true },
    { id: "r5", author: "Sandra L.", avatar: "https://i.pravatar.cc/40?img=25", rating: 5, comment: "Coup de cœur ! La piscine est un vrai plus.", date: "2025-04-22T11:00:00Z", verified: true },
  ],
  "immo-3": [
    { id: "r6", author: "Alain B.", avatar: "https://i.pravatar.cc/40?img=60", rating: 3, comment: "Studio correct mais un peu bruyant en soirée.", date: "2025-05-18T16:00:00Z", verified: false },
  ],
  "jobs-1": [
    { id: "r7", author: "Christophe M.", avatar: "https://i.pravatar.cc/40?img=14", rating: 5, comment: "CMSK est une excellente entreprise, équipe soudée et bonne ambiance.", date: "2025-05-25T09:00:00Z", verified: true },
    { id: "r8", author: "Fatou S.", avatar: "https://i.pravatar.cc/40?img=38", rating: 4, comment: "Processus de recrutement rapide. Salaire négociable.", date: "2025-05-12T13:00:00Z", verified: true },
  ],
  "jobs-2": [
    { id: "r9", author: "Marc T.", avatar: "https://i.pravatar.cc/40?img=3", rating: 5, comment: "TechHub est top ! Remote work bien géré, stack moderne.", date: "2025-05-20T10:00:00Z", verified: true },
    { id: "r10", author: "Nadia O.", avatar: "https://i.pravatar.cc/40?img=44", rating: 4, comment: "Bonne ambiance de travail, projets intéressants.", date: "2025-05-08T15:00:00Z", verified: false },
  ],
  "jobs-3": [
    { id: "r11", author: "Justin K.", avatar: "https://i.pravatar.cc/40?img=22", rating: 3, comment: "Poste correct mais la mobilité interne est lente.", date: "2025-04-28T10:00:00Z", verified: true },
  ],
  "sante-1": [
    { id: "r12", author: "Marie-Claire B.", avatar: "https://i.pravatar.cc/40?img=48", rating: 5, comment: "Docteur très à l'écoute, diagnostic précis. Je recommande vivement.", date: "2025-05-22T09:00:00Z", verified: true },
    { id: "r13", author: "Emile K.", avatar: "https://i.pravatar.cc/40?img=7", rating: 5, comment: "Consultation en ligne parfaite. Ordonnance reçue en 10 min.", date: "2025-05-19T11:00:00Z", verified: true },
    { id: "r14", author: "Sophie L.", avatar: "https://i.pravatar.cc/40?img=35", rating: 4, comment: "Très professionnel. Petit temps d'attente mais acceptable.", date: "2025-05-10T14:00:00Z", verified: false },
  ],
  "sante-2": [
    { id: "r15", author: "David M.", avatar: "https://i.pravatar.cc/40?img=16", rating: 5, comment: "Dr. Okoye est excellente avec les enfants. Ma fille n'a pas eu peur.", date: "2025-05-14T10:00:00Z", verified: true },
    { id: "r16", author: "Laure N.", avatar: "https://i.pravatar.cc/40?img=29", rating: 4, comment: "Pédiatre très compétente, explications claires.", date: "2025-05-05T09:00:00Z", verified: true },
  ],
  "transport-1": [
    { id: "r17", author: "Arnaud L.", avatar: "https://i.pravatar.cc/40?img=6", rating: 5, comment: "Patrick est ponctuel et la voiture est impeccable. 5 étoiles !", date: "2025-05-23T18:00:00Z", verified: true },
    { id: "r18", author: "Cécile M.", avatar: "https://i.pravatar.cc/40?img=41", rating: 5, comment: "Trajet très confortable. Je re-réserve sans hésiter.", date: "2025-05-18T20:00:00Z", verified: true },
  ],
  "transport-2": [
    { id: "r19", author: "Serge D.", avatar: "https://i.pravatar.cc/40?img=19", rating: 4, comment: "Rapide comme promis ! Petit conseil : porter un casque.", date: "2025-05-21T12:00:00Z", verified: false },
  ],
  "transport-3": [
    { id: "r20", author: "Pauline K.", avatar: "https://i.pravatar.cc/40?img=55", rating: 4, comment: "Joseph est sympa et connaît bien la ville. Bon prix.", date: "2025-05-17T09:00:00Z", verified: true },
    { id: "r21", author: "Roland T.", avatar: "https://i.pravatar.cc/40?img=8", rating: 3, comment: "Voiture un peu ancienne mais trajet sans problème.", date: "2025-05-11T15:00:00Z", verified: false },
  ],
};

function load(): Record<string, Review[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_REVIEWS;
    return { ...SEED_REVIEWS, ...(JSON.parse(raw) as Record<string, Review[]>) };
  } catch {
    return SEED_REVIEWS;
  }
}

function save(data: Record<string, Review[]>) {
  // Only persist user-added reviews (not the seed)
  const userAdded: Record<string, Review[]> = {};
  for (const [key, reviews] of Object.entries(data)) {
    const seedIds = new Set((SEED_REVIEWS[key] ?? []).map((r) => r.id));
    const added = reviews.filter((r) => !seedIds.has(r.id));
    if (added.length > 0) userAdded[key] = added;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userAdded));
}

export function getAggregateRating(reviews: Review[]): { avg: number; count: number } {
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, count: reviews.length };
}

const AVATARS = [
  "https://i.pravatar.cc/40?img=1",
  "https://i.pravatar.cc/40?img=2",
  "https://i.pravatar.cc/40?img=10",
  "https://i.pravatar.cc/40?img=13",
  "https://i.pravatar.cc/40?img=20",
  "https://i.pravatar.cc/40?img=27",
];

export function useReviews(itemId: string) {
  const [allReviews, setAllReviews] = useState<Record<string, Review[]>>(() => load());

  const reviews = allReviews[itemId] ?? [];
  const aggregate = getAggregateRating(reviews);

  const addReview = useCallback((rating: number, comment: string) => {
    const newReview: Review = {
      id: `user-${Date.now()}`,
      author: "Vous",
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      rating,
      comment,
      date: new Date().toISOString(),
      verified: true,
    };
    setAllReviews((prev) => {
      const updated = { ...prev, [itemId]: [newReview, ...(prev[itemId] ?? [])] };
      save(updated);
      return updated;
    });
  }, [itemId]);

  return { reviews, aggregate, addReview };
}
