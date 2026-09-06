import { useLocalSearchParams, useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";

// src/features/restauration/pages/RestaurationDetailPage.tsx
import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  X,
  Calendar,
  ShoppingBag,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react-native";

// Types
import type { Publication } from "@/features/publications/types";
import type { Id } from "@/convex/_generated/dataModel";
import type { MenuItem } from "../types/menu.types";

// Hooks
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../hooks/useFavorites";
import { useReservation } from "../hooks/useReservation";
import { usePayment } from "../hooks/usePayment";

// Composants de détail
import {
  RestaurantHeader,
  RestaurantGallery,
  RestaurantHero,
  RestaurantInfo,
  RestaurantHours,
  RestaurantLocation,
  RestaurantMap,
  RestaurantMenu,
  RestaurantChef,
  RestaurantTeam,
  RestaurantReviews,
  RestaurantReviewStats,
  RestaurantQuestions,
  RestaurantPromotions,
  RestaurantEvents,
  RestaurantVideos,
  RestaurantStories,
  RestaurantLive,
  RestaurantSimilar,
  RestaurantNearby,
  RestaurantReservation,
  RestaurantDeliveryTracking,
  RestaurantSocialActions,
  RestaurantStickyBar,
} from "../components/detail";

// Formulaires
import { ReservationForm } from "../components/reservation/ReservationForm";
import { ReservationConfirmation } from "../components/reservation/ReservationConfirmation";
import { PaymentMethods } from "../components/payment/PaymentMethods";
import { OrderSummary } from "../components/order/OrderSummary";
import { PaymentForm } from "../forms/PaymentForm";

// Utilitaire pour parser les métadonnées
function parseMeta(meta: any): any {
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta);
    } catch {
      return {};
    }
  }
  return meta || {};
}

// Convertit une publication en objet restaurant
// ✅ Accepte un type flexible (car getPublication ajoute des champs)
function publicationToRestaurant(pub: any) {
  const meta = parseMeta(pub.meta);
  return {
    _id: pub._id,
    name: pub.title || "Restaurant",
    cuisine: meta.cuisine || "",
    location: meta.location || pub.location || "",
    priceRange: meta.priceRange || "",
    deliveryTime: meta.deliveryTime || "",
    deliveryFee: meta.deliveryFee ?? 1500,
    image: pub.images && pub.images.length > 0 ? pub.images[0] : "",
    gallery: pub.images || [],
    tags: pub.tags || [],
    open: meta.isOpen ?? true,
    openingHours:
      typeof meta.openingHours === "string"
        ? meta.openingHours
        : "Lun-Sam 08:00 - 22:00",
    minOrder: meta.minOrder ?? 2000,
    speciality: meta.speciality || "",
    description: pub.description || "",
    rating: meta.rating ?? 4.5,
    reviewsCount: meta.reviewCount ?? 0,
    menu: meta.menu || [],
    schedules: meta.schedules || [],
    chef: meta.chef || null,
    team: meta.team || [],
    deliveryAreas: meta.deliveryAreas || [],
    hasDelivery: meta.hasDelivery ?? true,
    hasTakeaway: meta.hasTakeaway ?? true,
    hasDineIn: meta.hasDineIn ?? true,
    hasReservation: meta.hasReservation ?? false,
    ownerId: pub.authorId,
    createdAt: pub._creationTime,
    updatedAt: pub._creationTime,
  };
}

