import React from "react";
import { Image, type ImageProps, type ImageStyle, type StyleProp } from "react-native";

const logoSource = require("../../../assets/branding/debrouillepro-logo.png");
const markSource = require("../../../assets/branding/debrouillepro-mark.png");

type DebrouilleLogoProps = {
  variant?: "full" | "mark";
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function DebrouilleLogo({
  variant = "full",
  width,
  height,
  style,
  accessibilityLabel = "DébrouillePro",
}: DebrouilleLogoProps) {
  const source: ImageProps["source"] =
    variant === "full" ? logoSource : markSource;

  return (
    <Image
      source={source}
      resizeMode="contain"
      style={[{ width: width ?? 180, height: height ?? 72 }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
