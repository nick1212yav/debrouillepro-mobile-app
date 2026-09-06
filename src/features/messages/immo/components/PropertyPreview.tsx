import { View, Text, Image, ViewStyle, TextStyle, ImageStyle } from "react-native";
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
         source={{ uri: cover }} accessibilityLabel={property.title}/>
      )}

      <View style={contentStyle}>
        <View style={badgeRowStyle}>
          <Text style={badgeStyle}>
            {getTransactionTypeLabel(property.transactionType)}
          </Text>

          <Text style={typeStyle}>{getPropertyTypeLabel(property.type)}</Text>
        </View>

        <Text style={titleStyle}>{property.title}</Text>

        <View style={priceStyle}>
          {formatPropertyPrice(property.price, property.currency)}
        </View>

        <View style={detailsStyle}>
          {property.city && <Text><Text>📍</Text>{property.city}</Text>}

          {property.surface !== undefined && (
            <Text><Text>📐</Text>{property.surface} <Text>m²</Text></Text>
          )}

          {property.rooms !== undefined && (
            <Text><Text>🚪</Text>{property.rooms} <Text>pièces</Text></Text>
          )}
        </View>

        {property.ownerName && (
          <View style={ownerStyle}>
            {property.ownerAvatar ? (
              <Image style={ownerAvatarStyle}  source={{ uri: property.ownerAvatar }} accessibilityLabel=""/>
            ) : (
              <Text style={ownerPlaceholderStyle}><Text>👤</Text></Text>
            )}

            <Text>{property.ownerName}</Text>
          </View>
        )}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={cardStyle}>{content}</View>;
  }

  return (
    <Pressable
      type="button"
      onPress={() => onPress(property)}
      style={buttonResetStyle}
    >
      <View style={cardStyle}>{content}</View>
    </Pressable>
  );
}

const cardStyle: ViewStyle | TextStyle | ImageStyle = {
  overflow: "hidden",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const buttonResetStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  padding: 0,
  margin: 0,
  border: 0,
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
};

const imageStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  height: 190,
  display: "block",
  objectFit: "cover",
};

const compactImageStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  height: 130,
  display: "block",
  objectFit: "cover",
};

const contentStyle: ViewStyle | TextStyle | ImageStyle = {
  padding: 14,
};

const badgeRowStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  flexWrap: "wrap",
};

const badgeStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "inline-flex",
  padding: "4px 8px",
  borderRadius: 999,
  background: "#111827",
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 700,
};

const typeStyle: ViewStyle | TextStyle | ImageStyle = {
  fontSize: 12,
  color: "#6b7280",
};

const titleStyle: ViewStyle | TextStyle | ImageStyle = {
  margin: "9px 0 5px",
  fontSize: 16,
  lineHeight: 1.3,
  fontWeight: 700,
  color: "#111827",
};

const priceStyle: ViewStyle | TextStyle | ImageStyle = {
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const detailsStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 9,
  fontSize: 12,
  color: "#6b7280",
};

const ownerStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 13,
  paddingTop: 11,
  borderTop: "1px solid #f0f0f0",
  fontSize: 12,
  color: "#4b5563",
};

const ownerAvatarStyle: ViewStyle | TextStyle | ImageStyle = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  objectFit: "cover",
};

const ownerPlaceholderStyle: ViewStyle | TextStyle | ImageStyle = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f3f4f6",
};

export default PropertyPreview;
