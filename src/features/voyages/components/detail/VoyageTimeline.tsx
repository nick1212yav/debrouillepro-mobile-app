// src/features/voyages/components/detail/VoyageTimeline.tsx
// Note : ce composant est une extension pour plus tard (escales).
// Actuellement, il affiche simplement le trajet de base.
import { VoyageRoute } from "./VoyageRoute";
import type { VoyageTrip } from "../../types";

interface VoyageTimelineProps {
  trip: VoyageTrip;
}

export function VoyageTimeline({ trip }: VoyageTimelineProps) {
  return <VoyageRoute trip={trip} />;
}
