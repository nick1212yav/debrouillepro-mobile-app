// src/features/events/hooks/useEventReviews.ts
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function useEventReviews(eventId: string) {
  const [reviews, setReviews] = useState<any[]>([]);
  // ⚠️ Ces mutations seront ajoutées dans convex/events.ts plus tard
  // const addReviewMutation = useMutation(api.events.addReview);
  // const likeReviewMutation = useMutation(api.events.likeReview);

  const addReview = async (rating: number, comment: string) => {
    toast.info("Fonctionnalité à venir");
    // try {
    //   const review = await addReviewMutation({ eventId, rating, comment });
    //   setReviews((prev) => [...prev, review]);
    //   toast.success("Avis ajouté");
    //   return review;
    // } catch {
    //   toast.error("Erreur");
    // }
  };

  const likeReview = async (reviewId: string) => {
    toast.info("Fonctionnalité à venir");
    // try {
    //   await likeReviewMutation({ reviewId });
    //   setReviews((prev) =>
    //     prev.map((r) => {
    //       if (r._id === reviewId) {
    //         return { ...r, likedByMe: !r.likedByMe, likes: r.likedByMe ? r.likes - 1 : r.likes + 1 };
    //       }
    //       return r;
    //     })
    //   );
    // } catch {
    //   toast.error("Erreur");
    // }
  };

  return { reviews, addReview, likeReview };
}
