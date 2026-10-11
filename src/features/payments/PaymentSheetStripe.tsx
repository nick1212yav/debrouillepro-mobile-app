// src/features/payments/PaymentSheetStripe.tsx
//
// Flux Stripe PaymentSheet (cartes uniquement, USD, test mode).
//
// RÈGLES
// ------
// - Aucun `succeeded` local. Le webhook Stripe reste la seule source de vérité.
// - Le clientSecret n'est jamais persisté, jamais loggé.
// - USD uniquement pour C1 (CDF non supporté par Stripe).
// - Aucun `as`, aucun `any`, aucun `@ts-ignore`.

import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { usePaymentSheet } from "@stripe/stripe-react-native";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Info,
  Shield,
  X,
} from "lucide-react-native";

// ============================================================================
// CONSTANTES
// ============================================================================

const MIN_USD = 0.5;
const MAX_USD = 9999.99;

const COLORS = {
  background: "#020412",
  surface: "#0B1020",
  surfaceSoft: "rgba(255,255,255,0.045)",
  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.68)",
  textMuted: "rgba(255,255,255,0.42)",
  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.14)",
  red: "#EF4444",
  redSoft: "rgba(239,68,68,0.14)",
  blue: "#3B82F6",
  blueSoft: "rgba(59,130,246,0.14)",
  purple: "#8B5CF6",
  purpleSoft: "rgba(139,92,246,0.14)",
};

// ============================================================================
// HELPERS
// ============================================================================

function createStripeIdempotencyKey(amount: number): string {
  // Pas de Math.random() côté client. La clé doit être stable par tentative.
  return `wallet_topup:stripe:usd:${amount}:${Date.now()}`;
}

function parseUsdAmount(raw: string): number | null {
  const normalized = raw.replace(",", ".").trim();

  if (!normalized) {
    return null;
  }

  const value = Number(normalized);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  // Arrondi à 2 décimales pour éviter les erreurs flottantes (0.1 + 0.2).
  return Math.round(value * 100) / 100;
}

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// ============================================================================
// TYPES
// ============================================================================

type Step = "form" | "processing" | "transmitted" | "error";

// ============================================================================
// COMPOSANT PUBLIC
// ============================================================================

