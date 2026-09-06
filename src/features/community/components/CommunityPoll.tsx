import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { Check, BarChart3 } from "lucide-react-native";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Props {
  options: PollOption[];
  votedOptionId?: string;
  totalVotes?: number;
  onVote: (optionId: string) => Promise<void>;
  isEditable?: boolean;
}

export function CommunityPoll({
  options,
  votedOptionId,
  totalVotes = 0,
  onVote,
  isEditable = false,
}: Props) {
  const [selected, setSelected] = useState<string | null>(
    votedOptionId || null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(!!votedOptionId);

  const total = totalVotes || options.reduce((sum, o) => sum + o.votes, 0);

  const handleVote = async (optionId: string) => {
    if (selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onVote(optionId);
      setSelected(optionId);
      setShowResults(true);
    } catch {
      // error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentage = (votes: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getVoteCount = (optionId: string) => {
    const option = options.find((o) => o.id === optionId);
    return option?.votes || 0;
  };

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <BarChart3 size={16} className="text-white/30" />
        <Text className="text-sm font-medium text-white/50">Sondage</Text>
        {total > 0 && (
          <Text className="text-xs text-white/30">{total} voix</Text>
        )}
      </View>

      <View className="space-y-2">
        {options.map((option) => {
          const percentage = getPercentage(option.votes);
          const isSelected = selected === option.id;
          const isVoted = !!selected;

          return (
            <Pressable
              key={option.id}
              onPress={() => handleVote(option.id)}
              disabled={isVoted || isSubmitting}
              className={`relative w-full p-3 rounded-xl text-left transition-all cursor-pointer ${
                isSelected
                  ? "bg-purple-500/20 border-purple-400/50"
                  : isVoted
                    ? "bg-white/5 border-white/5 opacity-70"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
              } border overflow-hidden`}
            >
              <View
                className="absolute inset-0 bg-purple-500/10"
                style={{
                  width: showResults ? `${percentage}%` : "0%",
                }}
              />
              <View className="relative flex items-center justify-between z-10">
                <View className="flex items-center gap-2">
                  {isSelected && (
                    <Check
                      size={14}
                      className="text-purple-400 flex-shrink-0"
                    />
                  )}
                  <Text
                    className={`text-sm ${isSelected ? "text-white" : "text-white/80"}`}
                  >
                    {option.text}
                  </Text>
                </View>
                {showResults && (
                  <View className="flex items-center gap-2">
                    <Text className="text-sm font-medium text-white/70">
                      {getVoteCount(option.id)}
                    </Text>
                    <Text className="text-xs text-white/40">{percentage}<Text>%</Text></Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {!selected && !isEditable && (
        <Text className="text-xs text-white/30 text-center">
          <Text>Sélectionnez une option pour voter</Text></Text>
      )}

      {selected && (
        <Text className="text-xs text-green-400/60 text-center">
          <Text>✅ Vote enregistré</Text></Text>
      )}
    </View>
  );
}
