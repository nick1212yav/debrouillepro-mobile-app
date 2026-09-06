import { Pressable, View, Text, Image } from "react-native";
// src/features/sante/components/DoctorImaging.tsx
import { Scan, Calendar, Eye, Download } from "lucide-react-native";

export interface ImagingResult {
  id: string;
  type: "xray" | "mri" | "ct" | "ultrasound" | "pet";
  title: string;
  date: Date;
  imageUrl?: string;
  findings: string;
  doctor?: string;
}

interface DoctorImagingProps {
  images: ImagingResult[];
  onView?: (image: ImagingResult) => void;
  onDownload?: (image: ImagingResult) => void;
}

const typeLabels = {
  xray: "Radiographie",
  mri: "IRM",
  ct: "Scanner",
  ultrasound: "Échographie",
  pet: "TEP scan",
};

export function DoctorImaging({
  images,
  onView,
  onDownload,
}: DoctorImagingProps) {
  if (!images || images.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Scan size={14} /> Imagerie médicale
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">Aucune image</Text>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <Scan size={14} /> Imagerie médicale ({images.length})
      </Text>
      <View
        className="space-y-3 max-h-60 overflow-y-auto"
        style={{  }}
      >
        {images.map((img) => (
          <View
            key={img.id}
            className="p-3 rounded-xl bg-white/5 border border-white/10"
          >
            <View className="flex items-start gap-3">
              <View className="w-16 h-16 rounded-xl bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {img.imageUrl ? (
                  <Image
                   
                   
                    className="w-full h-full object-cover"
                   source={{ uri: img.imageUrl }} accessibilityLabel={img.title}/>
                ) : (
                  <Scan size={24} className="text-white/20" />
                )}
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-white text-sm font-medium truncate">
                  {img.title}
                </Text>
                <Text className="text-white/40 text-xs">
                  {typeLabels[img.type] || img.type}
                </Text>
                <Text className="text-white/40 text-xs flex items-center gap-1">
                  <Calendar size={10} /> {img.date.toLocaleDateString("fr-FR")}
                </Text>
                <Text className="text-white/50 text-xs">
                  {img.findings}
                </Text>
              </View>
              <View className="flex flex-col gap-1 flex-shrink-0">
                {onView && (
                  <Pressable
                    onPress={() => onView(img)}
                    className="p-1.5 rounded-lg bg-white/10"
                  >
                    <Eye size={14} className="text-white/40" />
                  </Pressable>
                )}
                {onDownload && (
                  <Pressable
                    onPress={() => onDownload(img)}
                    className="p-1.5 rounded-lg bg-white/10"
                  >
                    <Download size={14} className="text-white/40" />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
