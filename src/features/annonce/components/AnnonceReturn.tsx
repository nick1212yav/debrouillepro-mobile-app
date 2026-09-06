import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react-native";

interface Props {
  orderId: string;
  onBack?: () => void;
  onSubmit?: (data: ReturnData) => Promise<void>;
}

export interface ReturnData {
  reason: string;
  description: string;
  items: { id: string; quantity: number }[];
  photos?: string[];
}

const RETURN_REASONS = [
  "Produit défectueux",
  "Produit non conforme",
  "Produit endommagé",
  "Erreur de livraison",
  "Commande annulée",
  "Autre",
];

export function AnnonceReturn({ orderId, onBack, onSubmit }: Props) {
  const [step, setStep] = useState<"form" | "success" | "error">("form");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      UIService.openToast("Veuillez sélectionner un motif", "error");
      return;
    }
    setLoading(true);
    try {
      await onSubmit?.({
        reason,
        description,
        items: [], // à remplir avec les articles concernés
      });
      setStep("success");
      UIService.openToast("Demande de retour envoyée", "success");
    } catch {
      setStep("error");
      UIService.openToast("Erreur lors de l'envoi", "error");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <View className="text-center py-8 space-y-3">
        <CheckCircle size={48} className="text-emerald-400 mx-auto" />
        <Text className="text-white font-bold text-lg">
          Demande de retour envoyée
        </Text>
        <Text className="text-white/50 text-sm">
          Vous recevrez une confirmation par email sous 24h.
        </Text>
        <Pressable
          onPress={onBack}
          className="text-orange-400 text-sm"
        >
          <Text>Retour à la commande</Text></Pressable>
      </View>
    );
  }

  if (step === "error") {
    return (
      <View className="text-center py-8 space-y-3">
        <XCircle size={48} className="text-red-400 mx-auto" />
        <Text className="text-white font-bold text-lg">Une erreur est survenue</Text>
        <Text className="text-white/50 text-sm">
          Veuillez réessayer ou contacter le support.
        </Text>
        <Pressable
          onPress={() => setStep("form")}
          className="px-6 py-2 rounded-xl text-white font-medium"
          style={{  }}
        >
          <Text>Réessayer</Text></Pressable>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      <View className="flex items-center gap-3">
        <Pressable
          onPress={onBack}
          className="text-white/40"
        >
          <ArrowLeft size={18} />
        </Pressable>
        <Text className="text-white font-bold text-lg">Demander un retour</Text>
      </View>

      <View className="space-y-3">
        <View>
          <Text className="text-xs text-white/40 block mb-1">
            Motif du retour *
          </Text>
          <Picker
           
            onValueChange={(val) => setReason(val)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
           selectedValue={reason}>
            <Picker.Item label="Sélectionner un motif" value="" />
            {RETURN_REASONS.map((r) => (
              <Picker.Item label={`${r}`} value={r} />
            ))}
          </Picker>
        </View>

        <View>
          <Text className="text-xs text-white/40 block mb-1">
            Description du problème
          </Text>
          <TextInput
            value={description}
            onChangeText={(text) => setDescription(text)}
            placeholder="Décrivez le problème en détail..."
           
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
           multiline textAlignVertical="top"/>
        </View>

        <View className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
          <AlertCircle
            size={16}
            className="text-amber-400 flex-shrink-0 mt-0.5"
          />
          <Text className="text-amber-400/70 text-xs">
            <Text>Le retour est possible sous 14 jours après réception. Les frais de retour peuvent être à votre charge.</Text></Text>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
          style={{  }}
        >
          {loading ? "Envoi..." : "Envoyer la demande"}
        </Pressable>
      </View>
    </View>
  );
}
