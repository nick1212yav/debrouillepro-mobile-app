import { Picker } from "@react-native-picker/picker";
import { Text, View, Picker } from "react-native";
import { AlertCircle } from "lucide-react-native";

interface FieldSelectProps extends React.SelectHTMLAttributes<Picker> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

export function FieldSelect({
  label,
  options,
  error,
  className = "",
  ...props
}: FieldSelectProps) {
  return (
    <View className="space-y-1.5 text-left w-full">
      <Text className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">{label}{props.required && <Text className="text-orange-500 ml-0.5">*</Text>}</Text>
      <Picker {...props} className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-xs text-white outline-none transition-all duration-300 ${
          error
            ? "border-rose-500/50 focus:border-rose-500"
            : "border-slate-800 focus:border-orange-500/50"
        } ${className}`}>{options.map((opt) => (
          <Picker.Item label={opt.label} value={opt.value} />
        ))}</Picker>
      {error && (
        <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold animate-fade-in mt-1">
          <AlertCircle size={11} />
          {error}
        </Text>
      )}
    </View>
  );
}