export function PaymentSheetStripe({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: (paymentIntentId: string) => void;
}): React.ReactElement {
  const hasKey = Boolean(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {hasKey ? (
            <StripeFlow onClose={onClose} onSuccess={onSuccess} />
          ) : (
            <StripeNotConfigured onClose={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// NOT CONFIGURED
// ============================================================================

function StripeNotConfigured({
  onClose,
}: {
  onClose: () => void;
}): React.ReactElement {
  return (
    <>
      <Header onClose={onClose} title="Payer par carte" />

      <View style={styles.centerPanel}>
        <View style={styles.warningIcon}>
          <AlertCircle size={30} color={COLORS.red} />
        </View>

        <Text style={styles.centerTitle}>Paiement carte indisponible</Text>

        <Text style={styles.centerText}>
          Stripe n'est pas configuré dans cet environnement. Aucun paiement ne
          peut être effectué.
        </Text>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Fermer</Text>
        </Pressable>
      </View>
    </>
  );
}

// ============================================================================
// FLUX STRIPE
// ============================================================================

function StripeFlow({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: (paymentIntentId: string) => void;
}): React.ReactElement {
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const createPaymentIntent = useMutation(api.payments.createPaymentIntent);
  const startPayment = useAction(api.payments.startPayment);

  const [amountInput, setAmountInput] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsed = parseUsdAmount(amountInput);
  const validAmount = parsed !== null && parsed >= MIN_USD && parsed <= MAX_USD;

  // --------------------------------------------------------------------------
  // HANDLER
  // --------------------------------------------------------------------------

  async function handlePay(): Promise<void> {
    if (step === "processing" || !parsed || !validAmount) {
      return;
    }

    setStep("processing");
    setErrorMessage(null);

    try {
      const idempotencyKey = createStripeIdempotencyKey(parsed);

      // ÉTAPE 1 — Intention
      const intent = await createPaymentIntent({
        type: "wallet_topup",
        amount: parsed,
        currency: "USD",
        provider: "stripe",
        idempotencyKey,
      });

      // ÉTAPE 2 — Démarrage réel côté Payment Core
      const result = await startPayment({
        paymentIntentId: intent.paymentIntentId,
      });

      // Terminaux sans action client
      if (result.status === "failed" || result.status === "cancelled") {
        setStep("error");
        setErrorMessage("Le paiement a été refusé par Stripe.");
        return;
      }

      if (result.status === "succeeded") {
        // Rare (Stripe n'est pas synchrone), mais possible.
        setStep("transmitted");
        onSuccess?.(intent.paymentIntentId);
        return;
      }

      // ÉTAPE 3 — Extraire le clientSecret via l'union discriminée D0
      const nextAction = result.nextAction;

      if (
        !nextAction ||
        (nextAction.type !== "stripe_3ds" &&
          nextAction.type !== "stripe_confirm")
      ) {
        setStep("error");
        setErrorMessage(
          "Réponse Stripe inattendue. Aucun paiement n'a été effectué.",
        );
        return;
      }

      const clientSecret = nextAction.clientSecret;

      if (!clientSecret) {
        setStep("error");
        setErrorMessage(
          "Session de paiement Stripe indisponible. Aucun débit.",
        );
        return;
      }

      // ÉTAPE 4 — PaymentSheet
      const initResult = await initPaymentSheet({
        merchantDisplayName: "DébrouillePro",
        paymentIntentClientSecret: clientSecret,
      });

      if (initResult.error) {
        setStep("error");
        setErrorMessage(
          initResult.error.message ?? "Initialisation Stripe échouée.",
        );
        return;
      }

      const presentResult = await presentPaymentSheet();

      if (presentResult.error) {
        if (presentResult.error.code === "Canceled") {
          // Annulation utilisateur — retour au formulaire, pas une erreur.
          setStep("form");
          return;
        }

        setStep("error");
        setErrorMessage(
          presentResult.error.message ?? "Paiement non finalisé.",
        );
        return;
      }

      // ÉTAPE 5 — Stripe UI complétée.
      // NE PAS déclarer succeeded. Le webhook finalise le ledger.
      setStep("transmitted");
      onSuccess?.(intent.paymentIntentId);
    } catch (error) {
      console.error("[PaymentSheetStripe] error:", error);

      setStep("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Le paiement n'a pas pu être démarré.",
      );
    }
  }

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <>
      <Header onClose={onClose} title="Payer par carte" />

      {step === "form" && (
        <>
          <View style={styles.noticeCard}>
            <Shield size={16} color={COLORS.green} />
            <Text style={styles.noticeText}>
              Paiement sécurisé Stripe — mode test. Aucune vraie carte débitée.
            </Text>
          </View>

          <Text style={styles.fieldLabel}>MONTANT — USD</Text>

          <View style={styles.quickAmounts}>
            {[5, 10, 25, 50].map((preset) => {
              const selected = amountInput === String(preset);

              return (
                <Pressable
                  key={preset}
                  onPress={() => setAmountInput(String(preset))}
                  style={({ pressed }) => [
                    styles.quickAmount,
                    selected && styles.quickAmountSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      selected && styles.quickAmountTextSelected,
                    ]}
                  >
                    ${preset}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={amountInput}
            onChangeText={setAmountInput}
            keyboardType="decimal-pad"
            placeholder="Montant en USD"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.hint}>
            Minimum {formatUsd(MIN_USD)} — maximum {formatUsd(MAX_USD)}.
          </Text>

          <Pressable
            disabled={!validAmount}
            onPress={() => void handlePay()}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              !validAmount && styles.disabled,
            ]}
          >
            <CreditCard size={17} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {parsed && validAmount ? `Payer ${formatUsd(parsed)}` : "Payer"}
            </Text>
          </Pressable>
        </>
      )}

      {step === "processing" && (
        <View style={styles.centerPanel}>
          <ActivityIndicator size="small" color={COLORS.purple} />
          <Text style={styles.centerText}>Communication avec Stripe…</Text>
        </View>
      )}

      {step === "transmitted" && (
        <View style={styles.centerPanel}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={30} color={COLORS.green} />
          </View>

          <Text style={styles.centerTitle}>Paiement transmis</Text>

          <Text style={styles.centerText}>
            Stripe a accepté votre paiement. Le solde sera crédité dès
            confirmation serveur (généralement en quelques secondes).
          </Text>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Fermer</Text>
          </Pressable>
        </View>
      )}

      {step === "error" && (
        <View style={styles.centerPanel}>
          <View style={styles.warningIcon}>
            <AlertCircle size={30} color={COLORS.red} />
          </View>

          <Text style={styles.centerTitle}>Paiement non finalisé</Text>

          <Text style={styles.centerText}>
            {errorMessage ?? "Une erreur est survenue."}
          </Text>

          <View style={styles.errorActions}>
            <Pressable
              onPress={() => {
                setStep("form");
                setErrorMessage(null);
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Réessayer</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.infoRow}>
        <Info size={13} color={COLORS.textMuted} />
        <Text style={styles.infoText}>
          Le crédit du Wallet n'intervient qu'après confirmation serveur Stripe.
        </Text>
      </View>
    </>
  );
}

// ============================================================================
// HEADER
// ============================================================================

function Header({
  onClose,
  title,
}: {
  onClose: () => void;
  title: string;
}): React.ReactElement {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Stripe · USD · test mode</Text>
      </View>

      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
      >
        <X size={18} color={COLORS.textSecondary} />
      </Pressable>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.76)",
  },

  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 28,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.45,
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderRadius: 14,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.13)",
    marginBottom: 18,
  },

  noticeText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },

  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 7,
  },

  quickAmounts: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 10,
  },

  quickAmount: {
    flex: 1,
    minHeight: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  quickAmountSelected: {
    backgroundColor: COLORS.purpleSoft,
    borderColor: "rgba(139,92,246,0.4)",
  },

  quickAmountText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  quickAmountTextSelected: {
    color: COLORS.purple,
  },

  input: {
    minHeight: 47,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 12,
    marginBottom: 8,
  },

  hint: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginBottom: 16,
  },

  primaryButton: {
    minHeight: 49,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.18)",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  secondaryButton: {
    minHeight: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },

  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },

  centerPanel: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },

  centerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  centerText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.greenSoft,
  },

  warningIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.redSoft,
  },

  errorActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  infoText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 13,
  },
});

export default PaymentSheetStripe;
