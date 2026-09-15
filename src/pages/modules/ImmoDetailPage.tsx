import { View, Text, Pressable, Linking } from "react-native";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

// Composants du module immobilier (versions finales)
import {
  PropertyGallery,
  PropertyVideos,
  PropertyOwner,
  PropertyMap,
  PropertyDescription,
  PropertyFeatures,
  PropertyLocation,
  PropertyNeighborhood,
  PropertyNearby,
  PropertyReviews,
  PropertyHistory,
  PropertyVisitScheduler,
  PropertyShare,
  PropertyFavorite,
  Property360Viewer,
  PropertyVirtualTour,
  PropertyFloorPlan,
} from "@/features/immo/components";
import type { Property } from "@/features/immo/types";

// Labels et couleurs
const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  villa: "Villa",
  studio: "Studio",
  bureau: "Bureau",
  terrain: "Terrain",
  chambre: "Chambre",
  entrepot: "Entrepôt",
};

const TRANSACTION_LABELS: Record<string, string> = {
  location: "📍 À louer",
  vente: "💰 À vendre",
};

const STATUS_LABELS: Record<string, string> = {
  available: "✅ Disponible",
  rented: "🔴 Loué",
  sold: "🔴 Vendu",
  archived: "📦 Archivé",
};

const STATUS_COLORS: Record<string, string> = {
  available: "#10B981",
  rented: "#EF4444",
  sold: "#EF4444",
  archived: "#6B7280",
};

