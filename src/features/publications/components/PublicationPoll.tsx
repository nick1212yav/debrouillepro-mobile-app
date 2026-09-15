import { View, Pressable, Text } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

interface PollOption {
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

export function PublicationPoll({
  options,
  votedId,
  totalVotes,
  onVote,
}: Props) {
  const revealed = !!votedId;

  return (
    <View className="px-3 pb-3 flex flex-col gap-2">{options.map((opt) => {
        const pct =
          totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        const voted = votedId === opt.id;

        return (
          <Pressable key={opt.id} onPress={() => !revealed && onVote?.(opt.id)} disabled={revealed} className="relative w-full text-left rounded-xl px-3 py-2.5 overflow-hidden transition-all" style={{ backgroundColor: voted
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(255,255,255,0.05)", borderColor: "rgba(16,185,129,0.35)", borderStyle: "solid" }}>{revealed && (
              <View className="absolute left-0 top-0 h-full rounded-xl transition-all" style={{ width: `${pct}%`, backgroundColor: voted
                                  ? "rgba(16,185,129,0.15)"
                                  : "rgba(255,255,255,0.04)" }} />
            )}<View className="relative flex items-center justify-between"><View className="flex items-center gap-2">{voted && (
                  <CheckCircle2
                    size={12}
                    className="text-green-400 flex-shrink-0"
                  />
                )}<Text className="text-xs text-white/80">{opt.text}</Text></View>{revealed && (
                <Text className="text-[10px] font-bold" style={{
                    color: voted ? "#10B981" : "rgba(255,255,255,0.4)",
                  }}>
                  {pct}%
                </Text>
              )}</View></Pressable>
        );
      })}{votedId && (
        <Text className="text-[10px] text-white/30 text-center">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </Text>
      )}</View>
  );
}
