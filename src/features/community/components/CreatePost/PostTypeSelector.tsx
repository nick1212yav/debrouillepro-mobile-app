import { Pressable, View } from "react-native";

// src/features/community/components/CreatePost/PostTypeSelector.tsx
import { FileText, HelpCircle, BarChart2 } from "lucide-react-native";
import type { LocalPostType } from "../../types";

const TYPES: {
  value: LocalPostType;
  icon: React.ElementType;
  label: string;
  color: string;
}[] = [
  { value: "text", icon: FileText, label: "Texte libre", color: "#8B5CF6" },
  { value: "question", icon: HelpCircle, label: "Question", color: "#3B82F6" },
  { value: "poll", icon: BarChart2, label: "Sondage", color: "#10B981" },
];

interface Props {
  value: LocalPostType;
  onChange: (value: LocalPostType) => void;
}

export function PostTypeSelector({ value, onChange }: Props) {
  return (
    <View className="flex gap-2 overflow-x-auto">
      {TYPES.map((t) => {
        const Icon = t.icon;
        const active = value === t.value;
        return (
          <Pressable key={t.value} onPress={() => onChange(t.value)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
              active
                ? "bg-purple-500/20 border-purple-400/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`} style={{  }}>
            <Icon size={12} />
            {t.label}
          </Pressable>
        );
      })}
    </View>
  );
}