export default function ImmoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const property = useQuery(api.realestate.getProperty, { id: id as any }) as
    | Property
    | null
    | undefined;

  const trackView = useMutation(api.realestate.trackPropertyView);

  // Tracking de la vue
  useEffect(() => {
    if (property?._id) {
      trackView({ propertyId: property._id }).catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("Erreur de tracking :", error);
        }
      });
    }
  }, [property?._id, trackView]);

  // Logs de débogage
  if (property && process.env.NODE_ENV === "development") {
    console.log("🔍 ImmoDetailPage - property.images:", property.images);
    console.log("🔍 ImmoDetailPage - property:", property);
  }

  // Gestion des états de chargement
  if (!id) {
    return (
      <View className="h-full flex items-center justify-center" style={{  }}><Text className="text-white/50">ID invalide</Text></View>
    );
  }

  if (property === undefined) {
    return (
      <View className="h-full flex flex-col" style={{  }}><View className="flex-shrink-0 px-5 pt-5 pb-3"><Pressable onPress={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable></View><View className="flex-1 px-5 pb-6 space-y-4"><Skeleton className="h-64 w-full rounded-2xl" /><Skeleton className="h-12 w-3/4 rounded-2xl" /><Skeleton className="h-6 w-1/2 rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /><View className="gap-3"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></View></View></View>
    );
  }

  if (!property) {
    return (
      <View className="h-full flex flex-col items-center justify-center gap-3" style={{  }}><Pressable onPress={() => navigate(-1)} className="self-start ml-5 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="text-white/40"><Text>Bien introuvable</Text></View></View>
    );
  }

  // Extraction des données
  const statusColor = STATUS_COLORS[property.status] || "#6B7280";
  const transactionLabel =
    TRANSACTION_LABELS[property.transactionType] || property.transactionType;

  const allImages = property.images || [];
  const allVideos = property.videos || [];
  const amenities = property.amenities || [];
  const ownerName = property.ownerName;
  const ownerAvatar = property.ownerAvatar;
  // ✅ Récupérer le téléphone : on utilise property.phone ou property.ownerPhone
  // On transforme null en undefined pour correspondre au type attendu par PropertyOwner
  const phone = property.phone ?? property.ownerPhone ?? undefined;
  const ownerId = (property as any).ownerId; // si disponible
  const city = property.city || "";
  const neighborhood = property.neighborhood || null;
  const address = property.address || null;
  const latitude = property.latitude ?? undefined;
  const longitude = property.longitude ?? undefined;
  const createdAt = property._creationTime;
  const price = property.price;
  const currency = property.currency || "USD";
  const type = property.type;
  const surface = property.surface ?? null;
  const rooms = property.rooms ?? null;
  const bathrooms = property.bathrooms ?? null;
  const description = property.description || "";
  const virtualTourUrl = property.virtualTourUrl;
  const floorPlanUrl = property.floorPlanUrl;
  const tour360Images = property.tour360Images || [];

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = property.title;

  return (
    <View className="h-full flex flex-col" style={{  }}>{}<View className="flex-shrink-0 px-5 pt-5 pb-3 flex items-center gap-3"><Pressable onPress={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><Text className="text-white font-bold text-lg flex-1 truncate">{property.title}</Text></View>{}<View className="flex-1 overflow-y-auto px-5 pb-8 space-y-5"><View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">{}<View className="relative"><PropertyGallery images={allImages} title={property.title} /><View className="absolute top-3 left-3 z-10"><Text className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${statusColor}25`, color: statusColor, borderStyle: "solid" }}>{STATUS_LABELS[property.status] || property.status}</Text></View><View className="absolute top-3 right-3 z-10 flex gap-2"><PropertyFavorite propertyId={property._id} isFavorited={isLiked} onToggle={setIsLiked} /><Pressable onPress={() => setIsBookmarked(!isBookmarked)} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isBookmarked ? "#FBBF24" : "none"} stroke={isBookmarked ? "#FBBF24" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg></Pressable></View></View>{}<PropertyVideos videos={allVideos} title={property.title} />{}<View><Text className="text-xl font-bold text-white">{property.title}</Text><View className="flex items-center gap-2 mt-1 flex-wrap"><Text className="text-xs text-white/40">{TYPE_LABELS[property.type] || property.type}</Text><Text className="text-xs text-white/20">·</Text><Text className="text-xs text-orange-400">{transactionLabel}</Text>{property.neighborhood && (
                <>
                  <Text className="text-xs text-white/20">·</Text>
                  <Text className="text-xs text-white/40">
                    {property.neighborhood}
                  </Text>
                </>
              )}</View></View>{}<View><Text className="text-2xl font-black text-white">{price.toLocaleString()}{currency}{property.transactionType === "location" ? "/mois" : ""}</Text></View>{}<PropertyDescription description={description} maxLength={600} />{}<PropertyFeatures type={type} surface={surface} rooms={rooms} bathrooms={bathrooms} amenities={amenities} />{}<PropertyLocation city={city} neighborhood={neighborhood} address={address} />{}<PropertyMap city={city} address={address || undefined} latitude={latitude} longitude={longitude} />{}<PropertyNeighborhood city={city} />{}<PropertyNearby city={city} />{}<PropertyOwner ownerName={ownerName} ownerAvatar={ownerAvatar} ownerPhone={phone} ownerId={ownerId} createdAt={createdAt} rating={4.8} reviewCount={24} />{}<PropertyVisitScheduler propertyId={property._id} />{}<PropertyHistory price={price} currency={currency} createdAt={createdAt} priceHistory={[
              { date: createdAt - 86400000 * 30, price: price * 0.95 },
              { date: createdAt - 86400000 * 60, price: price * 0.97 },
            ]} />{}<View className="flex flex-wrap gap-2">{virtualTourUrl && (
              <Property360Viewer url={virtualTourUrl} title="Visite 360°" />
            )}{tour360Images.length > 0 && (
              <PropertyVirtualTour
                url={tour360Images[0]}
                title="Visite virtuelle"
              />
            )}{floorPlanUrl && (
              <PropertyFloorPlan floorPlanUrl={floorPlanUrl} title="Plan" />
            )}</View>{}<PropertyReviews reviews={[
              {
                id: "1",
                reviewerName: "Jean K.",
                rating: 5,
                comment: "Très beau bien, conforme à l'annonce.",
                date: new Date().toISOString(),
              },
              {
                id: "2",
                reviewerName: "Marie L.",
                rating: 4,
                comment: "Bon emplacement, propriétaire réactif.",
                date: new Date(Date.now() - 86400000 * 2).toISOString(),
              },
            ]} />{}<View className="pt-2 border-t border-white/5"><PropertyShare url={shareUrl} title={shareTitle} /></View>{}<View className="flex flex-wrap gap-2"><Pressable onPress={() => {
                if (phone) {
                  Linking.openURL(`tel:${phone}`);
                }
              }} className="flex-1 py-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform" style={{ backgroundColor: "rgba(16,185,129,0.2)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>Appeler
            </Pressable><Pressable onPress={() => {
                const scheduler = document.querySelector(
                  "[data-visit-scheduler]",
                ) as View;
                if (scheduler) {
                  scheduler.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }} className="flex-1 py-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform text-white" style={{  }}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>Visiter
            </Pressable></View></View></View></View>
  );
}
