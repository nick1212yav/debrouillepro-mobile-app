import { Pressable, View, TextInput, Text } from "react-native";
import { useState } from "react";
import { X, Star } from "lucide-react-native";
import { toast } from "sonner";
import { useServiceReviews } from "../hooks/useServiceReviews";
import type { Id } from "@/convex/_generated/dataModel";

export function ReviewSheet({
  isOpen,
  onClose,
  providerId,
}: {
  isOpen: boolean;
  onClose: () => void;
  providerId: Id<"serviceProviders">;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { addReview, loading } = useServiceReviews(providerId);
  const handleSubmit = async () => {
    if (!rating || !comment) {
      toast.error("Note et commentaire requis");
      return;
    }
    await addReview(rating, comment);
    onClose();
  };
  return (
<View>
      {isOpen && (
        <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onPress={onClose}>
          <View className="w-full max-w-md rounded-t-3xl p-6 bg-[#0D1117] border border-white/10" onPress={(e) => e.stopPropagation()}>
            <View className="w-10 h-1 rounded-full mx-auto mb-5 bg-white/20" />
            <Text className="text-white font-bold text-lg mb-4">Laisser un avis
            </Text>
            <View className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => setRating(s)}>
                  <Star
                    size={28}
                    className={
                      s <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white/20"
                    }
                  />
                </Pressable>
              ))}
            </View>
            <TextInput value={comment} onChangeText={(value) => setComment(value)} placeholder="Votre commentaire..." className="w-full rounded-xl p-3 text-sm text-white bg-white/5 border border-white/10 outline-none" multiline textAlignVertical="top" />
            <Pressable onPress={handleSubmit} disabled={loading} className="w-full py-3.5 rounded-xl text-white font-bold mt-4 bg-gradient-to-r from-orange-500 to-red-500 disabled:opacity-50">
              Envoyer
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
