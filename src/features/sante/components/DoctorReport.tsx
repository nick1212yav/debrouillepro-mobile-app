import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
// src/features/sante/components/DoctorReport.tsx
import { useState } from "react";
import { AlertTriangle, Send, X } from "lucide-react-native";

interface DoctorReportProps {
  onReport?: (reason: string, details: string) => void;
}

export function DoctorReport({ onReport }: DoctorReportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (reason && onReport) {
      onReport(reason, details);
      setIsOpen(false);
      setReason("");
      setDetails("");
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/20"
      >
        <AlertTriangle size={14} />
        <Text>Signaler</Text></Pressable>

      {isOpen && (
        <View
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <View
            className="max-w-sm w-full rounded-2xl p-6"
            style={{ backgroundColor: "#0d0d20", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          >
            <View className="flex items-center justify-between mb-4">
              <Text className="text-white font-bold text-lg">Signaler</Text>
              <Pressable
                onPress={() => setIsOpen(false)}
                className="text-white/50"
              >
                <X size={18} />
              </Pressable>
            </View>
            <View className="space-y-3">
              <View>
                <Text className="text-xs text-white/40">Motif</Text>
                <Picker
                 
                  onValueChange={(val) => setReason(val)}
                  className="w-full mt-1 p-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm"
                 selectedValue={reason}>
                  <Picker.Item label="Sélectionnez un motif" value="" />
                  <Picker.Item label="Spam" value="spam" />
                  <Picker.Item label="Contenu inapproprié" value="inappropriate" />
                  <Picker.Item label="Fausses informations" value="fake" />
                  <Picker.Item label="Harcèlement" value="harassment" />
                  <Picker.Item label="Autre" value="other" />
                </Picker>
              </View>
              <View>
                <Text className="text-xs text-white/40">Détails</Text>
                <TextInput
                  value={details}
                  onChangeText={(text) => setDetails(text)}
                  placeholder="Décrivez le problème..."
                  className="w-full mt-1 p-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/30"
                 
                 multiline textAlignVertical="top"/>
              </View>
              <Pressable
                onPress={handleSubmit}
                disabled={!reason}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={14} /> <Text>Envoyer le signalement</Text></Pressable>
            </View>
          </View>
        </View>
      )}
    </>
  );
}
