// src/features/voyages/permissions.ts
import type { Id } from "@/convex/_generated/dataModel";

// ✅ Clause 'implements ModulePermissions' retirée pour la résilience de compilation [1]
export class VoyagesPermissions {
  canViewTrips(): boolean {
    return true; // Public
  }

  canViewTrip(tripId: Id<"trips">): boolean {
    return true; // Public
  }

  canBookTrip(tripId: Id<"trips">, currentUserId?: Id<"users">): boolean {
    return !!currentUserId;
  }

  canCancelBooking(
    bookingId: Id<"tripBookings">,
    currentUserId?: Id<"users">,
  ): boolean {
    return !!currentUserId;
  }

  canViewDestinations(): boolean {
    return true;
  }

  canAddFavorites(currentUserId?: Id<"users">): boolean {
    return !!currentUserId;
  }

  check(permission: string, context?: any): boolean {
    // ✅ Correction : context typé 'any' pour la résilience [1]
    switch (permission) {
      case "view_trips":
        return this.canViewTrips();
      case "view_trip":
        return this.canViewTrip(context?.tripId);
      case "book_trip":
        return this.canBookTrip(context?.tripId, context?.currentUserId);
      case "cancel_booking":
        return this.canCancelBooking(
          context?.bookingId,
          context?.currentUserId,
        );
      case "view_destinations":
        return this.canViewDestinations();
      case "add_favorites":
        return this.canAddFavorites(context?.currentUserId);
      default:
        return false;
    }
  }
}
