import { Picker } from "@react-native-picker/picker";
import { View, Text, TextInput } from "react-native";
import { useState } from "react";
import { Flag, X, Send, AlertCircle } from "lucide-react-native";

interface Props {
  onReport: (reason: string, details: string) => Promise<void>;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Spam",
  "Contenu inapproprié",
  "Harcèlement",
  "Fausse information",
  "Violence",
  "Discrimination",
  "Autre",
];

export function CommunityReports({ onReport, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await onReport(reason, details);
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      className="p-4 rounded-2xl bg-[#0D1117] border border-white/10 max-w-sm w-full"
    >
      <View className="flex items-center justify-between mb-4">
        <View className="flex items-center gap-2">
          <Flag size={16} className="text-red-400" />
          <Text className="text-white font-bold text-base">Signaler</Text>
        </View>
        <Pressable
          onPress={onClose}
          className="text-white/40"
        >
          <X size={16} />
        </Pressable>
      </View>

      <View className="space-y-3">
        <Picker
         
          onValueChange={(val) => setReason(val)}
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none"
         selectedValue={reason}>
          <Picker.Item label="Motif du signalement" value="" />
          {REPORT_REASONS.map((r) => (
            <Picker.Item label={`${r}`} value={r} />
          ))}
        </Picker>
        <TextInput
          value={details}
          onChangeText={(text) => setDetails(text)}
          placeholder="Détails supplémentaires (optionnel)"
         
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/30"
         multiline textAlignVertical="top"/>
        <Pressable
          onPress={handleSubmit}
          disabled={!reason || isSubmitting}
          className="w-full py-2.5 rounded-xl text-white font-medium bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            "Envoi..."
          ) : (
            <>
              <Send size={14} /> Signaler
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
