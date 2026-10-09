import { Pressable, Text, View } from "react-native";
import {
  Bot,
  Languages,
  Lightbulb,
  PenLine,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react-native";

import type { AIAction } from "../services/ai.service";

interface AiActionsProps {
  onAction: (action: AIAction) => void;
  disabled?: boolean;
  loading?: boolean;
}

const actions: Array<{
  id: AIAction;
  label: string;
  icon: typeof Sparkles;
}> = [
  {
    id: "summarize",
    label: "Résumer",
    icon: Bot,
  },
  {
    id: "rewrite",
    label: "Réécrire",
    icon: PenLine,
  },
  {
    id: "improve",
    label: "Améliorer",
    icon: WandSparkles,
  },
  {
    id: "shorten",
    label: "Raccourcir",
    icon: RefreshCw,
  },
  {
    id: "expand",
    label: "Développer",
    icon: Sparkles,
  },
  {
    id: "reply",
    label: "Réponse",
    icon: Lightbulb,
  },
  {
    id: "translate",
    label: "Traduire",
    icon: Languages,
  },
];

export function AiActions({
  onAction,
  disabled = false,
  loading = false,
}: AiActionsProps) {
  const isDisabled = disabled || loading;

  return (
    <View className="flex-row flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Pressable
            key={action.id}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            disabled={isDisabled}
            onPress={() => onAction(action.id)}
            className="flex-row items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 disabled:opacity-40"
          >
            <Icon size={14} color="rgba(255,255,255,0.7)" />

            <Text className="text-xs font-medium text-white/70">
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default AiActions;
