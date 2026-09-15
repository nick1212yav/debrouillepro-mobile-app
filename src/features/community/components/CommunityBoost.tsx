// src/features/community/components/CommunityBoost.tsx
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { X, TrendingUp, Send } from "lucide-react-native";

interface Props {
  onBoost: (duration: number, budget: number) => Promise<void>;
  onClose?: () => void;
}

const DURATIONS = [
  { label: "1 jour", value: 1 },
  { label: "3 jours", value: 3 },
  { label: "7 jours", value: 7 },
];

const BUDGETS = [
  { label: "5 000 FCFA", value: 5000 },
  { label: "10 000 FCFA", value: 10000 },
  { label: "25 000 FCFA", value: 25000 },
  { label: "50 000 FCFA", value: 50000 },
];

export function CommunityBoost({ onBoost, onClose }: Props) {
  const [duration, setDuration] = useState(3);
  const [budget, setBudget] = useState(10000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onBoost(duration, budget);
      Alert.alert(
        "Succès",
        `Post boosté pour ${duration} jours avec un budget de ${budget} FCFA`,
      );
      onClose?.();
    } catch {
      Alert.alert("Erreur", "Erreur lors du boost");
    } finally {
      setIsSubmitting(false);
    }
  }, [duration, budget, onBoost, onClose]);

  const estimatedReach = (budget / 1000) * 200;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={() => onClose?.()}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable
          onPress={() => onClose?.()}
          style={styles.backdrop}
          accessibilityLabel="Fermer"
        />

        {/* Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrapper}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Booster le post</Text>
              <Pressable
                onPress={() => onClose?.()}
                style={styles.closeButton}
                hitSlop={6}
                accessibilityLabel="Fermer"
              >
                <X size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>

            {/* Contenu scrollable */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Info card */}
              <View style={styles.infoCard}>
                <TrendingUp size={24} color="#C084FC" />
                <View style={styles.infoTextColumn}>
                  <Text style={styles.infoTitle}>
                    Augmentez votre visibilité
                  </Text>
                  <Text style={styles.infoSubtitle}>
                    Votre post sera mis en avant auprès de plus de personnes
                  </Text>
                </View>
              </View>

              {/* Durée */}
              <View>
                <Text style={styles.sectionLabel}>Durée</Text>
                <View style={styles.durationsRow}>
                  {DURATIONS.map((d) => {
                    const isSelected = duration === d.value;
                    return (
                      <Pressable
                        key={d.value}
                        onPress={() => setDuration(d.value)}
                        style={({ pressed }) => [
                          styles.durationButton,
                          isSelected
                            ? styles.durationButtonSelected
                            : styles.durationButtonInactive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.durationText,
                            isSelected
                              ? styles.durationTextSelected
                              : styles.durationTextInactive,
                          ]}
                        >
                          {d.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Budget */}
              <View>
                <Text style={styles.sectionLabel}>Budget</Text>
                <View style={styles.budgetsColumn}>
                  {BUDGETS.map((b) => {
                    const isSelected = budget === b.value;
                    return (
                      <Pressable
                        key={b.value}
                        onPress={() => setBudget(b.value)}
                        style={({ pressed }) => [
                          styles.budgetButton,
                          isSelected
                            ? styles.budgetButtonSelected
                            : styles.budgetButtonInactive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.budgetText,
                            isSelected
                              ? styles.budgetTextSelected
                              : styles.budgetTextInactive,
                          ]}
                        >
                          {b.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Estimation */}
              <View style={styles.estimateCard}>
                <Text style={styles.estimateLabel}>Estimation de portée</Text>
                <Text style={styles.estimateValue}>
                  ~{estimatedReach} personnes
                </Text>
              </View>
            </ScrollView>

            {/* Bouton submit */}
            <View style={styles.footer}>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.submitButton,
                  isSubmitting && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={15} color="#FFFFFF" />
                )}
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? "Boost en cours..." : "Booster maintenant"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheetWrapper: {
    width: "100%",
  },
  sheet: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: "rgba(15,15,30,0.98)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  closeButton: {
    padding: 4,
    borderRadius: 999,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  infoTextColumn: {
    flex: 1,
  },
  infoTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  infoSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 4,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  durationsRow: {
    flexDirection: "row",
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  durationButtonSelected: {
    backgroundColor: "rgba(168,85,247,0.2)",
    borderColor: "rgba(168,85,247,0.3)",
  },
  durationButtonInactive: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "transparent",
  },
  durationText: {
    fontSize: 13,
    fontWeight: "500",
  },
  durationTextSelected: {
    color: "#C084FC",
  },
  durationTextInactive: {
    color: "rgba(255,255,255,0.5)",
  },
  budgetsColumn: {
    gap: 8,
  },
  budgetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  budgetButtonSelected: {
    backgroundColor: "rgba(168,85,247,0.2)",
    borderColor: "rgba(168,85,247,0.3)",
  },
  budgetButtonInactive: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "transparent",
  },
  budgetText: {
    fontSize: 13,
    fontWeight: "500",
  },
  budgetTextSelected: {
    color: "#C084FC",
  },
  budgetTextInactive: {
    color: "rgba(255,255,255,0.5)",
  },
  estimateCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  estimateLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  estimateValue: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
