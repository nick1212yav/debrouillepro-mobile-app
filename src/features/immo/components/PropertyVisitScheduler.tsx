import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { Calendar, Clock, Loader2, CheckCircle } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  /** ID Convex de la propriété (typé pour la sécurité) */
  propertyId: Id<"properties">;
  /** Callback optionnel déclenché après l'envoi réussi */
  onSuccess?: () => void;
}

/**
 * Planificateur de visite
 * - Permet de choisir une date et une heure
 - Envoie la demande via Convex (mutation api.realestate.createPropertyRequest)
 - Affiche un état de succès après l'envoi
 * - Validation : date future, champs obligatoires
 */
export function PropertyVisitScheduler({ propertyId, onSuccess }: Props) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const requestVisit = useMutation(api.realestate.createPropertyRequest);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = date && time;

  const handleSubmit = async () => {
    // Validations
    if (!date || !time) {
      UIService.openToast("Veuillez sélectionner une date et une heure", "error");
      return;
    }

    const visitDateTime = new Date(`${date}T${time}:00`);
    if (visitDateTime < new Date()) {
      UIService.openToast("La date de visite doit être dans le futur", "error");
      return;
    }

    // Limiter la longueur du message (optionnel)
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 500) {
      UIService.openToast("Le message ne peut pas dépasser 500 caractères", "error");
      return;
    }

    setIsLoading(true);
    try {
      await requestVisit({
        propertyId,
        message: trimmedMessage || "Demande de visite",
        visitDate: visitDateTime.toISOString(),
      });

      UIService.openToast("Demande de visite envoyée avec succès !", "success");
      setIsSubmitted(true);
      // Réinitialiser le formulaire
      setDate("");
      setTime("");
      setMessage("");
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de l'envoi :", error);
      // Affichage d'une erreur plus parlante
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue, veuillez réessayer";
      UIService.openToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // État de succès
  if (isSubmitted) {
    return (
      <View
        className="bg-white/5 rounded-2xl p-6 text-center space-y-3"
        data-visit-scheduler
      >
        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto animate-in fade-in" />
        <Text className="text-white font-medium">Demande envoyée !</Text>
        <Text className="text-white/50 text-sm">
          L'agence vous contactera pour confirmer la visite.
        </Text>
        <Pressable
          onPress={() => setIsSubmitted(false)}
          className="text-sm text-orange-400"
        >
          <Text>Envoyer une autre demande</Text></Pressable>
      </View>
    );
  }

  // Formulaire
  return (
    <View className="bg-white/5 rounded-2xl p-4 space-y-3" data-visit-scheduler>
      <Text className="text-sm font-medium text-white/70">
        Planifier une visite
      </Text>

      {/* Date */}
      <View>
        <Text className="text-xs text-white/40">Date *</Text>
        <View className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          <Calendar size={14} className="text-white/30" />
          <TextInput
           
            value={date}
            onChangeText={(text) => setDate(text)}
            min={new Date().toISOString().split("T")[0]}
            className="flex-1 bg-transparent text-white text-sm outline-none"
           />
        </View>
      </View>

      {/* Heure */}
      <View>
        <Text className="text-xs text-white/40">Heure *</Text>
        <View className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          <Clock size={14} className="text-white/30" />
          <TextInput
           
            value={time}
            onChangeText={(text) => setTime(text)}
            className="flex-1 bg-transparent text-white text-sm outline-none"
           />
        </View>
      </View>

      {/* Message */}
      <View>
        <Text className="text-xs text-white/40">
          Message <Text className="text-white/20">(optionnel)</Text>
        </Text>
        <TextInput
          value={message}
          onChangeText={(text) => setMessage(text)}
          placeholder="Ajoutez un message..."
         
          maxLength={500}
          className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 outline-none"
         multiline textAlignVertical="top"/>
        <Text className="text-[10px] text-white/20 text-right mt-0.5">
          {message.length}<Text>/500</Text></Text>
      </View>

      {/* Bouton d'envoi */}
      <Pressable
        onPress={handleSubmit}
        disabled={isLoading || !isFormValid}
        className="w-full py-3 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
        style={{  }}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin mx-auto" />
        ) : (
          "Envoyer la demande"
        )}
      </Pressable>

      <Text className="text-[10px] text-white/30 text-center mt-2">
        <Text>* Champs obligatoires</Text></Text>
    </View>
  );
}
