import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  Gavel,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface Offer {
  _id: Id<"publicationOffers">;
  publicationId: Id<"publications">;
  buyerId: Id<"users">;
  amount: number;
  message: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  counterAmount?: number;
  createdAt: number;
  buyerName: string;
  currency?: string;
}

interface Props {
  publicationId: Id<"publications">;
  canMakeOffer?: boolean;
  canManage?: boolean;
}

export function AnnonceOffers({
  publicationId,
  canMakeOffer = true,
  canManage = false,
}: Props) {
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [counterAmount, setCounterAmount] = useState<{ [key: string]: string }>(
    {},
  );
  const [showCounterInput, setShowCounterInput] = useState<string | null>(null);

  // ✅ Queries & Mutations
  const offersData = useQuery(api.annonceOffers.listOffersForPublication, {
    publicationId,
  });
  const createOffer = useMutation(api.annonceOffers.createOffer);
  const updateOfferStatus = useMutation(api.annonceOffers.updateOfferStatus);

  // ✅ Créer une offre
  const handleMakeOffer = async () => {
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) {
      UIService.openToast("Veuillez entrer un montant valide", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await createOffer({
        publicationId,
        amount,
        message: offerMessage.trim() || undefined,
      });
      UIService.openToast("Offre envoyée !", "success");
      setOfferAmount("");
      setOfferMessage("");
    } catch (error) {
      UIService.openToast(error instanceof Error ? error.message : "Erreur lors de l'envoi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Mettre à jour le statut d'une offre (accepter, refuser, contre-offre)
  const handleStatusUpdate = async (
    offerId: Id<"publicationOffers">,
    status: "accepted" | "rejected" | "countered",
    amount?: number,
  ) => {
    try {
      await updateOfferStatus({ offerId, status, counterAmount: amount });
      const label =
        status === "accepted"
          ? "acceptée"
          : status === "rejected"
            ? "refusée"
            : "contre-offre envoyée";
      UIService.openToast(`Offre ${label}`, "success");
      setShowCounterInput(null);
      setCounterAmount({});
    } catch (error) {
      UIService.openToast(error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour", "error");
    }
  };

  // ✅ Soumettre une contre-offre
  const handleSubmitCounter = async (offerId: string) => {
    const amount = parseFloat(counterAmount[offerId]);
    if (!amount || amount <= 0) {
      UIService.openToast("Veuillez entrer un montant valide", "error");
      return;
    }
    await handleStatusUpdate(
      offerId as Id<"publicationOffers">,
      "countered",
      amount,
    );
  };

  if (offersData === undefined) {
    return (
      <View className="text-white/40 text-sm"><Text>Chargement des offres...</Text></View>
    );
  }

  const offers: Offer[] = offersData.map((o: any) => ({
    ...o,
    currency: "USD",
  }));

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <Gavel size={16} className="text-white/30" />
        <Text className="text-sm font-medium text-white/50">Offres</Text>
        <Text className="text-xs text-white/30">({offers.length})</Text>
      </View>

      {/* Liste des offres */}
      <View className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {offers.length === 0 ? (
          <Text className="text-white/30 text-sm italic">
            Aucune offre pour le moment
          </Text>
        ) : (
          offers.map((offer) => {
            const statusLabel =
              offer.status === "pending"
                ? "En attente"
                : offer.status === "accepted"
                  ? "Acceptée"
                  : offer.status === "rejected"
                    ? "Refusée"
                    : "Contre-offre";
            const statusColor =
              offer.status === "pending"
                ? "#F59E0B"
                : offer.status === "accepted"
                  ? "#10B981"
                  : offer.status === "rejected"
                    ? "#EF4444"
                    : "#6366F1";
            const isPending = offer.status === "pending";
            const showCounter = showCounterInput === offer._id;

            return (
              <View
                key={offer._id}
                className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <View className="flex items-center gap-3">
                  <User size={16} className="text-white/30" />
                  <View className="flex-1 min-w-0">
                    <View className="flex items-center gap-2">
                      <Text className="text-white/80 text-sm font-medium">
                        {offer.buyerName}
                      </Text>
                      <Text className="text-white/20 text-xs">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="text-white font-bold text-sm">
                      {formatPrice(offer.amount, offer.currency || "USD")}
                    </Text>
                    {offer.message && (
                      <Text className="text-white/40 text-xs truncate">
                        {offer.message}
                      </Text>
                    )}
                  </View>
                  <View className="flex items-center gap-2">
                    <Text
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Actions pour le vendeur (gestion des offres) */}
                {canManage && isPending && (
                  <View className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                    <Pressable
                      onPress={() => handleStatusUpdate(offer._id, "accepted")}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10"
                    >
                      <CheckCircle size={12} /> <Text>Accepter</Text></Pressable>
                    <Pressable
                      onPress={() => handleStatusUpdate(offer._id, "rejected")}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-red-400 bg-red-500/10"
                    >
                      <XCircle size={12} /> <Text>Refuser</Text></Pressable>
                    <Pressable
                      onPress={() => {
                        setShowCounterInput(showCounter ? null : offer._id);
                        if (!showCounter) setCounterAmount({});
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10"
                    >
                      <AlertCircle size={12} /> <Text>Contre-offre</Text></Pressable>

                    {/* Champ de contre-offre */}
                    {showCounter && (
                      <View className="flex items-center gap-2 w-full mt-1">
                        <TextInput
                         
                          value={counterAmount[offer._id] || ""}
                          onChangeText={(text) =>
                            setCounterAmount((prev) => ({
                              ...prev,
                              [offer._id]: text,
                            }))
                          }
                          placeholder="Montant de la contre-offre"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/30"
                         keyboardType="numeric"/>
                        <Pressable
                          onPress={() => handleSubmitCounter(offer._id)}
                          disabled={!counterAmount[offer._id]}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-500/20 disabled:opacity-50"
                        >
                          <Text>Envoyer</Text></Pressable>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Faire une offre */}
      {canMakeOffer && (
        <View className="space-y-2 pt-2 border-t border-white/5">
          <View className="flex gap-2">
            <View className="flex-1">
              <TextInput
               
                value={offerAmount}
                onChangeText={(text) => setOfferAmount(text)}
                placeholder="Montant de l'offre"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/30"
               
               keyboardType="numeric" editable={!(isSubmitting)}/>
            </View>
            <Pressable
              onPress={handleMakeOffer}
              disabled={!offerAmount || isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{  }}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Offrir"
              )}
            </Pressable>
          </View>
          <TextInput
            value={offerMessage}
            onChangeText={(text) => setOfferMessage(text)}
            placeholder="Message (optionnel)"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/30"
           
           editable={!(isSubmitting)}/>
        </View>
      )}
    </View>
  );
}
