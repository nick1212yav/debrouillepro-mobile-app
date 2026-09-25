import {
  View,
  Text,
  Image,
  Pressable,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from "react-native";

// src/features/messages/immo/components/PropertyPreview.tsx

import React from "react";

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
      {cover && (
        <Image
          style={compact ? compactImageStyle : imageStyle}
          source={{ uri: cover }}
          resizeMode="cover"
          accessibilityLabel={property.title}
        />
      )}

      <View style={contentStyle}>
        <View style={badgeRowStyle}>
          <View style={badgePillStyle}>
            <Text style={badgeTextStyle}>
              {getTransactionTypeLabel(property.transactionType)}
            </Text>
          </View>
          <Text style={typeStyle}>{getPropertyTypeLabel(property.type)}</Text>
        </View>

        <Text style={titleStyle}>{property.title}</Text>

        <Text style={priceStyle}>
          {formatPropertyPrice(property.price, property.currency)}
        </Text>

        <View style={detailsStyle}>
          {property.city && (
            <Text style={detailTextStyle}>📍 {property.city}</Text>
          )}
          {property.surface !== undefined && (
            <Text style={detailTextStyle}>📐 {property.surface} m²</Text>
          )}
          {property.rooms !== undefined && (
            <Text style={detailTextStyle}>🚪 {property.rooms} pièces</Text>
          )}
        </View>

        {property.ownerName && (
          <View style={ownerStyle}>
            {property.ownerAvatar ? (
              <Image
                style={ownerAvatarStyle}
                source={{ uri: property.ownerAvatar }}
                accessibilityLabel=""
              />
            ) : (
              <View style={ownerPlaceholderStyle}>
                <Text style={ownerPlaceholderTextStyle}>👤</Text>
              </View>
            )}

            <Text style={ownerNameStyle}>{property.ownerName}</Text>
          </View>
        )}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={cardStyle}>{content}</View>;
  }

  return (
    <Pressable onPress={() => onPress(property)} style={cardStyle}>
      {content}
    </Pressable>
  );
}

const cardStyle: ViewStyle = {
  overflow: "hidden",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  backgroundColor: "#ffffff",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 3,
};

const imageStyle: ImageStyle = {
  width: "100%",
  height: 190,
};

const compactImageStyle: ImageStyle = {
  width: "100%",
  height: 130,
};

const contentStyle: ViewStyle = {
  padding: 14,
};

const badgeRowStyle: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 7,
  flexWrap: "wrap",
};

const badgePillStyle: ViewStyle = {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: "#111827",
};

const badgeTextStyle: TextStyle = {
  color: "#ffffff",
  fontSize: 11,
  fontWeight: "700",
};

const typeStyle: TextStyle = {
  fontSize: 12,
  color: "#6b7280",
};

const titleStyle: TextStyle = {
  marginTop: 9,
  marginBottom: 5,
  fontSize: 16,
  lineHeight: 21,
  fontWeight: "700",
  color: "#111827",
};

const priceStyle: TextStyle = {
  fontSize: 18,
  fontWeight: "800",
  color: "#111827",
};

const detailsStyle: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 9,
};

const detailTextStyle: TextStyle = {
  fontSize: 12,
  color: "#6b7280",
};

const ownerStyle: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  marginTop: 13,
  paddingTop: 11,
  borderTopWidth: 1,
  borderTopColor: "#f0f0f0",
};

const ownerAvatarStyle: ImageStyle = {
  width: 26,
  height: 26,
  borderRadius: 13,
};

const ownerPlaceholderStyle: ViewStyle = {
  width: 26,
  height: 26,
  borderRadius: 13,
  backgroundColor: "#f3f4f6",
  alignItems: "center",
  justifyContent: "center",
};

const ownerPlaceholderTextStyle: TextStyle = {
  fontSize: 14,
};

const ownerNameStyle: TextStyle = {
  fontSize: 12,
  color: "#4b5563",
};

export default PropertyPreview;