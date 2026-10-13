import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { ServiceGallery } from "../components/ServiceGallery";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
}

export function PortfolioSheet({ isOpen, onClose, images }: Props) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        className="flex-1 justify-end bg-black/70"
        accessibilityLabel="Fermer le portfolio"
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="max-h-[85%] w-full rounded-t-3xl border-t border-white/10 bg-[#0D1117] p-6"
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">Portfolio</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              className="h-9 w-9 items-center justify-center rounded-xl bg-white/5"
            >
              <X size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ServiceGallery images={images} title="Portfolio" />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
