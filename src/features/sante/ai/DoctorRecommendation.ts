// src/features/sante/ai/DoctorRecommendation.ts

export interface DoctorCriteria {
  location: { lat: number; lng: number };
  specialty?: string;
  maxDistance?: number;
  minRating?: number;
  availableNow?: boolean;
  language?: string;
  insurance?: string;
}

export interface DoctorSuggestion {
  id: string;
  name: string;
  specialty: string;
  address: string;
  distance: number;
  rating: number;
  fees: number;
  currency: string;
  online: boolean;
  phone: string;
  availableNow: boolean;
  score: number;
}

/**
 * Recommande des médecins selon les critères.
 */
export class DoctorRecommender {
  async recommend(criteria: DoctorCriteria): Promise<DoctorSuggestion[]> {
    // Simulation
    const mockDoctors: DoctorSuggestion[] = [
      {
        id: "d1",
        name: "Dr. Amara Diallo",
        specialty: "Médecin Généraliste",
        address: "2 Avenue des Cliniques, Kinshasa",
        distance: 1.2,
        rating: 4.8,
        fees: 5000,
        currency: "FCFA",
        online: true,
        phone: "+243 123456789",
        availableNow: true,
        score: 0,
      },
      {
        id: "d2",
        name: "Dr. Ngozi Okoye",
        specialty: "Pédiatre",
        address: "15 Rue des Enfants, Kinshasa",
        distance: 2.5,
        rating: 4.6,
        fees: 8000,
        currency: "FCFA",
        online: false,
        phone: "+243 987654321",
        availableNow: false,
        score: 0,
      },
      {
        id: "d3",
        name: "Dr. Ibrahim Touré",
        specialty: "Cardiologue",
        address: "45 Avenue du Cœur, Kinshasa",
        distance: 3.8,
        rating: 4.9,
        fees: 15000,
        currency: "FCFA",
        online: true,
        phone: "+243 456789123",
        availableNow: true,
        score: 0,
      },
    ];

    let filtered = mockDoctors.filter((d) => {
      if (criteria.specialty && d.specialty !== criteria.specialty)
        return false;
      if (criteria.maxDistance && d.distance > criteria.maxDistance)
        return false;
      if (criteria.minRating && d.rating < criteria.minRating) return false;
      if (criteria.availableNow && !d.availableNow) return false;
      return true;
    });

    filtered = filtered.map((d) => {
      const distanceScore = Math.max(0, 10 - d.distance);
      const ratingScore = d.rating * 2;
      const onlineBonus = d.online ? 3 : 0;
      const availableBonus = d.availableNow ? 2 : 0;
      d.score = distanceScore + ratingScore + onlineBonus + availableBonus;
      return d;
    });

    return filtered.sort((a, b) => b.score - a.score);
  }
}
