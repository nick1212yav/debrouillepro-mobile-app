export interface ReviewRecord {
  id: string;
  restaurantId: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 à 5
  comment: string;
  createdAt: string;
  responseFromOwner?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
