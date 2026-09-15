// src/pages/CheckoutPage.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";

export default function CheckoutPage() {
  // ✅ expo-router : searchParams est un objet direct
  const params = useLocalSearchParams<{
    product?: string;
    quantity?: string;
  }>();
  const router = useRouter();

  const { isAuthenticated, loading: authLoading } = useFirebaseAuth();

  const productId = (params.product as Id<"products">) || null;
  const quantity = parseInt(params.quantity || "1", 10);

  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"address" | "confirm" | "done">("address");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const product = useQuery(
    api.commerce.getProduct,
    productId ? { id: productId } : "skip",
  );

  const createOrder = useMutation(api.commerce.createOrder);
  const clearCart = useMutation(api.commerce.clearCart);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Optionnel : redirection automatique
      // router.push("/signin");
    }
  }, [authLoading, isAuthenticated]);

  // ── Loading auth ────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color="rgba(255,255,255,0.4)" />
      </View>
    );
  }

  // ── Connexion requise ───────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: 16 }]}>
        <Text style={styles.h1}>Connexion requise</Text>
        <Text style={styles.body}>
          Connectez-vous pour finaliser votre achat
        </Text>
        <View style={{ marginTop: 16 }}>
          <SignInButton />
        </View>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 24 }}
          hitSlop={8}
        >
          <Text style={styles.mutedText}>← Retour</Text>
        </Pressable>
      </View>
    );
  }

  // ── Produit introuvable ─────────────────────────────────────────────
  if (!product) {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: 16 }]}>
        <Pressable
          onPress={() => router.back()}
          style={{ alignSelf: "flex-start", marginBottom: 16 }}
        >
          <ArrowLeft size={24} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Text style={styles.mutedText}>Produit introuvable</Text>
      </View>
    );
  }

  const total = product.price * quantity;

  const handleOrder = async () => {
    if (!address.trim()) {
      Alert.alert("Erreur", "Veuillez renseigner une adresse de livraison");
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
      Alert.alert("Succès", "Commande confirmée !");
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Erreur lors de la commande");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Étape finale ────────────────────────────────────────────────────
  if (step === "done") {
    return <SuccessScreen onBackToShop={() => router.push("/marketplace")} />;
  }

  // ── Rendu principal ─────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
          hitSlop={8}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Finaliser la commande</Text>
      </View>

      {step === "address" ? (
        <View style={styles.stepContainer}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Résumé produit */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Résumé</Text>
              <Text style={styles.cardText}>
                {product.title} × {quantity}
              </Text>
              <Text style={styles.cardTotal}>
                {total.toLocaleString()} {product.currency}
              </Text>
            </View>

            {/* Adresse */}
            <View>
              <Text style={styles.inputLabel}>Adresse de livraison *</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Quartier, rue, numéro, ville..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.textArea]}
              />
            </View>

            {/* Note */}
            <View>
              <Text style={styles.inputLabel}>Note pour le vendeur</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Instructions spéciales..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={styles.input}
              />
            </View>
          </ScrollView>

          <Pressable
            onPress={() => setStep("confirm")}
            disabled={!address.trim()}
            style={({ pressed }) => [
              styles.primaryButton,
              !address.trim() && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Continuer</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.stepContainer}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Récapitulatif</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.cardText}>
                  {product.title} × {quantity}
                </Text>
                <Text style={styles.cardText}>
                  {total.toLocaleString()} {product.currency}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <Text style={styles.boldText}>Total</Text>
                <Text style={[styles.boldText, { fontSize: 16 }]}>
                  {total.toLocaleString()} {product.currency}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.mutedSmall}>Livraison à</Text>
              <Text style={styles.cardText}>{address}</Text>
            </View>
          </ScrollView>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setStep("address")}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Modifier</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleOrder()}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.confirmButton,
                isSubmitting && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Confirmer</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Écran de succès (isolé pour gérer proprement l'animation) ─────────────
function SuccessScreen({ onBackToShop }: { onBackToShop: () => void }) {
  const scale = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.back(1.7)),
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <View style={[styles.screen, styles.center, { paddingHorizontal: 16 }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <CheckCircle2 size={56} color="#4ADE80" />
      </Animated.View>
      <Text style={[styles.h1, { marginTop: 16 }]}>Commande confirmée !</Text>
      <Text style={[styles.body, { marginBottom: 24 }]}>
        Vous recevrez une notification dès que le vendeur confirme.
      </Text>
      <Pressable
        onPress={onBackToShop}
        style={({ pressed }) => [
          styles.primaryButton,
          { paddingHorizontal: 24, alignSelf: "center" },
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>Retour à la boutique</Text>
      </Pressable>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 6,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 6,
  },
  cardText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  cardTotal: {
    color: "#FB923C",
    fontWeight: "700",
    fontSize: 18,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 12,
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  boldText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  mutedText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
  mutedSmall: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  body: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  h1: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 20,
    textAlign: "center",
  },
  inputLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  textArea: {
    minHeight: 80,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    marginTop: 0,
    backgroundColor: "#22C55E",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
});
