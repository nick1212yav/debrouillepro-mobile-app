import { View, Text, Pressable, TextInput } from "react-native";
import React, { useState } from "react";
import { Star, Plus } from "lucide-react-native";
import { RatingStars } from "../common/RatingStars";

interface Review {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  date: string;
  text: string;
}

interface AccommodationReviewsProps {
  reviews?: Review[];
  rating: number;
  reviewsCount: number;
  onAddReview?: (text: string, rating: number) => void;
}

export const AccommodationReviews: React.FC<AccommodationReviewsProps> = ({
  reviews,
  rating,
  reviewsCount,
  onAddReview,
}) => {
  const [newReviewText, setNewReviewText] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [showForm, setShowForm] = useState(false);

  const mockReviews: Review[] = [
    {
      id: "1",
      authorName: "Marie-Claire K.",
      rating: 5,
      date: "Juillet 2026",
      text: "Un séjour merveilleux ! L'appartement est encore plus beau en vrai. La vue sur la lagune est absolument reposante. Je reviendrai à coup sûr lors de mon prochain voyage à Abidjan.",
    },
    {
      id: "2",
      authorName: "Koffi Hermann A.",
      rating: 4,
      date: "Juin 2026",
      text: "Très bien situé à Cocody, calme et sécurisé. L'hôte a été d'une réactivité exemplaire. Seul bémol, le débit du WiFi fluctuait parfois le soir.",
    },
  ];

  const list = reviews || mockReviews;

  const handleSubmit = (e: unknown) => {
    if (!newReviewText.trim()) return;
    if (onAddReview) {
      onAddReview(newReviewText, newRating);
    }
    setNewReviewText("");
    setShowForm(false);
  };

  return (
    <View className="p-4 md:p-6 border-b border-white/5 flex flex-col gap-4">
      <View className="flex items-center justify-between">
        <Text className="text-white font-semibold text-sm">Avis des voyageurs</Text>
        <Pressable
          onPress={() => setShowForm(!showForm)}
         
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400"
        >
          <Plus size={14} />
          <Text>Laisser un avis</Text>
        </Pressable>
      </View>

      {showForm && (
        <View
         
          className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3"
        >
          <View className="flex items-center gap-2">
            <Text className="text-xs text-white/60">Note :</Text>
            <View className="flex gap-1">
              {[1, 2, 3, 4, 5].map((stars) => (
                <Pressable
                  key={stars}
                 
                  onPress={() => setNewRating(stars)}
                  className="p-0.5"
                >
                  <Star
                    size={18}
                    className={
                      stars <= newRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-white/20"
                    }
                  />
                </Pressable>
              ))}
            </View>
          </View>
          <TextInput
            value={newReviewText}
            onChangeText={(text) => setNewReviewText(text)}
            placeholder="Écrivez votre commentaire..."
            className="w-full min-h-[80px] p-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30"
           multiline textAlignVertical="top"/>
          <Pressable
           
            className="py-2 px-4 rounded-lg bg-indigo-500 text-white text-xs font-bold self-end"
          >
            <Text>Publier</Text></Pressable>
        </View>
      )}

      <View className="flex flex-col gap-4">
        {list.map((review) => (
          <View key={review.id} className="flex flex-col gap-2">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-xs text-indigo-400 border border-white/5 uppercase shrink-0">
                  {review.authorName[0]}
                </View>
                <View className="flex flex-col">
                  <Text className="text-xs font-semibold text-white">
                    {review.authorName}
                  </Text>
                  <Text className="text-[10px] text-white/40">
                    {review.date}
                  </Text>
                </View>
              </View>
              <RatingStars rating={review.rating} showText={false} />
            </View>
            <Text className="text-xs text-white/70 leading-relaxed">
              {review.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
