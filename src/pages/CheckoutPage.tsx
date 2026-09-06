import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";

// src/pages/CheckoutPage.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel"; // ✅ Ajout de l'import manquant

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useFirebaseAuth();

  const productId = searchParams.get("product") as Id<"products"> | null;
  const quantity = parseInt(searchParams.get("quantity") || "1", 10);

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
      // On pourrait afficher un message de connexion
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return (
      <View
        className="h-full flex items-center justify-center"
        style={{  }}
      >
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View
        className="h-full flex flex-col items-center justify-center px-4 gap-4"
        style={{  }}
      >
        <Text className="text-white font-bold text-xl">Connexion requise</Text>
        <Text className="text-white/50 text-sm">
          Connectez-vous pour finaliser votre achat
        </Text>
        <SignInButton />
        <Pressable onPress={() => router(-1)} className="text-white/40 text-sm">
          <Text>← Retour</Text></Pressable>
      </View>
    );
  }

  if (!product) {
    return (
      <View
        className="h-full flex flex-col items-center justify-center px-4"
        style={{  }}
      >
        <Pressable onPress={() => router(-1)} className="self-start mb-4">
          <ArrowLeft size={24} className="text-white/60" />
        </Pressable>
        <Text className="text-white/40">Produit introuvable</Text>
      </View>
    );
  }

  const total = product.price * quantity;

  const handleOrder = async () => {
    if (!address.trim()) {
      UIService.openToast("Veuillez renseigner une adresse de livraison", "error");
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
      // Si le panier contient des articles, on le vide
      await clearCart();
      setStep("done");
      UIService.openToast("Commande confirmée !", "success");
    } catch (error) {
      console.error(error);
      UIService.openToast("Erreur lors de la commande", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <View
        className="h-full flex flex-col items-center justify-center px-4"
        style={{  }}
      >
        <View
        >
          <CheckCircle2 size={56} className="mx-auto mb-4 text-green-400" />
        </View>
        <Text className="text-white font-bold text-xl mb-2">
          Commande confirmée !
        </Text>
        <Text className="text-white/50 text-sm mb-6">
          Vous recevrez une notification dès que le vendeur confirme.
        </Text>
        <Pressable
          onPress={() => router("/marketplace")}
          className="px-6 py-2 rounded-xl bg-orange-500 text-white font-medium"
        >
          <Text>Retour à la boutique</Text></Pressable>
      </View>
    );
  }

  return (
    <View
      className="h-full flex flex-col px-4 pt-12 pb-8"
      style={{  }}
    >
      {/* Header */}
      <View className="flex items-center gap-3 mb-6">
        <Pressable
          onPress={() => router(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-lg">Finaliser la commande</Text>
      </View>

      {step === "address" ? (
        <View className="flex-1 flex flex-col">
          <View className="space-y-4 flex-1">
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
              <Text className="text-xs text-white/50 mb-1 block">
                Adresse de livraison *
              </Text>
              <TextInput
                value={address}
                onChangeText={(text) => setAddress(text)}
                placeholder="Quartier, rue, numéro, ville..."
               
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none bg-white/5 border border-white/10"
               multiline textAlignVertical="top"/>
            </View>

            <View>
              <Text className="text-xs text-white/50 mb-1 block">
                Note pour le vendeur
              </Text>
              <TextInput
                value={note}
                onChangeText={(text) => setNote(text)}
                placeholder="Instructions spéciales..."
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none bg-white/5 border border-white/10"
              />
            </View>
          </View>

          <Pressable
            onPress={() => setStep("confirm")}
            disabled={!address.trim()}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50"
          >
            <Text>Continuer</Text></Pressable>
        </View>
      ) : (
        <View className="flex-1 flex flex-col">
          <View className="flex-1 space-y-4">
            <View className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Text className="text-white font-semibold mb-2">Récapitulatif</Text>
              <View className="space-y-2">
                <View className="flex justify-between text-sm">
                  <Text className="text-white/70">
                    {product.title} × {quantity}
                  </Text>
                  <Text className="text-white">
                    {total.toLocaleString()} {product.currency}
                  </Text>
                </View>
              </View>
              <View className="border-t border-white/10 mt-3 pt-3 flex justify-between">
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

          <View className="flex gap-3">
            <Pressable
              onPress={() => setStep("address")}
              className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 font-medium"
            >
              <Text>Modifier</Text></Pressable>
            <Pressable
              onPress={() => void handleOrder()}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Confirmer"
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
