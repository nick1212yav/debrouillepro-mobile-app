// src/features/agri/sheets/ContactSellerSheet.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  X,
  Phone,
  MessageSquare,
  ShieldCheck,
  CornerDownLeft,
} from "lucide-react-native";
import type { AgriProduct } from "../types/product.types";

interface ContactSellerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  seller: {
    userId: string;
    name: string;
    verified: boolean;
  };
  product: AgriProduct;
}

const PHONE_NUMBER = "+24300000000";

export function ContactSellerSheet({
  isOpen,
  onClose,
  seller,
  product,
}: ContactSellerSheetProps) {
  const [negotiationText, setNegotiationText] = useState("");

  const templates = useMemo(
    () => [
      `Bonjour, je suis intéressé par votre offre de "${product.title}". Est-elle toujours disponible ?`,
      `Seriez-vous d'accord pour négocier le prix de ${product.pricing.price} ${product.pricing.currency} ?`,
      `Quelle est la localisation exacte pour le retrait sur place ?`,
    ],
    [product.title, product.pricing.price, product.pricing.currency],
  );

  const handleSendQuery = useCallback(
    (text: string) => {
      // Remplace `toast.success` par un feedback natif.
      // Pour un toast stylé, installer `react-native-toast-message`.
      Alert.alert("Succès", "Message envoyé avec succès au producteur !");
      setNegotiationText("");
      onClose();
    },
    [onClose],
  );

  const handleCall = useCallback(async () => {
    const url = `tel:${PHONE_NUMBER}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Erreur", "Impossible de lancer l'appel.");
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setNegotiationText("");
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/* Backdrop */}
        <Pressable
          onPress={handleDismiss}
          style={styles.backdrop}
          accessibilityLabel="Fermer"
        />

        {/* Bottom sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrapper}
        >
          <View style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Contacter le producteur</Text>
                <Pressable
                  onPress={handleDismiss}
                  style={styles.closeButton}
                  hitSlop={8}
                  accessibilityLabel="Fermer"
                >
                  <X size={15} color="rgba(255,255,255,0.5)" />
                </Pressable>
              </View>

              {/* Seller card */}
              <View style={styles.sellerCard}>
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerName} numberOfLines={1}>
                      {seller.name}
                    </Text>
                    {seller.verified && (
                      <ShieldCheck
                        size={14}
                        color="#34D399"
                        style={styles.verifiedIcon}
                      />
                    )}
                  </View>
                  <Text style={styles.sellerSector}>
                    Secteur : {product.location.city}
                  </Text>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={handleCall}
                    style={({ pressed }) => [
                      styles.callButton,
                      pressed && styles.callButtonPressed,
                    ]}
                    accessibilityLabel="Appeler le producteur"
                  >
                    <Phone size={14} color="#4ADE80" />
                  </Pressable>
                </View>
              </View>

              {/* Quick templates */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Messages rapides</Text>
                <View style={styles.templatesColumn}>
                  {templates.map((tpl, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setNegotiationText(tpl)}
                      style={({ pressed }) => [
                        styles.templateButton,
                        pressed && styles.templateButtonPressed,
                      ]}
                    >
                      <Text style={styles.templateText}>{tpl}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Custom message */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Message personnalisé</Text>
                <View style={styles.inputWrapper}>
                  <MessageSquare
                    size={14}
                    color="rgba(255,255,255,0.3)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={negotiationText}
                    onChangeText={setNegotiationText}
                    placeholder="Écrivez votre message..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    style={styles.input}
                  />
                  {negotiationText.trim().length > 0 && (
                    <Pressable
                      onPress={() => handleSendQuery(negotiationText)}
                      style={({ pressed }) => [
                        styles.sendButton,
                        pressed && styles.sendButtonPressed,
                      ]}
                      accessibilityLabel="Envoyer"
                    >
                      <CornerDownLeft size={12} color="#000000" />
                    </Pressable>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  sheetWrapper: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#0a0f0b",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    maxHeight: "80%",
    paddingBottom: 24,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  scroll: {
    maxHeight: 560,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  // Seller card
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  sellerInfo: {
    flexShrink: 1,
  },
  sellerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sellerName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    flexShrink: 1,
  },
  verifiedIcon: {
    flexShrink: 0,
  },
  sellerSector: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  callButtonPressed: {
    backgroundColor: "rgba(34,197,94,0.2)",
  },

  // Sections
  section: {
    gap: 6,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  // Templates
  templatesColumn: {
    flexDirection: "column",
    gap: 8,
  },
  templateButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  templateButtonPressed: {
    borderColor: "rgba(255,255,255,0.1)",
  },
  templateText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    lineHeight: 16,
  },

  // Input
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: 16,
  },
  input: {
    flex: 1,
    paddingLeft: 28,
    paddingRight: 32,
    color: "#FFFFFF",
    fontSize: 12,
    minHeight: 40,
  },
  sendButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
  },
  sendButtonPressed: {
    backgroundColor: "#4ADE80",
    transform: [{ scale: 0.9 }],
  },
});
