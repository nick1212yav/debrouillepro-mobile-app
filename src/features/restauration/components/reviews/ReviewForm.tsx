import { Pressable, View, Text, TextInput } from "react-native";
import { useState } from "react";
import { Star, Send } from "lucide-react-native";

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => void;
  isSubmitting: boolean;
}

export function ReviewForm({ onSubmit, isSubmitting }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const handleFormSubmit = (e: unknown) => {
    if (rating === 0 || !comment.trim()) return;
    onSubmit(rating, comment.trim());
    setComment("");
  };

  return (
    <View
     
      className="space-y-4 text-left p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04]"
    >
      <View className="flex flex-col items-center gap-2 py-2">
        <Text className="text-[10px] text-white/40 uppercase font-black tracking-wider">
          Votre note d'appréciation
        </Text>
        <View className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              disabled={isSubmitting}
              className="p-1"
            >
              <Star
                size={24}
                className={`${
                  star <= (hoverRating ?? rating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-white/10"
                } transition-colors duration-200`}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider mb-1.5">
          Votre avis détaillé
        </Text>
        <TextInput
         
          value={comment}
          onChangeText={(text) => setComment(text)}
          placeholder="Racontez-nous votre expérience culinaire..."
         
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-white/20"
          multiline textAlignVertical="top" editable={!(isSubmitting)}/>
      </View>

      <Pressable
        disabled={isSubmitting || !comment.trim()}
        className="w-full py-4 rounded-xl bg-orange-500 disabled:bg-white/5 disabled:text-white/25 text-[#020617] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
      >
        <Send size={13} />
        {isSubmitting ? "Enregistrement..." : "Publier mon avis"}
      </Pressable>
    </View>
  );
}
