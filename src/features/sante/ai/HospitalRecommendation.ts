// src/features/sante/ai/HospitalRecommendation.ts

export interface HospitalCriteria {
  location: { lat: number; lng: number };
  maxDistance?: number; // km
  specialties?: string[];
  emergencyOnly?: boolean;
  minRating?: number;
  insuranceAccepted?: string[];
}

export interface HospitalSuggestion {
  id: string;
  name: string;
  address: string;
  distance: number; // km
  rating: number;
  specialties: string[];
  emergency: boolean;
  phone: string;
  openNow: boolean;
  score: number;
}

/**
 * Recommande des hôpitaux en fonction de critères.
 */
export class HospitalRecommender {
  /**
   * Trouve les meilleurs hôpitaux selon les critères.
   * Ici, nous simulons un appel API – à remplacer par des données réelles.
   */
  async recommend(criteria: HospitalCriteria): Promise<HospitalSuggestion[]> {
    // Simulation de données
    const mockHospitals: HospitalSuggestion[] = [
      {
        id: "h1",
        name: "CHU de Kinshasa",
        address: "1 Avenue de la Clinique, Kinshasa",
        distance: 2.3,
        rating: 4.2,
        specialties: ["Cardiologie", "Neurologie", "Urgences", "Pédiatrie"],
        emergency: true,
        phone: "+243 123456789",
        openNow: true,
        score: 0,
      },
      {
        id: "h2",
        name: "Hôpital Saint-Joseph",
        address: "45 Rue des Soeurs, Kinshasa",
        distance: 5.1,
        rating: 3.8,
        specialties: ["Maternité", "Gynécologie", "Urgences"],
        emergency: true,
        phone: "+243 987654321",
        openNow: false,
        score: 0,
      },
      {
        id: "h3",
        name: "Clinique Ngaliema",
        address: "Avenue Ngaliema, Kinshasa",
        distance: 8.7,
        rating: 4.5,
        specialties: ["Cardiologie", "Ophtalmologie", "Orthopédie"],
        emergency: false,
        phone: "+243 456789123",
        openNow: true,
        score: 0,
      },
    ];

    // Filtrer selon les critères
    let filtered = mockHospitals.filter((h) => {
      if (criteria.maxDistance && h.distance > criteria.maxDistance)
        return false;
      if (criteria.emergencyOnly && !h.emergency) return false;
      if (criteria.minRating && h.rating < criteria.minRating) return false;
      if (criteria.specialties && criteria.specialties.length > 0) {
        return criteria.specialties.some((s) => h.specialties.includes(s));
      }
      return true;
    });

    // Score : combinaison distance, note, urgence
    filtered = filtered.map((h) => {
      const distanceScore = Math.max(0, 10 - h.distance);
      const ratingScore = h.rating * 2;
      const emergencyBonus = h.emergency ? 3 : 0;
      const openBonus = h.openNow ? 2 : 0;
      h.score = distanceScore + ratingScore + emergencyBonus + openBonus;
      return h;
    });

    return filtered.sort((a, b) => b.score - a.score);
  }
}
