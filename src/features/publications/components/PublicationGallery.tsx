import { View, Image, Pressable } from "react-native";
// src/features/publications/components/PublicationGallery.tsx
import { useState } from "react";

interface Props {
  images: string[];
  alt?: string;
  fit?: "cover" | "contain" | "auto";
}

export function PublicationGallery({ images, alt = "", fit = "auto" }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const detectFit = (url: string): "cover" | "contain" => {
    if (fit !== "auto") return fit;
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

  if (!images || images.length === 0) return null;

  const count = images.length;
  const display = images.slice(0, 4);
  const remaining = Math.max(0, count - 4);

  const renderImage = (src: string, idx: number) => {
    const imageFit = detectFit(src);
    const objectClass =
      imageFit === "contain" ? "object-contain bg-black/20" : "object-cover";

    // 🔍 Logs de diagnostic pour debugger la première image vide
    console.log(`🖼️ PublicationGallery image ${idx}:`, src);

    return (
      <Image
        key={`${src}-${idx}`}
       
       
        className={`w-full h-full ${objectClass}`}
        loading={idx === 0 ? "eager" : "lazy"}
        onPress={(e) => {
          setSelected(src);
        }}
        onLoad={(e) => {
          const img = e.currentTarget as Image;
          console.log(`✅ IMAGE CHARGÉE (${idx})`, {
            src,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        }}
        onError={(e) => {
          console.error(`❌ IMAGE IMPOSSIBLE À CHARGER (${idx})`, src);
          e.currentTarget.style.display = "none";
        }}
       source={{ uri: src }} accessibilityLabel={`${alt} ${idx + 1}`}/>
    );
  };

  // ─── 1 IMAGE ──────────────────────────────────────────────────────────────
  if (count === 1) {
    return (
      <>
        <View className="overflow-hidden rounded-2xl bg-white/5 border border-white/10">
          <View className="max-h-[560px] min-h-[240px] overflow-hidden">
            {renderImage(display[0], 0)}
          </View>
        </View>
        {selected && (
          <ImageModal
            src={selected}
            alt={alt}
            onClose={() => setSelected(null)}
          />
        )}
      </>
    );
  }

  // ─── 2 IMAGES ──────────────────────────────────────────────────────────────
  if (count === 2) {
    return (
      <>
        <View className="gap-2 overflow-hidden rounded-2xl">
          {display.map((src, i) => (
            <View
              key={i}
              className="aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/5"
            >
              {renderImage(src, i)}
            </View>
          ))}
        </View>
        {selected && (
          <ImageModal
            src={selected}
            alt={alt}
            onClose={() => setSelected(null)}
          />
        )}
      </>
    );
  }

  // ─── 3 IMAGES ──────────────────────────────────────────────────────────────
  if (count === 3) {
    return (
      <>
        <View className="gap-2 overflow-hidden rounded-2xl auto-rows-[1fr]">
          <View className="overflow-hidden rounded-xl bg-white/5 border border-white/5">
            {renderImage(display[0], 0)}
          </View>
          <View className="aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/5">
            {renderImage(display[1], 1)}
          </View>
          <View className="aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/5">
            {renderImage(display[2], 2)}
          </View>
        </View>
        {selected && (
          <ImageModal
            src={selected}
            alt={alt}
            onClose={() => setSelected(null)}
          />
        )}
      </>
    );
  }

  // ─── 4+ IMAGES ─────────────────────────────────────────────────────────────
  return (
    <>
      <View className="gap-2 overflow-hidden rounded-2xl">
        {display.map((src, i) => (
          <View
            key={i}
            className="relative aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/5"
          >
            {renderImage(src, i)}
            {i === 3 && remaining > 0 && (
              <Pressable
                className="absolute inset-0 flex items-center justify-center bg-black/60 text-2xl font-bold text-white"
                onPress={(e) => {
                  setSelected(display[3]);
                }}
              >
                +{remaining}
              </Pressable>
            )}
          </View>
        ))}
      </View>
      {selected && (
        <ImageModal
          src={selected}
          alt={alt}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function ImageModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <Pressable
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onPress={onClose}
    >
      <Pressable
        onPress={onClose}
        className="absolute right-5 top-5 z-10 rounded-full bg-white/10 px-4 py-2 text-xl text-white"
      >
        ✕
      </Pressable>
      <Image
       
       
        className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
        onPress={(e) => e.stopPropagation()}
       source={{ uri: src }} accessibilityLabel={alt}/>
    </Pressable>
  );
}
