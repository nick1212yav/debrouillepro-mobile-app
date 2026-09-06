import { Text, Pressable } from "react-native";
import { useState } from "react";
import { PhoneModal } from "./PhoneModal";

export function PhoneButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl font-semibold text-white"
        style={{ backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}
      >
        <Text className="text-lg">📱</Text>
        Continuer avec Téléphone
      </Pressable>

      <PhoneModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
