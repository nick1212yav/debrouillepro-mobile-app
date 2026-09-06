// src/features/agri/types/seller.types.ts
export interface AgriSeller {
  userId: string;
  name: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  joinedAt: string;
}

export interface AgriSellerProfileData extends AgriSeller {
  farmLocation: {
    city: string;
    province: string;
    territory?: string;
  };
  certifications?: string[];
  bio?: string;
  contactPhone?: string;
  contactWhatsApp?: string;
}
