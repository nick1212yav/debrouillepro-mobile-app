import { View, Text } from "react-native";
import type { Message } from "../../chat/services/chat.service";

interface PollMessageProps {
  message: Message;
  own?: boolean;
}

export function PollMessage({ message, own = false }: PollMessageProps) {
  const title = message.text?.trim() || "Nouveau sondage";

  return (
    <View
      className={[
        "w-full min-w-[250px] max-w-[380px] overflow-hidden rounded-2xl",
        "border backdrop-blur-xl",
        own
          ? "border-black/10 bg-black/[0.04]"
          : "border-white/10 bg-white/[0.035]",
      ].join(" ")}
    >
      {/* HEADER */}
      <View
        className={[
          "flex items-center gap-3 border-b px-4 py-3",
          own ? "border-black/10" : "border-white/[0.08]",
        ].join(" ")}
      >
        <View
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            own ? "bg-black/10" : "bg-cyan-500/10",
          ].join(" ")}
        >
          <Text className="text-lg">📊</Text>
        </View>

        <View className="min-w-0 flex-1">
          <Text
            className={[
              "text-[10px] font-bold uppercase tracking-[0.14em]",
              own ? "text-black/40" : "text-cyan-300/70",
            ].join(" ")}
          >
            Sondage
          </Text>

          <Text
            className={[
              "mt-0.5 truncate text-sm font-semibold",
              own ? "text-black" : "text-white",
            ].join(" ")}
          >
            {title}
          </Text>
        </View>
      </View>

      {/* OPTIONS — structure prête pour le vrai système de vote */}
      <View className="space-y-2 p-3">
        <View
          className={[
            "rounded-xl border px-3 py-3",
            own
              ? "border-black/10 bg-black/[0.025]"
              : "border-white/[0.07] bg-white/[0.025]",
          ].join(" ")}
        >
          <View className="mb-2 flex items-center justify-between">
            <Text
              className={[
                "text-xs font-medium",
                own ? "text-black/70" : "text-white/70",
              ].join(" ")}
            >
              Options du sondage
            </Text>

            <Text
              className={[
                "text-[10px]",
                own ? "text-black/35" : "text-white/30",
              ].join(" ")}
            >
              0 vote
            </Text>
          </View>

          <View
            className={[
              "h-2 overflow-hidden rounded-full",
              own ? "bg-black/10" : "bg-white/[0.06]",
            ].join(" ")}
          >
            <View
              className={[
                "h-full w-0 rounded-full",
                own ? "bg-black/20" : "bg-cyan-400/30",
              ].join(" ")}
            />
          </View>
        </View>

        <Pressable
          type="button"
          disabled
          className={[
            "w-full rounded-xl px-4 py-2.5 text-xs font-semibold",
            "transition",
            own
              ? "bg-black/10 text-black/35"
              : "bg-cyan-500/10 text-cyan-300/40",
          ].join(" ")}
        >
          <Text>Voter</Text></Pressable>
      </View>
    </View>
  );
}

export default PollMessage;
