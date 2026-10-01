import { Image, Text, View } from "react-native";
import { Heart, MessageCircle } from "lucide-react-native";

import { TYPE_COLORS, TYPE_LABELS } from "@/hooks/use-publications.ts";
import type { PublicationType } from "@/hooks/use-publications.ts";

interface MiniPubCardProps {
  pub: {
    _id: string;
    title: string;
    type: PublicationType;
    images: string[];
    likeCount: number;
    commentCount: number;
    price?: string;
  };
}

const FALLBACK_COLOR = "#6366F1";

function getTypeColor(type: PublicationType): string {
  return TYPE_COLORS[type] ?? FALLBACK_COLOR;
}

function getTypeLabel(type: PublicationType): string {
  return TYPE_LABELS[type] ?? "Publication";
}

function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0";
  }

  if (value >= 1_000_000) {
    const formatted = value / 1_000_000;
    return `${formatted.toFixed(formatted >= 10 ? 0 : 1)}M`;
  }

  if (value >= 1_000) {
    const formatted = value / 1_000;
    return `${formatted.toFixed(formatted >= 10 ? 0 : 1)}K`;
  }

  return String(Math.floor(value));
}

function normalizeImageUri(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const uri = value.trim();

  if (!uri) {
    return null;
  }

  return uri;
}

export function MiniPubCard({ pub }: MiniPubCardProps) {
  const color = getTypeColor(pub.type);
  const label = getTypeLabel(pub.type);

  const imageUri = normalizeImageUri(pub.images[0]);

  const hasImage = imageUri !== null;

  const likeCount = formatCount(pub.likeCount);
  const commentCount = formatCount(pub.commentCount);

  return (
    <View
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Publication ${pub.title}`}
    >
      {hasImage && imageUri ? (
        <View className="relative h-24 w-full">
          <Image
            source={{ uri: imageUri }}
            accessibilityLabel={pub.title}
            accessibilityRole="image"
            resizeMode="cover"
            className="h-full w-full"
          />

          <View
            pointerEvents="none"
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(0,0,0,0.16)",
            }}
          />

          <View
            className="absolute bottom-2 left-2 rounded-full px-2 py-1"
            style={{
              backgroundColor: color,
            }}
          >
            <Text className="text-[10px] font-bold text-white">{label}</Text>
          </View>
        </View>
      ) : (
        <View
          className="h-12 w-full items-start justify-center px-3"
          style={{
            backgroundColor: `${color}15`,
          }}
        >
          <View
            className="rounded-full px-2 py-1"
            style={{
              backgroundColor: color,
            }}
          >
            <Text className="text-[10px] font-bold text-white">{label}</Text>
          </View>
        </View>
      )}

      <View className="p-3">
        <Text
          className="mb-1.5 text-xs font-semibold leading-4 text-white"
          numberOfLines={2}
        >
          {pub.title}
        </Text>

        {pub.price?.trim() ? (
          <Text
            className="mb-1 text-xs font-black text-emerald-400"
            numberOfLines={1}
          >
            {pub.price}
          </Text>
        ) : null}

        <View className="flex-row items-center">
          <View className="mr-3 flex-row items-center">
            <Heart size={11} color="rgba(255,255,255,0.38)" strokeWidth={2} />

            <Text className="ml-1 text-[10px] text-white/40">{likeCount}</Text>
          </View>

          <View className="flex-row items-center">
            <MessageCircle
              size={11}
              color="rgba(255,255,255,0.38)"
              strokeWidth={2}
            />

            <Text className="ml-1 text-[10px] text-white/40">
              {commentCount}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
