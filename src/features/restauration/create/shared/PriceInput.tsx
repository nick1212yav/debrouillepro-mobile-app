import { View, Text, TextInput, TextInputProps } from "react-native";
import { DollarSign, AlertCircle } from "lucide-react-native";

interface PriceInputProps extends Omit<
  TextInputProps,
  "type"
> {
  label: string;
  error?: string;
}

export function PriceInput({
  label,
  error,
  className = "",
  ...props
}: PriceInputProps) {
  return (
    <View className="space-y-1.5 text-left w-full">
      <Text className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">
        {label}
        {props.required && <Text className="text-orange-500 ml-0.5">*</Text>}
      </Text>

      <View
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-950 border transition-all duration-300 ${
          error
            ? "border-rose-500/50 focus-within:border-rose-500"
            : "border-slate-800 focus-within:border-orange-500/50"
        }`}
      >
        <DollarSign size={15} className="text-slate-600 shrink-0" />
        <TextInput
         
          {...props}
          className={`flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-700 ${className}`}
         keyboardType="numeric"/>
        <Text className="text-[10px] font-black uppercase text-slate-500 tracking-wider shrink-0 pr-1">
          <Text>FCFA</Text></Text>
      </View>

      {error && (
        <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold mt-1">
          <AlertCircle size={11} />
          {error}
        </Text>
      )}
    </View>
  );
}
