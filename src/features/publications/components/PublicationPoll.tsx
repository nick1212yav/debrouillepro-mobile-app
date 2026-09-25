import { Pressable, Text, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Props {
  options: PollOption[];
  votedId: string | null | undefined;
  totalVotes: number;
  onVote?: (optionId: string) => void;
}

function getPercentage(votes: number, totalVotes: number): number {
  if (totalVotes <= 0 || votes <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((votes / totalVotes) * 100));
}

export function PublicationPoll({
  options,
  votedId,
  totalVotes,
  onVote,
}: Props) {
  const revealed = Boolean(votedId);

  if (options.length === 0) {
    return null;
  }

  return (
    <View className="px-3 pb-3 gap-2">
      {options.map((option) => {
        const percentage = getPercentage(option.votes, totalVotes);
        const isVoted = votedId === option.id;
        const isDisabled = revealed || !onVote;

        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{
              disabled: isDisabled,
              selected: isVoted,
            }}
            disabled={isDisabled}
            onPress={() => {
              if (!isDisabled) {
                onVote?.(option.id);
              }
            }}
            className="relative w-full overflow-hidden rounded-xl px-3 py-2.5"
            style={{
              backgroundColor: isVoted
                ? "rgba(16,185,129,0.12)"
                : "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: isVoted
                ? "rgba(16,185,129,0.35)"
                : "rgba(255,255,255,0.10)",
            }}
          >
            {revealed ? (
              <View
                pointerEvents="none"
                className="absolute left-0 top-0 h-full rounded-xl"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: isVoted
                    ? "rgba(16,185,129,0.15)"
                    : "rgba(255,255,255,0.04)",
                }}
              />
            ) : null}

            <View className="relative flex-row items-center justify-between gap-2">
              <View className="min-w-0 flex-1 flex-row items-center gap-2">
                {isVoted ? (
                  <CheckCircle2
                    size={12}
                    color="#34D399"
                    accessibilityLabel="Option sélectionnée"
                  />
                ) : null}

                <Text
                  numberOfLines={2}
                  className="flex-1 text-xs text-white/80"
                >
                  {option.text}
                </Text>
              </View>

              {revealed ? (
                <Text
                  className="text-[10px] font-bold"
                  style={{
                    color: isVoted ? "#10B981" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {percentage}%
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}

      {revealed ? (
        <Text className="text-center text-[10px] text-white/30">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </Text>
      ) : null}
    </View>
  );
}
