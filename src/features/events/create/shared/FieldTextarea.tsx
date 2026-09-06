import { View, TextInput, ViewStyle, TextStyle, ImageStyle } from "react-native";
interface Props {
  icon: React.ComponentType<{ size: number; style?: ViewStyle | TextStyle | ImageStyle }>;
  color: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
}

export function FieldTextarea({
  icon: Icon,
  color,
  placeholder,
  value,
  onChange,
  rows = 3,
  required = false,
}: Props) {
  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex items-start gap-2.5">
        <Icon size={14} style={{ color, marginTop: 3 }} />
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text)}
          placeholder={required ? `${placeholder} *` : placeholder}
         
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
         multiline textAlignVertical="top"/>
      </View>
    </View>
  );
}
