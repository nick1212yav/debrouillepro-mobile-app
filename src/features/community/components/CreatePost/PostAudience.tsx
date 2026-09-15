import { Pressable, View } from "react-native";

// src/features/community/components/CreatePost/PostAudience.tsx
import { Globe, Users, Lock } from "lucide-react-native";

type Audience = "public" | "friends" | "private";

interface Props {
  audience: Audience;
  onChange: (audience: Audience) => void;
}

export function PostAudience({ audience, onChange }: Props) {
  const options: { value: Audience; label: string; icon: React.ElementType }[] =
    [
      { value: "public", label: "Public", icon: Globe },
      { value: "friends", label: "Amis", icon: Users },
      { value: "private", label: "Privé", icon: Lock },
    ];

  return (
    <View className="flex items-center gap-2 text-xs">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = audience === opt.value;
        return (
          <Pressable key={opt.value} onPress={() => onChange(opt.value)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
              active
                ? "bg-purple-500/20 text-purple-400"
                : "text-white/40 hover:bg-white/5"
            }`}>
            <Icon size={12} /> {opt.label}
          </Pressable>
        );
      })}
    </View>
  );
}
