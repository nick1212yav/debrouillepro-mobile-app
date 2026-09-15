import { View, Pressable, Text, Image, TextInput } from "react-native";
import { useState } from "react";
import { X, CheckCircle2, ThumbsUp } from "lucide-react-native";
import { StarRating } from "@/components/ui/star-rating.tsx";
import { type Review, useReviews, getAggregateRating } from "@/hooks/use-reviews.ts";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ── Leave-a-review modal ──────────────────────────────────────────────────────

interface ReviewModalProps {
  itemId: string;
  itemLabel: string;
  accentColor: string;
  onClose: () => void;
}

export function ReviewModal({ itemId, itemLabel, accentColor, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { addReview } = useReviews(itemId);

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Veuillez sélectionner une note");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("Votre avis doit comporter au moins 10 caractères");
      return;
    }
    addReview(rating, comment.trim());
    toast.success("Avis publié !", { description: "Merci pour votre retour." });
    onClose();
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[800] flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.8)" }} onPress={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full rounded-t-3xl p-6" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} onPress={(e) => e.stopPropagation()}>
        {/* Handle */}
        <View className="flex justify-center mb-4"><View className="w-10 h-1 rounded-full bg-white/20" /></View>

        <View className="flex items-center justify-between mb-5"><View><Text className="text-white font-black text-lg">Laisser un avis</Text><Text className="text-white/40 text-xs mt-0.5">{itemLabel}</Text></View><Pressable onPress={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><X size={16} className="text-white/50" /></Pressable></View>

        {/* Stars */}
        <View className="flex flex-col items-center gap-2 py-4 rounded-2xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><StarRating value={rating} onChange={setRating} size={34} color={accentColor} /><Text className="text-xs text-white/40">{rating === 0 ? "Touchez pour noter" :
             rating === 1 ? "Très décevant" :
             rating === 2 ? "Décevant" :
             rating === 3 ? "Correct" :
             rating === 4 ? "Bien" : "Excellent !"}</Text></View>

        {/* Comment */}
        <TextInput value={comment} onChangeText={(value) => setComment(value)} placeholder="Partagez votre expérience... (min. 10 caractères)" className="w-full rounded-2xl p-4 text-sm text-white placeholder:text-white/30 outline-none mb-4" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} multiline textAlignVertical="top" />

        <Pressable whileTap={{ scale: 0.97 }} onPress={handleSubmit} className="w-full py-3.5 rounded-2xl text-white font-black text-sm" style={{  }}>
          Publier mon avis
        </Pressable>
      </View>
    </View>
  );
}

// ── Review list panel ─────────────────────────────────────────────────────────

interface ReviewsPanelProps {
  itemId: string;
  itemLabel: string;
  accentColor: string;
}

function ReviewCard({ review }: { review: Review }) {
  const timeAgo = formatDistanceToNow(new Date(review.date), { addSuffix: true, locale: fr });
  return (
    <View className="rounded-2xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><View className="flex items-start gap-2.5 mb-2"><Image className="w-8 h-8 rounded-xl object-cover flex-shrink-0" source={{ uri: review.avatar }} accessibilityLabel={review.author} /><View className="flex-1 min-w-0"><View className="flex items-center gap-1.5"><Text className="text-xs font-bold text-white truncate">{review.author}</Text>{review.verified && <CheckCircle2 size={10} className="text-blue-400 flex-shrink-0" />}</View><View className="flex items-center gap-2 mt-0.5"><StarRating value={review.rating} size={10} /><Text className="text-[10px] text-white/30">{timeAgo}</Text></View></View></View><Text className="text-xs text-white/65 leading-relaxed">{review.comment}</Text><Pressable className="flex items-center gap-1 mt-2"><ThumbsUp size={11} className="text-white/25" /><Text className="text-[10px] text-white/25">Utile</Text></Pressable></View>
  );
}

export function ReviewsPanel({ itemId, itemLabel, accentColor }: ReviewsPanelProps) {
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");
  const { reviews, aggregate } = useReviews(itemId);

  const sorted = [...reviews].sort((a, b) =>
    sortBy === "recent"
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : b.rating - a.rating
  );

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <>
<View>
        {showModal && (
          <ReviewModal
            itemId={itemId}
            itemLabel={itemLabel}
            accentColor={accentColor}
            onClose={() => setShowModal(false)}
          />
        )}
      </View>

      <View className="mt-4">{}<View className="flex items-center justify-between mb-3"><Text className="text-xs font-black text-white/30 uppercase tracking-widest">Avis ({aggregate.count})
          </Text><Pressable whileTap={{ scale: 0.93 }} onPress={() => setShowModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: `${accentColor}22`, borderStyle: "solid" }}>+ Laisser un avis
          </Pressable></View>{aggregate.count > 0 && (
          <View className="rounded-3xl p-4 mb-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><View className="flex gap-4 items-center mb-3">{}<View className="flex flex-col items-center flex-shrink-0"><Text className="text-4xl font-black text-white leading-none">{aggregate.avg.toFixed(1)}</Text><StarRating value={aggregate.avg} size={13} color={accentColor} /><Text className="text-[10px] text-white/35 mt-1">{aggregate.count}avis</Text></View>{}<View className="flex-1 flex flex-col gap-1">{dist.map(({ star, count }) => {
                  const pct = aggregate.count > 0 ? (count / aggregate.count) * 100 : 0;
                  return (
                    <View key={star} className="flex items-center gap-2"><Text className="text-[10px] text-white/35 w-3 text-right">{star}</Text><View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><View initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.1 * (6 - star), duration: 0.5 }} className="h-full rounded-full" style={{ backgroundColor: accentColor }} /></View><Text className="text-[10px] text-white/25 w-4">{count}</Text></View>
                  );
                })}</View></View></View>
        )}{}<View className="flex gap-2 mb-3">{(["recent", "top"] as const).map((s) => (
            <Pressable key={s} onPress={() => setSortBy(s)} className="px-3 py-1 rounded-full text-xs font-semibold transition-all" style={sortBy === s
                ? { backgroundColor: accentColor }
                : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{s === "recent" ? "Récents" : "Top notés"}</Pressable>
          ))}</View>{}<View className="flex flex-col gap-2">{sorted.map((r, i) => (
            <View key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ReviewCard review={r} />
            </View>
          ))}{reviews.length === 0 && (
            <View className="text-center py-6">
              <Text className="text-white/25 text-sm">Aucun avis pour l'instant</Text>
              <Text className="text-white/15 text-xs mt-1">Soyez le premier à donner votre avis</Text>
            </View>
          )}</View></View>
    </>
  );
}
