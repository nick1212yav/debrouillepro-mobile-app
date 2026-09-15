import { Pressable, View, TextInput } from "react-native";

// src/features/community/components/CreatePost/PostPoll.tsx
import { X, Plus } from "lucide-react-native";

interface Props {
  options: string[];
  onChange: (options: string[]) => void;
  color?: string;
}

export function PostPoll({ options, onChange, color = "#8B5CF6" }: Props) {
  const addOption = () => {
    if (options.length < 4) onChange([...options, ""]);
  };
  const removeOption = (idx: number) => {
    if (options.length > 2) onChange(options.filter((_, i) => i !== idx));
  };
  const updateOption = (idx: number, val: string) => {
    const next = [...options];
    next[idx] = val;
    onChange(next);
  };

  return (
    <View className="flex flex-col gap-2">
      {options.map((opt, idx) => (
        <View key={idx} className="flex items-center gap-2">
          <TextInput value={opt} onChangeText={(value) => updateOption(idx, value)} placeholder={`Option ${idx + 1}`} className="flex-1 bg-transparent text-white placeholder:text-white/25 text-sm outline-none px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} />
          {options.length > 2 && (
            <Pressable onPress={() => removeOption(idx)} className="">
              <X size={14} className="text-white/30" />
            </Pressable>
          )}
        </View>
      ))}
      {options.length < 4 && (
        <Pressable onPress={addOption} className="flex items-center gap-2 text-xs text-white/40 py-1.5">
          <Plus size={12} /> Ajouter une option
        </Pressable>
      )}
    </View>
  );
}
