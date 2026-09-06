import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";
import type { Id } from "@/convex/_generated/dataModel";

// Abstraction native sécurisée pour remplacer "sonner" (web-only)
const toast = {
  success: (msg: string) => Alert.alert("Succès", msg),
  error: (msg: string) => Alert.alert("Erreur", msg),
};

export default function CheckoutPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useFirebaseAuth();

  const productId = params.product as Id<"products"> | null;
  const quantityRaw = Array.isArray(params.quantity)
    ? params.quantity[0]
    : params.quantity;
  const quantity = parseInt(quantityRaw || "1", 10);

  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"address" | "confirm" | "done">("address");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer le produit
  const product = useQuery(
    api.commerce.getProduct,
    productId ? { id: productId } : "skip",
  );

  const createOrder = useMutation(api.commerce.createOrder);
  const clearCart = useMutation(api.commerce.clearCart);

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Afficher une alerte ou rediriger
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 flex-col items-center justify-center px-4 gap-4 bg-slate-950">
        <Text className="text-white font-bold text-xl">Connexion requise</Text>
        <Text className="text-white/50 text-sm text-center">
          Connectez-vous pour finaliser votre achat
        </Text>
        <SignInButton />
        <TouchableOpacity onPress={() => router.back()} className="mt-2">
          <Text className="text-white/40 text-sm">← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 flex-col items-center justify-center px-4 bg-slate-950">
        <TouchableOpacity
          onPress={() => router.back()}
          className="self-start mb-4"
        >
          <ArrowLeft size={24} className="text-white/60" />
        </TouchableOpacity>
        <Text className="text-white/40">Produit introuvable</Text>
      </View>
    );
  }

  const total = product.price * quantity;

  const handleOrder = async () => {
    if (!address.trim()) {
      toast.error("Veuillez renseigner une adresse de livraison");
      return;
    }
    setIsSubmitting(true);
    try {
      await createOrder({
        productId: product._id,
        quantity,
        deliveryAddress: address,
        note: note.trim() || undefined,
      });
      await clearCart();
      setStep("done");
      toast.success("Commande confirmée !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la commande");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <View className="flex-1 flex-col items-center justify-center px-4 bg-slate-950">
        <View className="mb-4">
          <CheckCircle2 size={56} className="text-green-400" />
        </View>
        <Text className="text-white font-bold text-xl mb-2 text-center">
          Commande confirmée !
        </Text>
        <Text className="text-white/50 text-sm mb-6 text-center">
          Vous recevrez une notification dès que le vendeur confirme.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/marketplace")}
          className="px-6 py-3 rounded-xl bg-orange-500"
        >
          <Text className="text-white font-medium">Retour à la boutique</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 32,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} className="text-white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">
          Finaliser la commande
        </Text>
      </View>

      {step === "address" ? (
        <View className="flex-1 flex-col">
          <View className="space-y-4 flex-1 mb-6">
            <View className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Text className="text-white font-semibold mb-2">Résumé</Text>
              <Text className="text-white/80">
                {product.title} × {quantity}
              </Text>
              <Text className="text-orange-400 font-bold text-lg mt-1">
                {total.toLocaleString()} {product.currency}
              </Text>
            </View>

            <View>
              <Text className="text-xs text-white/50 mb-1">
                Adresse de livraison *
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Quartier, rue, numéro, ville..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: "top" }}
                className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10"
              />
            </View>

            <View>
              <Text className="text-xs text-white/50 mb-1">
                Note pour le vendeur
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Instructions spéciales..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setStep("confirm")}
            disabled={!address.trim()}
            style={{ opacity: address.trim() ? 1 : 0.5 }}
            className="w-full py-4 rounded-xl bg-orange-500"
          >
            <Text className="text-center font-bold text-white text-base">
              Continuer
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1 flex-col">
          <View className="flex-1 space-y-4 mb-6">
            <View className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Text className="text-white font-semibold mb-2">
                Récapitulatif
              </Text>
              <View className="space-y-2">
                <View className="flex-row justify-between text-sm">
                  <Text className="text-white/70">
                    {product.title} × {quantity}
                  </Text>
                  <Text className="text-white">
                    {total.toLocaleString()} {product.currency}
                  </Text>
                </View>
              </View>
              <View className="border-t border-white/10 mt-3 pt-3 flex-row justify-between items-center">
                <Text className="text-white font-bold">Total</Text>
                <Text className="text-white font-bold text-lg">
                  {total.toLocaleString()} {product.currency}
                </Text>
              </View>
            </View>

            <View className="p-3 rounded-xl bg-white/5 border border-white/10">
              <Text className="text-white/40 text-xs mb-1">Livraison à</Text>
              <Text className="text-white text-sm">{address}</Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setStep("address")}
              className="flex-1 py-4 rounded-xl bg-white/5"
            >
              <Text className="text-center text-white/70 font-medium">
                Modifier
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void handleOrder()}
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.5 : 1 }}
              className="flex-1 py-4 rounded-xl bg-green-500 flex-row justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-center font-bold text-white">
                  Confirmer
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
