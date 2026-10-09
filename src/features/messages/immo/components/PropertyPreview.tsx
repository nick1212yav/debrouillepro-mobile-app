// src/features/messages/immo/components/PropertyPreview.tsx

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { PropertyWithMedia } from "../services/immo.service";
import {
  formatPropertyPrice,
  getPropertyCoverImage,
  getPropertyTypeLabel,
  getTransactionTypeLabel,
} from "../services/immo.service";

export interface PropertyPreviewProps {
  property: PropertyWithMedia;
  compact?: boolean;
  onPress?: (property: PropertyWithMedia) => void;
}

export function PropertyPreview({
  property,
  compact = false,
  onPress,
}: PropertyPreviewProps) {
  const cover = getPropertyCoverImage(property);

  const content = (
    <>
      {cover ? (
        <Image
          style={compact ? styles.compactImage : styles.image}
          source={{ uri: cover }}
          resizeMode="cover"
          accessibilityLabel={property.title}
        />
      ) : null}

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>
              {getTransactionTypeLabel(property.transactionType)}
            </Text>
          </View>

          <Text style={styles.type}>{getPropertyTypeLabel(property.type)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {property.title}
        </Text>

        <Text style={styles.price}>
          {formatPropertyPrice(property.price, property.currency)}
        </Text>

        <View style={styles.details}>
          {property.city ? (
            <Text style={styles.detailText}>📍 {property.city}</Text>
          ) : null}

          {property.surface !== undefined ? (
            <Text style={styles.detailText}>📐 {property.surface} m²</Text>
          ) : null}

          {property.rooms !== undefined ? (
            <Text style={styles.detailText}>🚪 {property.rooms} pièces</Text>
          ) : null}
        </View>

        {property.ownerName ? (
          <View style={styles.owner}>
            {property.ownerAvatar ? (
              <Image
                style={styles.ownerAvatar}
                source={{ uri: property.ownerAvatar }}
                accessibilityLabel={`Photo de ${property.ownerName}`}
              />
            ) : (
              <View
                style={styles.ownerPlaceholder}
                accessibilityLabel="Photo du propriétaire indisponible"
              >
                <Text style={styles.ownerPlaceholderText}>👤</Text>
              </View>
            )}

            <Text
              style={styles.ownerName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {property.ownerName}
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View
        style={styles.card}
        accessibilityRole="summary"
        accessibilityLabel={`Annonce immobilière : ${property.title}`}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onPress(property)}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir l'annonce ${property.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    backgroundColor: "#111827",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },

  cardPressed: {
    opacity: 0.92,
  },

  image: {
    width: "100%",
    height: 190,
  },

  compactImage: {
    width: "100%",
    height: 130,
  },

  content: {
    padding: 14,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#2563eb",
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },

  type: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },

  title: {
    marginTop: 9,
    marginBottom: 5,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    color: "#ffffff",
  },

  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },

  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 9,
  },

  detailText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },

  owner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  ownerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },

  ownerPlaceholder: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  ownerPlaceholderText: {
    fontSize: 14,
  },

  ownerName: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
  },
});

export default PropertyPreview;
