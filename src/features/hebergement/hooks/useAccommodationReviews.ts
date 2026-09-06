import { useState } from "react";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  date: string;
  text: string;
}

export function useAccommodationReviews(accommodationId?: string) {
  const [reviews, setReviews] = useState<Review[]>([]);

  const addReview = async (text: string, rating: number) => {
    const newReview: Review = {
      id: String(Math.random()),
      authorName: "Moi",
      rating,
      date: "À l'instant",
      text,
    };
    setReviews((prev) => [newReview, ...prev]);
  };

  return { reviews, addReview };
}
