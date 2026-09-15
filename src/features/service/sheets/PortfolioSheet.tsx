import { Pressable, View, Text } from "react-native";
import { X } from "lucide-react-native";
import { ServiceGallery } from "../components/ServiceGallery";

export function PortfolioSheet({
  isOpen,
  onClose,
  images,
}: {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
}) {
  return (
<View>
      {isOpen && (
        <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onPress={onClose}>
          <View className="w-full max-w-md rounded-t-3xl p-6 bg-[#0D1117] border border-white/10" onPress={(e) => e.stopPropagation()}>
            <View className="flex justify-between">
              <Text className="text-white font-bold text-lg">Portfolio</Text>
              <Pressable onPress={onClose}>
                <X className="text-white/60" />
              </Pressable>
            </View>
            <ServiceGallery images={images} title="Portfolio" />
          </View>
        </View>
      )}
    </View>
  );
}
