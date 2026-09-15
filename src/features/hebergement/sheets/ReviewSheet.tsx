import { Pressable, Text, View } from "react-native";
import React from "react";
import { X, MessageSquare } from "lucide-react-native";
import { ReviewForm } from "../components/reviews/ReviewForm";

interface ReviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const ReviewSheet: React.FC<ReviewSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[85vh] overflow-y-auto bg-slate-950 border-t border-white/10">
        <View className="flex items-center justify-between mb-4">
          <Text className="text-base font-bold flex items-center gap-2"><MessageSquare size={18} className="text-indigo-400" /><Text>Évaluer le séjour</Text></Text>
          <Pressable onPress={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60">
            <X size={16} />
          </Pressable>
        </View>

        <ReviewForm onSubmit={onSubmit} />
      </View>
    </View>
  );
};
