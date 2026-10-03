// src/features/auth/components/PhoneButton.tsx

import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { PhoneModal } from "./PhoneModal";

export function PhoneButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continuer avec téléphone"
        accessibilityState={{ expanded: isOpen }}
        onPress={handleOpen}
        className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.15] py-3.5 active:opacity-80"
      >
        <View className="flex-row items-center justify-center">
          <Text className="mr-3 text-lg">📱</Text>

          <Text className="text-sm font-semibold text-white">
            Continuer avec Téléphone
          </Text>
        </View>
      </Pressable>

      <PhoneModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
