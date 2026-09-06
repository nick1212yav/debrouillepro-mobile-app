import { useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  Phone,
  MessageCircle,
  ShoppingBag,
  Calendar,
  Heart,
  Share2,
  Flag,
  UserPlus,
  UserCheck,
  Loader2,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  publicationId: Id<"publications">;
  ownerId?: Id<"users">;
  phone?: string;
  isSold?: boolean;
  isReserved?: boolean;
  isFavorited?: boolean;
  isFollowing?: boolean;
  title?: string;
  onCall?: () => void;
  onMessage?: () => void;
  onBuy?: () => void;
  onReserve?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  onReport?: () => void;
}

export function AnnonceActions({
  publicationId,
  ownerId,
  phone,
  isSold,
  isReserved,
  isFavorited = false,
  isFollowing = false,
  title = "",
  onCall,
  onMessage,
  onBuy,
  onReserve,
  onFavorite,
  onShare,
  onReport,
}: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowing);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [loadingReserve, setLoadingReserve] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNote, setReportNote] = useState("");

  const followMutation = useMutation(api.social.followUser);
  const reserveMutation = useMutation(api.reservations.reservePublication);
  const cancelReservation = useMutation(api.reservations.cancelReservation);
  const reportMutation = useMutation(api.reports.reportPublication);
  const incrementShare = useMutation(api.publications.incrementShare);

  // ✅ Suivre
  const handleFollow = async () => {
    if (!ownerId) return;
    setLoadingFollow(true);
    try {
      const { followed } = await followMutation({ targetUserId: ownerId });
      setFollowing(followed);
      UIService.openToast(followed ? "Vendeur suivi !" : "Vendeur retiré des abonnements", "success");
    } catch {
      UIService.openToast("Erreur lors du suivi", "error");
    } finally {
      setLoadingFollow(false);
    }
  };

  // ✅ Réserver
  const handleReserve = async () => {
    if (!ownerId) return;
    setLoadingReserve(true);
    try {
      await reserveMutation({
        publicationId,
        message: `Je souhaite réserver : ${title}`,
      });
      UIService.openToast("Demande de réservation envoyée !", "success");
      onReserve?.();
    } catch (error) {
      UIService.openToast(error instanceof Error
          ? error.message
          : "Erreur lors de la réservation", "error");
    } finally {
      setLoadingReserve(false);
    }
  };

  // ✅ Annuler réservation
  const handleCancelReservation = async () => {
    try {
      await cancelReservation({ publicationId });
      UIService.openToast("Réservation annulée", "success");
    } catch (error) {
      UIService.openToast(error instanceof Error ? error.message : "Erreur lors de l'annulation", "error");
    }
  };

  // ✅ Message
  const handleMessage = async () => {
    if (!ownerId) return;
    try {
      router.push(`/messages/new?userId=${ownerId}&publicationId=${publicationId}&title=${encodeURIComponent(title)}`);
    } catch {
      UIService.openToast("Erreur lors de l'ouverture de la conversation", "error");
    }
  };

  // ✅ Partager (avec incrémentation du compteur)
  const handleShare = async () => {
    try {
      await incrementShare({ publicationId });
    } catch {
      // Silencieux : le compteur n'est pas critique
    }

    if (undefined) {
      try {
        await undefined;
        UIService.openToast("Annonce partagée !", "success");
      } catch {
        // Utilisateur a annulé
      }
    } else {
      try {
        await undefined?.writeText(undefined.href);
        UIService.openToast("Lien copié dans le presse-papier", "info");
      } catch {
        UIService.openToast("Impossible de copier le lien", "error");
      }
    }
    onShare?.();
  };

  // ✅ Signaler
  const handleOpenReport = () => {
    setReportModalOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason) {
      UIService.openToast("Veuillez sélectionner un motif", "error");
      return;
    }
    try {
      await reportMutation({
        publicationId,
        reason: reportReason as any,
        note: reportNote || undefined,
      });
      UIService.openToast("Signalement envoyé. Merci pour votre vigilance.", "success");
      setReportModalOpen(false);
      setReportReason("");
      setReportNote("");
      onReport?.();
    } catch {
      UIService.openToast("Erreur lors du signalement", "error");
    }
  };

  const isAvailable = !isSold && !isReserved;

  return (
    <>
      <View className="flex flex-wrap gap-2">
        {phone && (
          <Pressable
            onPress={onCall}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm"
            style={{ backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.15)", borderStyle: "solid" }}
          >
            <Phone size={16} /> <Text>Appeler</Text></Pressable>
        )}

        {ownerId && (
          <Pressable
            onPress={handleMessage}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm"
            style={{ backgroundColor: "rgba(59,130,246,0.15)", borderWidth: 1, borderColor: "rgba(59,130,246,0.15)", borderStyle: "solid" }}
          >
            <MessageCircle size={16} /> <Text>Message</Text></Pressable>
        )}

        {isAvailable ? (
          <>
            <Pressable
              onPress={onBuy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-white"
              style={{  }}
            >
              <ShoppingBag size={16} /> <Text>Acheter</Text></Pressable>
            <Pressable
              onPress={handleReserve}
              disabled={loadingReserve}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm disabled:opacity-50"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
            >
              {loadingReserve ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Calendar size={16} />
              )}
              {loadingReserve ? "..." : "Réserver"}
            </Pressable>
          </>
        ) : (
          <>
            {isReserved && !isSold && (
              <View className="w-full flex gap-2">
                <View className="flex-1 text-center text-amber-400 text-sm font-medium py-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Text>🔒 En réservation</Text></View>
                <Pressable
                  onPress={handleCancelReservation}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-red-400"
                >
                  <Text>Annuler</Text></Pressable>
              </View>
            )}
            {isSold && (
              <View className="w-full text-center text-red-400 text-sm font-medium py-2 bg-red-500/10 rounded-xl border border-red-500/20">
                <Text>❌ Vendu</Text></View>
            )}
          </>
        )}

        {/* Actions secondaires */}
        <View className="flex flex-wrap gap-2 w-full pt-2 border-t border-white/5">
          <Pressable
            onPress={onFavorite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ backgroundColor: isFavorited
                            ? "rgba(244,63,94,0.15)"
                            : "rgba(255,255,255,0.05)" }}
          >
            <Heart size={14} className={isFavorited ? "fill-red-500" : ""} />
            {isFavorited ? "Favori" : "Ajouter"}
          </Pressable>

          <Pressable
            onPress={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <Share2 size={14} /> <Text>Partager</Text></Pressable>

          {ownerId && (
            <Pressable
              onPress={handleFollow}
              disabled={loadingFollow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50"
              style={{ backgroundColor: following
                                ? "rgba(16,185,129,0.15)"
                                : "rgba(255,255,255,0.05)" }}
            >
              {loadingFollow ? (
                <Loader2 size={14} className="animate-spin" />
              ) : following ? (
                <UserCheck size={14} />
              ) : (
                <UserPlus size={14} />
              )}
              {loadingFollow ? "..." : following ? "Suivi" : "Suivre"}
            </Pressable>
          )}

          <Pressable
            onPress={handleOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/30 ml-auto"
            style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <Flag size={14} /> <Text>Signaler</Text></Pressable>
        </View>
      </View>

      {/* Modal de signalement */}
      {reportModalOpen && (
        <Pressable
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onPress={() => setReportModalOpen(false)}
        >
          <Pressable
            className="bg-[#0D1117] rounded-2xl p-6 max-w-md w-full border border-white/10"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-white font-bold text-lg mb-4">
              Signaler l'annonce
            </Text>
            <View className="space-y-3">
              <Picker
               
                onValueChange={(val) => setReportReason(val)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
               selectedValue={reportReason}>
                <Picker.Item label="Motif du signalement" value="" />
                <Picker.Item label="Spam" value="spam" />
                <Picker.Item label="Contenu inapproprié" value="inappropriate" />
                <Picker.Item label="Fausse annonce" value="fake" />
                <Picker.Item label="Harcèlement" value="harassment" />
                <Picker.Item label="Autre" value="other" />
              </Picker>
              <TextInput
                value={reportNote}
                onChangeText={(text) => setReportNote(text)}
                placeholder="Détails (optionnel)"
               
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
               multiline textAlignVertical="top"/>
              <View className="flex gap-2">
                <Pressable
                  onPress={() => setReportModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-white/60 font-medium"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <Text>Annuler</Text></Pressable>
                <Pressable
                  onPress={handleSubmitReport}
                  disabled={!reportReason}
                  className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-50"
                  style={{  }}
                >
                  <Text>Signaler</Text></Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      )}
    </>
  );
}
