export interface ReviewValidationData {
  rating: number;
  text: string;
}

export const validateReview = (
  data: ReviewValidationData,
): { success: boolean; errors?: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (data.rating < 1 || data.rating > 5) {
    errors.rating = "La note doit être comprise entre 1 et 5 étoiles.";
  }

  if (!data.text || data.text.trim().length < 10) {
    errors.text = "Le commentaire doit contenir au moins 10 caractères.";
  }

  return {
    success: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};
