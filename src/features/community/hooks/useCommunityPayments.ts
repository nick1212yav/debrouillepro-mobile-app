// src/features/community/hooks/useCommunityPayments.ts
//
// SÉCURITÉ : les endpoints `community.processPayment` /
// `createPaymentIntent` / `confirmPayment` ont été neutralisés côté backend.
//
// Ce hook est conservé pour compatibilité (mêmes noms de fonctions) mais ses
// 3 entrées échouent avec un message explicite. Aucune opération financière
// n'est possible.

const NOT_AVAILABLE_MESSAGE =
  "Le paiement Community est en cours de migration vers DébrouillePay. Utilisez votre portefeuille pour finaliser cette opération.";

export function useCommunityPayments() {
  return {
    processPayment: async (): Promise<never> => {
      throw new Error(NOT_AVAILABLE_MESSAGE);
    },
    createPaymentIntent: async (): Promise<never> => {
      throw new Error(NOT_AVAILABLE_MESSAGE);
    },
    confirmPayment: async (): Promise<never> => {
      throw new Error(NOT_AVAILABLE_MESSAGE);
    },
  };
}