export default function RestaurationDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ✅ Correction du type de l'ID pour Convex
  const publicationId = id as Id<"publications"> | undefined;

  const publication = useQuery(
    api.publications.getPublication,
    publicationId ? { id: publicationId } : "skip",
  );
  const isLoading = publication === undefined;
  const error = publication === null ? "Publication introuvable" : null;

  // Construction de l'objet restaurant à partir de la publication
  const restaurant = useMemo(() => {
    if (!publication) return null;
    if (publication.type !== "restauration") {
      return null;
    }
    // publication contient maintenant les champs supplémentaires (author, etc.)
    return publicationToRestaurant(publication);
  }, [publication]);

  // Hooks de gestion (panier, favoris, réservation, paiement)
  const {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal,
    cartItemsCount,
  } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { reserveTable, isProcessing: isReserving } = useReservation();
  const { processPayment, isProcessing: isPaying } = usePayment();

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("mobile_money");

  const handleBack = useCallback(() => router(-1), [router]);

  const handleToggleFav = useCallback(async () => {
    if (!restaurant) return;
    // ✅ Cast de l'ID (les hooks attendent un nombre, mais nous avons un string)
    const isAdded = await toggleFavorite(restaurant._id as any);
    UIService.openToast(isAdded
        ? "Restaurant ajouté à vos favoris"
        : "Restaurant retiré de vos favoris", "success");
  }, [restaurant, toggleFavorite]);

  const handleShare = useCallback(() => {
    if (undefined && restaurant) {
      undefined
        .catch(() => UIService.openToast("Lien partagé !", "success"));
    } else {
      undefined.writeText(undefined.href);
      UIService.openToast("Lien copié !", "success");
    }
  }, [restaurant]);

  const handleBookingSubmit = async (data: any) => {
    if (!restaurant) return;
    // ✅ Cast de l'ID pour correspondre à l'attente du hook (number)
    const response = await reserveTable({
      restaurantId: restaurant._id as any,
      userId: "USER_CURRENT_REACTIVE_ID",
      bookingDate: data.date,
      bookingTime: data.time,
      guestsCount: data.guests,
      section: data.section,
      specialRequest: data.specialRequest,
    });
    if (response.success && response.reservation) {
      setConfirmedBooking(response.reservation);
    } else {
      UIService.openToast("Échec de la réservation.", "error");
    }
  };

  const handlePaymentSubmit = async (paymentDetails: any) => {
    if (!restaurant) return;
    const orderItems = Object.values(cart).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));
    const response = await processPayment({
      orderId: `ORD-${Date.now().toString().slice(-5)}`,
      clientName: "Client",
      clientEmail: "client@debrouillepro.com",
      restaurantName: restaurant.name,
      items: orderItems,
      deliveryFee: restaurant.deliveryFee || 0,
      paymentMethod: selectedPaymentMethod as any,
      paymentDetails,
    });
    if (response.success) {
      UIService.openToast("Commande payée avec succès !", "success");
      clearCart();
      setShowCheckoutModal(false);
    } else {
      UIService.openToast(response.errorMessage || "Erreur de paiement.", "error");
    }
  };

  if (isLoading) {
    return (
      <View className="h-full flex items-center justify-center text-white/50 text-xs">
        <Text>Chargement du restaurant...</Text></View>
    );
  }

  if (error || !restaurant) {
    return (
      <View className="h-full flex flex-col items-center justify-center gap-4 text-white/50 text-xs px-4">
        <UtensilsCrossed size={48} className="text-white/20" />
        <Text>{error || "Restaurant introuvable."}</Text>
        <Pressable
          onPress={handleBack}
          className="px-4 py-2 bg-white/5 rounded-xl text-white"
        >
          <Text>Retour</Text></Pressable>
      </View>
    );
  }

  return (
    <View className="h-full flex flex-col relative overflow-hidden bg-[#020617]">
      <RestaurantHeader
        onBack={handleBack}
        // ✅ Cast pour isFavorite
        isFavorite={isFavorite(restaurant._id as any)}
        onToggleFavorite={handleToggleFav}
        onShare={handleShare}
      />

      <View className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        <RestaurantHero
          image={restaurant.image}
          name={restaurant.name}
          tags={restaurant.tags}
          open={restaurant.open}
        />

        <RestaurantInfo
          name={restaurant.name}
          cuisine={restaurant.cuisine}
          description={restaurant.description}
          rating={restaurant.rating}
          reviewsCount={restaurant.reviewsCount}
        />

        <RestaurantSocialActions />
        <RestaurantStories />
        <RestaurantLive />
        <RestaurantPromotions />
        <RestaurantLocation location={restaurant.location} />
        <RestaurantHours
          openingHours={restaurant.openingHours}
          schedules={restaurant.schedules}
        />

        <RestaurantReservation
          onOpenBooking={() => {
            setConfirmedBooking(null);
            setShowBookingModal(true);
          }}
        />

        <RestaurantMap location={restaurant.location} />

        <RestaurantMenu
          categories={restaurant.menu}
          cart={cart}
          onAddToCart={addToCart}
          onRemoveFromCart={removeFromCart}
        />

        <RestaurantGallery images={restaurant.gallery} />
        <RestaurantVideos />
        <RestaurantEvents />
        <RestaurantChef chef={restaurant.chef} />
        <RestaurantTeam />
        <RestaurantDeliveryTracking />
        <RestaurantReviews />
        <RestaurantQuestions />
        <RestaurantSimilar />
        <RestaurantNearby />
      </View>

      <RestaurantStickyBar
        totalAmount={cartTotal + (restaurant.deliveryFee || 0)}
        itemsCount={cartItemsCount}
        onCheckout={() => setShowCheckoutModal(true)}
      />

      {/* Modales réservation et paiement (inchangées) */}
      <>
        {showBookingModal && (
          <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
            <View
              className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[85vh] overflow-y-auto no-scrollbar"
              style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", borderTopStyle: "solid" }}
            >
              {confirmedBooking ? (
                <ReservationConfirmation
                  bookingId={confirmedBooking.id}
                  tableNumber={confirmedBooking.tableNumber}
                  restaurantName={restaurant.name}
                  date={confirmedBooking.bookingDate}
                  time={confirmedBooking.bookingTime}
                  guestsCount={confirmedBooking.guestsCount}
                  section={confirmedBooking.section}
                  onClose={() => setShowBookingModal(false)}
                />
              ) : (
                <View className="space-y-4">
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2 text-emerald-400">
                      <Calendar />
                      <Text className="font-extrabold text-sm uppercase tracking-wider">
                        Planifier une table
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setShowBookingModal(false)}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50"
                    >
                      <X size={15} />
                    </Pressable>
                  </View>
                  <ReservationForm
                    onSubmit={handleBookingSubmit}
                    isSubmitting={isReserving}
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </>

      <>
        {showCheckoutModal && (
          <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/75">
            <View
              className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar"
              style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", borderTopStyle: "solid" }}
            >
              <View className="flex items-center justify-between mb-4">
                <View className="flex items-center gap-2 text-orange-500">
                  <ShoppingBag />
                  <Text className="font-black text-sm uppercase tracking-wider">
                    Finaliser ma commande
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowCheckoutModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50"
                >
                  <X size={15} />
                </Pressable>
              </View>

              <View className="mb-4">
                <OrderSummary
                  items={Object.values(cart).map((i) => ({
                    name: i.name,
                    quantity: i.quantity,
                    unitPrice: i.price,
                  }))}
                  subtotal={cartTotal}
                  deliveryFee={restaurant.deliveryFee || 0}
                  tax={Math.round(cartTotal * 0.05)}
                  total={
                    cartTotal +
                    (restaurant.deliveryFee || 0) +
                    Math.round(cartTotal * 0.05)
                  }
                />
              </View>

              <View className="mb-4">
                <PaymentMethods
                  selectedMethod={selectedPaymentMethod}
                  onChange={setSelectedPaymentMethod}
                  totalAmount={
                    cartTotal +
                    (restaurant.deliveryFee || 0) +
                    Math.round(cartTotal * 0.05)
                  }
                />
              </View>

              {selectedPaymentMethod !== "cash" && (
                <View className="mb-2">
                  <PaymentForm
                    gateway={selectedPaymentMethod as any}
                    amount={
                      cartTotal +
                      (restaurant.deliveryFee || 0) +
                      Math.round(cartTotal * 0.05)
                    }
                    onSubmit={handlePaymentSubmit}
                    isSubmitting={isPaying}
                  />
                </View>
              )}

              {selectedPaymentMethod === "cash" && (
                <Pressable
                  onPress={() => handlePaymentSubmit({})}
                  disabled={isPaying}
                  className="w-full py-4 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
                  style={{  }}
                >
                  <ShieldCheck size={14} />
                  {isPaying ? "Traitement..." : "Confirmer et Payer en Espèces"}
                </Pressable>
              )}
            </View>
          </View>
        )}
      </>
    </View>
  );
}
