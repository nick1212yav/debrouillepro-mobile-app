// src/features/voyages/components/index.ts

// Cartes & Mises en page
export { VoyageDestinationCard } from "./cards/VoyageDestinationCard";
export { VoyageReviewCard } from "./cards/VoyageReviewCard";
export { VoyageSimilarCard } from "./cards/VoyageSimilarCard";
export { VoyageTripCard, VoyageCard } from "./cards/VoyageTripCard"; // ✅ Conforme [1]

// Éléments Communs & Utilitaires
export { VoyageBadge } from "./common/VoyageBadge";
export { VoyageEmptyState } from "./common/VoyageEmptyState";
export { VoyagePrice } from "./common/VoyagePrice";
export { VoyageRating } from "./common/VoyageRating";
export { VoyageSkeleton } from "./common/VoyageSkeleton";

// Sections de détails de Voyages
export { VoyageAmenities } from "./detail/VoyageAmenities";
export { VoyageAvailability } from "./detail/VoyageAvailability";
export { VoyageGallery } from "./detail/VoyageGallery";
export { VoyageHero } from "./detail/VoyageHero";
export { VoyageInfo } from "./detail/VoyageInfo";
export { VoyageMap } from "./detail/VoyageMap";
export { VoyageNearby } from "./detail/VoyageNearby";
export { VoyageOperator } from "./detail/VoyageOperator";
export { VoyagePolicies } from "./detail/VoyagePolicies";
export { VoyageReviews } from "./detail/VoyageReviews";
export { VoyageRoute } from "./detail/VoyageRoute";
export { VoyageSafety } from "./detail/VoyageSafety";
export { VoyageSimilar } from "./detail/VoyageSimilar";
export { VoyageStickyBar } from "./detail/VoyageStickyBar";
export { VoyageTimeline } from "./detail/VoyageTimeline";

// Tunnel de réservation
export { VoyageBookingSuccess } from "./booking/VoyageBookingSuccess";
export { VoyageBookingSummary } from "./booking/VoyageBookingSummary";
export { VoyageDigitalTicket } from "./booking/VoyageDigitalTicket";
export { VoyagePassengerForm } from "./booking/VoyagePassengerForm";
export { VoyagePaymentSheet } from "./booking/VoyagePaymentSheet";
export { VoyageSeatMap } from "./booking/VoyageSeatMap";

// Cartes d'itinéraires
export { VoyageMapControls } from "./map/VoyageMapControls";
export { VoyageMapView } from "./map/VoyageMapView";
export { VoyageRouteLine } from "./map/VoyageRouteLine";

// Galerie
export { VoyageGalleryCounter } from "./gallery/VoyageGalleryCounter";
export { VoyageGalleryGrid } from "./gallery/VoyageGalleryGrid";
export { VoyageLightbox } from "./gallery/VoyageLightbox";
