import { Pressable, View, Text, TextInput } from "react-native";
import React, { useState } from "react";
import { Star, Image, Loader2, Check } from "lucide-react-native";

interface ReviewFormProps {
  onSubmit: (data: {
    rating: number;
    text: string;
    photos?: string[];
  }) => Promise<void>;
  className?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  className = "",
}) => {
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: unknown) => {
    if (!text.trim() || rating < 1) return;

    setLoading(true);
    try {
      await onSubmit({ rating, text });
      setSuccess(true);
      setText("");
      setRating(5);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // Erreur gérée de façon transparente
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
     
      className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4 ${className}`}
    >
      <View className="flex flex-col gap-1">
        <Text className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Donnez votre avis
        </Text>
        <Text className="text-[10px] text-white/40 leading-relaxed">
          Partagez votre expérience avec la communauté DébrouillePro.
        </Text>
      </View>

      <View className="flex items-center gap-2">
        <Text className="text-xs text-white/60">Évaluation :</Text>
        <View className="flex gap-1">
          {[1, 2, 3, 4, 5].map((stars) => (
            <Pressable
              key={stars}
              onPress={() => setRating(stars)}
              disabled={loading || success}
              className="p-0.5 disabled:pointer-events-none"
            >
              <Star
                size={20}
                className={
                  stars <= rating
                    ? "text-amber-400 fill-amber-400"
                    : "text-white/20"
                }
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View className="flex flex-col gap-1">
        <TextInput
         value={text}
          onChangeText={(text) => setText(text)}
         
          placeholder="Racontez votre expérience, la propreté du logement, l'amabilité de l'hôte..."
          className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/20 disabled:opacity-50"
         multiline textAlignVertical="top" editable={!(loading || success)}/>
      </View>

      <View className="flex items-center justify-between gap-4">
        <Pressable
          disabled={loading || success}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 flex items-center gap-1.5 text-[10px] font-bold uppercase disabled:opacity-40"
        >
          <Image size={14} className="text-indigo-400" />
          <Text><Text>Ajouter des photos</Text></Text>
        </Pressable>

        <Pressable
          disabled={loading || success || !text.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-45 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              <Text><Text>Publication...</Text></Text>
            </>
          ) : success ? (
            <>
              <Check size={12} className="text-emerald-400 stroke-[3]" />
              <Text><Text>Avis publié !</Text></Text>
            </>
          ) : (
            <Text><Text>Publier l'avis</Text></Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};
