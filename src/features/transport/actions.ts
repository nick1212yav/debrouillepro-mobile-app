// src/features/transport/actions.ts

export const actions = {
  // Action de réservation
  bookSeat: {
    id: "transport:book_seat",
    name: "Réserver une place [2]",
    description:
      "Inicie le processus de réservation d'un siège sur un trajet actif [2].",
    category: "mutation",
  },
  // Action d'annulation de réservation
  cancelBooking: {
    id: "transport:cancel_booking",
    name: "Annuler ma réservation [2]",
    description:
      "Annule une réservation en cours de validité selon les termes de la charte [2].",
    category: "mutation",
  },
  // Action de création/publication de trajet
  publishRoute: {
    id: "transport:publish_route",
    name: "Publier un trajet [2]",
    description:
      "Permet à un conducteur de soumettre un nouvel itinéraire [2].",
    category: "mutation",
  },
  // Action de géolocalisation
  trackVehicle: {
    id: "transport:track_vehicle",
    name: "Suivre le véhicule [2]",
    description:
      "Active l'écoute et le rendu du flux GPS matériel en direct [2].",
    category: "query",
  },
};
