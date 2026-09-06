import { View, Text, Pressable } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

export interface PollResultOption {
  optionId: string;
  text: string;
  votes: number;
  percentage: number;
}

interface PollResultsProps {
  results: PollResultOption[];
  totalVotes: number;
  currentUserVotes?: string[];
  multipleChoice?: boolean;
  anonymous?: boolean;
  closed?: boolean;
  onVote?: (optionId: string) => void;
  disabled?: boolean;
}

export function PollResults({
  results,
  totalVotes,
  currentUserVotes = [],
  multipleChoice = false,
  anonymous = false,
  closed = false,
  onVote,
  disabled = false,
}: PollResultsProps) {
  const hasVoted = currentUserVotes.length > 0;

  const canVote = !disabled && !closed && (!hasVoted || multipleChoice);

  return (
    <View className="mt-3 space-y-2">
      {results.map((result) => {
        const selected = currentUserVotes.includes(result.optionId);

        const percentage = Math.max(0, Math.min(100, result.percentage));

        return (
          <Pressable
            key={result.optionId}
           
            disabled={!canVote}
            onPress={() => onVote?.(result.optionId)}
            className={[
              "relative w-full overflow-hidden rounded-xl border text-left transition",
              selected ? "border-violet-500/70" : "border-white/10",
              canVote
                ? "cursor-pointer hover:border-white/20"
                : "cursor-default",
            ].join(" ")}
          >
            <View
              className="absolute inset-y-0 left-0 bg-violet-500/15"
              style={{
                width: `${percentage}%`,
              }}
            />

            <View className="relative flex items-center gap-3 px-3 py-3">
              <View
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  selected
                    ? "border-violet-400 bg-violet-500"
                    : "border-white/25",
                ].join(" ")}
              >
                {selected && <CheckCircle2 size={13} className="text-white" />}
              </View>

              <Text className="min-w-0 flex-1 text-sm text-white/85">
                {result.text}
              </Text>

              <Text className="text-xs font-semibold text-white/50">
                {percentage}%
              </Text>
            </View>
          </Pressable>
        );
      })}

      <View className="flex items-center justify-between pt-1 text-[11px] text-white/35">
        <Text>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </Text>

        {anonymous && <Text><Text>Vote anonyme</Text></Text>}

        {closed && <Text className="text-amber-400/70"><Text>Sondage fermé</Text></Text>}
      </View>
    </View>
  );
}

export default PollResults;
