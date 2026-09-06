import { Pressable, Text, View } from "react-native";
import React from "react";

export const ContactPlaceholder = ({ onClose }: { onClose: () => void }) => (
  <View className="p-4 text-white">
    <Text className="font-bold text-lg mb-2">Contacter le propriétaire</Text>
    <Text className="text-white/50 text-sm">Formulaire de contact à venir.</Text>
    <Pressable
      onPress={onClose}
      className="mt-4 px-4 py-2 bg-white/10 rounded-xl"
    >
      Fermer
    </Pressable>
  </View>
);

export const VisitPlaceholder = ({ onClose }: { onClose: () => void }) => (
  <View className="p-4 text-white">
    <Text className="font-bold text-lg mb-2">Demander une visite</Text>
    <Text className="text-white/50 text-sm">Calendrier de visite à venir.</Text>
    <Pressable
      onPress={onClose}
      className="mt-4 px-4 py-2 bg-white/10 rounded-xl"
    >
      Fermer
    </Pressable>
  </View>
);
