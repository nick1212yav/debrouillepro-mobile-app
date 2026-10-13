import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Liste des avis d'un prestataire.
 */
export function useServiceReviews(providerId: Id<"serviceProviders">) {
  const reviews = useQuery(api.services.reviews.getReviews, { providerId });

  return {
    reviews: reviews ?? [],
    loading: reviews === undefined,
  };
}

/**
 * Créer un avis — V1 exige un bookingId (réservation terminée).
 *
 * Contrat :
 *   - le booking doit être en statut "done"
 *   - l'appelant doit être le client du booking
 *   - un seul avis par booking
 */
export function useServiceReviewCreate() {
  const createReview = useMutation(api.services.reviews.createReview);

  const addReview = async (
    bookingId: Id<"serviceBookings">,
    rating: number,
    comment: string,
  ) => {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      toast.error("La note doit être un entier entre 1 et 5.");
      throw new Error("La note doit être un entier entre 1 et 5.");
    }

    try {
      const result = await createReview({
        bookingId,
        rating,
        comment: comment.trim(),
      });
      toast.success("Avis envoyé !");
      return result;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de l'avis.",
      );
      throw error;
    }
  };

  return { addReview };
}
