// src/features/publications/components/PublicationGallery.tsx

import { useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";

interface Props {
  images: string[];
  alt?: string;
  fit?: "cover" | "contain" | "auto";
}

type ImageFit = "cover" | "contain";

export function PublicationGallery({ images, alt = "", fit = "auto" }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const count = images.length;
  const display = images.slice(0, 4);
  const remaining = Math.max(0, count - 4);

  const detectFit = (url: string): ImageFit => {
    if (fit !== "auto") {
      return fit;
    }

    const lower = url.toLowerCase();

    if (
      lower.includes("logo") ||
      lower.includes("qr") ||
      lower.includes("code") ||
      /\.(svg|png)(\?|$)/i.test(lower)
    ) {
      return "contain";
    }

    return "cover";
  };

  const getAccessibilityLabel = (index: number): string => {
    const base = alt.trim();

    if (base.length === 0) {
      return `Image ${index + 1}`;
    }

    return `${base} ${index + 1}`;
  };

  const renderImage = (src: string, index: number) => {
    const imageFit = detectFit(src);

    return (
      <Pressable
        key={`${src}-${index}`}
        className="h-full w-full overflow-hidden"
        onPress={() => setSelected(src)}
        accessibilityRole="button"
        accessibilityLabel={getAccessibilityLabel(index)}
        accessibilityHint="Ouvrir l'image en plein écran"
      >
        <Image
          source={{ uri: src }}
          className="h-full w-full"
          resizeMode={imageFit}
          accessibilityLabel={getAccessibilityLabel(index)}
        />
      </Pressable>
    );
  };

  const renderModal = () => {
    if (!selected) {
      return null;
    }

    return (
      <ImageModal src={selected} alt={alt} onClose={() => setSelected(null)} />
    );
  };

  // ─── 1 IMAGE ──────────────────────────────────────────────────────────────
  if (count === 1) {
    return (
      <>
        <View className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <View className="min-h-[240px] max-h-[560px] overflow-hidden">
            {renderImage(display[0], 0)}
          </View>
        </View>

        {renderModal()}
      </>
    );
  }

  // ─── 2 IMAGES ─────────────────────────────────────────────────────────────
  if (count === 2) {
    return (
      <>
        <View className="gap-2 overflow-hidden rounded-2xl">
          {display.map((src, index) => (
            <View
              key={`${src}-${index}`}
              className="aspect-square overflow-hidden rounded-xl border border-white/5 bg-white/5"
            >
              {renderImage(src, index)}
            </View>
          ))}
        </View>

        {renderModal()}
      </>
    );
  }

  // ─── 3 IMAGES ─────────────────────────────────────────────────────────────
  if (count === 3) {
    return (
      <>
        <View className="gap-2 overflow-hidden rounded-2xl">
          <View className="min-h-[240px] overflow-hidden rounded-xl border border-white/5 bg-white/5">
            {renderImage(display[0], 0)}
          </View>

          <View className="aspect-square overflow-hidden rounded-xl border border-white/5 bg-white/5">
            {renderImage(display[1], 1)}
          </View>

          <View className="aspect-square overflow-hidden rounded-xl border border-white/5 bg-white/5">
            {renderImage(display[2], 2)}
          </View>
        </View>

        {renderModal()}
      </>
    );
  }

  // ─── 4+ IMAGES ────────────────────────────────────────────────────────────
  return (
    <>
      <View className="gap-2 overflow-hidden rounded-2xl">
        {display.map((src, index) => (
          <View
            key={`${src}-${index}`}
            className="relative aspect-square overflow-hidden rounded-xl border border-white/5 bg-white/5"
          >
            {renderImage(src, index)}

            {index === 3 && remaining > 0 && (
              <Pressable
                className="absolute inset-0 items-center justify-center bg-black/60"
                onPress={() => setSelected(display[3])}
                accessibilityRole="button"
                accessibilityLabel={`Afficher ${remaining} image${
                  remaining > 1 ? "s" : ""
                } supplémentaire${remaining > 1 ? "s" : ""}`}
              >
                <View className="items-center justify-center rounded-full bg-black/30 px-5 py-3">
                  <Text className="text-2xl font-bold text-white">
                    +{remaining}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {renderModal()}
    </>
  );
}

// ─── MODAL IMAGE ─────────────────────────────────────────────────────────────

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

function ImageModal({ src, alt, onClose }: ImageModalProps) {
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/95">
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer l'image"
        />

        <View className="h-[90%] w-[95%] items-center justify-center">
          <Image
            source={{ uri: src }}
            className="h-full w-full"
            resizeMode="contain"
            accessibilityLabel={alt || "Image en plein écran"}
          />
        </View>

        <Pressable
          className="absolute right-5 top-12 h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        >
          <View className="items-center justify-center">
            <CloseIcon />
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

// ─── CLOSE ICON ──────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <View className="relative h-5 w-5 items-center justify-center">
      <View className="absolute h-[2px] w-5 rotate-45 rounded-full bg-white" />
      <View className="absolute h-[2px] w-5 -rotate-45 rounded-full bg-white" />
    </View>
  );
}
