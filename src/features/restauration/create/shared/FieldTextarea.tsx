import { Text, View, TextInput } from "react-native";
import { AlertCircle } from "lucide-react-native";

interface FieldTextareaProps extends React.TextareaHTMLAttributes<TextInput> {
  label: string;
  error?: string;
}

export function FieldTextarea({
  label,
  error,
  className = "",
  ...props
}: FieldTextareaProps) {
  return (
    <View className="space-y-1.5 text-left w-full">
      <Text className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">{label}{props.required && <Text className="text-orange-500 ml-0.5">*</Text>}</Text>
      <TextInput {...props} className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-xs text-white outline-none transition-all duration-300 placeholder:text-slate-700 ${
          error
            ? "border-rose-500/50 focus:border-rose-500"
            : "border-slate-800 focus:border-orange-500/50"
        } ${className}`} multiline textAlignVertical="top" />
      {error && (
        <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold animate-fade-in mt-1">
          <AlertCircle size={11} />
          {error}
        </Text>
      )}
    </View>
  );
}
