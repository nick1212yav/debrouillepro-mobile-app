import { View, Text, Image, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { Upload, Trash, Image, AlertCircle } from "lucide-react-native";

interface MediaUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

export function MediaUploader({
  label,
  value,
  onChange,
  error,
}: MediaUploaderProps) {
  const [isValidImage, setIsValidImage] = useState(false);

  useEffect(() => {
    if (!value.trim()) {
      setIsValidImage(false);
      return;
    }

    // Test asynchrone simple de chargement de l'image
    const img = new undefined();
    img.src = value;
    img.onload = () => setIsValidImage(true);
    img.onerror = () => setIsValidImage(false);
  }, [value]);

  return (
    <View className="space-y-1.5 text-left w-full">
      <Text className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">
        {label}
      </Text>

      <View className="flex gap-2">
        <View className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800">
          <Image size={15} className="text-slate-600 shrink-0" />
          <TextInput
           
            placeholder="Saisir l'adresse URL de l'image (https://...)"
            value={value}
            onChangeText={(text) => onChange(text)}
            className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-700"
           keyboardType="url" autoCapitalize="none" autoCorrect={false}/>
        </View>
        {value.length > 0 && (
          <Pressable
            type="button"
            onPress={() => onChange("")}
            className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/15 flex items-center justify-center shrink-0"
          >
            <Trash size={14} />
          </Pressable>
        )}
      </View>

      {/* Zone de prévisualisation réactive */}
      {value.trim().length > 0 && (
        <View className="mt-2 h-28 rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden flex items-center justify-center relative">
          {isValidImage ? (
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: value }} accessibilityLabel="Preview"/>
          ) : (
            <View className="flex flex-col items-center gap-1.5 text-slate-600">
              <Upload size={20} />
              <Text className="text-[10px] uppercase font-bold tracking-wider">
                <Text>Lien d'image incomplet</Text></Text>
            </View>
          )}
        </View>
      )}

      {error && (
        <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold mt-1">
          <AlertCircle size={11} />
          {error}
        </Text>
      )}
    </View>
  );
}
